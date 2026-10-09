import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Layers, 
  ArrowRight,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StudioBarRecord } from '../types/studioDatabase';

interface InsertBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  bars: StudioBarRecord[];
  onSelectBar: (bar: StudioBarRecord) => void;
}

/**
 * Normalizes HTML/Rich text content from editor into clean lines
 * without double empty line gaps.
 */
function normalizeBarContentToLines(htmlOrText?: string): string[] {
  if (!htmlOrText) return [];

  // Convert HTML line breaks and paragraphs to single newline
  const clean = htmlOrText
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u200B\u00A0]/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, ''); // strip remaining tags

  // Split into lines, trim each, and preserve only non-consecutive empty lines
  const rawLines = clean.split('\n').map((l) => l.trim());
  const lines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.length > 0) {
      lines.push(line);
    } else if (lines.length > 0 && lines[lines.length - 1] !== '') {
      // allow at most single blank line separation if user intentionally spaced it
      lines.push('');
    }
  }

  // Trim trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
}

export const InsertBarModal: React.FC<InsertBarModalProps> = ({
  isOpen,
  onClose,
  bars,
  onSelectBar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'fresh' | 'used'>('fresh');
  const [expandedBarIds, setExpandedBarIds] = useState<Set<string>>(new Set());

  // Count items for tab badges
  const freshCount = useMemo(() => bars.filter((b) => b.status !== 'used').length, [bars]);
  const usedCount = useMemo(() => bars.filter((b) => b.status === 'used').length, [bars]);

  const filteredBars = useMemo(() => {
    return bars.filter((b) => {
      // 2 clean tabs only: fresh vs used
      if (filterMode === 'fresh' && b.status === 'used') return false;
      if (filterMode === 'used' && b.status !== 'used') return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (b.title || '').toLowerCase().includes(q);
      const contentMatch = (b.content || '').toLowerCase().includes(q);
      const themeMatch = (b.theme || '').toLowerCase().includes(q);
      const topicMatch = (b.topic || '').toLowerCase().includes(q);
      return titleMatch || contentMatch || themeMatch || topicMatch;
    });
  }, [bars, searchQuery, filterMode]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-bg-secondary rounded-2xl shadow-2xl border border-border-default/40 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          height: 'min(86vh, 760px)',
          minHeight: 'min(86vh, 500px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-default/30 flex items-center justify-between shrink-0 bg-bg-secondary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shadow-xs shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-text-heading">
                Sisipkan Bar ke Lirik
              </h2>
              <p className="text-[11px] text-text-muted">
                Pilih ide bar untuk ditempel ke lirik & otomatis tercatat di lagu ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Clean 2 Tabs (Fresh vs Terpakai) */}
        <div className="p-4 bg-bg-secondary/70 border-b border-border-default/20 space-y-3 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul bar, cuplikan lirik, tema, topik..."
              className="w-full pl-9 pr-8 py-2 bg-bg-primary rounded-xl text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-hidden focus:ring-1 focus:ring-accent-primary border border-border-default/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2 Clean Tabs: Fresh vs Terpakai */}
          <div className="grid grid-cols-2 gap-2 bg-bg-primary p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterMode('fresh')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                filterMode === 'fresh'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Sparkles size={13} />
              <span>Fresh (Bebas)</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                filterMode === 'fresh' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-bg-secondary text-text-muted'
              }`}>
                {freshCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('used')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                filterMode === 'used'
                  ? 'bg-amber-500/20 text-amber-400 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Lock size={12} />
              <span>Terpakai</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                filterMode === 'used' ? 'bg-amber-500/30 text-amber-300' : 'bg-bg-secondary text-text-muted'
              }`}>
                {usedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Bar List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredBars.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-16 space-y-2">
              <Layers size={36} className="text-text-disabled opacity-50" />
              <p className="text-xs font-medium">
                {filterMode === 'fresh' 
                  ? 'Tidak ada ide bar fresh yang ditemukan' 
                  : 'Tidak ada ide bar terpakai yang ditemukan'}
              </p>
            </div>
          ) : (
            filteredBars.map((b) => {
              const isUsed = b.status === 'used';
              const isExpanded = expandedBarIds.has(b.id);
              const normalizedLines = normalizeBarContentToLines(b.content);
              const totalLines = normalizedLines.length;
              const displayLines = isExpanded ? normalizedLines : normalizedLines.slice(0, 4);

              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-bg-primary hover:bg-bg-hover/80 border border-border-default/30 transition-all flex flex-col gap-3 group"
                >
                  {/* Top Row: Title, Badges, and Action Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-text-heading truncate">
                          {b.title || 'Bar Tanpa Judul'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-bg-secondary text-text-secondary font-mono font-medium">
                          {b.barCount || 4} Bars
                        </span>
                        {b.rhymeScheme && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted font-mono">
                            {b.rhymeScheme}
                          </span>
                        )}
                        {isUsed ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold flex items-center gap-1">
                            <Lock size={10} />
                            Terpakai
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles size={10} />
                            Fresh
                          </span>
                        )}
                      </div>

                      {(b.theme || b.topic) && (
                        <div className="flex items-center gap-2 text-[10.5px] text-text-muted">
                          {b.theme && <span>Tema: {b.theme}</span>}
                          {b.theme && b.topic && <span>•</span>}
                          {b.topic && <span>Topik: {b.topic}</span>}
                        </div>
                      )}
                    </div>

                    {/* Insert Button */}
                    <button
                      type="button"
                      onClick={() => onSelectBar(b)}
                      className="px-3 py-1.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-accent-contrast text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <span>Sisipkan</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Preview Container: Clean lines without arbitrary blank space */}
                  <div className="p-2.5 rounded-xl bg-bg-secondary/70 border border-border-default/20 text-xs font-mono text-text-secondary">
                    {displayLines.length === 0 ? (
                      <p className="text-text-muted italic">(Konten bar masih kosong)</p>
                    ) : (
                      <div className="space-y-0.5">
                        {displayLines.map((line, idx) => (
                          <p key={idx} className="leading-normal break-words">
                            {line || '\u00A0'}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Toggle if lines exceed 4 */}
                    {totalLines > 4 && (
                      <div className="mt-2.5 pt-1.5 border-t border-border-default/20 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(b.id, e)}
                          className="text-[11px] text-accent-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={12} />
                              <span>Sembunyikan Cuplikan Penuh</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={12} />
                              <span>Lihat Seluruh Bar ({totalLines} baris)</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-text-muted font-sans">
                          {totalLines} baris
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
