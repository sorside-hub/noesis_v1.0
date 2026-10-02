import { db } from '../../../lib/db';
import { supabase, getSupabaseConfig } from '../../../lib/supabase';
import { StudioProjectRecord, StudioSongRecord, StudioLyricVersionRecord } from '../types/studioDatabase';

// ==========================================
// 1. STUDIO PROJECTS CRUD (Offline First + Sync)
// ==========================================

export async function getAllStudioProjects(): Promise<StudioProjectRecord[]> {
  try {
    const projects = await db.studio_projects
      .filter((p) => !p.deletedAt)
      .toArray();
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[MusicStudio] Failed to load projects from DB:', err);
    return [];
  }
}

export async function saveStudioProject(project: StudioProjectRecord): Promise<void> {
  await db.studio_projects.put(project);

  // Sync to Supabase if configured & logged in
  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('studio_projects').upsert({
          id: project.id,
          title: project.title,
          type: project.type,
          status: project.status || 'idea',
          genre: project.genre || null,
          target_release_date: project.targetReleaseDate || null,
          cover_url: project.coverUrl || null,
          description: project.description || null,
          progress_note: project.progressNote || null,
          user_id: user.id,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        });
      }
    } catch (err) {
      console.warn('[MusicStudio] Remote project sync failed, saved locally:', err);
    }
  }
}

export async function deleteStudioProject(id: string): Promise<void> {
  const now = Date.now();
  // 1. Soft delete the project in Dexie
  await db.studio_projects.update(id, { deletedAt: now });

  // 2. Cascade delete all child tracks and their lyric versions
  try {
    const childSongs = await db.studio_songs.where('projectId').equals(id).toArray();
    for (const song of childSongs) {
      await db.studio_songs.update(song.id, { deletedAt: now });
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
    const [allSongs, allProjects] = await Promise.all([
      db.studio_songs.filter((s) => !s.deletedAt).toArray(),
      db.studio_projects.filter((p) => !p.deletedAt).toArray(),
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
      const now = Date.now();
      Promise.all(orphanedSongIds.map((id) => db.studio_songs.update(id, { deletedAt: now }))).catch((err) => {
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
  return await db.studio_songs.get(id);
}

export async function saveStudioSong(song: StudioSongRecord): Promise<void> {
  await db.studio_songs.put(song);

  // Sync to Supabase if configured & logged in
  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('studio_songs').upsert({
          id: song.id,
          project_id: song.projectId || null,
          release_type: song.releaseType || 'single',
          track_number: song.trackNumber || null,
          title: song.title,
          premise: song.premise || '',
          scratchpad: song.scratchpad || '',
          content_lyrics: song.contentLyrics,
          status: song.status,
          progress: typeof song.progress === 'number' ? song.progress : 0,
          progress_note: song.progressNote || null,
          musical_key: song.musicalKey,
          bpm: song.bpm,
          capo: song.capo,
          time_signature: song.timeSignature,
          tuning: song.tuning,
          genre: song.genre || null,
          target_release_date: song.targetReleaseDate || null,
          reference_link: song.referenceLink || null,
          audio_url: song.audioUrl || null,
          cover_url: song.coverUrl || null,
          user_id: user.id,
          created_at: song.createdAt,
          updated_at: song.updatedAt,
        });
      }
    } catch (err) {
      console.warn('[MusicStudio] Remote song sync failed, saved locally:', err);
    }
  }
}

export async function deleteStudioSong(id: string): Promise<void> {
  await db.studio_songs.update(id, { deletedAt: Date.now() });

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
  await db.studio_lyric_versions.put(version);

  const config = getSupabaseConfig();
  if (config.isConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('studio_lyric_versions').upsert({
          id: version.id,
          song_id: version.songId,
          version_name: version.versionName,
          content: version.content,
          is_focused: !!version.isFocused,
          is_final: !!version.isFinal,
          user_id: user.id,
          created_at: version.createdAt,
        });
      }
    } catch (err) {
      console.warn('[MusicStudio] Remote lyric version sync failed:', err);
    }
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

    // Fetch projects
    const { data: remoteProjects, error: projErr } = await supabase
      .from('studio_projects')
      .select('*')
      .eq('user_id', user.id);

    if (!projErr && remoteProjects) {
      const localProjects: StudioProjectRecord[] = remoteProjects.map((p: any) => ({
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
      }));
      await db.studio_projects.bulkPut(localProjects);
    }

    // Fetch songs
    const { data: remoteSongs, error: songErr } = await supabase
      .from('studio_songs')
      .select('*')
      .eq('user_id', user.id);

    if (!songErr && remoteSongs) {
      const localSongs: StudioSongRecord[] = remoteSongs.map((s: any) => ({
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
        coverUrl: s.cover_url || undefined,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
      await db.studio_songs.bulkPut(localSongs);
    }

    // Fetch lyric versions
    const { data: remoteVersions, error: verErr } = await supabase
      .from('studio_lyric_versions')
      .select('*')
      .eq('user_id', user.id);

    if (!verErr && remoteVersions) {
      const localVersions: StudioLyricVersionRecord[] = remoteVersions.map((v: any) => ({
        id: v.id,
        songId: v.song_id,
        versionName: v.version_name,
        content: v.content,
        isFocused: !!v.is_focused,
        isFinal: !!v.is_final,
        createdAt: v.created_at,
      }));
      await db.studio_lyric_versions.bulkPut(localVersions);
    }
  } catch (err) {
    console.warn('[MusicStudio] Cloud pull error:', err);
  }
}
