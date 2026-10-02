import React, { useState, useEffect } from 'react';
import { 
  X, 
  SlidersVertical,
  Clock,
  Calendar,
  Plus,
  Minus,
  ChevronDown,
  Check
} from 'lucide-react';
import { StudioSongRecord } from '../types/studioDatabase';

interface SongStudioSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  song: StudioSongRecord;
  onUpdateSong: (patch: Partial<StudioSongRecord>) => void;
  drawerRef?: React.RefObject<HTMLDivElement | null>;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
}

// 12 Smart Root Keys (Circle of Fifths order with smart Enharmonic Minor spellings)
const CIRCLE_OF_FIFTHS = [
  { major: 'C', minor: 'Cm' },
  { major: 'G', minor: 'Gm' },
  { major: 'D', minor: 'Dm' },
  { major: 'A', minor: 'Am' },
  { major: 'E', minor: 'Em' },
  { major: 'B', minor: 'Bm' },
  { major: 'F#', minor: 'F#m' },
  { major: 'Db', minor: 'C#m' },
  { major: 'Ab', minor: 'G#m' },
  { major: 'Eb', minor: 'Ebm' },
  { major: 'Bb', minor: 'Bbm' },
  { major: 'F', minor: 'Fm' },
];

const TUNING_OPTIONS = [
  'Standard (E A D G B E)',
  'Drop D (D A D G B E)',
  'Half Step Down (Eb Ab Db Gb Bb Eb)',
  'Full Step Down (D G C F A D)',
  'Drop C (C G C F A D)',
  'DADGAD',
  'Open D (D A D F# A D)',
  'Open G (D G D G B D)',
];

const COMMON_TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', 'Free'];

