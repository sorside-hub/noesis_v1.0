import { db } from '../../../lib/db';
import { supabase, getSupabaseConfig } from '../../../lib/supabase';
import { StudioProjectRecord, StudioSongRecord, StudioLyricVersionRecord, StudioBarRecord } from '../types/studioDatabase';

// ==========================================
// PERSISTENT DELETION TRACKING (Tombstones)
// Prevents deleted projects/songs from resurrecting on cloud sync
// ==========================================

const DELETED_PROJECTS_KEY = 'noesis_deleted_studio_projects';
const DELETED_SONGS_KEY = 'noesis_deleted_studio_songs';
const DELETED_BARS_KEY = 'noesis_deleted_studio_bars';

export function getDeletedStudioProjectIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PROJECTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function getDeletedStudioSongIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_SONGS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markStudioProjectAsDeleted(id: string) {
  const set = getDeletedStudioProjectIds();
  set.add(id);
  try {
    localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function markStudioSongAsDeleted(id: string) {
  const set = getDeletedStudioSongIds();
  set.add(id);
  try {
    localStorage.setItem(DELETED_SONGS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function getDeletedStudioBarIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_BARS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markStudioBarAsDeleted(id: string) {
  const set = getDeletedStudioBarIds();
  set.add(id);
  try {
    localStorage.setItem(DELETED_BARS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

// ==========================================
// 0. STUDIO BARS CRUD (Idea Bank - Offline First)
// ==========================================

export async function getAllStudioBars(): Promise<StudioBarRecord[]> {
  const deletedIds = getDeletedStudioBarIds();
  const allBars = await db.studio_bars.toArray();
  return allBars
    .filter((b) => !b.deletedAt && !deletedIds.has(b.id))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getStudioBarById(id: string): Promise<StudioBarRecord | undefined> {
  const deletedIds = getDeletedStudioBarIds();
  if (deletedIds.has(id)) return undefined;
  const bar = await db.studio_bars.get(id);
  if (bar && !bar.deletedAt) return bar;
  return undefined;
}

export async function saveStudioBar(bar: StudioBarRecord): Promise<void> {
  // Clear any tombstone if re-created or updated
  const deletedSet = getDeletedStudioBarIds();
  if (deletedSet.has(bar.id)) {
    deletedSet.delete(bar.id);
    try {
      localStorage.setItem(DELETED_BARS_KEY, JSON.stringify(Array.from(deletedSet)));
    } catch {}
  }

  const updatedBar: StudioBarRecord = {
    ...bar,
    updatedAt: new Date().toISOString(),
  };
  await db.studio_bars.put(updatedBar);
  window.dispatchEvent(new Event('music-studio-updated'));

  // Background non-blocking sync to Supabase if configured & logged in
  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const payload: any = {
            id: updatedBar.id,
            title: updatedBar.title,
            content: updatedBar.content || '',
            theme: updatedBar.theme || 'Bebas',
            topic: updatedBar.topic || '',
            rhyme_scheme: updatedBar.rhymeScheme || 'Bebas',
            bar_count: typeof updatedBar.barCount === 'number' ? updatedBar.barCount : 4,
            status: updatedBar.status || 'available',
            used_in_song_id: updatedBar.usedInSongId || null,
            tags: updatedBar.tags || [],
            notes: updatedBar.notes || '',
            user_id: user.id,
            created_at: updatedBar.createdAt,
            updated_at: updatedBar.updatedAt,
          };
          const { error } = await supabase.from('studio_bars').upsert(payload);
          if (error && error.code !== 'PGRST205') {
            console.warn('[MusicStudio] studio_bars upsert warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('[MusicStudio] Remote studio_bars sync failed, saved locally:', err);
      }
    })();
  }
}

export async function deleteStudioBar(id: string): Promise<void> {
  markStudioBarAsDeleted(id);
  await db.studio_bars.delete(id);
  window.dispatchEvent(new Event('music-studio-updated'));

  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      await supabase.from('studio_bars').delete().eq('id', id);
    } catch (err) {
      console.warn('[MusicStudio] Remote studio_bars delete failed:', err);
    }
  }
}

// ==========================================
// 1. STUDIO PROJECTS CRUD (Offline First + Sync)
// ==========================================

export async function getAllStudioProjects(): Promise<StudioProjectRecord[]> {
  try {
    const deletedIds = getDeletedStudioProjectIds();
    const projects = await db.studio_projects
      .filter((p) => !p.deletedAt && !deletedIds.has(p.id))
      .toArray();
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[MusicStudio] Failed to load projects from DB:', err);
    return [];
  }
}

export async function saveStudioProject(project: StudioProjectRecord): Promise<void> {
  // Clear any tombstone if re-created
  const deletedSet = getDeletedStudioProjectIds();
  if (deletedSet.has(project.id)) {
    deletedSet.delete(project.id);
    try {
      localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(Array.from(deletedSet)));
    } catch {}
  }

  const record = { ...project };
  if (!record.theme || !record.theme.trim()) {
    delete record.theme;
  } else {
    record.theme = record.theme.trim();
  }

  await db.studio_projects.put(record);

  // Background non-blocking sync to Supabase if configured & logged in
  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const payload: any = {
            id: record.id,
            title: record.title,
            type: record.type,
            status: record.status || 'idea',
            theme: record.theme || null,
            target_release_date: record.targetReleaseDate || null,
            cover_url: record.coverUrl || null,
            description: record.description || null,
            progress_note: record.progressNote || null,
            user_id: user.id,
            created_at: record.createdAt,
            updated_at: record.updatedAt,
          };
          const { error } = await supabase.from('studio_projects').upsert(payload);
          if (error) {
            console.warn('[MusicStudio] studio_projects upsert warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('[MusicStudio] Remote project sync failed, saved locally:', err);
      }
    })();
  }
}

export async function deleteStudioProject(id: string): Promise<void> {
  markStudioProjectAsDeleted(id);

  // 1. Delete project from Dexie permanently
  await db.studio_projects.delete(id);

  // 2. Cascade delete all child tracks and their lyric versions
  try {
    const childSongs = await db.studio_songs.where('projectId').equals(id).toArray();
    for (const song of childSongs) {
      markStudioSongAsDeleted(song.id);
      await db.studio_songs.delete(song.id);
      try {
        await db.studio_lyric_versions.where('songId').equals(song.id).delete();
      } catch (verErr) {
        console.warn('[MusicStudio] Failed deleting versions for child song:', verErr);
      }
    }
  } catch (childErr) {
    console.warn('[MusicStudio] Failed cascading song deletions:', childErr);
  }

  // 3. Delete in Supabase if configured
  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      await supabase.from('studio_songs').delete().eq('project_id', id);
      await supabase.from('studio_projects').delete().eq('id', id);
    } catch (err) {
      console.warn('[MusicStudio] Remote project delete failed:', err);
    }
  }
}

