import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { SongItem, MusicProductionStatus } from '../types';
import { MusicKanbanCard } from './MusicKanbanCard';

interface MusicKanbanColumnProps {
  stageId: MusicProductionStatus;
  label: string;
  icon: string;
  songs: SongItem[];
  onSelectSong: (songId: string) => void;
  onUpdateStatus: (songId: string, status: MusicProductionStatus) => void;
  onCreateSongInStage?: (stage: MusicProductionStatus) => void;
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
  songs,
  onSelectSong,
  onUpdateStatus,
  onCreateSongInStage,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
    data: {
      type: 'column',
      stageId,
    },
  });

  const theme = getColumnTheme(stageId);
  const songIds = songs.map((s) => s.id);

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

      {/* Column Header with only border-b divider */}
      <div className="p-3 border-b border-border-default/40 bg-bg-secondary flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{icon}</span>
            <h3 className="text-xs font-bold text-text-heading tracking-tight">
              {label}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${theme.badge} shrink-0`}>
            {songs.length}
          </span>

          {onCreateSongInStage && (
            <button
              type="button"
              onClick={() => onCreateSongInStage(stageId)}
              title={`Tambah Lagu ke tahap ${label}`}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Column Body / Cards in bg-bg-primary list - fills entire height to bottom */}
      <div className="flex-1 min-h-0 p-2.5 space-y-2.5 overflow-y-auto [scrollbar-width:thin]">
        <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
          {songs.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center rounded-xl bg-bg-primary/40 text-center p-3 text-[11px] text-text-muted">
              <span>Tarik atau tambah lagu ke sini</span>
            </div>
          ) : (
            songs.map((song) => (
              <MusicKanbanCard
                key={song.id}
                song={song}
                onSelectSong={onSelectSong}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
