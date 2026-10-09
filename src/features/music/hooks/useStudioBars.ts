import { useState, useEffect, useCallback, useRef } from 'react';
import { StudioBarRecord } from '../types/studioDatabase';
import {
  getAllStudioBars,
  getStudioBarById,
  saveStudioBar,
  deleteStudioBar,
} from '../lib/musicStudioStorage';

export function useStudioBars() {
  const [bars, setBars] = useState<StudioBarRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const barsRef = useRef(bars);
  useEffect(() => {
    barsRef.current = bars;
  }, [bars]);

  const debounceTimersRef = useRef<Map<string, any>>(new Map());

  // Reload all bars from Dexie
  const reloadBars = useCallback(async () => {
    try {
      const items = await getAllStudioBars();
      setBars(items);
    } catch (err) {
      console.error('[MusicStudio] Failed to load studio bars:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadBars();

    const handleUpdate = () => {
      reloadBars();
    };

    window.addEventListener('music-studio-updated', handleUpdate);
    return () => window.removeEventListener('music-studio-updated', handleUpdate);
  }, [reloadBars]);

  // Flush debounce before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      debounceTimersRef.current.forEach((timer, barId) => {
        clearTimeout(timer);
        const bar = barsRef.current.find((b) => b.id === barId);
        if (bar) {
          saveStudioBar(bar).catch(console.error);
        }
      });
      debounceTimersRef.current.clear();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Create a new bar
  const createNewBar = useCallback(
    async (initial?: Partial<StudioBarRecord>): Promise<string> => {
      const id = `bar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newBar: StudioBarRecord = {
        id,
        title: initial?.title || 'Bar Baru',
        content: initial?.content || '',
        theme: initial?.theme || 'Bebas',
        topic: initial?.topic || '',
        rhymeScheme: initial?.rhymeScheme || 'Bebas',
        barCount: initial?.barCount || 4,
        status: initial?.status || 'available',
        usedInSongId: initial?.usedInSongId || null,
        tags: initial?.tags || [],
        notes: initial?.notes || '',
        createdAt: now,
        updatedAt: now,
      };

      await saveStudioBar(newBar);
      setBars((prev) => [newBar, ...prev]);
      return id;
    },
    []
  );

  // Update a bar (with optional debounce for text changes)
  const updateBar = useCallback(
    async (id: string, patch: Partial<StudioBarRecord>, debounceMs = 0) => {
      const now = new Date().toISOString();

      // Optimistic update
      setBars((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: now } : b))
      );

      const existingTimer = debounceTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const saveAction = async () => {
        const currentBar = barsRef.current.find((b) => b.id === id);
        if (!currentBar) return;
        const merged: StudioBarRecord = {
          ...currentBar,
          ...patch,
          updatedAt: now,
        };
        await saveStudioBar(merged);
        debounceTimersRef.current.delete(id);
      };

      if (debounceMs > 0) {
        const timer = setTimeout(saveAction, debounceMs);
        debounceTimersRef.current.set(id, timer);
      } else {
        await saveAction();
      }
    },
    []
  );

  // Delete a bar
  const removeBar = useCallback(async (id: string) => {
    setBars((prev) => prev.filter((b) => b.id !== id));
    await deleteStudioBar(id);
  }, []);

  // Duplicate a bar
  const duplicateBar = useCallback(
    async (id: string): Promise<string | null> => {
      const source = barsRef.current.find((b) => b.id === id);
      if (!source) return null;

      const newId = `bar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const clone: StudioBarRecord = {
        ...source,
        id: newId,
        title: `${source.title} (Salinan)`,
        status: 'available',
        usedInSongId: null,
        createdAt: now,
        updatedAt: now,
      };

      await saveStudioBar(clone);
      setBars((prev) => [clone, ...prev]);
      return newId;
    },
    []
  );

  return {
    bars,
    isLoading,
    createNewBar,
    updateBar,
    removeBar,
    duplicateBar,
    reloadBars,
  };
}