// ==========================================
// 2. STUDIO SONGS CRUD (Offline First + Sync)
// ==========================================

export async function getAllStudioSongs(): Promise<StudioSongRecord[]> {
  try {
    const deletedSongIds = getDeletedStudioSongIds();
    const deletedProjIds = getDeletedStudioProjectIds();

    const [allSongs, allProjects] = await Promise.all([
      db.studio_songs.filter((s) => !s.deletedAt && !deletedSongIds.has(s.id)).toArray(),
      db.studio_projects.filter((p) => !p.deletedAt && !deletedProjIds.has(p.id)).toArray(),
    ]);

    const activeProjectIds = new Set(allProjects.map((p) => p.id));
    const validSongs: StudioSongRecord[] = [];
    const orphanedSongIds: string[] = [];

    for (const song of allSongs) {
      if (song.projectId) {
        if (activeProjectIds.has(song.projectId)) {
          validSongs.push(song);
        } else {
          // Detected orphaned track whose parent project was deleted!
          orphanedSongIds.push(song.id);
        }
      } else {
        // Legitimate standalone Single song
        validSongs.push(song);
      }
    }

    // Auto-cleanup orphaned songs in the background so they never leak
    if (orphanedSongIds.length > 0) {
      Promise.all(orphanedSongIds.map((id) => {
        markStudioSongAsDeleted(id);
        return db.studio_songs.delete(id);
      })).catch((err) => {
        console.warn('[MusicStudio] Auto-cleanup of orphaned songs failed:', err);
      });
    }

    return validSongs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[MusicStudio] Failed to load songs from DB:', err);
    return [];
  }
}

