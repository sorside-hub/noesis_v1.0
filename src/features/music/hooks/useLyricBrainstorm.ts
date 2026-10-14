import { useState, useEffect, useCallback } from 'react';
import { 
  LyricBrainstormMode, 
  LyricBrainstormToneStyle, 
  LyricBrainstormSuggestion, 
  StudioLyricBrainstormRecord 
} from '../types/studioDatabase';
import { 
  getSongLyricBrainstorms, 
  saveLyricBrainstormRecord, 
  deleteLyricBrainstormRecord 
} from '../lib/musicStudioStorage';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';

interface UseLyricBrainstormProps {
  songId: string;
  versionId?: string | null;
  songTitle?: string;
  genre?: string;
  premise?: string;
}

export const TONE_OPTIONS: Array<{
  id: LyricBrainstormToneStyle;
  label: string;
  emoji: string;
  desc: string;
  badgeColor: string;
}> = [
  {
    id: 'raw',
    label: 'Raw & Tajam',
    emoji: '⚡',
    desc: 'Lugas, sarkastik, kemarahan nyata, punk/grunge/rock, anti-klise puitis',
    badgeColor: 'border-amber-500/30 text-amber-500 bg-amber-500/10',
  },
  {
    id: 'indie_folk',
    label: 'Indie Realis',
    emoji: '📻',
    desc: 'Membumi, detail benda & percakapan keseharian, jujur & reflektif',
    badgeColor: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10',
  },
  {
    id: 'poetic',
    label: 'Puitis Segar',
    emoji: '🌿',
    desc: 'Analogi sastra kontemporer, berlapis makna, tanpa klise usang',
    badgeColor: 'border-sky-500/30 text-sky-500 bg-sky-500/10',
  },
  {
    id: 'pop_urban',
    label: 'Pop Urban',
    emoji: '🏙️',
    desc: 'Catchy, gaya obrolan luwes, mengalir santai mengikuti flow pop modern',
    badgeColor: 'border-violet-500/30 text-violet-500 bg-violet-500/10',
  },
  {
    id: 'hiphop',
    label: 'Hip-Hop / Rima',
    emoji: '🔥',
    desc: 'Rima ganda, punchline telak, asonansi tajam & ritme ketukan padat',
    badgeColor: 'border-rose-500/30 text-rose-500 bg-rose-500/10',
  },
];

export const MODE_OPTIONS: Array<{
  id: LyricBrainstormMode;
  label: string;
  iconName: string;
  shortDesc: string;
}> = [
  {
    id: 'metaphor',
    label: 'Metafor Segar',
    iconName: 'Sparkles',
    shortDesc: 'Kiasan & analogi tak terduga',
  },
  {
    id: 'rhyme',
    label: 'Diksi & Rima',
    iconName: 'Music',
    shortDesc: 'Pasangan rima & kata kunci',
  },
  {
    id: 'variations',
    label: 'Variasi Baris',
    iconName: 'Split',
    shortDesc: 'Pilihan alternatif sudut pandang',
  },
  {
    id: 'imagery',
    label: 'Citraan Indera',
    iconName: 'Eye',
    shortDesc: 'Detail visual, audio & fisik',
  },
];

const STORAGE_TONE_KEY = 'noesis_lyric_brainstorm_pref_tone';

export function useLyricBrainstorm({
  songId,
  versionId,
  songTitle,
  genre,
  premise,
}: UseLyricBrainstormProps) {
  const [history, setHistory] = useState<StudioLyricBrainstormRecord[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<LyricBrainstormSuggestion[]>([]);
  const [activeTone, setActiveTone] = useState<LyricBrainstormToneStyle>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TONE_KEY);
      if (saved && ['raw', 'indie_folk', 'poetic', 'pop_urban', 'hiphop'].includes(saved)) {
        return saved as LyricBrainstormToneStyle;
      }
    } catch {}
    return 'raw';
  });

  const [activeMode, setActiveMode] = useState<LyricBrainstormMode>('metaphor');
  const [keyword, setKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  // Load history for current song
  const loadHistory = useCallback(async () => {
    if (!songId) return;
    try {
      const records = await getSongLyricBrainstorms(songId);
      setHistory(records);
    } catch (e) {
      console.warn('[useLyricBrainstorm] Failed to load history:', e);
    }
  }, [songId]);

  useEffect(() => {
    loadHistory();

    const handleUpdate = () => loadHistory();
    window.addEventListener('music-studio-brainstorms-updated', handleUpdate);
    return () => {
      window.removeEventListener('music-studio-brainstorms-updated', handleUpdate);
    };
  }, [loadHistory]);

  const handleSetTone = (newTone: LyricBrainstormToneStyle) => {
    setActiveTone(newTone);
    try {
      localStorage.setItem(STORAGE_TONE_KEY, newTone);
    } catch {}
  };

  const generateBrainstorm = useCallback(
    async (overrideKeyword?: string, contextSnippet?: string): Promise<boolean> => {
      const targetKeyword = (overrideKeyword ?? keyword).trim();
      if (!targetKeyword) {
        setError('Ketikkan kata kunci atau tandai baris teks terlebih dahulu.');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const customKeys = getAllLocalKeyOverrides();
        const response = await fetch('/api/music/lyric-brainstorm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: targetKeyword,
            mode: activeMode,
            toneStyle: activeTone,
            contextSnippet,
            songTitle,
            genre,
            premise,
            customKeys,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          const errMsg = data.error || data.attempts?.[data.attempts.length - 1]?.error || 'Gagal menghasilkan ide lirik';
          throw new Error(errMsg);
        }

        const suggestions: LyricBrainstormSuggestion[] = data.data?.suggestions || data.suggestions || [];
        if (suggestions.length === 0) {
          throw new Error('Tidak ada saran yang dihasilkan.');
        }

        setCurrentSuggestions(suggestions);
        setModelUsed(data.data?.modelUsed || data.usedModel || data.modelUsed || 'gemini-3.6-flash');

        // Automatically persist brainstorm to Dexie & Supabase
        const newRecord: StudioLyricBrainstormRecord = {
          id: `bs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          songId,
          versionId: versionId || undefined,
          mode: activeMode,
          toneStyle: activeTone,
          keyword: targetKeyword,
          contextSnippet,
          suggestions,
          createdAt: new Date().toISOString(),
        };

        await saveLyricBrainstormRecord(newRecord);
        await loadHistory();
        return true;
      } catch (err: any) {
        console.error('[useLyricBrainstorm] Generation error:', err);
        setError(err.message || 'Terjadi kesalahan saat memproses AI.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, activeMode, activeTone, songId, versionId, songTitle, genre, premise, loadHistory]
  );

  const deleteBrainstorm = useCallback(
    async (recordId: string) => {
      try {
        await deleteLyricBrainstormRecord(recordId);
        await loadHistory();
      } catch (err) {
        console.error('[useLyricBrainstorm] Failed to delete record:', err);
      }
    },
    [loadHistory]
  );

  const clearCurrentSuggestions = useCallback(() => {
    setCurrentSuggestions([]);
    setError(null);
  }, []);

  return {
    history,
    currentSuggestions,
    setCurrentSuggestions,
    activeTone,
    setActiveTone: handleSetTone,
    activeMode,
    setActiveMode,
    keyword,
    setKeyword,
    isLoading,
    error,
    modelUsed,
    generateBrainstorm,
    deleteBrainstorm,
    clearCurrentSuggestions,
    reloadHistory: loadHistory,
  };
}
