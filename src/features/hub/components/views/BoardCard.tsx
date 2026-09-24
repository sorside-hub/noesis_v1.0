import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Clock } from 'lucide-react';
import { EnrichedNoteItem } from '../../types';
import { DynamicFilter, getPropertyLabel } from '../HubFilterBar';

interface BoardCardProps {
  note: EnrichedNoteItem;
  dynamicProperties: string[];
  getPropertyValue: (note: EnrichedNoteItem, prop: string) => any;
  onOpenNote: (id: string) => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
};

export const BoardCard: React.FC<BoardCardProps> = ({
  note,
  dynamicProperties,
  getPropertyValue,
  onOpenNote,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: {
      type: 'Note',
      note,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent opening if the user was just dragging
        if (!isDragging) {
           onOpenNote(note.id);
        }
      }}
      className={`group p-3 rounded-xl bg-bg-primary transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2 relative select-none touch-none ${
        isDragging
          ? 'ring-2 ring-accent-primary/50 shadow-xl'
          : 'shadow-2xs hover:shadow-md hover:bg-bg-hover/70'
      }`}
    >
      <div className="flex items-start gap-2">
        <FileText size={14} className="text-text-muted mt-0.5 shrink-0 group-hover:text-accent-primary transition-colors" />
        <h4 className="text-xs font-semibold text-text-primary leading-snug line-clamp-2">
          {note.title || 'Tanpa Judul'}
        </h4>
      </div>
      
      {/* Footer: Dynamic Property Info + Updated Date */}
      <div className="flex items-center justify-between gap-2 pl-5 pt-1.5 border-t border-border-default/30 text-[10px]">
        {/* Dynamic Active Filter Text (Clean & Unboxed) */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {dynamicProperties.map(prop => {
            const val = getPropertyValue(note, prop);
            if (val === undefined || val === null || val === '') return null;
            const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
            return (
              <span 
                key={prop} 
                className="inline-flex items-center gap-1 text-[10px] text-text-muted truncate max-w-[140px]"
                title={`${getPropertyLabel(prop)}: ${displayVal}`}
              >
                <span className="opacity-60">{getPropertyLabel(prop)}:</span>
                <span className="font-medium text-text-secondary truncate">{displayVal}</span>
              </span>
            );
          })}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1 text-text-muted shrink-0 ml-auto">
          <Clock size={10} className="opacity-60" />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
