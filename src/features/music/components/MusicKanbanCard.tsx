import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Music2, Mic, Disc3 } from 'lucide-react';
import { SongItem, MusicProductionStatus } from '../types';

interface MusicKanbanCardProps {
  song: SongItem;
  onSelectSong: (songId: string) => void;
  onUpdateStatus?: (songId: string, status: MusicProductionStatus) => void;
  isDraggingOverlay?: boolean;
}

export const MusicKanbanCard: React.FC<MusicKanbanCardProps> = ({
  song,
  onSelectSong,
  isDraggingOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: song.id,
    data: {
      type: 'song',
      song,
    },
    disabled: isDraggingOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) {
          onSelectSong(song.id);
        }
      }}
      className={`group relative flex flex-col gap-2 p-3.5 rounded-xl bg-bg-primary transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDraggingOverlay
          ? 'shadow-2xl ring-2 ring-accent-primary/50 rotate-1 scale-102 bg-bg-primary/95 backdrop-blur-md z-50 touch-none'
          : isDragging
          ? 'ring-2 ring-accent-primary/40 shadow-xl touch-none'
          : 'shadow-2xs hover:shadow-md hover:bg-bg-hover/70'
      }`}
    >
      {/* Header: Icon, Title & Demo Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Music2 
            size={14} 
            className="text-text-muted mt-0.5 shrink-0 group-hover:text-accent-primary transition-colors" 
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-text-heading leading-snug line-clamp-2">
              {song.title || 'Tanpa Judul'}
            </h4>
            {song.project && (
              <p className="text-[10px] text-text-muted mt-0.5 truncate flex items-center gap-1">
                <Disc3 size={10} className="text-accent-primary/70 shrink-0" />
                <span className="truncate">{song.project}</span>
              </p>
            )}
          </div>
        </div>

        {song.hasAudioMemo && (
          <span 
            title="Terdapat Audio Memo / Demo Guide"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary text-[9px] font-semibold shrink-0"
          >
            <Mic size={9} />
            <span>Demo</span>
          </span>
        )}
      </div>

      {/* Snippet Lyrics (Optional, Clean 1-line preview) */}
      {song.snippet && (
        <p className="text-[11px] text-text-muted/80 line-clamp-1 font-sans leading-relaxed">
          {song.snippet}
        </p>
      )}

      {/* Musical Details: Key, BPM, Tuning, Capo */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-border-default/20 text-[10px]">
        {song.key ? (
          <span className="px-1.5 py-0.5 rounded-md bg-bg-secondary font-mono font-medium text-text-primary">
            {song.key}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-md bg-bg-secondary/60 font-mono text-text-muted">
            No Key
          </span>
        )}

        {song.bpm ? (
          <span className="px-1.5 py-0.5 rounded-md bg-bg-secondary font-mono text-text-secondary">
            {song.bpm} BPM
          </span>
        ) : null}

        {song.capo && song.capo > 0 ? (
          <span className="px-1.5 py-0.5 rounded-md bg-bg-secondary/80 font-mono text-text-muted">
            Capo {song.capo}
          </span>
        ) : null}

        {song.genre ? (
          <span className="ml-auto text-[9px] text-text-muted truncate max-w-[80px]">
            {song.genre}
          </span>
        ) : null}
      </div>
    </div>
  );
};
