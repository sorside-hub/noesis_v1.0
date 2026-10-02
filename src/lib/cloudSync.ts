import { supabase } from './supabase';
import { db } from './db';
import { FileNode } from '../types/vault';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  getUserId,
  toTimestamp,
  pushDebounceTimers,
  cancelPushDebounceTimer,
  markNodeAsDeleted,
  isNodeRecentlyDeleted,
} from './sync/syncHelpers';
import { StudioProjectRecord, StudioSongRecord, StudioLyricVersionRecord } from '../features/music/types/studioDatabase';

export { syncPullFromCloud, syncPushAllToCloud } from './sync/syncOperations';
export type { SyncSummary } from './sync/syncOperations';

let syncChannel: RealtimeChannel | null = null;
let lastPushedGroupsJson = '';

// Initialize Supabase Realtime Subscription
export const initRealtimeSync = async () => {
  const userId = await getUserId();
  if (!userId) return;

  if (syncChannel) {
    supabase.removeChannel(syncChannel);
  }

  syncChannel = supabase
    .channel('public:sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'nodes', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.id === '__system_bookmark_groups__') {
            await db.settings.delete('bookmarkGroups');
            localStorage.removeItem('noesis_vault_bookmark_groups');
            lastPushedGroupsJson = '[]';
            window.dispatchEvent(new CustomEvent('bookmark-groups-updated', { detail: [] }));
          } else {
            const deletedId = payload.old?.id;
            if (deletedId) {
              // 1. Mark as recently deleted and cancel any pending push timers (Resurrect Guard)
              markNodeAsDeleted(deletedId);

              // 2. Delete from local IndexedDB
              await db.nodes.delete(deletedId);
              await db.ai_metadata.delete(deletedId);

              // 3. Smart Ghost Tab Cleanup: prune deleted ID from openTabs and adjust activeTabId
              try {
                const openTabsSetting = await db.settings.get('openTabs');
                let tabs: string[] = [];
                if (openTabsSetting?.value) {
                  try {
                    tabs = JSON.parse(openTabsSetting.value);
                  } catch (e) {
                    tabs = [];
                  }
                }
                const newTabs = tabs.filter((t) => t !== deletedId);
                if (newTabs.length !== tabs.length) {
                  await db.settings.put({ key: 'openTabs', value: JSON.stringify(newTabs) });
                }

                const activeSetting = await db.settings.get('activeTabId');
                if (activeSetting?.value === deletedId) {
                  const nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                  await db.settings.put({ key: 'activeTabId', value: nextActive });
                }
              } catch (err) {
                console.warn('Failed to prune openTabs on realtime delete:', err);
              }
            }
            window.dispatchEvent(new Event('vault-updated'));
          }
        } else if (payload.new) {
          const cloudNode = payload.new as any;

          // Special handling for System Bookmark Groups
          if (cloudNode.id === '__system_bookmark_groups__') {
            try {
              const groups = cloudNode.metadata?.groups || (cloudNode.content ? JSON.parse(cloudNode.content) : []);
              if (Array.isArray(groups)) {
                const groupsJson = JSON.stringify(groups);
                const currentLocal = localStorage.getItem('noesis_vault_bookmark_groups');
                // Guard against echo-loop: if cloud data is identical to local state or just pushed, ignore
                if (currentLocal === groupsJson || lastPushedGroupsJson === groupsJson) {
                  return;
                }
                lastPushedGroupsJson = groupsJson;
                await db.settings.put({ key: 'bookmarkGroups', value: groupsJson });
                localStorage.setItem('noesis_vault_bookmark_groups', groupsJson);
                window.dispatchEvent(new CustomEvent('bookmark-groups-updated', { detail: groups }));
              }
            } catch (e) {
              console.warn('Failed to parse realtime bookmark groups:', e);
            }
            return;
          }

          const cloudUpdatedAt = toTimestamp(cloudNode.updatedAt);
          const existingLocal = await db.nodes.get(cloudNode.id);

          // Ignore stale or local-echo events if local data is equal or newer
          if (existingLocal && existingLocal.updatedAt && existingLocal.updatedAt >= cloudUpdatedAt) {
            return;
          }

          const localNode: FileNode = {
            id: cloudNode.id,
            name: cloudNode.name,
            type: cloudNode.type as 'file' | 'folder',
            parentId: cloudNode.parentId,
            content: cloudNode.content || undefined,
            metadata: cloudNode.metadata || undefined,
            createdAt: toTimestamp(cloudNode.createdAt),
            updatedAt: cloudUpdatedAt,
          };
          await db.nodes.put(localNode);
          window.dispatchEvent(new Event('vault-updated'));
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_sessions', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          await db.chat_sessions.delete(payload.old.id);
        } else if (payload.new) {
          await db.chat_sessions.put(payload.new as any);
        }
        window.dispatchEvent(new Event('chat-updated'));
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          await db.chat_messages.delete(payload.old.id);
        } else if (payload.new) {
          const existing = await db.chat_messages.get(payload.new.id);
          const toPut = {
            ...payload.new,
            cascadeLog: existing?.cascadeLog,
          };
          await db.chat_messages.put(toPut as any);
        }
        window.dispatchEvent(new Event('chat-updated'));
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'media_attachments', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          await db.media_attachments.delete(payload.old.id);
        } else if (payload.new) {
          // Parse back to local format if needed
          const record = payload.new;
          const existingLocal = await db.media_attachments.get(record.id);
          let deletedAt = record.deleted_at ? new Date(record.deleted_at).getTime() : undefined;
          if (!deletedAt && existingLocal?.deletedAt) {
            deletedAt = existingLocal.deletedAt;
          }

          const localItem = {
            id: record.id,
            title: record.title,
            url: record.url,
            type: record.type,
            createdAt: record.created_at || new Date().toISOString(),
            deletedAt
          };
          
          await db.media_attachments.put(localItem as any);
        }
        // Assuming we need a way to notify media view of updates
        window.dispatchEvent(new Event('media-updated'));
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'studio_projects', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.id) {
            await db.studio_projects.delete(payload.old.id);
          }
        } else if (payload.new) {
          const p = payload.new as any;
          const localProject: StudioProjectRecord = {
            id: p.id,
            title: p.title,
            type: p.type,
            status: p.status || 'idea',
            genre: p.genre || undefined,
            targetReleaseDate: p.target_release_date || undefined,
            coverUrl: p.cover_url || undefined,
            description: p.description || undefined,
            progressNote: p.progress_note || undefined,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
          await db.studio_projects.put(localProject);
        }
        window.dispatchEvent(new Event('music-studio-updated'));
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'studio_songs', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.id) {
            await db.studio_songs.delete(payload.old.id);
          }
        } else if (payload.new) {
          const s = payload.new as any;
          const localSong: StudioSongRecord = {
            id: s.id,
            projectId: s.project_id || undefined,
            releaseType: s.release_type || 'single',
            trackNumber: s.track_number ? Number(s.track_number) : undefined,
            title: s.title,
            premise: s.premise || '',
            contentLyrics: s.content_lyrics || '',
            status: s.status || 'idea',
            progress: typeof s.progress === 'number' ? s.progress : 0,
            progressNote: s.progress_note || undefined,
            musicalKey: s.musical_key || 'C',
            bpm: s.bpm || 120,
            capo: s.capo || 0,
            timeSignature: s.time_signature || '4/4',
            tuning: s.tuning || 'Standard (E A D G B E)',
            genre: s.genre || undefined,
            targetReleaseDate: s.target_release_date || undefined,
            scratchpad: s.scratchpad || '',
            referenceLink: s.reference_link || undefined,
            audioUrl: s.audio_url || undefined,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          };
          await db.studio_songs.put(localSong);
        }
        window.dispatchEvent(new Event('music-studio-updated'));
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'studio_lyric_versions', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.id) {
            await db.studio_lyric_versions.delete(payload.old.id);
          }
        } else if (payload.new) {
          const v = payload.new as any;
          const localVersion: StudioLyricVersionRecord = {
            id: v.id,
            songId: v.song_id,
            versionName: v.version_name,
            content: v.content,
            isFocused: !!v.is_focused,
            isFinal: !!v.is_final,
            createdAt: v.created_at,
          };
          await db.studio_lyric_versions.put(localVersion);
        }
        window.dispatchEvent(new Event('music-studio-updated'));
      }
    )
    .subscribe();
};

