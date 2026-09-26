import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Star, Trash2, FolderPlus, X, ChevronDown, Check, Folder } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { FileNode, VaultData } from '../../../types/vault';
import { BookmarkGroup } from '../types/bookmarks';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode: FileNode | null;
  vault: VaultData | null;
  groups: BookmarkGroup[];
  isBookmarked: boolean;
  currentTitle?: string;
  currentGroupId?: string | null;
  onSaveBookmark: (nodeId: string, title: string, groupId: string | null) => void;
  onRemoveBookmark: (nodeId: string) => void;
  onCreateGroup?: (name: string) => string | undefined;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  targetNode,
  vault,
  groups,
  isBookmarked,
  currentTitle = '',
  currentGroupId = null,
  onSaveBookmark,
  onRemoveBookmark,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const groupMenuRef = useRef<HTMLDivElement>(null);

  // Calculate full breadcrumb path for the target node
  const nodePath = useMemo(() => {
    if (!targetNode || !vault) return '';
    const parts: string[] = [targetNode.name];
    let parentId = targetNode.parentId;
    while (parentId && vault.nodes[parentId]) {
      const parent = vault.nodes[parentId];
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts.join(' / ');
  }, [targetNode, vault]);

  // Click outside listener for group dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node)) {
        setShowGroupMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state when modal opens or targetNode changes
  useEffect(() => {
    if (isOpen && targetNode) {
      const existingBookmark = targetNode.metadata?.bookmark;
      const initialTitle = existingBookmark?.title || currentTitle || targetNode.name;
      const initialGroup = existingBookmark?.groupId ?? currentGroupId ?? null;
      setTitle(initialTitle);
      setSelectedGroupId(initialGroup);
      setIsCreatingNewGroup(false);
      setNewGroupName('');
      setShowGroupMenu(false);
    }
  }, [isOpen, targetNode, currentTitle, currentGroupId]);

  if (!isOpen || !targetNode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalGroupId = selectedGroupId;

    // If user typed a new group name
    if (isCreatingNewGroup && newGroupName.trim() && onCreateGroup) {
      const createdId = onCreateGroup(newGroupName.trim());
      if (createdId) {
        finalGroupId = createdId;
      }
    }

    const finalTitle = title.trim() || targetNode.name;
    onSaveBookmark(targetNode.id, finalTitle, finalGroupId);
    onClose();
  };

  const handleRemove = () => {
    onRemoveBookmark(targetNode.id);
    onClose();
  };

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const modalContent = (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg-primary rounded-2xl shadow-2xl overflow-hidden flex flex-col border-0 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-bg-primary border-0 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-bg-secondary flex items-center justify-center text-accent-primary shrink-0 border-0">
              <Bookmark size={18} className="fill-accent-primary text-accent-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {isBookmarked ? 'Edit Bookmark' : 'Bookmark Catatan'}
              </h3>
              <p className="text-[11px] text-text-muted truncate">
                Atur judul tampilan dan grup untuk bookmark ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer border-0 shrink-0"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-1 space-y-4">
          {/* 1. Alur / Path Info (Read-only) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <span>Alur / Lokasi File</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary text-xs text-text-secondary overflow-x-auto select-all border-0">
              <span className="text-accent-primary shrink-0 text-[11px]">📁</span>
              <span className="font-mono text-[11.5px] truncate text-text-secondary">
                {nodePath}
              </span>
            </div>
            <p className="text-[10px] text-text-muted/70">
              *Lokasi file asli bersifat tetap dan tidak berubah.
            </p>
          </div>

          {/* 2. Judul Bookmark Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="bm-title-input"
              className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between"
            >
              <span>Judul Bookmark</span>
              <span className="text-[10px] lowercase text-text-muted/70">
                (bisa beda dari nama file)
              </span>
            </label>
            <input
              id="bm-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={targetNode.name}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/50 transition-all font-medium border-0"
            />
          </div>

          {/* 3. Custom In-Flow / Expanding Group Selector */}
          <div className="space-y-1.5" ref={groupMenuRef}>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
              <span>Grup Bookmark</span>
            </label>

            {!isCreatingNewGroup ? (
              <div 
                className={twMerge(
                  "w-full bg-bg-secondary rounded-xl transition-all overflow-hidden",
                  showGroupMenu ? "ring-1 ring-accent-primary/50" : ""
                )}
              >
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-text-primary hover:bg-bg-hover/50 cursor-pointer transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder size={13} className="text-accent-primary shrink-0" />
                    <span className="font-medium truncate">
                      {currentGroupObj ? currentGroupObj.name : 'Tanpa Grup (Root)'}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={twMerge(
                      "text-text-muted shrink-0 transition-transform duration-150",
                      showGroupMenu ? "rotate-180 text-accent-primary" : ""
                    )}
                  />
                </button>

                {/* In-flow Group Options */}
                {showGroupMenu && (
                  <div className="animate-in fade-in duration-150">
                    <div className="mx-3 h-px bg-border-subtle/30 my-0.5" />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                      {/* Root option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(null);
                          setShowGroupMenu(false);
                        }}
                        className={twMerge(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                          selectedGroupId === null
                            ? "bg-bg-primary text-text-primary font-medium"
                            : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder size={12} className="text-text-muted shrink-0" />
                          <span>Tanpa Grup (Root)</span>
                        </div>
                        {selectedGroupId === null && <Check size={12} className="text-accent-primary shrink-0" />}
                      </button>

                      {/* Group items */}
                      {groups.map((grp) => {
                        const isSelected = selectedGroupId === grp.id;
                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => {
                              setSelectedGroupId(grp.id);
                              setShowGroupMenu(false);
                            }}
                            className={twMerge(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                              isSelected
                                ? "bg-bg-primary text-text-primary font-medium"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder size={12} className="text-accent-primary shrink-0" />
                              <span className="truncate">{grp.name}</span>
                            </div>
                            {isSelected && <Check size={12} className="text-accent-primary shrink-0" />}
                          </button>
                        );
                      })}

                      {/* Create New Group Option */}
                      <div className="pt-1 border-t border-border-subtle/20 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewGroup(true);
                            setSelectedGroupId(null);
                            setShowGroupMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-accent-primary hover:bg-accent-primary/10 transition-colors cursor-pointer text-left font-medium"
                        >
                          <FolderPlus size={13} className="shrink-0" />
                          <span>+ Buat Grup Baru...</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Inline New Group Input */
              <div className="space-y-2 p-3 bg-bg-secondary rounded-xl animate-in fade-in duration-150 border-0">
                <div className="flex items-center justify-between text-xs text-text-primary font-medium">
                  <span className="flex items-center gap-1.5 text-accent-primary">
                    <FolderPlus size={14} />
                    <span>Nama Grup Baru</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewGroup(false);
                      setNewGroupName('');
                    }}
                    className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Proyek Aktif, Referensi Penting..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-primary text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/50 border-0"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-0">
            {isBookmarked ? (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-status-error hover:bg-status-error-bg/30 transition-colors cursor-pointer border-0"
              >
                <Trash2 size={13} />
                <span>Hapus Bookmark</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer border-0"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-text-inverse hover:opacity-90 transition-all active:scale-98 cursor-pointer border-0"
              >
                <Star size={13} className="fill-current text-current" />
                <span>{isBookmarked ? 'Simpan Perubahan' : 'Bookmark'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
