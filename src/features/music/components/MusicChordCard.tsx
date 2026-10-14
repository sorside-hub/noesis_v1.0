import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Music,
  Play,
  Square,
  Volume2,
  Copy,
  Check,
  Star,
  MoreVertical,
  Trash2,
  FileEdit,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StudioChordProgressionRecord } from '../types/studioDatabase';
import { MOOD_CATEGORIES } from '../lib/chordTheory';

interface MusicChordCardProps {
  progression: StudioChordProgressionRecord;
  isPlaying?: boolean;
  activeChordIndex?: number;
  onPlay: (prog: StudioChordProgressionRecord) => void;
  onStop: () => void;
  onPlaySingleChord: (chord: string) => void;
  onEdit: (prog: StudioChordProgressionRecord) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const MusicChordCard: React.FC<MusicChordCardProps> = ({
  progression,
  isPlaying = false,
  activeChordIndex = -1,
  onPlay,
  onStop,
  onPlaySingleChord,
  onEdit,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showMenu]);

  // Mood color & emoji
  const moodInfo = useMemo(() => {
    const found = MOOD_CATEGORIES.find(
      (m) => m.id.toLowerCase() === (progression.mood || '').toLowerCase()
    );
    if (found) return found;
    return {
      id: progression.mood || 'Umum',
      label: progression.mood || 'Umum',
      color: 'indigo',
      emoji: '🎵',
    };
  }, [progression.mood]);

  const moodBadgeClasses = useMemo(() => {
    switch (moodInfo.color) {
      case 'amber':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rose':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'teal':
        return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      case 'indigo':
      default:
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
  }, [moodInfo.color]);

  const handleCopyChords = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const chordString = progression.chords.join(' - ');
    try {
      await navigator.clipboard.writeText(chordString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyFull = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = `[${progression.key} ${progression.scale}]\n` +
      `Mood: ${progression.mood}\n` +
      `Derajat: ${progression.romans.join(' - ')}\n` +
      `Chord: ${progression.chords.join(' - ')}\n` +
      (progression.bpm ? `Tempo: ${progression.bpm} BPM\n` : '') +
      (progression.description ? `Catatan: ${progression.description}\n` : '');

    try {
      await navigator.clipboard.writeText(formatted.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setShowMenu(false);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between p-4 rounded-2xl bg-bg-surface border transition-all duration-200 select-none ${
        isPlaying
          ? 'border-accent-primary ring-1 ring-accent-primary/50 shadow-md shadow-accent-primary/5'
          : 'border-border-default/40 hover:border-border-default/80 hover:shadow-xs'
      }`}
    >
      {/* 
        TOP HEADER: KEY, MOOD, FAVORITE & MENU
      */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Key & Scale Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-secondary text-text-primary text-xs font-bold font-mono border border-border-default/30">
            <Music size={12} className="text-accent-primary shrink-0" />
            <span>
              {progression.key} {progression.scale}
            </span>
          </div>

          {/* Mood Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${moodBadgeClasses}`}
          >
            <span>{moodInfo.emoji}</span>
            <span>{progression.mood}</span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(progression.id);
            }}
            title={progression.isFavorite ? 'Hapus dari favorit' : 'Tandai favorit'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              progression.isFavorite
                ? 'text-amber-400 hover:bg-amber-400/10'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Star
              size={15}
              className={progression.isFavorite ? 'fill-amber-400' : ''}
            />
          </button>

          {/* More Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <MoreVertical size={15} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-bg-surface border border-border-default rounded-xl shadow-xl z-30 p-1.5 text-xs text-text-primary space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(progression);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg-hover transition-colors text-left cursor-pointer"
                >
                  <FileEdit size={14} className="text-accent-primary" />
                  <span>Edit Progresi</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyFull}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg-hover transition-colors text-left cursor-pointer"
                >
                  <Copy size={14} className="text-text-muted" />
                  <span>Salin Info Lengkap</span>
                </button>

                {onDuplicate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDuplicate(progression.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg-hover transition-colors text-left cursor-pointer"
                  >
                    <Sparkles size={14} className="text-text-muted" />
                    <span>Duplikasi Kartu</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(progression.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Hapus Progresi</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        TITLE & DESCRIPTION
      */}
      <div className="mb-3 cursor-pointer" onClick={() => onEdit(progression)}>
        <h4 className="text-sm font-bold text-text-heading line-clamp-1 group-hover:text-accent-primary transition-colors">
          {progression.title}
        </h4>
        {progression.description && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
            {progression.description}
          </p>
        )}
        {/* Multi-Section Structure Badges */}
        {progression.sections && progression.sections.length > 1 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {progression.sections.map((sec) => (
              <span
                key={sec.id}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-bg-secondary text-text-secondary border border-border-default/40"
              >
                {sec.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 
        ROMAN NUMERAL STRIP & INTERACTIVE CHORD BLOCKS
      */}
      <div className="my-2 p-2.5 rounded-xl bg-bg-secondary/70 border border-border-default/30 space-y-2">
        {/* Roman Numerals Row */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {progression.romans.map((roman, idx) => (
            <React.Fragment key={`rom-${idx}`}>
              <div className="flex-1 text-center font-mono text-[11px] font-semibold text-text-muted">
                {roman}
              </div>
              {idx < progression.romans.length - 1 && (
                <span className="text-text-muted/40 text-[10px] select-none">→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Chord Blocks Row */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          {progression.chords.map((chord, idx) => {
            const isStepActive = isPlaying && activeChordIndex === idx;
            return (
              <button
                key={`chord-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaySingleChord(chord);
                }}
                title={`Klik untuk dengar akor ${chord}`}
                className={`flex-1 min-w-[48px] py-2 px-1 rounded-lg text-center font-bold text-sm transition-all cursor-pointer border ${
                  isStepActive
                    ? 'bg-accent-primary text-accent-contrast border-accent-primary scale-105 shadow-sm'
                    : 'bg-bg-surface text-text-heading border-border-default/40 hover:border-accent-primary/50 hover:bg-bg-hover active:scale-95'
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

      {/* 
        FOOTER: METADATA & BOTTOM ACTIONS
      */}
      <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-border-default/20 text-xs">
        {/* Left: BPM & Genre */}
        <div className="flex items-center gap-2 text-text-muted flex-wrap">
          {progression.bpm && (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <Clock size={11} className="text-text-muted/70" />
              <span>{progression.bpm} BPM</span>
            </div>
          )}
          {progression.genre && (
            <span className="text-[11px] text-text-muted truncate max-w-[120px]">
              • {progression.genre}
            </span>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy Chords */}
          <button
            type="button"
            onClick={handleCopyChords}
            title="Salin deret chord"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary text-[11px] font-medium transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Salin</span>
              </>
            )}
          </button>

          {/* Play/Stop Audio Sequence */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isPlaying) {
                onStop();
              } else {
                onPlay(progression);
              }
            }}
            title={isPlaying ? 'Hentikan pemutaran' : 'Dengarkan progresi'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
              isPlaying
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-95'
            }`}
          >
            {isPlaying ? (
              <>
                <Square size={11} className="fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={11} className="fill-current" />
                <span>Dengar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