// Push a single node (create or update) to Supabase (debounced to avoid network thrashing during fast typing)
export const pushNodeToCloud = async (node: FileNode): Promise<void> => {
  const nodeId = node.id;

  // Immediate guard: If node was recently deleted, cancel push immediately
  if (isNodeRecentlyDeleted(nodeId)) {
    cancelPushDebounceTimer(nodeId);
    return;
  }

  cancelPushDebounceTimer(nodeId);

  const timer = setTimeout(async () => {
    pushDebounceTimers.delete(nodeId);
    try {
      // Secondary check: verify not deleted while debounce was waiting
      if (isNodeRecentlyDeleted(nodeId)) {
        console.info(`[cloudSync] Skipped push: node ${nodeId} was recently deleted.`);
        return;
      }

      const userId = await getUserId();
      if (!userId) return; // Not logged in, skip sync

      // CRITICAL ZOMBIE RESURRECT GUARD:
      // Verify the node still exists in local IndexedDB before pushing to Supabase.
      // If the node was deleted locally or remotely, abort immediately.
      const freshNode = await db.nodes.get(nodeId);
      if (!freshNode) {
        console.info(`[cloudSync] Skipped push: note ${nodeId} no longer exists in local database.`);
        return;
      }

      const payload = {
        id: freshNode.id,
        name: freshNode.name,
        type: freshNode.type,
        parentId: freshNode.parentId,
        content: freshNode.content || null,
        metadata: freshNode.metadata || null,
        createdAt: freshNode.createdAt,
        updatedAt: freshNode.updatedAt,
        user_id: userId,
      };

      const { error } = await supabase.from('nodes').upsert(payload);
      if (error) {
        console.warn('Supabase push failed (possibly offline or invalid config):', error.message);
      }
    } catch (err) {
      console.warn('Failed to push to cloud:', err);
    }
  }, 500);

  pushDebounceTimers.set(nodeId, timer);
};

