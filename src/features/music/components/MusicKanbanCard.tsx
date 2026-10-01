import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Music2, 
  Disc3, 
  MoreVertical, 
  Pencil, 
  ArrowRightLeft, 
  Trash2, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { MusicReleaseItem, MusicProductionStatus, PRODUCTION_STAGES } from '../types';

interface MusicKanbanCardProps {
  item: MusicReleaseItem;
  onSelectItem: (item: MusicReleaseItem) => void;
  onRenameItem?: (item: MusicReleaseItem) => void;
  onUpdateStatus?: (item: MusicReleaseItem, status: MusicProductionStatus) => void;
  onDeleteItem?: (item: MusicReleaseItem) => void;
  isDraggingOverlay?: boolean;
}

export const MusicKanbanCard: React.FC<MusicKanbanCardProps> = ({
  item,
  onSelectItem,
  onRenameItem,
  onUpdateStatus,
  onDeleteItem,
  isDraggingOverlay = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
    },
    disabled: isDraggingOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isSingle = item.type === 'single';

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowStageSelector(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showMenu]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) {
          onSelectItem(item);
        }
      }}
      className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-bg-primary transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDraggingOverlay
          ? 'shadow-2xl ring-2 ring-accent-primary/50 rotate-1 scale-102 bg-bg-primary/95 backdrop-blur-md z-50 touch-none'
          : isDragging
          ? 'ring-2 ring-accent-primary/40 shadow-xl touch-none'
          : 'shadow-2xs hover:shadow-md hover:bg-bg-hover'
      }`}
    >
      {/* Icon & Judul */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="text-text-muted group-hover:text-accent-primary transition-colors shrink-0">
          {isSingle ? <Music2 size={15} /> : <Disc3 size={15} />}
        </div>
        <h4 className="text-xs font-semibold text-text-heading truncate">
          {item.title || 'Tanpa Judul'}
        </h4>
      </div>

      {/* Right Controls: Badge & Titik 3 */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Badge / Info Single / EP / Album */}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg-secondary text-text-muted uppercase tracking-wider shrink-0">
          {item.type}
        </span>

        {/* Titik 3 Action Button */}
        {!isDraggingOverlay && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setShowMenu(!showMenu);
                setShowStageSelector(false);
              }}
              className="w-6 h-6 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="Aksi"
              aria-label="Aksi"
            >
              <MoreVertical size={13} />
            </button>

            {/* Menu Popup - NO BORDER */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-bg-secondary rounded-xl shadow-xl p-1 z-40 select-none animate-in fade-in zoom-in-95 duration-100">
                {!showStageSelector ? (
                  <>
                    {/* 1. Ubah Judul */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onRenameItem?.(item);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Pencil size={13} className="text-text-muted" />
                      <span>Ubah Judul</span>
                    </button>

                    {/* 2. Pindah Tahapan */}
                    <button
                      type="button"
                      onClick={() => setShowStageSelector(true)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRightLeft size={13} className="text-text-muted" />
                        <span>Pindah Tahapan</span>
                      </span>
                      <ChevronRight size={12} className="text-text-muted" />
                    </button>

                    <div className="h-px bg-border-default/20 my-1" />

                    {/* 3. Hapus */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteItem?.(item);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Back header for Stage Selector */}
                    <button
                      type="button"
                      onClick={() => setShowStageSelector(false)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer border-b border-border-default/20 mb-1"
                    >
                      <ChevronLeft size={12} />
                      <span>Kembali</span>
                    </button>

                    {/* List of Stages */}
                    <div className="space-y-0.5">
                      {PRODUCTION_STAGES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            onUpdateStatus?.(item, st.id);
                            setShowMenu(false);
                            setShowStageSelector(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                            item.status === st.id
                              ? 'bg-accent-primary text-accent-contrast font-medium'
                              : 'text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{st.icon}</span>
                            <span className="truncate">{st.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
