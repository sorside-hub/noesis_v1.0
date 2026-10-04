import React, { useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MusicReleaseItem, MusicProductionStatus } from '../types';
import { MusicKanbanCard } from './MusicKanbanCard';

interface MusicKanbanColumnProps {
  stageId: MusicProductionStatus;
  label: string;
  icon: string;
  items: MusicReleaseItem[];
  onSelectItem: (item: MusicReleaseItem) => void;
  onRenameItem?: (item: MusicReleaseItem) => void;
  onMoveItem?: (item: MusicReleaseItem) => void;
  onUpdateStatus?: (item: MusicReleaseItem, status: MusicProductionStatus) => void;
  onDeleteItem?: (item: MusicReleaseItem) => void;
}

const getColumnTheme = (stageId: MusicProductionStatus) => {
  switch (stageId) {
    case 'idea':
      return {
        topLine: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        badge: 'bg-amber-500/15 text-amber-300',
        dot: 'bg-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
        dropActive: 'ring-2 ring-amber-500/40 bg-amber-500/10',
      };
    case 'demo':
      return {
        topLine: 'bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.35)]',
        badge: 'bg-sky-500/15 text-sky-300',
        dot: 'bg-sky-400 ring-2 ring-sky-400/20 shadow-[0_0_6px_rgba(14,165,233,0.5)]',
        dropActive: 'ring-2 ring-sky-500/40 bg-sky-500/10',
      };
    case 'recording':
      return {
        topLine: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
        badge: 'bg-purple-500/15 text-purple-300',
        dot: 'bg-purple-400 ring-2 ring-purple-400/20 shadow-[0_0_6px_rgba(168,85,247,0.5)]',
        dropActive: 'ring-2 ring-purple-500/40 bg-purple-500/10',
      };
    case 'mixing':
      return {
        topLine: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]',
        badge: 'bg-indigo-500/15 text-indigo-300',
        dot: 'bg-indigo-400 ring-2 ring-indigo-400/20 shadow-[0_0_6px_rgba(99,102,241,0.5)]',
        dropActive: 'ring-2 ring-indigo-500/40 bg-indigo-500/10',
      };
    case 'ready':
      return {
        topLine: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
        badge: 'bg-emerald-500/15 text-emerald-300',
        dot: 'bg-emerald-400 ring-2 ring-emerald-400/20 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
        dropActive: 'ring-2 ring-emerald-500/40 bg-emerald-500/10',
      };
    case 'released':
      return {
        topLine: 'bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.35)]',
        badge: 'bg-teal-500/15 text-teal-300',
        dot: 'bg-teal-400 ring-2 ring-teal-400/20 shadow-[0_0_6px_rgba(20,184,166,0.5)]',
        dropActive: 'ring-2 ring-teal-500/40 bg-teal-500/10',
      };
  }
};

export const MusicKanbanColumn: React.FC<MusicKanbanColumnProps> = ({
  stageId,
  label,
  icon,
  items,
  onSelectItem,
  onRenameItem,
  onMoveItem,
  onUpdateStatus,
  onDeleteItem,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
    data: {
      type: 'column',
      stageId,
    },
  });

  const theme = getColumnTheme(stageId);
  const itemIds = items.map((it) => it.id);

  const columnBodyRef = useRef<HTMLDivElement | null>(null);

  // Restore vertical scroll position on mount
  useEffect(() => {
    const savedY = sessionStorage.getItem(`music_kanban_col_${stageId}_y`);
    if (savedY && columnBodyRef.current) {
      const targetY = parseFloat(savedY);
      const raf = requestAnimationFrame(() => {
        if (columnBodyRef.current) {
          columnBodyRef.current.scrollTop = targetY;
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [stageId]);

  const handleBodyScroll = useCallback(() => {
    if (columnBodyRef.current) {
      sessionStorage.setItem(`music_kanban_col_${stageId}_y`, String(columnBodyRef.current.scrollTop));
    }
  }, [stageId]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-xl relative overflow-hidden transition-all duration-200 flex-shrink-0 w-72 sm:w-80 select-none ${
        isOver
          ? `bg-bg-secondary ${theme.dropActive} shadow-xl scale-[1.01]`
          : 'bg-bg-secondary shadow-xs'
      }`}
    >
      {/* Top Ambient Glow Line */}
      <div className={`h-1 w-full shrink-0 ${theme.topLine}`} />

      {/* Column Header (Matching InboxTriageColumn) */}
      <div className="p-3 border-b border-border-default/40 bg-bg-secondary flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{icon}</span>
            <h3 className="text-xs font-bold text-text-heading tracking-tight">
              {label}
            </h3>
          </div>
        </div>

        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${theme.badge} shrink-0`}>
          {items.length}
        </span>
      </div>

      {/* Cards List Body with Dnd-Kit SortableContext */}
      <div 
        ref={columnBodyRef}
        onScroll={handleBodyScroll}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-0 [scrollbar-width:thin]"
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <MusicKanbanCard
              key={item.id}
              item={item}
              onSelectItem={onSelectItem}
              onRenameItem={onRenameItem}
              onMoveItem={onMoveItem}
              onUpdateStatus={onUpdateStatus}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="h-24 flex items-center justify-center border border-dashed border-border-default/30 rounded-xl text-text-muted text-[11px]">
            Kosong
          </div>
        )}
      </div>
    </div>
  );
};
