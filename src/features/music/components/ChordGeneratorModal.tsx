import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Sparkles,
  Dice5,
  Play,
  Square,
  Volume2,
  Check,
  Music,
  Clock,
  Tag,
  BookmarkCheck,
} from 'lucide-react';
import {
  ROOT_KEYS,
  RootKey,
  SCALE_TYPES,
  ScaleType,
  MOOD_CATEGORIES,
  generateProgression,
  playChordSound,
  playProgressionSequence,
} from '../lib/chordTheory';
import { StudioChordProgressionRecord } from '../types/studioDatabase';
import { FamilyChordSelector } from './FamilyChordSelector';

interface ChordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToBank: (progression: Partial<StudioChordProgressionRecord>) => Promise<void>;
}

export const ChordGeneratorModal: React.FC<ChordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSaveToBank,
}) => {
  // Generator Parameters
  const [selectedMood, setSelectedMood] = useState<string>('Melankolis');
  const [selectedKey, setSelectedKey] = useState<RootKey>('C');
  const [selectedScale, setSelectedScale] = useState<ScaleType>('Major');
  const [chordCount, setChordCount] = useState<number>(4);

  // Generated Result
  const [generatedResult, setGeneratedResult] = useState<ReturnType<typeof generateProgression> | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Stop audio on unmount or close
  const stopAudio = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setIsPlaying(false);
    setActiveStep(-1);
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen]);

  // Generate on parameter change or initial open
  const runGeneration = () => {
    stopAudio();
    setIsSaved(false);
    const result = generateProgression({
      mood: selectedMood,
      rootKey: selectedKey,
      scaleType: selectedScale,
      count: chordCount,
    });
    setGeneratedResult(result);
  };

  useEffect(() => {
    if (isOpen) {
      runGeneration();
    }
  }, [isOpen, selectedMood, selectedKey, selectedScale, chordCount]);

  // Handle click on family chord chip to append to progression
  const handleSelectFamilyChord = (chord: string, roman: string) => {
    setIsSaved(false);
    setGeneratedResult((prev) => {
      if (!prev) {
        return {
          title: `Progresi Harmoni ${selectedKey} ${selectedScale}`,
          romans: [roman],
          chords: [chord],
          key: selectedKey,
          scale: selectedScale,
          mood: selectedMood,
          bpm: 80,
          genre: 'Pop / Akustik',
          description: `Kombinasi akor kustom dalam nada ${selectedKey} ${selectedScale}`,
          tags: ['Kustom', selectedMood, selectedKey],
        };
      }
      return {
        ...prev,
        romans: [...prev.romans, roman],
        chords: [...prev.chords, chord],
      };
    });
  };

  const handleRemoveLastChord = () => {
    setIsSaved(false);
    setGeneratedResult((prev) => {
      if (!prev || prev.chords.length === 0) return prev;
      return {
        ...prev,
        romans: prev.romans.slice(0, -1),
        chords: prev.chords.slice(0, -1),
      };
    });
  };

  const handleClearChords = () => {
    setIsSaved(false);
    setGeneratedResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        romans: [],
        chords: [],
      };
    });
  };

  // Handle Play progression sequence
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!generatedResult || generatedResult.chords.length === 0) return;

    setIsPlaying(true);
    setActiveStep(0);

    const stopFn = playProgressionSequence({
      chords: generatedResult.chords,
      bpm: generatedResult.bpm,
      onStepChange: (idx) => {
        setActiveStep(idx);
      },
      onComplete: () => {
        setIsPlaying(false);
        setActiveStep(-1);
        stopAudioRef.current = null;
      },
    });

    stopAudioRef.current = stopFn;
  };

  // Handle Save to Bank
  const handleSave = async () => {
    if (!generatedResult || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveToBank({
        title: generatedResult.title,
        key: generatedResult.key,
        scale: generatedResult.scale,
        mood: generatedResult.mood,
        romans: generatedResult.romans,
        chords: generatedResult.chords,
        description: generatedResult.description,
        bpm: generatedResult.bpm,
        genre: generatedResult.genre,
        tags: generatedResult.tags,
        isFavorite: false,
      });
      setIsSaved(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save progression:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-bg-surface border border-border-default/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden select-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 
          1. MODAL HEADER
        */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                Generator Progresi Chord
              </h3>
              <p className="text-[11px] text-text-muted">
                Dapatkan inspirasi harmoni instan berdasarkan emosi dan tangga nada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 
          2. SCROLLABLE GENERATOR CONTROLS & PREVIEW
        */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Mood Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              1. Pilih Mood & Emosi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {MOOD_CATEGORIES.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-accent-primary text-accent-contrast border-accent-primary shadow-xs font-bold'
                        : 'bg-bg-secondary text-text-secondary border-border-default/30 hover:border-border-default/80 hover:text-text-primary'
                    }`}
                  >
                    <span className="text-sm">{m.emoji}</span>
                    <span className="truncate">{m.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Root Key & Scale Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Root Key */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                2. Tangga Nada (Root Key)
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {ROOT_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelectedKey(k)}
                    className={`min-w-[32px] px-2 py-1.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
                      selectedKey === k
                        ? 'bg-accent-primary text-accent-contrast border-accent-primary shadow-xs'
                        : 'bg-bg-secondary text-text-secondary border-border-default/30 hover:border-border-default/80 hover:text-text-primary'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Type */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                3. Jenis Tangga Nada
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SCALE_TYPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedScale(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      selectedScale === s
                        ? 'bg-accent-primary text-accent-contrast border-accent-primary font-bold shadow-xs'
                        : 'bg-bg-secondary text-text-secondary border-border-default/30 hover:border-border-default/80 hover:text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chord Count */}
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              4. Panjang Bar / Chord
            </label>
            <div className="flex items-center gap-2">
              {[4, 6, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setChordCount(count)}
                  className={`flex-1 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer border ${
                    chordCount === count
                      ? 'bg-accent-primary text-accent-contrast border-accent-primary font-bold shadow-xs'
                      : 'bg-bg-secondary text-text-secondary border-border-default/30 hover:text-text-primary'
                  }`}
                >
                  {count} Chord
                </button>
              ))}

              {/* Randomize Button */}
              <button
                type="button"
                onClick={runGeneration}
                title="Acak variasi lain"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-secondary hover:bg-bg-hover text-text-primary border border-border-default/40 font-semibold cursor-pointer transition-all active:scale-95"
              >
                <Dice5 size={14} className="text-accent-primary" />
                <span>Acak Variasi</span>
              </button>
            </div>
          </div>

          {/* Rekomendasi Akor Keluarga (Family Chords) */}
          <FamilyChordSelector
            rootKey={selectedKey}
            scale={selectedScale}
            onSelectChord={handleSelectFamilyChord}
            onRemoveLastChord={handleRemoveLastChord}
            onClearChords={handleClearChords}
            currentChords={generatedResult?.chords || []}
            currentRomans={generatedResult?.romans || []}
          />

          {/* 
            LIVE PREVIEW CARD
          */}
          {generatedResult && (
            <div className="mt-4 p-4 rounded-2xl bg-bg-secondary/60 border border-border-default/60 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent-primary tracking-wider">
                    Hasil Rekomendasi Harmoni
                  </span>
                  <h4 className="text-sm font-bold text-text-heading mt-0.5">
                    {generatedResult.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="px-2 py-0.5 rounded-md bg-bg-surface text-text-primary text-[11px] font-mono font-bold border border-border-default/30">
                    {generatedResult.key} {generatedResult.scale}
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary text-[11px] font-semibold">
                    {generatedResult.mood}
                  </div>
                </div>
              </div>

              {/* Roman & Chords Block */}
              <div className="p-3 rounded-xl bg-bg-surface border border-border-default/40 space-y-2">
                {/* Romans */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                  {generatedResult.romans.map((roman, idx) => (
                    <React.Fragment key={`prev-rom-${idx}`}>
                      <div className="flex-1 text-center font-mono text-[11px] font-semibold text-text-muted">
                        {roman}
                      </div>
                      {idx < generatedResult.romans.length - 1 && (
                        <span className="text-text-muted/40 text-[10px] select-none">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Chords Buttons */}
                <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
                  {generatedResult.chords.map((chord, idx) => {
                    const isStepActive = isPlaying && activeStep === idx;
                    return (
                      <button
                        key={`prev-chord-${idx}`}
                        type="button"
                        onClick={() => playChordSound(chord, 1.2)}
                        title={`Klik dengar akor ${chord}`}
                        className={`flex-1 min-w-[42px] py-2.5 px-1 rounded-lg text-center font-bold text-sm transition-all cursor-pointer border ${
                          isStepActive
                            ? 'bg-accent-primary text-accent-contrast border-accent-primary scale-105 shadow-sm'
                            : 'bg-bg-secondary text-text-heading border-border-default/40 hover:border-accent-primary/50 hover:bg-bg-hover'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{chord}</span>
                          {isStepActive && <Volume2 size={12} className="animate-pulse shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Musical Description & Metadata */}
              <p className="text-xs text-text-secondary leading-relaxed italic">
                "{generatedResult.description}"
              </p>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-default/20 text-[11px] text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="font-mono">Tempo ~{generatedResult.bpm} BPM</span>
                  <span>• {generatedResult.genre}</span>
                </div>

                {/* Audio Preview Trigger */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-rose-500 text-white'
                      : 'bg-bg-surface hover:bg-bg-hover text-accent-primary border border-border-default/50'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square size={11} className="fill-current" />
                      <span>Hentikan</span>
                    </>
                  ) : (
                    <>
                      <Play size={11} className="fill-current" />
                      <span>Dengar Rangkaian</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 
          3. MODAL FOOTER ACTIONS
        */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-default/30 bg-bg-surface shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isSaved
                ? 'bg-emerald-500 text-white'
                : 'bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-95 disabled:opacity-50'
            }`}
          >
            {isSaved ? (
              <>
                <Check size={14} />
                <span>Tersimpan di Bank Ide!</span>
              </>
            ) : (
              <>
                <BookmarkCheck size={14} />
                <span>Simpan ke Bank Ide</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