export const SongStudioSidebar: React.FC<SongStudioSidebarProps> = ({
  isOpen,
  onClose,
  song,
  onUpdateSong,
  drawerRef,
  backdropRef,
}) => {
  // Key mode (Mayor vs Minor)
  const [keyMode, setKeyMode] = useState<'major' | 'minor'>(() => {
    const k = song.musicalKey || '';
    return k.endsWith('m') || k.toLowerCase().includes('minor') ? 'minor' : 'major';
  });

  // Expandable Input Box states
  const [isTuningExpanded, setIsTuningExpanded] = useState(false);
  const [isCapoExpanded, setIsCapoExpanded] = useState(false);

  // Keep keyMode synchronized if song.musicalKey is updated externally
  useEffect(() => {
    const k = song.musicalKey || '';
    if (k.endsWith('m') || k.toLowerCase().includes('minor')) {
      setKeyMode('minor');
    } else {
      setKeyMode('major');
    }
  }, [song.musicalKey]);

  // Handle Mode Switch (Convert active key if matching Circle of Fifths)
  const handleSwitchMode = (targetMode: 'major' | 'minor') => {
    setKeyMode(targetMode);
    const currentKey = song.musicalKey || '';
    const match = CIRCLE_OF_FIFTHS.find(
      (item) => item.major === currentKey || item.minor === currentKey
    );
    if (match) {
      onUpdateSong({ musicalKey: targetMode === 'major' ? match.major : match.minor });
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return isoString;
    }
  };

  return (
    <>
      {/* Backdrop for click-away and touch dismiss */}
      <div
        ref={backdropRef}
        onClick={() => {
          setIsTuningExpanded(false);
          setIsCapoExpanded(false);
          onClose();
        }}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 ease-out will-change-[opacity] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-over Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`fixed inset-y-0 right-0 z-50 w-80 sm:w-88 bg-bg-secondary shadow-2xl flex flex-col transition-transform duration-300 ease-out will-change-transform select-none ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-bg-secondary">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
              <SlidersVertical size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-text-heading truncate">Parameter Musikal</h2>
              <p className="text-[11px] text-text-muted truncate">{song.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Tutup Parameter"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Musical Parameter Controls */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin]">
          
          {/* 1. TUNING GITAR */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-muted tracking-wider uppercase block">
              Tuning Gitar
            </label>

            <div className="w-full h-9 relative">
              {!isTuningExpanded ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsTuningExpanded(true);
                    setIsCapoExpanded(false);
                  }}
                  className="w-full h-9 px-3 text-xs font-medium text-text-primary bg-bg-primary hover:bg-bg-secondary/40 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-left"
                >
                  <span className="truncate">{song.tuning || 'Standard (E A D G B E)'}</span>
                  <ChevronDown size={14} className="text-text-muted shrink-0" />
                </button>
              ) : (
                <div className="absolute top-0 left-0 right-0 z-50 bg-bg-primary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => setIsTuningExpanded(false)}
                    className="w-full h-9 px-3 text-xs font-medium text-text-primary hover:bg-bg-secondary/40 flex items-center justify-between gap-2 cursor-pointer transition-colors text-left"
                  >
                    <span className="truncate font-bold">{song.tuning || 'Standard (E A D G B E)'}</span>
                    <ChevronDown size={14} className="text-text-primary shrink-0 rotate-180 transition-transform" />
                  </button>

                  <div className="mx-2.5 h-px bg-border-default/30" />

                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                    {TUNING_OPTIONS.map((opt) => {
                      const isSelected = (song.tuning || 'Standard (E A D G B E)') === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            onUpdateSong({ tuning: opt });
                            setIsTuningExpanded(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                            isSelected
                              ? 'bg-bg-secondary text-text-primary font-bold'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/60'
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isSelected && <Check size={12} className="text-text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. NADA DASAR (KEY) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-muted tracking-wider uppercase block">
                Nada Dasar (Key)
              </label>

              <div className="flex bg-bg-primary rounded-xl p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('major')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    keyMode === 'major'
                      ? 'bg-accent-primary text-accent-contrast shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Mayor
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('minor')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    keyMode === 'minor'
                      ? 'bg-accent-primary text-accent-contrast shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Minor
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-bg-primary space-y-2.5">
              <div className="grid grid-cols-4 gap-1.5">
                {CIRCLE_OF_FIFTHS.map((item) => {
                  const displayKey = keyMode === 'major' ? item.major : item.minor;
                  const isActive = song.musicalKey === displayKey;
                  return (
                    <button
                      key={item.major}
                      type="button"
                      onClick={() => onUpdateSong({ musicalKey: displayKey })}
                      className={`py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer text-center ${
                        isActive
                          ? 'bg-accent-primary text-accent-contrast shadow-xs'
                          : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      {displayKey}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-bg-secondary/80">
                <input
                  type="text"
                  placeholder="Atau ketik nada khusus (misal: Eb Major, D Dorian)..."
                  value={song.musicalKey || ''}
                  onChange={(e) => onUpdateSong({ musicalKey: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-bg-secondary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>
          </div>

          {/* 3. TEMPO (BPM) & CAPO GITAR */}
          <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3">
            <div className="grid grid-cols-2 gap-2.5 items-start">
              {/* Tempo (BPM) */}
              <div className="space-y-1.5 flex flex-col items-center">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">
                  Tempo (BPM)
                </label>
                <div className="w-full h-8 px-1 bg-bg-secondary rounded-xl flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateSong({ bpm: Math.max(30, (song.bpm || 120) - 1) })}
                    className="w-6 h-6 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover/80 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Kurangi Tempo (-1 BPM)"
                  >
                    <Minus size={12} />
                  </button>

                  <input
                    type="number"
                    min={30}
                    max={300}
                    value={song.bpm || 120}
                    onChange={(e) => onUpdateSong({ bpm: parseInt(e.target.value, 10) || 120 })}
                    className="w-12 h-full bg-transparent text-center font-mono font-bold text-xs text-text-primary focus:outline-hidden p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <button
                    type="button"
                    onClick={() => onUpdateSong({ bpm: Math.min(300, (song.bpm || 120) + 1) })}
                    className="w-6 h-6 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover/80 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Tambah Tempo (+1 BPM)"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Capo Gitar */}
              <div className="space-y-1.5 flex flex-col items-center w-full">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">
                  Capo Gitar
                </label>

                <div className="w-full h-8 relative">
                  {!isCapoExpanded ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCapoExpanded(true);
                        setIsTuningExpanded(false);
                      }}
                      className="w-full h-8 px-2.5 text-xs font-semibold text-text-primary bg-bg-secondary hover:bg-bg-hover/50 rounded-xl flex items-center justify-between gap-1 cursor-pointer transition-colors"
                    >
                      <span className="truncate w-full text-center">
                        {song.capo ? `Fret ${song.capo}` : 'Tanpa Capo'}
                      </span>
                      <ChevronDown size={12} className="text-text-muted shrink-0" />
                    </button>
                  ) : (
                    <div className="absolute top-0 left-0 right-0 z-50 bg-bg-secondary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => setIsCapoExpanded(false)}
                        className="w-full h-8 px-2.5 text-xs font-semibold text-text-primary hover:bg-bg-hover/50 flex items-center justify-between gap-1 cursor-pointer transition-colors"
                      >
                        <span className="truncate w-full text-center font-bold">
                          {song.capo ? `Fret ${song.capo}` : 'Tanpa Capo'}
                        </span>
                        <ChevronDown size={12} className="text-text-primary shrink-0 rotate-180 transition-transform" />
                      </button>

                      <div className="mx-2.5 h-px bg-border-default/30" />

                      <div className="max-h-44 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSong({ capo: 0 });
                            setIsCapoExpanded(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                            (song.capo || 0) === 0
                              ? 'bg-bg-primary text-text-primary font-bold'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
                          }`}
                        >
                          <span>Tanpa Capo</span>
                          {(song.capo || 0) === 0 && <Check size={12} className="text-text-primary shrink-0" />}
                        </button>

                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((fret) => {
                          const isSelected = song.capo === fret;
                          return (
                            <button
                              key={fret}
                              type="button"
                              onClick={() => {
                                onUpdateSong({ capo: fret });
                                setIsCapoExpanded(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                                isSelected
                                  ? 'bg-bg-primary text-text-primary font-bold'
                                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
                              }`}
                            >
                              <span>Fret {fret}</span>
                              {isSelected && <Check size={12} className="text-text-primary shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. BIRAMA (TIME SIGNATURE) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted tracking-wider uppercase block">
              Birama (Time Signature)
            </label>

            <div className="p-3 rounded-2xl bg-bg-primary space-y-2.5">
              <input
                type="text"
                placeholder="Contoh: 4/4, 3/4, 6/8, 7/8, Rubato..."
                value={song.timeSignature || '4/4'}
                onChange={(e) => onUpdateSong({ timeSignature: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-bg-secondary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />

              <div className="flex flex-wrap gap-1">
                {COMMON_TIME_SIGNATURES.map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => onUpdateSong({ timeSignature: ts })}
                    className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                      song.timeSignature === ts
                        ? 'bg-accent-primary text-accent-contrast shadow-xs'
                        : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    {ts}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. DETAIL WAKTU (CREATED & MODIFIED DATE) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted tracking-wider uppercase block">
              Detail Waktu
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-2 text-xs">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-icon-secondary" />
                  <span>Dibuat</span>
                </div>
                <span className="font-mono text-text-secondary">{formatDate(song.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-icon-secondary" />
                  <span>Diubah</span>
                </div>
                <span className="font-mono text-text-secondary">{formatDate(song.updatedAt)}</span>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