export async function getStudioSongById(id: string): Promise<StudioSongRecord | undefined> {
  const deletedSongIds = getDeletedStudioSongIds();
  if (deletedSongIds.has(id)) return undefined;
  return await db.studio_songs.get(id);
}

export async function saveStudioSong(song: StudioSongRecord): Promise<void> {
  // Clear any tombstone if re-created
  const deletedSet = getDeletedStudioSongIds();
  if (deletedSet.has(song.id)) {
    deletedSet.delete(song.id);
    try {
      localStorage.setItem(DELETED_SONGS_KEY, JSON.stringify(Array.from(deletedSet)));
    } catch {}
  }

  const record = { ...song };
  if (!record.theme || !record.theme.trim()) {
    delete record.theme;
  } else {
    record.theme = record.theme.trim();
  }

  await db.studio_songs.put(record);

  // Background non-blocking sync to Supabase if configured & logged in
  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const payload: any = {
            id: record.id,
            project_id: record.projectId || null,
            release_type: record.releaseType || 'single',
            track_number: record.trackNumber || null,
            title: record.title,
            premise: record.premise || '',
            scratchpad: record.scratchpad || '',
            content_lyrics: record.contentLyrics || '',
            status: record.status,
            progress: typeof record.progress === 'number' ? record.progress : 0,
            progress_note: record.progressNote || null,
            musical_key: record.musicalKey || 'C',
            bpm: record.bpm || 120,
            capo: record.capo || 0,
            time_signature: record.timeSignature || '4/4',
            tuning: record.tuning || 'Standard (E A D G B E)',
            theme: record.theme || null,
            target_release_date: record.targetReleaseDate || null,
            audio_url: record.audioUrl || null,
            cover_url: record.coverUrl || null,
            user_id: user.id,
            created_at: record.createdAt,
            updated_at: record.updatedAt,
          };
          const { error } = await supabase.from('studio_songs').upsert(payload);
          if (error) {
            console.warn('[MusicStudio] studio_songs upsert warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('[MusicStudio] Remote song sync failed, saved locally:', err);
      }
    })();
  }
}

export async function deleteStudioSong(id: string): Promise<void> {
  markStudioSongAsDeleted(id);

  // 1. Delete song from Dexie permanently
  await db.studio_songs.delete(id);

  try {
    await db.studio_lyric_versions.where('songId').equals(id).delete();
  } catch (err) {
    console.warn('[MusicStudio] Failed deleting lyric versions:', err);
  }

  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      await supabase.from('studio_songs').delete().eq('id', id);
    } catch (err) {
      console.warn('[MusicStudio] Remote song delete failed:', err);
    }
  }
}

// ==========================================
// 3. LYRIC VERSIONS CRUD
// ==========================================

export const isDefaultTemplate = (content?: string): boolean => {
  if (!content) return false;
  return (
    content.includes('Tulis lirik dan chord') ||
    content.includes('Bagian reff lagu') ||
    content.includes('<h3>[Intro]</h3>\n<p>[C]</p>')
  );
};

export async function getLyricVersionById(id: string): Promise<StudioLyricVersionRecord | undefined> {
  try {
    return await db.studio_lyric_versions.get(id);
  } catch (err) {
    console.error('[MusicStudio] Failed to get lyric version by id:', err);
    return undefined;
  }
}

export async function getLyricVersionsBySongId(songId: string): Promise<StudioLyricVersionRecord[]> {
  try {
    const versions = await db.studio_lyric_versions
      .where('songId')
      .equals(songId)
      .toArray();
    return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[MusicStudio] Failed to load lyric versions:', err);
    return [];
  }
}

export async function saveLyricVersion(version: StudioLyricVersionRecord): Promise<void> {
  const updatedVersion = {
    ...version,
    updatedAt: version.updatedAt || new Date().toISOString(),
  };
  await db.studio_lyric_versions.put(updatedVersion);

  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('studio_lyric_versions').upsert({
            id: updatedVersion.id,
            song_id: updatedVersion.songId,
            version_name: updatedVersion.versionName,
            content: updatedVersion.content,
            is_focused: !!updatedVersion.isFocused,
            is_final: !!updatedVersion.isFinal,
            musical_key: updatedVersion.musicalKey || 'C',
            bpm: updatedVersion.bpm || 120,
            capo: updatedVersion.capo || 0,
            time_signature: updatedVersion.timeSignature || '4/4',
            tuning: updatedVersion.tuning || 'Standard (E A D G B E)',
            user_id: user.id,
            created_at: updatedVersion.createdAt,
            updated_at: updatedVersion.updatedAt,
          });
        }
      } catch (err) {
        console.warn('[MusicStudio] Remote lyric version sync failed:', err);
      }
    })();
  }
}

