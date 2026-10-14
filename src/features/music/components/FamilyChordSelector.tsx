import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  Plus,
  Delete,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Music2,
  Flame,
} from 'lucide-react';
import {
  RootKey,
  ScaleType,
  getFamilyChords,
  playChordSound,
  FamilyChordDegree,
  CategorizedSpicedChord,
} from '../lib/chordTheory';

interface FamilyChordSelectorProps {
  rootKey: RootKey;
  scale: ScaleType;
  onSelectChord: (chord: string, roman: string) => void;
  onRemoveLastChord?: () => void;
  onClearChords?: () => void;
  currentChords?: string[];
  currentRomans?: string[];
  className?: string;
}

export const FamilyChordSelector: React.FC<FamilyChordSelectorProps> = ({
  rootKey,
  scale,
  onSelectChord,
  onRemoveLastChord,
  onClearChords,
  currentChords = [],
  currentRomans = [],
  className = '',
}) => {
  const [showSpice, setShowSpice] = useState(false);
  const [selectedSpiceCategory, setSelectedSpiceCategory] = useState<'all' | '7th' | 'sus' | 'add9'>('all');
  const [recentlyPlayedChord, setRecentlyPlayedChord] = useState<string | null>(null);

  // Calculate diatonic & spiced family chords for current Key & Scale
  const familyData = useMemo(() => {
    return getFamilyChords(rootKey, scale);
  }, [rootKey, scale]);

  const handleChordClick = (chord: string, roman: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Instant Web Audio audition
    playChordSound(chord, 1.0);
    setRecentlyPlayedChord(chord);
    setTimeout(() => {
      setRecentlyPlayedChord((prev) => (prev === chord ? null : prev));
    }, 600);

    // Append to progression
    onSelectChord(chord, roman);
  };

  const filteredSpicedChords = useMemo(() => {
    if (selectedSpiceCategory === 'all') return familyData.categorizedSpiced;
    return familyData.categorizedSpiced.filter((s) => s.category === selectedSpiceCategory);
  }, [familyData, selectedSpiceCategory]);

  return (
    <div className={`bg-bg-secondary/70 border border-border-default/60 rounded-xl p-3.5 space-y-3 ${className}`}>
      {/* Header Info & Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-primary/15 text-accent-primary flex items-center justify-center">
            <Music2 size={12} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-primary tracking-wide">
              Keluarga Akor Nada{' '}
              <span className="text-accent-primary font-mono">{rootKey}</span> {scale}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-text-muted ml-2">
              (Harmoni Diatonik {familyData.scaleNotes.join(' - ')})
            </span>
          </div>
        </div>

        {/* Spice Variation Toggle Button */}
        <button
          type="button"
          onClick={() => setShowSpice(!showSpice)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
            showSpice
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-xs'
              : 'bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary border-border-default/40'
          }`}
          title="Tampilkan variasi bumbu akor (7th, sus4, add9, maj7)"
        >
          <Flame size={12} className={showSpice ? 'text-amber-400 fill-amber-400/20' : 'text-amber-500/70'} />
          <span>Bumbu Akor (7th / sus / add9)</span>
          {showSpice ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Row 1: 7 Diatonic Degree Chips */}
      <div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1.5 flex items-center justify-between">
          <span>Akor Pokok Derajat Tangga Nada (Klik untuk Memasukkan)</span>
          <span className="text-[9px] text-text-muted/80">I sampai vii°</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {familyData.degrees.map((deg) => {
            const isPlaying = recentlyPlayedChord === deg.chord;
            const isMajor = deg.quality === 'major';
            const isDim = deg.quality === 'diminished';

            // Distinct theme badges for Major, Minor, Diminished
            const badgeBg = isMajor
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : isDim
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

            return (
              <button
                key={`deg-${deg.degreeIndex}-${deg.chord}`}
                type="button"
                onClick={(e) => handleChordClick(deg.chord, deg.roman, e)}
                title={`${deg.role}: Klik untuk dengar suara & masukkan ${deg.chord}`}
                className={`relative group flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center ${
                  isPlaying
                    ? 'bg-accent-primary text-accent-contrast border-accent-primary scale-105 shadow-sm z-10'
                    : 'bg-bg-surface hover:bg-bg-hover border-border-default/50 hover:border-accent-primary/60 hover:shadow-2xs'
                }`}
              >
                {/* Roman Numeral Badge */}
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded mb-1 border ${
                    isPlaying ? 'bg-white/20 text-accent-contrast border-transparent' : badgeBg
                  }`}
                >
                  {deg.roman}
                </span>

                {/* Chord Name */}
                <span className="text-xs font-mono font-bold tracking-tight text-text-heading group-hover:text-accent-primary transition-colors">
                  {deg.chord}
                </span>

                {/* Role text */}
                <span className="text-[8px] text-text-muted truncate max-w-full mt-0.5 opacity-80 group-hover:opacity-100">
                  {deg.role.split(' ')[0]}
                </span>

                {/* Audio icon cue on hover */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 transition-opacity">
                  <Volume2 size={9} className="text-text-muted" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Spiced Chord Variations (Collapsible) */}
      {showSpice && (
        <div className="pt-2 border-t border-border-default/30 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              <Sparkles size={11} /> Variasi Bumbu Harmonis (Ekstensi Nada):
            </span>

            {/* Sub-category pills */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: '7th', label: '7th / Maj7' },
                  { id: 'sus', label: 'sus2 / sus4' },
                  { id: 'add9', label: 'add9' },
                ] as const
              ).map((cat) => (
                <button
                  key={`spice-cat-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedSpiceCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-colors cursor-pointer ${
                    selectedSpiceCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto no-scrollbar pr-0.5">
            {filteredSpicedChords.map((spice, idx) => {
              const isPlaying = recentlyPlayedChord === spice.chord;
              return (
                <button
                  key={`spiced-${idx}-${spice.chord}`}
                  type="button"
                  onClick={(e) => handleChordClick(spice.chord, spice.degreeRoman, e)}
                  title={`${spice.flavor} — Klik untuk dengar & sisipkan ${spice.chord}`}
                  className={`flex flex-col items-start justify-center p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 text-black border-amber-500 scale-105 shadow-sm'
                      : 'bg-bg-surface hover:bg-bg-hover border-border-default/40 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-mono text-text-muted">
                      {spice.degreeRoman}
                    </span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 uppercase font-bold">
                      {spice.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-text-heading mt-0.5">
                    {spice.label}
                  </span>
                  <span className="text-[8px] text-text-muted truncate max-w-full opacity-70">
                    {spice.flavor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 3: Action Bar (Backspace, Reset, and Count) */}
      <div className="flex items-center justify-between pt-1 border-t border-border-default/30 text-[10px] text-text-muted">
        <div className="flex items-center gap-2">
          <span>Tersusun: <strong className="text-text-primary font-mono">{currentChords.length}</strong> akor</span>
          {currentChords.length > 0 && (
            <span className="text-text-secondary font-mono truncate max-w-[140px] sm:max-w-xs">
              ({currentChords.join(' → ')})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onRemoveLastChord && currentChords.length > 0 && (
            <button
              type="button"
              onClick={onRemoveLastChord}
              className="px-2 py-1 rounded-md bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default/40 flex items-center gap-1 transition-colors cursor-pointer"
              title="Hapus akor terakhir (Backspace)"
            >
              <Delete size={11} className="text-rose-400" />
              <span>Hapus Terakhir</span>
            </button>
          )}

          {onClearChords && currentChords.length > 0 && (
            <button
              type="button"
              onClick={onClearChords}
              className="px-2 py-1 rounded-md bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-rose-400 border border-border-default/40 flex items-center gap-1 transition-colors cursor-pointer"
              title="Bersihkan semua akor"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
