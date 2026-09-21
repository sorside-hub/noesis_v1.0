import React from 'react';
import { FileNode } from '../../../types/vault';

interface DeleteNodeModalProps {
  nodeToDelete: FileNode | null;
  closeActiveDialog: () => void;
  confirmDelete: () => void;
}

export const DeleteNodeModal: React.FC<DeleteNodeModalProps> = ({
  nodeToDelete,
  closeActiveDialog,
  confirmDelete,
}) => {
  if (!nodeToDelete) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={closeActiveDialog}
    >
      <div
        className="w-full max-w-sm bg-bg-quaternary border border-border-default rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-text-primary">
          Hapus {nodeToDelete.type === 'folder' ? 'Folder' : 'Catatan'}?
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Apakah Anda yakin ingin menghapus <span className="font-semibold text-text-primary">&quot;{nodeToDelete.name}&quot;</span>?
          {nodeToDelete.type === 'folder' && ' Semua isi di dalam folder ini juga akan terhapus.'}
          <br />
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-2.5 mt-2">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
            onClick={closeActiveDialog}
          >
            Batal
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-medium bg-status-error text-white hover:opacity-90 rounded-lg transition-colors cursor-pointer"
            onClick={confirmDelete}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};