export async function deleteLyricVersion(id: string): Promise<void> {
  await db.studio_lyric_versions.delete(id);

  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      await supabase.from('studio_lyric_versions').delete().eq('id', id);
    } catch (err) {
      console.warn('[MusicStudio] Remote lyric version delete failed:', err);
    }
  }
}

// ==========================================
// 4. CLOUD SYNC PULL (Supabase -> Local Dexie)
// ==========================================

export async function syncMusicStudioFromCloud(): Promise<void> {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const deletedProjIds = getDeletedStudioProjectIds();
    const deletedSongIds = getDeletedStudioSongIds();

    // 1. Fetch projects
    const { data: remoteProjects, error: projErr } = await supabase
      .from('studio_projects')
      .select('*')
      .eq('user_id', user.id);

    if (!projErr && remoteProjects) {
      // Filter out any projects that were deleted locally
      const activeRemoteProjects = remoteProjects.filter((p: any) => !deletedProjIds.has(p.id));

      // Clean up remotely any projects that were marked deleted locally
      if (deletedProjIds.size > 0) {
        try {
          await supabase.from('studio_projects').delete().in('id', Array.from(deletedProjIds));
        } catch {}
      }

      const allLocalProjects = await db.studio_projects.toArray();
      const localProjectMap = new Map(allLocalProjects.map((p) => [p.id, p]));

      const localProjects: StudioProjectRecord[] = activeRemoteProjects.map((p: any) => {
        const local = localProjectMap.get(p.id);
        const remoteUpdated = new Date(p.updated_at).getTime() || 0;
        const localUpdated = local ? (new Date(local.updatedAt).getTime() || 0) : 0;

        // If local record exists and is newer than cloud, preserve local changes (including deleted theme)
        if (local && localUpdated >= remoteUpdated) {
          return local;
        }

        return {
          id: p.id,
          title: p.title,
          type: p.type,
          status: p.status || 'idea',
          theme: p.theme ? p.theme.trim() : undefined,
          genre: p.genre || undefined,
          targetReleaseDate: p.target_release_date || undefined,
          coverUrl: p.cover_url || undefined,
          description: p.description || undefined,
          progressNote: p.progress_note || undefined,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      });

      // Reconcile: Purge local projects that were deleted on cloud
      const remoteProjIds = new Set(activeRemoteProjects.map((p: any) => p.id));
      const purgeProjIds = allLocalProjects
        .filter((p) => !remoteProjIds.has(p.id) || deletedProjIds.has(p.id))
        .map((p) => p.id);
      if (purgeProjIds.length > 0) {
        await db.studio_projects.bulkDelete(purgeProjIds);
      }

      if (localProjects.length > 0) {
        await db.studio_projects.bulkPut(localProjects);
      }
    }

    // 2. Fetch songs
    const { data: remoteSongs, error: songErr } = await supabase
      .from('studio_songs')
      .select('*')
      .eq('user_id', user.id);

    if (!songErr && remoteSongs) {
      // Filter out any songs that were deleted locally
      const activeRemoteSongs = remoteSongs.filter((s: any) => !deletedSongIds.has(s.id));

      if (deletedSongIds.size > 0) {
        try {
          await supabase.from('studio_songs').delete().in('id', Array.from(deletedSongIds));
        } catch {}
      }

      const allLocalSongs = await db.studio_songs.toArray();
      const localSongMap = new Map(allLocalSongs.map((s) => [s.id, s]));

      const localSongs: StudioSongRecord[] = activeRemoteSongs.map((s: any) => {
        const local = localSongMap.get(s.id);
        const remoteUpdated = new Date(s.updated_at).getTime() || 0;
        const localUpdated = local ? (new Date(local.updatedAt).getTime() || 0) : 0;

        // If local record exists and is newer than cloud, preserve local changes (including deleted theme)
        if (local && localUpdated >= remoteUpdated) {
          return local;
        }

        return {
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
          theme: s.theme ? s.theme.trim() : undefined,
          genre: s.genre || undefined,
          targetReleaseDate: s.target_release_date || undefined,
          scratchpad: s.scratchpad || '',
          referenceLink: s.reference_link || undefined,
          audioUrl: s.audio_url || undefined,
          coverUrl: s.cover_url || undefined,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        };
      });

      // Reconcile: Purge local songs that were deleted on cloud
      const remoteSongIds = new Set(activeRemoteSongs.map((s: any) => s.id));
      const purgeSongIds = allLocalSongs
        .filter((s) => !remoteSongIds.has(s.id) || deletedSongIds.has(s.id))
        .map((s) => s.id);
      if (purgeSongIds.length > 0) {
        await db.studio_songs.bulkDelete(purgeSongIds);
      }

      if (localSongs.length > 0) {
        await db.studio_songs.bulkPut(localSongs);
      }
    }

    // 3. Fetch lyric versions
    const { data: remoteVersions, error: verErr } = await supabase
      .from('studio_lyric_versions')
      .select('*')
      .eq('user_id', user.id);

    if (!verErr && remoteVersions) {
      const activeRemoteVersions = remoteVersions.filter((v: any) => !deletedSongIds.has(v.song_id));
      const localVersions: StudioLyricVersionRecord[] = activeRemoteVersions.map((v: any) => ({
        id: v.id,
        songId: v.song_id,
        versionName: v.version_name,
        content: v.content,
        isFocused: !!v.is_focused,
        isFinal: !!v.is_final,
        musicalKey: v.musical_key || 'C',
        bpm: v.bpm || 120,
        capo: v.capo || 0,
        timeSignature: v.time_signature || '4/4',
        tuning: v.tuning || 'Standard (E A D G B E)',
        createdAt: v.created_at,
        updatedAt: v.updated_at || v.created_at,
      }));

      // Reconcile: Purge local versions that were deleted on cloud
      const remoteVersionIds = new Set(activeRemoteVersions.map((v: any) => v.id));
      const allLocalVersions = await db.studio_lyric_versions.toArray();
      const deletedVersionIds = allLocalVersions
        .filter((v) => !remoteVersionIds.has(v.id) || deletedSongIds.has(v.songId))
        .map((v) => v.id);
      if (deletedVersionIds.length > 0) {
        await db.studio_lyric_versions.bulkDelete(deletedVersionIds);
      }

      if (localVersions.length > 0) {
        await db.studio_lyric_versions.bulkPut(localVersions);
      }
    }

    // 4. Fetch Idea Bank Bars (studio_bars)
    const deletedBarIds = getDeletedStudioBarIds();
    const { data: remoteBars, error: barErr } = await supabase
      .from('studio_bars')
      .select('*')
      .eq('user_id', user.id);

    if (!barErr && remoteBars) {
      const activeRemoteBars = remoteBars.filter((b: any) => !deletedBarIds.has(b.id));
      const localBars: StudioBarRecord[] = activeRemoteBars.map((b: any) => ({
        id: b.id,
        title: b.title || 'Bar Baru',
        content: b.content || '',
        theme: b.theme || 'Bebas',
        topic: b.topic || '',
        rhymeScheme: b.rhyme_scheme || 'Bebas',
        barCount: typeof b.bar_count === 'number' ? b.bar_count : 4,
        status: b.status || 'available',
        usedInSongId: b.used_in_song_id || null,
        tags: Array.isArray(b.tags) ? b.tags : [],
        notes: b.notes || '',
        createdAt: b.created_at,
        updatedAt: b.updated_at || b.created_at,
      }));

      // Reconcile: Purge local bars that were deleted on cloud
      const remoteBarIds = new Set(activeRemoteBars.map((b: any) => b.id));
      const allLocalBars = await db.studio_bars.toArray();
      const purgeBarIds = allLocalBars
        .filter((b) => !remoteBarIds.has(b.id) || deletedBarIds.has(b.id))
        .map((b) => b.id);
      if (purgeBarIds.length > 0) {
        await db.studio_bars.bulkDelete(purgeBarIds);
      }

      if (localBars.length > 0) {
        await db.studio_bars.bulkPut(localBars);
      }
    }

    window.dispatchEvent(new Event('music-studio-updated'));
  } catch (err) {
    console.warn('[MusicStudio] Cloud pull error:', err);
  }
}

