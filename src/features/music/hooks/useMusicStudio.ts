import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SongItem, MusicProject, MusicProductionStatus } from '../types';
import { StudioProjectRecord, StudioSongRecord } from '../types/studioDatabase';
import {
  getAllStudioProjects,
  getAllStudioSongs,
  saveStudioProject,
  saveStudioSong,
  deleteStudioProject,
  deleteStudioSong,
  saveLyricVersion,
  getLyricVersionById,
  syncMusicStudioFromCloud,
} from '../lib/musicStudioStorage';

export function useMusicStudio() {
  const [dbSongs, setDbSongs] = useState<StudioSongRecord[]>([]);
  const [dbProjects, setDbProjects] = useState<StudioProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref for instant synchronous lookups
  const dbSongsRef = useRef(dbSongs);
  useEffect(() => {
    dbSongsRef.current = dbSongs;
  }, [dbSongs]);

  // Debounce timers for typing (premise, raw, lyrics)
  const songDebounceTimersRef = useRef<Map<string, any>>(new Map());

  // Load all studio data from local Dexie & trigger cloud sync
  const reloadData = useCallback(async () => {
    try {
      const [loadedSongs, loadedProjects] = await Promise.all([
        getAllStudioSongs(),
        getAllStudioProjects(),
      ]);
      setDbSongs(loadedSongs);
      setDbProjects(loadedProjects);
    } catch (err) {
      console.error('[MusicStudio] Failed to reload studio data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
    syncMusicStudioFromCloud().then(() => {
      reloadData();
    });

    const handleStudioUpdate = () => {
      reloadData();
    };

    window.addEventListener('music-studio-updated', handleStudioUpdate);
    return () => {
      window.removeEventListener('music-studio-updated', handleStudioUpdate);
    };
  }, [reloadData]);

  // Convert dbSongs to UI SongItems (safeguarded against orphaned tracks)
  const songs: SongItem[] = useMemo(() => {
    // Only map valid standalone singles OR tracks belonging to active existing dbProjects
    const validDbSongs = dbSongs.filter((s) => {
      if (!s.projectId) return true; // Standalone single
      return dbProjects.some((p) => p.id === s.projectId); // Active parent project exists
    });

    return validDbSongs.map((s) => {
      const parentProject = dbProjects.find((p) => p.id === s.projectId);
      const content = s.contentLyrics || '';
      const textSnippet = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[[^\]]+\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);

      const hasAudioMemo = !!s.audioUrl || content.includes('data-type="audio"') || content.includes('audio/') || content.includes('.mp3') || content.includes('.wav') || content.includes('.m4a');

      return {
        id: s.id,
        title: s.title,
        key: s.musicalKey,
        bpm: s.bpm,
        project: parentProject?.title,
        genre: s.genre || parentProject?.genre,
        snippet: textSnippet || 'Belum ada lirik...',
        status: (s.status as MusicProductionStatus) || 'idea',
        hasAudioMemo,
        createdAt: new Date(s.createdAt).getTime() || Date.now(),
        updatedAt: new Date(s.updatedAt).getTime() || Date.now(),
      };
    });
  }, [dbSongs, dbProjects]);

  // Group songs into Projects UI representation
  const projects: MusicProject[] = useMemo(() => {
    const projectMap = new Map<string, MusicProject>();

    // 1. Add explicitly created dbProjects
    dbProjects.forEach((p) => {
      projectMap.set(p.id, {
        id: p.id,
        title: p.title,
        type: p.type,
        status: (p.status as MusicProductionStatus) || 'idea',
        genre: p.genre,
        releaseDate: p.targetReleaseDate,
        description: p.description,
        songs: [],
        createdAt: new Date(p.createdAt).getTime() || Date.now(),
        updatedAt: new Date(p.updatedAt).getTime() || Date.now(),
      });
    });

    // 2. Map dbSongs into their matching parent projects
    songs.forEach((song) => {
      const dbSong = dbSongs.find((s) => s.id === song.id);
      if (dbSong?.projectId && projectMap.has(dbSong.projectId)) {
        projectMap.get(dbSong.projectId)!.songs.push(song);
      }
    });

    // Sort songs inside each project by createdAt ascending (earliest created is Track #1, then Track #2, etc.)
    projectMap.forEach((proj) => {
      proj.songs.sort((a, b) => {
        const dbA = dbSongs.find((s) => s.id === a.id);
        const dbB = dbSongs.find((s) => s.id === b.id);
        if (dbA?.trackNumber && dbB?.trackNumber && dbA.trackNumber !== dbB.trackNumber) {
          return dbA.trackNumber - dbB.trackNumber;
        }
        return a.createdAt - b.createdAt;
      });
    });

    return Array.from(projectMap.values());
  }, [dbProjects, dbSongs, songs]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalSongs = songs.length;
    const totalProjects = projects.length;

    const inProgressCount = songs.filter(
      (s) => s.status !== 'ready' && s.status !== 'released'
    ).length;

    const releasedCount = songs.filter((s) => s.status === 'released').length + 
      projects.filter((p) => p.status === 'released').length;

    return {
      totalSongs,
      totalProjects,
      inProgressCount,
      releasedCount,
    };
  }, [songs, projects]);

  // Actions
  const createNewSong = async (params: {
    title: string;
    key?: string;
    bpm?: number;
    project?: string;
    genre?: string;
    status?: MusicProductionStatus;
    initialContent?: string;
  }): Promise<string> => {
    const songId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    let matchedProjectId: string | undefined = undefined;
    let trackNumber: number | undefined = undefined;
    if (params.project) {
      const proj = dbProjects.find(
        (p) => p.id === params.project || p.title.toLowerCase() === params.project!.toLowerCase()
      );
      if (proj) {
        matchedProjectId = proj.id;
        const existingProjSongs = dbSongsRef.current.filter((s) => s.projectId === proj.id);
        const maxTrack = existingProjSongs.reduce((max, s) => Math.max(max, s.trackNumber || 0), 0);
        trackNumber = Math.max(maxTrack, existingProjSongs.length) + 1;
      }
    }

    const defaultLyrics = params.initialContent || '';

    const newSong: StudioSongRecord = {
      id: songId,
      projectId: matchedProjectId,
      trackNumber,
      title: params.title.trim(),
      contentLyrics: defaultLyrics,
      status: params.status || 'idea',
      musicalKey: params.key || 'C',
      bpm: params.bpm || 120,
      capo: 0,
      timeSignature: '4/4',
      tuning: 'Standard (E A D G B E)',
      genre: params.genre?.trim() || undefined,
      scratchpad: '',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Instant 0ms Optimistic UI update for snappy satset reactivity
    setDbSongs((prev) => [newSong, ...prev]);

    // 2. Background non-blocking persistence
    saveStudioSong(newSong).catch((err) => {
      console.error('[MusicStudio] Failed to save song:', err);
    });

    return songId;
  };

  const createNewProject = async (params: {
    title: string;
    type: 'single' | 'ep' | 'album';
    status?: MusicProductionStatus;
    genre?: string;
    targetReleaseDate?: string;
    description?: string;
  }): Promise<string> => {
    const projId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const newProject: StudioProjectRecord = {
      id: projId,
      title: params.title.trim(),
      type: params.type,
      status: params.status || 'idea',
      genre: params.genre?.trim() || undefined,
      targetReleaseDate: params.targetReleaseDate?.trim() || undefined,
      description: params.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Instant 0ms Optimistic UI update for snappy satset reactivity
    setDbProjects((prev) => [newProject, ...prev]);

    // 2. Background non-blocking persistence
    saveStudioProject(newProject).catch((err) => {
      console.error('[MusicStudio] Failed to save project:', err);
    });

    return projId;
  };

  const updateSongStatus = useCallback(async (songId: string, newStatus: MusicProductionStatus) => {
    const existing = dbSongsRef.current.find((s) => s.id === songId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: StudioSongRecord = {
      ...existing,
      status: newStatus,
      updatedAt: now,
    };

    setDbSongs((prev) => prev.map((s) => (s.id === songId ? updated : s)));

    saveStudioSong(updated).catch((err) => {
      console.error('[MusicStudio] Failed to save status:', err);
    });
  }, []);

  const updateProjectStatus = useCallback(async (projectId: string, newStatus: MusicProductionStatus) => {
    const existing = dbProjects.find((p) => p.id === projectId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: StudioProjectRecord = {
      ...existing,
      status: newStatus,
      updatedAt: now,
    };

    setDbProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));

    saveStudioProject(updated).catch((err) => {
      console.error('[MusicStudio] Failed to save project status:', err);
    });
  }, [dbProjects]);

  const updateSongRecord = useCallback((songId: string, patch: Partial<StudioSongRecord>) => {
    const existing = dbSongsRef.current.find((s) => s.id === songId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: StudioSongRecord = {
      ...existing,
      ...patch,
      updatedAt: now,
    };

    // 1. Instant in-memory state update for snappy 0ms UI reactivity
    setDbSongs((prev) => {
      const next = prev.map((s) => (s.id === songId ? updated : s));
      dbSongsRef.current = next;
      return next;
    });

    // 2. Debounced save to IndexedDB and Supabase (400ms)
    const existingTimer = songDebounceTimersRef.current.get(songId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      saveStudioSong(updated).catch((err) => {
        console.error('[MusicStudio] Failed to save song patch:', err);
      });
      songDebounceTimersRef.current.delete(songId);
    }, 400);

    songDebounceTimersRef.current.set(songId, timer);
  }, []);

  // Debounced update for active lyric version (e.g. while editing in SongStudioEditor)
  const versionDebounceTimersRef = useRef<Map<string, any>>(new Map());

  const updateLyricVersionContent = useCallback((versionId: string, content: string) => {
    const existingTimer = versionDebounceTimersRef.current.get(versionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      try {
        const ver = await getLyricVersionById(versionId);
        if (ver) {
          const updatedVer = {
            ...ver,
            content,
          };
          await saveLyricVersion(updatedVer);
        }
      } catch (err) {
        console.error('[MusicStudio] Failed to save lyric version content:', err);
      }
      versionDebounceTimersRef.current.delete(versionId);
    }, 400);

    versionDebounceTimersRef.current.set(versionId, timer);
  }, []);

  // Instant flush to ensure no pending keystrokes are lost on navigation/back
  const flushSongAndVersion = useCallback(async (songId: string, versionId?: string | null) => {
    const songTimer = songDebounceTimersRef.current.get(songId);
    if (songTimer) {
      clearTimeout(songTimer);
      songDebounceTimersRef.current.delete(songId);
      const song = dbSongsRef.current.find((s) => s.id === songId);
      if (song) {
        await saveStudioSong(song).catch(console.error);
      }
    }
    if (versionId) {
      const verTimer = versionDebounceTimersRef.current.get(versionId);
      if (verTimer) {
        clearTimeout(verTimer);
        versionDebounceTimersRef.current.delete(versionId);
      }
      try {
        const ver = await getLyricVersionById(versionId);
        if (ver) {
          const song = dbSongsRef.current.find((s) => s.id === songId);
          if (song && song.contentLyrics !== undefined) {
            await saveLyricVersion({ ...ver, content: song.contentLyrics }).catch(console.error);
          }
        }
      } catch (err) {
        console.error('[MusicStudio] Failed to flush lyric version:', err);
      }
    }
  }, []);

  const updateProjectRecord = useCallback(async (projectId: string, patch: Partial<StudioProjectRecord>) => {
    const existing = dbProjects.find((p) => p.id === projectId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: StudioProjectRecord = {
      ...existing,
      ...patch,
      updatedAt: now,
    };

    setDbProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));

    saveStudioProject(updated).catch((err) => {
      console.error('[MusicStudio] Failed to save project patch:', err);
    });
  }, [dbProjects]);

  const removeSong = async (songId: string) => {
    await deleteStudioSong(songId);
    await reloadData();
  };

  const removeProject = async (projectId: string) => {
    await deleteStudioProject(projectId);
    await reloadData();
  };

  return {
    songs,
    rawSongs: dbSongs,
    projects,
    rawProjects: dbProjects,
    stats,
    isLoading,
    reloadData,
    createNewSong,
    createNewProject,
    updateSongStatus,
    updateProjectStatus,
    updateSongRecord,
    updateProjectRecord,
    updateLyricVersionContent,
    flushSongAndVersion,
    removeSong,
    removeProject,
  };
}
