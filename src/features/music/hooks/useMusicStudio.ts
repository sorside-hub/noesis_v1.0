import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SongItem, MusicProject, MusicProductionStatus, MusicProjectType } from '../types';
import { StudioProjectRecord, StudioSongRecord } from '../types/studioDatabase';
import {
  getAllStudioProjects,
  getAllStudioSongs,
  saveStudioProject,
  saveStudioSong,
  deleteStudioProject,
  deleteStudioSong,
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
  }, [reloadData]);

  // Convert dbSongs to UI SongItems
  const songs: SongItem[] = useMemo(() => {
    return dbSongs.map((s) => {
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
        status: s.status,
        key: s.musicalKey,
        bpm: s.bpm,
        tuning: s.tuning,
        capo: s.capo,
        timeSignature: s.timeSignature,
        project: parentProject ? parentProject.title : undefined,
        genre: s.genre,
        tags: ['#song', '#music'],
        snippet: textSnippet,
        hasAudioMemo,
        updatedAt: new Date(s.updatedAt).getTime(),
        createdAt: new Date(s.createdAt).getTime(),
      };
    });
  }, [dbSongs, dbProjects]);

  // Group into Music Projects (Albums, EPs, Singles)
  const projects: MusicProject[] = useMemo(() => {
    return dbProjects.map((p) => {
      const projectSongs = songs.filter((s) => {
        const rawSong = dbSongs.find((ds) => ds.id === s.id);
        return rawSong?.projectId === p.id;
      });

      // Calculate overall project status
      let projStatus: MusicProductionStatus = 'idea';
      if (projectSongs.length > 0) {
        const allReleased = projectSongs.every(s => s.status === 'released');
        const allReady = projectSongs.every(s => s.status === 'ready' || s.status === 'released');
        if (allReleased) projStatus = 'released';
        else if (allReady) projStatus = 'ready';
        else projStatus = 'recording';
      }

      return {
        id: p.id,
        title: p.title,
        type: p.type,
        status: projStatus,
        genre: p.genre,
        releaseDate: p.targetReleaseDate,
        description: p.description,
        songs: projectSongs,
        updatedAt: new Date(p.updatedAt).getTime(),
        createdAt: new Date(p.createdAt).getTime(),
      };
    });
  }, [dbProjects, dbSongs, songs]);

  // Studio statistics
  const stats = useMemo(() => {
    const totalSongs = songs.length;
    const releasedCount = songs.filter((s) => s.status === 'released').length;
    const readyCount = songs.filter((s) => s.status === 'ready').length;
    const inProgressCount = songs.filter((s) => ['demo', 'recording', 'mixing'].includes(s.status)).length;
    const ideaCount = songs.filter((s) => s.status === 'idea').length;
    const totalProjects = projects.length;

    return {
      totalSongs,
      totalProjects,
      ideaCount,
      inProgressCount,
      readyCount,
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
    if (params.project) {
      const proj = dbProjects.find(
        (p) => p.id === params.project || p.title.toLowerCase() === params.project!.toLowerCase()
      );
      if (proj) matchedProjectId = proj.id;
    }

    const defaultLyrics = params.initialContent || `<h3>[Intro]</h3>\n<p>[${params.key || 'C'}]</p>\n\n<h3>[Verse 1]</h3>\n<p>Tulis lirik dan chord di sini...</p>\n\n<h3>[Chorus]</h3>\n<p>Bagian reff lagu...</p>\n`;

    const newSong: StudioSongRecord = {
      id: songId,
      projectId: matchedProjectId,
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

    await saveStudioSong(newSong);
    await reloadData();
    return songId;
  };

  const createNewProject = async (params: {
    title: string;
    type: MusicProjectType;
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
      genre: params.genre?.trim() || undefined,
      targetReleaseDate: params.targetReleaseDate || undefined,
      description: params.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await saveStudioProject(newProject);
    await reloadData();
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

    // Instant optimistic update
    setDbSongs((prev) => prev.map((s) => (s.id === songId ? updated : s)));

    // Background persist without blocking UI or reloading
    saveStudioSong(updated).catch((err) => {
      console.error('[MusicStudio] Failed to save status:', err);
    });
  }, []);

  // OPTIMIZED INSTANT UPDATE FOR PARAMETERS & METADATA (0ms UI LAG)
  const updateSongRecord = useCallback(async (songId: string, patch: Partial<StudioSongRecord>) => {
    const existing = dbSongsRef.current.find((s) => s.id === songId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: StudioSongRecord = {
      ...existing,
      ...patch,
      updatedAt: now,
    };

    // 1. Instant optimistic update in React state (0ms latency, super satset!)
    setDbSongs((prev) => prev.map((s) => (s.id === songId ? updated : s)));

    // 2. Background persistence to IndexedDB without blocking render
    saveStudioSong(updated).catch((err) => {
      console.error('[MusicStudio] Failed to save song patch:', err);
    });
  }, []);

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
    updateSongRecord,
    removeSong,
    removeProject,
  };
}