// Delete nodes and their associated AI metadata and embeddings from Supabase
export const deleteNodesFromCloud = async (ids: string[]): Promise<void> => {
  if (!ids || ids.length === 0) return;
  // Mark all IDs as recently deleted and cancel any pending push timers (Resurrect Guard)
  for (const id of ids) {
    markNodeAsDeleted(id);
  }
  // Ensure local ai_metadata is purged immediately
  try {
    await db.ai_metadata.bulkDelete(ids);
  } catch (err) {
    console.warn('Failed to delete local ai_metadata in deleteNodesFromCloud:', err);
  }
  try {
    const userId = await getUserId();
    if (!userId) return; // Not logged in, skip sync

    // 1. Delete associated AI analysis metadata
    await supabase
      .from('note_metadata')
      .delete()
      .in('note_id', ids)
      .eq('user_id', userId);

    // 2. Delete associated RAG vector embeddings
    await supabase
      .from('note_embeddings')
      .delete()
      .in('note_id', ids)
      .eq('user_id', userId);

    // 3. Delete nodes themselves (will also trigger ON DELETE CASCADE in DB)
    const { error } = await supabase
      .from('nodes')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase delete error:', error.message);
    }
  } catch (err) {
    console.warn('Failed to delete from cloud:', err);
  }
};

// Push a single chat session to Supabase
export const pushChatSessionToCloud = async (session: any): Promise<void> => {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const cloudSession = {
      id: session.id,
      title: session.title || 'Untitled Chat',
      isPinned: Boolean(session.isPinned),
      memorySummary: session.memorySummary || null,
      createdAt: toTimestamp(session.createdAt),
      updatedAt: toTimestamp(session.updatedAt),
      user_id: userId,
    };

    const { error } = await supabase.from('chat_sessions').upsert(cloudSession);
    if (error) console.warn('Supabase chat session push error:', error.message);
  } catch (err) {
    console.warn('Failed to push chat session to cloud:', err);
  }
};

// Push a single chat message to Supabase
export const pushChatMessageToCloud = async (msg: any): Promise<void> => {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const cloudMsg = {
      id: msg.id,
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content || '',
      sources: msg.sources || null,
      chunks: msg.chunks || null,
      createdAt: toTimestamp(msg.createdAt),
      user_id: userId,
    };

    const { error } = await supabase.from('chat_messages').upsert(cloudMsg);
    if (error) console.warn('Supabase chat message push error:', error.message);
  } catch (err) {
    console.warn('Failed to push chat message to cloud:', err);
  }
};

// Delete a chat session from Supabase (will cascade messages)
export const deleteChatSessionFromCloud = async (id: string): Promise<void> => {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) console.warn('Supabase chat session delete error:', error.message);
  } catch (err) {
    console.warn('Failed to delete chat session from cloud:', err);
  }
};

// Delete chat messages from Supabase
export const deleteChatMessagesFromCloud = async (ids: string[]): Promise<void> => {
  try {
    const userId = await getUserId();
    if (!userId || ids.length === 0) return;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);
    if (error) console.warn('Supabase chat message delete error:', error.message);
  } catch (err) {
    console.warn('Failed to delete chat messages from cloud:', err);
  }
};

let groupsDebounceTimer: NodeJS.Timeout | null = null;

// Push Bookmark Groups to Supabase (debounced)
export const pushBookmarkGroupsToCloud = async (groups: any[]): Promise<void> => {
  if (groupsDebounceTimer) {
    clearTimeout(groupsDebounceTimer);
  }

  groupsDebounceTimer = setTimeout(async () => {
    groupsDebounceTimer = null;
    try {
      const userId = await getUserId();
      if (!userId) return;

      const groupsJson = JSON.stringify(groups || []);
      // Skip if identical to what was already pushed or received
      if (groupsJson === lastPushedGroupsJson) {
        return;
      }
      lastPushedGroupsJson = groupsJson;

      const payload = {
        id: '__system_bookmark_groups__',
        name: 'Bookmark Groups',
        type: 'system',
        parentId: '__system__',
        content: groupsJson,
        metadata: { groups: groups || [] },
        createdAt: 0,
        updatedAt: Date.now(),
        user_id: userId,
      };

      const { error } = await supabase.from('nodes').upsert(payload);
      if (error) {
        console.warn('Supabase bookmark groups push error:', error.message);
      }
    } catch (err) {
      console.warn('Failed to push bookmark groups to cloud:', err);
    }
  }, 400);
};
