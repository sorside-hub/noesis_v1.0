import React, { useState, useRef, useEffect } from 'react';
import { Music2, Disc3, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { MusicReleaseItem, MusicProductionStatus, PRODUCTION_STAGES } from '../types';

interface MusicSongCardProps {
  item: MusicReleaseItem;
  onSelectItem: (item: MusicReleaseItem) => void;
  onRenameItem?: (item: MusicReleaseItem) => void;
  onUpdateStatus?: (item: MusicReleaseItem, status: MusicProductionStatus) => void;
  onDeleteItem?: (item: MusicReleaseItem) => void;
}

export const MusicSongCard: React.FC<MusicSongCardProps> = ({
  item,
  onSelectItem,
  onRenameItem,
  onUpdateStatus,
  onDeleteItem,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === item.status) || PRODUCTION_STAGES[0];
  const isSingle = item.type === 'single';

  // Close menus on outside click
  useEffect(() => {
    if (!showStatusMenu && !showActionMenu) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showStatusMenu, showActionMenu]);

  const prog = item.progress || 0;
  const progressColorClass = prog === 100 ? 'text-emerald-400' : prog >= 50 ? 'text-amber-400' : 'text-text-muted';
  const typeText = item.type === 'ep' ? 'EP' : item.type === 'album' ? 'Album' : 'Single';

  return (
    <div
      onClick={() => onSelectItem(item)}
      className="group relative px-3.5 py-2.5 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer select-none flex items-center justify-between gap-3"
    >
      {/* LEFT CONTENT: BARIS 1 (JUDUL) + BARIS 2 (SUB-INFO) */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-text-heading group-hover:text-accent-primary transition-colors truncate">
          {item.title || 'Tanpa Judul'}
        </h4>

        {/* BARIS 2: INFO TYPE (teks kecil tanpa box) • % (3 tingkat warna) • CATATAN */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted min-w-0 w-full truncate font-medium">
          <span className="shrink-0">{typeText}</span>
          <span className="shrink-0 opacity-40">•</span>
          <span className={`font-mono font-bold shrink-0 ${progressColorClass}`}>
            {prog}%
          </span>
          {item.progressNote && item.progressNote.trim() && (
            <>
              <span className="shrink-0 opacity-40">•</span>
              <span className="truncate italic text-text-muted/80">
                {item.progressNote}
              </span>
            </>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT: STATUS BADGE & TITIK 3 MENU (VERTICALLY CENTERED) */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Status Badge & Dropdown - NO BORDER */}
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowActionMenu(false);
            }}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${currentStage.bgLight} ${currentStage.color}`}
          >
            <span>{currentStage.icon}</span>
            <span className="hidden sm:inline">{currentStage.label}</span>
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-bg-secondary rounded-xl shadow-xl p-1 z-40 select-none animate-in fade-in zoom-in-95 duration-100">
              {PRODUCTION_STAGES.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    if (onUpdateStatus) onUpdateStatus(item, stage.id);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    item.status === stage.id
                      ? 'bg-accent-primary text-accent-contrast font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{stage.icon}</span>
                    <span>{stage.label}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Menu (Titik 3) */}
        <div className="relative" ref={actionMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowActionMenu(!showActionMenu);
              setShowStatusMenu(false);
            }}
            className="w-6 h-6 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-primary flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Aksi"
            aria-label="Aksi"
          >
            <MoreVertical size={13} />
          </button>

          {showActionMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-bg-secondary rounded-xl shadow-xl p-1 z-40 select-none animate-in fade-in zoom-in-95 duration-100">
              {/* 1. Ubah Judul */}
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  onRenameItem?.(item);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer text-left"
              >
                <Pencil size={13} className="text-text-muted" />
                <span>Ubah Judul</span>
              </button>

              <div className="h-px bg-border-default/20 my-1" />

              {/* 2. Hapus */}
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  onDeleteItem?.(item);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
