import React, { useState, useMemo } from 'react';
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
 * Strips all <p>, </p>, <div>, </div>, <br> so every line of verse
 * is tightly grouped with no artificial blank rows.
 */
function normalizeBarContentToLines(htmlOrText?: string): string[] {
  if (!htmlOrText) return [];

  const clean = htmlOrText
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u200B\u00A0]/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<[^>]*>/g, ''); // strip remaining tags

  // Split into lines, trim each, and ignore empty lines completely
  return clean
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-70 flex justify-center items-start pt-3 sm:pt-0 sm:items-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-bg-primary border-0 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 animate-in zoom-in-95 duration-150 shrink-0 mt-1 sm:my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Identical structure to Kanban Inbox Triage Move to Folder Modal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Layers size={17} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-text-heading">
              Sisipkan Bar
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input - text-base on mobile prevents iOS/Android auto-zoom shift */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul bar, cuplikan lirik, tema, topik..."
            className="w-full pl-8.5 pr-8 py-2 text-base sm:text-xs bg-bg-secondary text-text-primary placeholder:text-text-muted rounded-xl border-0 focus:outline-hidden focus:ring-1.5 focus:ring-accent-primary/40 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[10px] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* 2 Clean Tabs: Fresh vs Terpakai with High Contrast Badges */}
        <div className="grid grid-cols-2 gap-2 bg-bg-secondary p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMode('fresh')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              filterMode === 'fresh'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <Sparkles size={13} />
            <span>Fresh</span>
            <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
              filterMode === 'fresh'
                ? 'bg-white/25 text-white'
                : 'bg-bg-primary text-text-primary border border-border-default/40'
            }`}>
              {freshCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('used')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              filterMode === 'used'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <Lock size={12} />
            <span>Terpakai</span>
            <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
              filterMode === 'used'
                ? 'bg-white/25 text-white'
                : 'bg-bg-primary text-text-primary border border-border-default/40'
            }`}>
              {usedCount}
            </span>
          </button>
        </div>

        {/* Bar List (Scrollable Area) */}
        <div className="max-h-72 sm:max-h-80 overflow-y-auto space-y-2.5 custom-scrollbar py-0.5">
          {filteredBars.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-text-muted space-y-2">
              <Layers size={32} className="text-text-disabled opacity-40" />
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
                  className="p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover/80 text-left transition-all border-0 flex flex-col gap-2.5 group"
                >
                  {/* Top Row: Title, Badges, and Action Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-text-heading truncate">
                          {b.title || 'Bar Tanpa Judul'}
                        </span>
                        {/* Bar count badge */}
                        <span 
                          title={`${b.barCount || 4} Bars`}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-primary text-text-secondary font-mono font-medium flex items-center gap-1 shrink-0"
                        >
                          <Layers size={11} className="text-text-muted" />
                          <span className="hidden sm:inline">{b.barCount || 4} Bars</span>
                          <span className="sm:hidden">{b.barCount || 4}</span>
                        </span>

                        {/* Rhyme scheme badge (only if non-default) */}
                        {b.rhymeScheme && b.rhymeScheme !== 'Bebas' && (
                          <span 
                            title={`Skema rima: ${b.rhymeScheme}`}
                            className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-primary text-text-muted font-mono shrink-0"
                          >
                            {b.rhymeScheme}
                          </span>
                        )}

                        {/* Status badge: Clean & compact icon on mobile, with text on desktop */}
                        {isUsed ? (
                          <span 
                            title="Status: Terpakai"
                            className="p-1 sm:px-2 sm:py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold flex items-center gap-1 border border-amber-500/30 shrink-0"
                          >
                            <Lock size={11} />
                            <span className="hidden sm:inline text-[10px]">Terpakai</span>
                          </span>
                        ) : (
                          <span 
                            title="Status: Fresh"
                            className="p-1 sm:px-2 sm:py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 border border-emerald-500/30 shrink-0"
                          >
                            <Sparkles size={11} />
                            <span className="hidden sm:inline text-[10px]">Fresh</span>
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

                  {/* Preview Container: Clean lines with ZERO arbitrary blank gap */}
                  <div className="p-2.5 rounded-xl bg-bg-primary/80 text-xs font-mono text-text-secondary">
                    {displayLines.length === 0 ? (
                      <p className="text-text-muted italic">(Konten bar masih kosong)</p>
                    ) : (
                      <div className="space-y-0.5">
                        {displayLines.map((line, idx) => (
                          <p key={idx} className="leading-snug break-words">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Toggle if lines exceed 4 */}
                    {totalLines > 4 && (
                      <div className="mt-2 pt-1.5 border-t border-border-default/20 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(b.id, e)}
                          className="text-[11px] text-accent-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={12} />
                              <span>Sembunyikan Cuplikan</span>
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
    </div>
  );
};
