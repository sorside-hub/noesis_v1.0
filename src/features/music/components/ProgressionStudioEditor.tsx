import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Square,
  Plus,
  Trash2,
  Copy,
  Music,
  Sparkles,
  Volume2,
  Layers,
  Check,
  BookmarkCheck,
  RotateCcw,
  Clock,
  Tag,
  ListMusic,
  ChevronDown,
} from 'lucide-react';
import {
  ROOT_KEYS,
  RootKey,
  SCALE_TYPES,
  ScaleType,
  MOOD_CATEGORIES,
  playChordSound,
  playProgressionSequence,
  inferRomanFromChord,
  convertRomansToChords,
} from '../lib/chordTheory';
import {
  StudioChordProgressionRecord,
  ChordProgressionSection,
} from '../types/studioDatabase';
import { FamilyChordSelector } from './FamilyChordSelector';

interface ProgressionStudioEditorProps {
  progression: StudioChordProgressionRecord;
  onBack: () => void;
  onUpdateProgression: (patch: Partial<StudioChordProgressionRecord>) => void;
  onDeleteProgression?: (id: string) => void;
}

const SECTION_PRESETS = [
  'Verse 1',
  'Verse 2',
  'Verse 3',
  'Chorus',
  'Pre-Chorus',
  'Bridge',
  'Intro',
  'Outro',
  'Solo',
  'Interlude',
];

