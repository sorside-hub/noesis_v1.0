import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Layers, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Sparkles, 
  FileEdit,
  Music2 
} from 'lucide-react';
import { StudioBarRecord, StudioSongRecord } from '../types/studioDatabase';
import { calculateBarCount } from '../lib/musicBarUtils';

interface MusicBarCardProps {
  bar: StudioBarRecord;
  songs?: StudioSongRecord[];
  onSelect: (bar: StudioBarRecord) => void;
  onDuplicate?: (barId: string) => void;
  onDelete?: (barId: string) => void;
}

export const MusicBarCard: React.FC<MusicBarCardProps> = ({
  bar,
  songs = [],
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Clean snippet (flexible up to 4 complete bars/lines, skipping section headers and pure chords)
  const snippet = useMemo(() => {
    if (!bar.content) return 'Belum ada isi lirik...';
    const plain = bar.content
      .replace(/&nbsp;/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '');
    const lines = plain
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => {
        if (!l) return false;
        if (/^((\[|\()(intro|verse|chorus|reff|bridge|pre-chorus|solo|outro|hook).*?(\]|\)))$/i.test(l)) return false;
        // If line is pure chord brackets, ignore unless whole text is chords
        const stripped = l.replace(/\[[A-G][b#]?(m|maj|min|dim|aug|sus\d*|\d)*(\/[A-G][b#]?)?\]/gi, '').replace(/[|\-/\s]/g, '');
        if (stripped.length === 0) return false;
        return true;
      });

    if (lines.length === 0) {
      // Fallback for pure chords
      const fallback = plain.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      return fallback.slice(0, 4).join('\n') || 'Belum ada isi lirik...';
    }

    return lines.slice(0, 4).join('\n') || 'Belum ada isi lirik...';
  }, [bar.content]);

  // Dynamic bar count
  const barCount = useMemo(() => {
    return bar.barCount || calculateBarCount(bar.content) || 1;
  }, [bar.content, bar.barCount]);

  const usedSong = songs.find((s) => s.id === bar.usedInSongId);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = bar.content.replace(/<[^>]*>/g, '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setShowMenu(false);
  };

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(bar.updatedAt || bar.createdAt);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }, [bar.updatedAt, bar.createdAt]);

  return (
    <div
      onClick={() => onSelect(bar)}
      className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.99] select-none text-left"
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Bar Count Badge */}
            <span className="px-2 py-0.5 rounded-lg bg-bg-primary text-text-primary text-[10px] font-mono font-bold tracking-tight">
              {barCount} Bar
            </span>

            {/* Theme & Topic Badge */}
            {Boolean((bar.theme && bar.theme.trim()) || (bar.topic && bar.topic.trim())) && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent-primary/10 text-accent-primary text-[10px] font-medium truncate max-w-[160px]">
                <Sparkles size={10} className="shrink-0" />
                <span className="truncate">
                  {bar.theme && bar.topic ? `${bar.theme} • ${bar.topic}` : bar.theme || bar.topic}
                </span>
              </span>
            )}
          </div>

          {/* Right Menu Button */}
          <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Opsi Bar"
            >
              <MoreVertical size={14} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-bg-primary rounded-xl shadow-2xl p-1 z-30 select-none animate-in fade-in zoom-in-95 duration-100 space-y-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onSelect(bar);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
                >
                  <FileEdit size={13} />
                  <span>Buka Editor</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Lirik'}</span>
                </button>

                {onDuplicate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDuplicate(bar.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Duplikat Bar</span>
                  </button>
                )}

                <div className="h-px bg-border-default/20 my-0.5" />

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (window.confirm('Yakin ingin menghapus bar ini?')) {
                        onDelete(bar.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-status-error hover:bg-status-error/10 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-text-heading group-hover:text-accent-primary transition-colors line-clamp-1 mb-1.5">
          {bar.title}
        </h3>

        {/* Lyric Snippet preview */}
        <p className="text-xs text-text-secondary line-clamp-4 leading-relaxed whitespace-pre-line font-normal italic opacity-90">
          &ldquo;{snippet}&rdquo;
        </p>
      </div>

      {/* Card Footer: Usage Status & Date */}
      <div className="mt-3.5 pt-2.5 border-t border-border-default/10 flex items-center justify-between text-[11px] text-text-muted gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {bar.status === 'used' ? (
            <div className="flex items-center gap-1 text-amber-400 font-semibold truncate">
              <Lock size={11} className="shrink-0" />
              <span className="truncate">
                {usedSong ? usedSong.title : 'Terpakai'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Unlock size={11} className="shrink-0" />
              <span>Fresh</span>
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono shrink-0">{formattedDate}</span>
      </div>
    </div>
  );
};
