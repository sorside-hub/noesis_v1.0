import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FolderInput, X, Search, Home, Folder } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { FileNode } from '../../../types/vault';

interface MoveNodeModalProps {
  movingNode: FileNode | null;
  folderSearchQuery: string;
  setFolderSearchQuery: (query: string) => void;
  folderSearchInputRef: React.RefObject<HTMLInputElement | null>;
  isInputFocused?: boolean;
  setIsInputFocused: (focused: boolean) => void;
  closeActiveDialog: () => void;
  handleExecuteMove: (targetParentId: string | null) => void;
  getAvailableFolders: () => { id: string; name: string; fullPath: string }[];
}

export const MoveNodeModal: React.FC<MoveNodeModalProps> = ({
  movingNode,
  folderSearchQuery,
  setFolderSearchQuery,
  folderSearchInputRef,
  isInputFocused = false,
  setIsInputFocused,
  closeActiveDialog,
  handleExecuteMove,
  getAvailableFolders,
}) => {
  const [initialTop, setInitialTop] = useState<number | null>(null);

  useEffect(() => {
    if (movingNode) {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 640;
        const vh = window.innerHeight;
        // On mobile, lock position comfortably near top (e.g. 70px) so keyboard popping up doesn't push it or shift it up
        const targetTop = isMobile 
          ? Math.min(Math.max(Math.round(vh * 0.1), 60), 90)
          : Math.max(Math.round((vh - 400) / 2), 60);
        setInitialTop(targetTop);
      }
    } else {
      setInitialTop(null);
    }
  }, [movingNode]);

  if (!movingNode) return null;

  const availableFolders = getAvailableFolders();

  const modalContent = (
    <div
      className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs overflow-hidden"
      onClick={closeActiveDialog}
    >
      <div
        style={{ top: initialTop !== null ? `${initialTop}px` : '12vh' }}
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-bg-primary rounded-2xl shadow-2xl p-4 flex flex-col gap-3 border-0 animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-bg-secondary text-accent-primary shrink-0 border-0">
              <FolderInput size={16} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary truncate">
              Pindahkan &quot;{movingNode.name}&quot;
            </h3>
          </div>
          <button
            type="button"
            onClick={closeActiveDialog}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer border-0 shrink-0"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search
            size={14}
            className={twMerge(
              "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
              folderSearchQuery || isInputFocused ? "text-accent-primary" : "text-text-muted"
            )}
          />
          <input
            ref={folderSearchInputRef}
            type="text"
            value={folderSearchQuery}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChange={(e) => setFolderSearchQuery(e.target.value)}
            placeholder="Cari folder tujuan..."
            className="w-full pl-9 pr-8 py-2 bg-bg-secondary rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/50 transition-colors border-0"
          />
          {folderSearchQuery && (
            <button
              type="button"
              onClick={() => setFolderSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
              title="Hapus pencarian"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* List of Available Folders */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-60 custom-scrollbar">
          {/* Root Destination Option */}
          {(!folderSearchQuery.trim() || 
            'vault root'.includes(folderSearchQuery.toLowerCase().trim()) ||
            'root'.includes(folderSearchQuery.toLowerCase().trim()) ||
            'root vault'.includes(folderSearchQuery.toLowerCase().trim())) && (
            <button
              type="button"
              disabled={movingNode.parentId === null}
              onClick={() => handleExecuteMove(null)}
              className={twMerge(
                'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer border-0',
                movingNode.parentId === null
                  ? 'bg-bg-secondary/40 text-text-muted/50 cursor-not-allowed opacity-60'
                  : 'bg-bg-secondary hover:bg-bg-hover text-text-primary'
              )}
            >
              <Home size={15} className="text-accent-primary shrink-0" />
              <span className="truncate">Root Vault</span>
              {movingNode.parentId === null && (
                <span className="ml-auto text-[10px] text-text-muted shrink-0">(Lokasi saat ini)</span>
              )}
            </button>
          )}

          {availableFolders.length > 0 ? (
            availableFolders.map((folder) => {
              const isCurrentParent = movingNode.parentId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  disabled={isCurrentParent}
                  onClick={() => handleExecuteMove(folder.id)}
                  className={twMerge(
                    'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer border-0',
                    isCurrentParent
                      ? 'bg-bg-secondary/40 text-text-muted/50 cursor-not-allowed opacity-60'
                      : 'bg-bg-secondary hover:bg-bg-hover text-text-primary'
                  )}
                >
                  <Folder size={15} className="text-accent-primary shrink-0" />
                  <span className="truncate">{folder.fullPath}</span>
                  {isCurrentParent && (
                    <span className="ml-auto text-[10px] text-text-muted shrink-0">(Lokasi saat ini)</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-text-muted">
              Folder &quot;{folderSearchQuery}&quot; tidak ditemukan.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-1 border-0">
          <button
            type="button"
            onClick={closeActiveDialog}
            className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer border-0"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