export const ProgressionStudioEditor: React.FC<ProgressionStudioEditorProps> = ({
  progression,
  onBack,
  onUpdateProgression,
  onDeleteProgression,
}) => {
  // Metadata state
  const [title, setTitle] = useState(progression.title || 'Progresi Musik Baru');
  const [key, setKey] = useState<RootKey>((progression.key as RootKey) || 'C');
  const [scale, setScale] = useState<ScaleType>((progression.scale as ScaleType) || 'Major');
  const [mood, setMood] = useState(progression.mood || 'Melankolis');
  const [bpm, setBpm] = useState<number>(progression.bpm || 80);
  const [genre, setGenre] = useState(progression.genre || 'Pop Ballad');
  const [notes, setNotes] = useState(progression.notes || '');

  // Sections state
  const initialSections = useMemo((): ChordProgressionSection[] => {
    if (progression.sections && progression.sections.length > 0) {
      return progression.sections;
    }
    // Fallback from legacy chords / romans
    const legacyChords = progression.chords || ['C', 'G', 'Am', 'F'];
    const legacyRomans = progression.romans || ['I', 'V', 'vi', 'IV'];
    return [
      {
        id: `sec_${Date.now()}_1`,
        name: 'Verse 1',
        chords: legacyChords,
        romans: legacyRomans,
      },
    ];
  }, [progression.id]);

  const [sections, setSections] = useState<ChordProgressionSection[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string>(initialSections[0]?.id || '');

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingScope, setPlayingScope] = useState<'all' | string>('all'); // 'all' or sectionId
  const [activeSectionPlaybackId, setActiveSectionPlaybackId] = useState<string | null>(null);
  const [activeChordIndex, setActiveChordIndex] = useState<number>(-1);
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Debounced auto-save
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      // Flatten all chords from all sections for master overview
      const allChords = sections.flatMap((s) => s.chords);
      const allRomans = sections.flatMap((s) => s.romans);

      onUpdateProgression({
        title,
        key,
        scale,
        mood,
        bpm: Number(bpm) || 80,
        genre,
        notes,
        sections,
        chords: allChords.length > 0 ? allChords : ['C'],
        romans: allRomans.length > 0 ? allRomans : ['I'],
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [title, key, scale, mood, bpm, genre, notes, sections]);

  // Audio cleanup on unmount
  const stopAudio = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setIsPlaying(false);
    setActiveSectionPlaybackId(null);
    setActiveChordIndex(-1);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Focused active section
  const currentActiveSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  // 1. Add Chord to the currently active section
  const handleAddChordToActiveSection = (chord: string, roman: string) => {
    if (!currentActiveSection) return;

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === currentActiveSection.id) {
          return {
            ...sec,
            chords: [...sec.chords, chord],
            romans: [...sec.romans, roman],
          };
        }
        return sec;
      })
    );
  };

  // 2. Remove last chord from currently active section
  const handleRemoveLastChordFromActiveSection = () => {
    if (!currentActiveSection || currentActiveSection.chords.length === 0) return;

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === currentActiveSection.id) {
          return {
            ...sec,
            chords: sec.chords.slice(0, -1),
            romans: sec.romans.slice(0, -1),
          };
        }
        return sec;
      })
    );
  };

  // 3. Clear chords in active section
  const handleClearChordsInActiveSection = () => {
    if (!currentActiveSection) return;

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === currentActiveSection.id) {
          return {
            ...sec,
            chords: [],
            romans: [],
          };
        }
        return sec;
      })
    );
  };

  // 4. Update section name or inline chords
  const handleUpdateSection = (sectionId: string, patch: Partial<ChordProgressionSection>) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, ...patch } : sec))
    );
  };

  // 5. Add new Section
  const handleAddSection = (namePreset?: string) => {
    const existingCount = sections.length;
    const defaultName = namePreset || `Bagian ${existingCount + 1}`;
    const newId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Default chords based on key
    const newSection: ChordProgressionSection = {
      id: newId,
      name: defaultName,
      chords: [],
      romans: [],
    };

    setSections((prev) => [...prev, newSection]);
    setActiveSectionId(newId);
  };

  // 6. Duplicate Section
  const handleDuplicateSection = (sectionId: string) => {
    const target = sections.find((s) => s.id === sectionId);
    if (!target) return;

    const newId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const duplicate: ChordProgressionSection = {
      ...target,
      id: newId,
      name: `${target.name} (Salinan)`,
      chords: [...target.chords],
      romans: [...target.romans],
    };

    const targetIdx = sections.findIndex((s) => s.id === sectionId);
    const updated = [...sections];
    updated.splice(targetIdx + 1, 0, duplicate);
    setSections(updated);
    setActiveSectionId(newId);
  };

  // 7. Delete Section
  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) return; // Keep at least one section
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (activeSectionId === sectionId) {
      const remaining = sections.filter((s) => s.id !== sectionId);
      if (remaining[0]) setActiveSectionId(remaining[0].id);
    }
  };

  // 8. Playback a single Section
  const handlePlaySection = (section: ChordProgressionSection) => {
    if (isPlaying && activeSectionPlaybackId === section.id) {
      stopAudio();
      return;
    }
    stopAudio();

    if (section.chords.length === 0) return;

    setIsPlaying(true);
    setPlayingScope(section.id);
    setActiveSectionPlaybackId(section.id);
    setActiveChordIndex(0);

    const stopFn = playProgressionSequence({
      chords: section.chords,
      bpm: bpm || 80,
      onStepChange: (idx) => {
        setActiveChordIndex(idx);
      },
      onComplete: () => {
        setIsPlaying(false);
        setActiveSectionPlaybackId(null);
        setActiveChordIndex(-1);
        stopAudioRef.current = null;
      },
    });

    stopAudioRef.current = stopFn;
  };

  // 9. Playback Entire Song Sequence (All sections in order)
  const handlePlayAllSections = () => {
    if (isPlaying && playingScope === 'all') {
      stopAudio();
      return;
    }
    stopAudio();

    // Flatten all sections into sequential items with section tracking
    const items: { sectionId: string; chord: string; indexInSection: number }[] = [];
    sections.forEach((sec) => {
      sec.chords.forEach((chord, idx) => {
        items.push({ sectionId: sec.id, chord, indexInSection: idx });
      });
    });

    if (items.length === 0) return;

    setIsPlaying(true);
    setPlayingScope('all');
    setActiveSectionPlaybackId(items[0].sectionId);
    setActiveChordIndex(items[0].indexInSection);

    const chordsList = items.map((i) => i.chord);

    const stopFn = playProgressionSequence({
      chords: chordsList,
      bpm: bpm || 80,
      onStepChange: (masterIdx) => {
        const currentItem = items[masterIdx];
        if (currentItem) {
          setActiveSectionPlaybackId(currentItem.sectionId);
          setActiveChordIndex(currentItem.indexInSection);
        }
      },
      onComplete: () => {
        setIsPlaying(false);
        setActiveSectionPlaybackId(null);
        setActiveChordIndex(-1);
        stopAudioRef.current = null;
      },
    });

    stopAudioRef.current = stopFn;
  };

  const totalChordsCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.chords.length, 0);
  }, [sections]);

  return (
    <div className="relative w-full h-full bg-bg-primary text-text-primary flex flex-col overflow-hidden select-none">
      {/* 
        HEADER STUDIO
      */}
      <header className="px-4 py-2.5 bg-bg-surface/80 border-b border-border-default/50 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              stopAudio();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer border border-border-default/40 shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Bank Ide</span>
          </button>

          {/* Editable Progression Title */}
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul Progresi..."
              className="bg-transparent text-sm sm:text-base font-bold text-text-heading focus:outline-none focus:ring-1 focus:ring-accent-primary rounded px-1.5 py-0.5 truncate w-full max-w-xs sm:max-w-md border border-transparent hover:border-border-default/40 transition-colors"
            />
          </div>
        </div>

        {/* Global Action Controls: Master Play & Delete */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Master Play Button */}
          <button
            type="button"
            onClick={handlePlayAllSections}
            disabled={totalChordsCount === 0}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isPlaying && playingScope === 'all'
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-95 disabled:opacity-40'
            }`}
          >
            {isPlaying && playingScope === 'all' ? (
              <>
                <Square size={13} className="fill-current" />
                <span>Hentikan</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" />
                <span className="hidden sm:inline">Putar Seluruh Lagu</span>
                <span className="sm:hidden">Putar Semua</span>
              </>
            )}
          </button>

          {onDeleteProgression && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Yakin ingin menghapus progresi ini?')) {
                  stopAudio();
                  onDeleteProgression(progression.id);
                  onBack();
                }
              }}
              title="Hapus progresi"
              className="p-2 rounded-xl text-text-muted hover:text-rose-400 hover:bg-bg-hover transition-colors cursor-pointer border border-border-default/30"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </header>

      {/* 
        SUB-HEADER: HARMONY CONTROLS (Key, Scale, Mood, BPM)
      */}
      <div className="px-4 py-2 bg-bg-surface/50 border-b border-border-default/30 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <div className="flex items-center gap-3">
          {/* Root Key Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-muted uppercase">Key:</span>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value as RootKey)}
              className="px-2 py-1 rounded-lg bg-bg-secondary border border-border-default/50 text-text-primary text-xs font-mono font-bold focus:outline-none focus:border-accent-primary cursor-pointer"
            >
              {ROOT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-muted uppercase">Scale:</span>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as ScaleType)}
              className="px-2 py-1 rounded-lg bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary cursor-pointer"
            >
              {SCALE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Selector */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-muted uppercase">Mood:</span>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="px-2 py-1 rounded-lg bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary cursor-pointer"
            >
              {MOOD_CATEGORIES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.id}
                </option>
              ))}
            </select>
          </div>

          {/* BPM */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-muted uppercase">Tempo:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-14 px-2 py-1 rounded-lg bg-bg-secondary border border-border-default/50 text-text-primary text-xs font-mono font-bold focus:outline-none focus:border-accent-primary text-center"
              />
              <span className="text-[10px] text-text-muted font-mono">BPM</span>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex items-center gap-2 text-text-muted text-[11px] shrink-0 font-medium">
          <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-bold">
            {sections.length} Bagian
          </span>
          <span>•</span>
          <span>{totalChordsCount} Akor Total</span>
        </div>
      </div>

      {/* 
        MAIN WORKSPACE AREA: PINNED CHORD SELECTOR + SECTIONS CARDS
      */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-4 max-w-6xl w-full mx-auto pb-24">
        {/* 
          1. DOCKED FAMILY CHORD SELECTOR
        */}
        <div className="bg-bg-surface/80 border border-border-default/60 rounded-2xl p-4 shadow-sm backdrop-blur-xs space-y-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent-primary" />
              Rekomendasi Akor Tangga Nada {key} {scale}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <span>Menambahkan ke:</span>
              <span className="font-bold text-accent-primary px-2 py-0.5 rounded-md bg-accent-primary/10 border border-accent-primary/20">
                {currentActiveSection?.name || 'Seksi Terpilih'}
              </span>
            </div>
          </div>

          <FamilyChordSelector
            rootKey={key}
            scale={scale}
            onSelectChord={handleAddChordToActiveSection}
            onRemoveLastChord={handleRemoveLastChordFromActiveSection}
            onClearChords={handleClearChordsInActiveSection}
            currentChords={currentActiveSection?.chords || []}
            currentRomans={currentActiveSection?.romans || []}
          />
        </div>

        {/* 
          2. MULTI-SECTION CARDS CANVAS (Verse 1, Verse 2, Chorus, etc.)
        */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Layers size={14} className="text-accent-primary" />
              Struktur Progresi Lagu ({sections.length} Seksi)
            </h3>

            {/* Quick Add Presets Bar */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-text-muted hidden sm:inline mr-1">+ Tambah:</span>
              {['Verse', 'Chorus', 'Pre-Chorus', 'Bridge', 'Outro'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const matchCount = sections.filter((s) => s.name.startsWith(preset)).length;
                    const label = matchCount > 0 ? `${preset} ${matchCount + 1}` : preset;
                    handleAddSection(label);
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default/40 transition-colors cursor-pointer shrink-0"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* List of Section Cards */}
          <div className="space-y-3">
            {sections.map((section, sIdx) => {
              const isFocused = activeSectionId === section.id;
              const isSectionPlaying = isPlaying && activeSectionPlaybackId === section.id;

              return (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`rounded-2xl border transition-all cursor-pointer p-4 space-y-3 ${
                    isFocused
                      ? 'bg-bg-surface border-accent-primary/80 shadow-md ring-1 ring-accent-primary/30'
                      : 'bg-bg-surface/50 border-border-default/50 hover:border-border-default hover:bg-bg-surface'
                  }`}
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-muted w-5">
                        {sIdx + 1}.
                      </span>

                      {/* Section Name Editable Input */}
                      <input
                        type="text"
                        value={section.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateSection(section.id, { name: e.target.value })}
                        placeholder="Nama Bagian (e.g. Verse 1)"
                        className="font-bold text-sm text-text-heading bg-transparent border-b border-transparent hover:border-border-default focus:border-accent-primary focus:outline-none px-1 py-0.5"
                      />

                      {/* Focused Status Pill */}
                      {isFocused && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-primary text-accent-contrast">
                          Aktif Dipilih
                        </span>
                      )}
                    </div>

                    {/* Section Action Buttons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Play Section Button */}
                      <button
                        type="button"
                        onClick={() => handlePlaySection(section)}
                        disabled={section.chords.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSectionPlaying
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-bg-secondary hover:bg-bg-hover text-accent-primary border-border-default/40 disabled:opacity-40'
                        }`}
                        title="Putar rangkaian akor di seksi ini"
                      >
                        {isSectionPlaying ? (
                          <>
                            <Square size={11} className="fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play size={11} className="fill-current" />
                            <span>Putar Seksi</span>
                          </>
                        )}
                      </button>

                      {/* Duplicate Section */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateSection(section.id)}
                        title="Duplikat bagian ini"
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>

                      {/* Delete Section */}
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id)}
                          title="Hapus bagian ini"
                          className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-bg-hover transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chord Visual Blocks Row */}
                  <div className="bg-bg-secondary/40 border border-border-default/30 rounded-xl p-3 min-h-[70px] flex items-center">
                    {section.chords.length === 0 ? (
                      <div className="w-full text-center py-2 text-text-muted text-xs">
                        <span>Belum ada akor di seksi ini. Klik salah satu chip di atas untuk menyisipkan akor!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-1">
                        {section.chords.map((chord, cIdx) => {
                          const roman = section.romans[cIdx] || inferRomanFromChord(chord, key, scale);
                          const isChordActive = isSectionPlaying && activeChordIndex === cIdx;

                          return (
                            <React.Fragment key={`sec-${section.id}-ch-${cIdx}`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playChordSound(chord, 1.2);
                                }}
                                title={`Klik untuk dengar ${chord} (${roman})`}
                                className={`flex flex-col items-center justify-center min-w-[54px] py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isChordActive
                                    ? 'bg-accent-primary text-accent-contrast border-accent-primary scale-110 shadow-md z-10 animate-pulse'
                                    : 'bg-bg-surface hover:bg-bg-hover text-text-heading border-border-default/50 hover:border-accent-primary/60'
                                }`}
                              >
                                <span
                                  className={`text-[9px] font-mono font-bold ${
                                    isChordActive ? 'text-accent-contrast' : 'text-text-muted'
                                  }`}
                                >
                                  {roman}
                                </span>
                                <span className="text-sm font-mono font-bold tracking-tight mt-0.5">
                                  {chord}
                                </span>
                              </button>

                              {cIdx < section.chords.length - 1 && (
                                <span className="text-text-muted/40 font-bold select-none text-xs">→</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section Inline Chords String Editor */}
                  <div className="flex items-center gap-2 pt-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                    <span className="text-text-muted font-mono shrink-0">Ketik/Ubah:</span>
                    <input
                      type="text"
                      value={section.chords.join(' - ')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const splitChords = raw
                          .split(/[-–—, ]+/)
                          .map((c) => c.trim())
                          .filter(Boolean);
                        const splitRomans = splitChords.map((c) => inferRomanFromChord(c, key, scale));
                        handleUpdateSection(section.id, { chords: splitChords, romans: splitRomans });
                      }}
                      placeholder="e.g. Em - D - C - G"
                      className="flex-1 px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-default/40 text-text-primary font-mono text-xs focus:outline-none focus:border-accent-primary"
                    />
                    {section.chords.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateSection(section.id, {
                            chords: section.chords.slice(0, -1),
                            romans: section.romans.slice(0, -1),
                          });
                        }}
                        className="px-2 py-1 rounded-md text-[10px] text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors shrink-0"
                        title="Hapus akor terakhir di seksi ini"
                      >
                        ⌫ Hapus 1
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Section Button Big */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleAddSection()}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border-default/60 hover:border-accent-primary/60 hover:bg-bg-secondary/40 text-text-secondary hover:text-text-primary text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Plus size={16} className="text-accent-primary" />
              <span>Tambah Bagian Lagu Baru (Verse / Chorus / Bridge)</span>
            </button>
          </div>
        </div>

        {/* 
          3. NOTES & GENRE OVERVIEW CARD
        */}
        <div className="bg-bg-surface/50 border border-border-default/40 rounded-2xl p-4 space-y-3 text-xs">
          <span className="font-bold text-text-secondary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Tag size={13} className="text-accent-primary" /> Catatan & Detail Harmonis
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Rekomendasi Genre:</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Contoh: Pop Ballad, Indie Folk, R&B Soul"
                className="w-full px-3 py-1.5 rounded-xl bg-bg-secondary border border-border-default/40 text-text-primary text-xs focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] text-text-muted mb-1">Catatan Musisi / Lirik:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Cocok untuk vokal melankolis dengan arpeggio piano"
                className="w-full px-3 py-1.5 rounded-xl bg-bg-secondary border border-border-default/40 text-text-primary text-xs focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
