import React, { useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Filter, 
  Layers, 
  Check, 
  Link2, 
  Tag, 
  ArrowLeftRight,
  Sparkles 
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { LocalGraphDepth, LocalGraphFilterOptions, LocalGraphStats } from './types';

interface LocalGraphHeaderProps {
  filters: LocalGraphFilterOptions;
  stats: LocalGraphStats;
  onSetDepth: (depth: LocalGraphDepth) => void;
  onToggleOutgoing: () => void;
  onToggleBacklinks: () => void;
  onToggleTags: () => void;
  onToggleSemantic: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  onCloseFilter: () => void;
}

export const LocalGraphHeader: React.FC<LocalGraphHeaderProps> = ({
  filters,
  stats,
  onSetDepth,
  onToggleOutgoing,
  onToggleBacklinks,
  onToggleTags,
  onToggleSemantic,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFilterOpen,
  onToggleFilter,
  onCloseFilter,
}) => {
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDropdown = filterDropdownRef.current?.contains(target);
      const clickedInsideButton = filterButtonRef.current?.contains(target);
      
      if (!clickedInsideDropdown && !clickedInsideButton) {
        onCloseFilter();
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, onCloseFilter]);

  return (
    <div className="relative flex items-center justify-between px-3 py-2 bg-bg-secondary select-none">
      {/* Left: Depth Quick Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-text-muted font-medium">Depth</span>
        <div className="flex items-center gap-1 bg-bg-primary p-0.5 rounded-lg">
          {([1, 2, 3] as LocalGraphDepth[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onSetDepth(d)}
              className={twMerge(
                'px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer',
                filters.depth === d
                  ? 'bg-accent-primary text-accent-contrast font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              {d} hop{d > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Actions (Filter & Zoom Controls in 1 row) */}
      <div className="flex items-center gap-1.5">
        {/* Filter Toggle Button (Icon Only) */}
        <button
          ref={filterButtonRef}
          type="button"
          onClick={onToggleFilter}
          className={twMerge(
            'p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer',
            isFilterOpen || !filters.showOutgoing || !filters.showBacklinks || !filters.showTags
              ? 'bg-accent-primary/15 text-accent-primary'
              : 'bg-bg-primary text-icon-secondary hover:text-text-primary hover:bg-bg-hover'
          )}
          title="Connection Filters"
        >
          <Filter size={13} />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-bg-primary p-0.5 rounded-lg">
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 rounded text-icon-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 rounded text-icon-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <div className="w-[1px] h-3 bg-border-subtle mx-0.5" />
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1 rounded text-icon-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Reset View"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Filter Dropdown Popover (Opens Upward from right side) */}
      {isFilterOpen && (
        <div
          ref={filterDropdownRef}
          className="absolute bottom-full right-3 mb-2 w-56 z-40 bg-bg-primary rounded-xl shadow-xl p-2.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">
            Connection Filters
          </div>

          <button
            type="button"
            onClick={onToggleOutgoing}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-link-primary shadow-xs" />
              <Link2 size={13} className="text-link-primary" />
              <span>Outgoing Links</span>
            </div>
            {filters.showOutgoing && <Check size={13} className="text-accent-primary" />}
          </button>

          <button
            type="button"
            onClick={onToggleBacklinks}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success shadow-xs" />
              <ArrowLeftRight size={13} className="text-status-success" />
              <span>Backlinks</span>
            </div>
            {filters.showBacklinks && <Check size={13} className="text-accent-primary" />}
          </button>

          <button
            type="button"
            onClick={onToggleTags}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-warning shadow-xs" />
              <Tag size={13} className="text-status-warning" />
              <span>Shared Tags (Dashed)</span>
            </div>
            {filters.showTags && <Check size={13} className="text-accent-primary" />}
          </button>

          <button
            type="button"
            onClick={onToggleSemantic}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-primary shadow-xs" />
              <Sparkles size={13} className="text-accent-primary" />
              <span>Related Notes (AI)</span>
            </div>
            {filters.showSemantic && <Check size={13} className="text-accent-primary" />}
          </button>
        </div>
      )}
    </div>
  );
};
