import { useState, useEffect, useCallback, useRef } from 'react';
import { StudioChordProgressionRecord } from '../types/studioDatabase';
import {
  getAllStudioChordProgressions,
  saveStudioChordProgression,
  deleteStudioChordProgression,
} from '../lib/musicStudioStorage';
import { playChordSound, playProgressionSequence } from '../lib/chordTheory';

export function useStudioChords() {
  const [progressions, setProgressions] = useState<StudioChordProgressionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Audio Playback states
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const progsRef = useRef(progressions);
  useEffect(() => {
    progsRef.current = progressions;
  }, [progressions]);

  // Reload all chord progressions from Dexie
  const reloadProgressions = useCallback(async () => {
    try {
      const items = await getAllStudioChordProgressions();
      setProgressions(items);
    } catch (err) {
      console.error('[MusicStudio] Failed to load studio chord progressions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadProgressions();

    const handleUpdate = () => {
      reloadProgressions();
    };

    window.addEventListener('music-studio-chords-updated', handleUpdate);
    return () => window.removeEventListener('music-studio-chords-updated', handleUpdate);
  }, [reloadProgressions]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
    };
  }, []);

  // Stop currently playing progression
  const stopPlayback = useCallback(() => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setPlayingId(null);
    setActiveStepIndex(-1);
  }, []);

  // Play progression sequence
  const playProgression = useCallback(
    (prog: StudioChordProgressionRecord) => {
      // If already playing this, toggle off (pause/stop)
      if (playingId === prog.id) {
        stopPlayback();
        return;
      }

      // Stop previous
      stopPlayback();

      if (!prog.chords || prog.chords.length === 0) return;

      setPlayingId(prog.id);
      setActiveStepIndex(0);

      const stopFn = playProgressionSequence({
        chords: prog.chords,
        bpm: prog.bpm || 80,
        onStepChange: (idx) => {
          setActiveStepIndex(idx);
        },
        onComplete: () => {
          setPlayingId(null);
          setActiveStepIndex(-1);
          stopAudioRef.current = null;
        },
      });

      stopAudioRef.current = stopFn;
    },
    [playingId, stopPlayback]
  );

  // Play single chord
  const playSingleChord = useCallback((chord: string) => {
    playChordSound(chord, 1.2);
  }, []);

  // Create new progression
  const createNewProgression = useCallback(
    async (initial: Partial<StudioChordProgressionRecord>): Promise<string> => {
      const id = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newProg: StudioChordProgressionRecord = {
        id,
        title: initial.title || 'Progresi Baru',
        key: initial.key || 'C',
        scale: initial.scale || 'Major',
        mood: initial.mood || 'Melankolis',
        romans: initial.romans && initial.romans.length > 0 ? initial.romans : ['I', 'V', 'vi', 'IV'],
        chords: initial.chords && initial.chords.length > 0 ? initial.chords : ['C', 'G', 'Am', 'F'],
        description: initial.description || '',
        bpm: initial.bpm || 80,
        genre: initial.genre || 'Pop',
        tags: initial.tags || [],
        notes: initial.notes || '',
        isFavorite: initial.isFavorite || false,
        createdAt: now,
        updatedAt: now,
      };

      await saveStudioChordProgression(newProg);
      setProgressions((prev) => [newProg, ...prev]);
      return id;
    },
    []
  );

  // Update existing progression
  const updateProgression = useCallback(
    async (id: string, patch: Partial<StudioChordProgressionRecord>) => {
      const current = progsRef.current.find((p) => p.id === id);
      if (!current) return;

      const now = new Date().toISOString();
      const updated: StudioChordProgressionRecord = {
        ...current,
        ...patch,
        updatedAt: now,
      };

      setProgressions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      await saveStudioChordProgression(updated);
    },
    []
  );

  // Toggle Favorite
  const toggleFavoriteProgression = useCallback(
    async (id: string) => {
      const current = progsRef.current.find((p) => p.id === id);
      if (!current) return;

      const nextFav = !current.isFavorite;
      const now = new Date().toISOString();
      const updated: StudioChordProgressionRecord = {
        ...current,
        isFavorite: nextFav,
        updatedAt: now,
      };

      setProgressions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      await saveStudioChordProgression(updated);
    },
    []
  );

  // Remove progression
  const removeProgression = useCallback(
    async (id: string) => {
      if (playingId === id) {
        stopPlayback();
      }
      setProgressions((prev) => prev.filter((p) => p.id !== id));
      await deleteStudioChordProgression(id);
    },
    [playingId, stopPlayback]
  );

  // Duplicate progression
  const duplicateProgression = useCallback(
    async (id: string): Promise<string | null> => {
      const source = progsRef.current.find((p) => p.id === id);
      if (!source) return null;

      const newId = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const clone: StudioChordProgressionRecord = {
        ...source,
        id: newId,
        title: `${source.title} (Salinan)`,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };

      await saveStudioChordProgression(clone);
      setProgressions((prev) => [clone, ...prev]);
      return newId;
    },
    []
  );

  return {
    progressions,
    isLoading,
    playingId,
    activeStepIndex,
    playProgression,
    stopPlayback,
    playSingleChord,
    createNewProgression,
    updateProgression,
    removeProgression,
    duplicateProgression,
    toggleFavoriteProgression,
    reloadProgressions,
  };
}
