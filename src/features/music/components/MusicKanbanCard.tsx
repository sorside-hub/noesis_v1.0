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
  onMoveItem?: (item: MusicReleaseItem) => void;
  onUpdateStatus?: (item: MusicReleaseItem, status: MusicProductionStatus) => void;
  onDeleteItem?: (item: MusicReleaseItem) => void;
  isDraggingOverlay?: boolean;
}

export const MusicKanbanCard: React.FC<MusicKanbanCardProps> = ({
  item,
  onSelectItem,
  onRenameItem,
  onMoveItem,
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

  const prog = item.progress || 0;
  const progressColorClass = prog === 100 ? 'text-emerald-400' : prog >= 50 ? 'text-amber-400' : 'text-text-muted';
  const typeText = item.type === 'ep' ? 'EP' : item.type === 'album' ? 'Album' : 'Single';

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
      className={`group relative flex items-center justify-between gap-3 p-3 rounded-2xl bg-bg-primary transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDraggingOverlay
          ? 'shadow-2xl ring-2 ring-accent-primary/50 rotate-1 scale-102 bg-bg-primary/95 backdrop-blur-md z-50 touch-none'
          : isDragging
          ? 'ring-2 ring-accent-primary/40 shadow-xl touch-none'
          : 'shadow-2xs hover:shadow-md hover:bg-bg-hover'
      }`}
    >
      {/* COVER THUMBNAIL IF PRESENT */}
      {item.coverUrl ? (
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-bg-secondary shrink-0 border border-border-default/20 shadow-2xs">
          <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : null}

      {/* LEFT CONTENT: BARIS 1 (JUDUL) + BARIS 2 (INFO TYPE • TEMA • %) + BARIS 3 (CATATAN PROGRES) */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        {/* BARIS 1: JUDUL */}
        <h4 className="text-xs font-bold text-text-heading truncate group-hover:text-accent-primary transition-colors leading-tight">
          {item.title || 'Tanpa Judul'}
        </h4>

        {/* BARIS 2: METADATA & PROGRES (Type • Tema • %) */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted min-w-0 w-full truncate font-medium">
          <span className="shrink-0">{typeText}</span>

          {item.theme && item.theme.trim() ? (
            <>
              <span className="shrink-0 opacity-40">•</span>
              <span className="truncate text-text-secondary font-medium">
                {item.theme.trim()}
              </span>
            </>
          ) : null}

          {item.status !== 'ready' && item.status !== 'released' && (
            <>
              <span className="shrink-0 opacity-40">•</span>
              <span className={`font-mono font-bold shrink-0 ${progressColorClass}`}>
                {prog}%
              </span>
            </>
          )}

          {item.trackCount ? (
            <>
              <span className="shrink-0 opacity-40">•</span>
              <span className="shrink-0">{item.trackCount} Lagu</span>
            </>
          ) : null}
        </div>

        {/* BARIS 3: CATATAN PROGRES (Jika Ada) */}
        {item.progressNote && item.progressNote.trim() ? (
          <div className="text-[10.5px] italic text-text-muted/80 truncate pt-0.5 flex items-center gap-1 min-w-0">
            <span className="shrink-0 text-[10px] opacity-70">💬</span>
            <span className="truncate">{item.progressNote.trim()}</span>
          </div>
        ) : null}
      </div>

      {/* RIGHT CONTENT: TITIK 3 MENU (VERTICALLY CENTERED) */}
      {!isDraggingOverlay && (
        <div className="relative shrink-0 flex items-center justify-center" ref={menuRef} onClick={(e) => e.stopPropagation()}>
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
            <MoreVertical size={14} />
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

                  {/* 2. Pindahkan ke Album (Khusus Single) */}
                  {isSingle && onMoveItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onMoveItem(item);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Disc3 size={13} className="text-sky-400" />
                      <span>Pindahkan ke Album</span>
                    </button>
                  )}

                  {/* 3. Pindah Tahapan */}
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
  );
};
