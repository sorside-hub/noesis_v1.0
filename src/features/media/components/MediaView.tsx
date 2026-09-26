import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  AlertCircle, 
  CheckCircle2,
  ChevronDown,
  Clock,
  History,
  ArrowDownAZ,
  Check
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useMediaManager } from '../hooks/useMediaManager';
import { MediaHeader } from './MediaHeader';
import { MediaHubHome } from './MediaHubHome';
import { MediaCategoryDetail } from './MediaCategoryDetail';
import { DeleteConfirmModal, ImagePreviewModal, EmptyTrashModal } from './MediaModals';
import { DocumentPreviewModal } from '../../editor/components/DocumentPreviewModal';
import { MediaAttachment } from '../../../lib/db';
import { SortOption } from '../types';

interface MediaViewProps {
  vaultState?: any;
}

const SORT_OPTIONS: Array<{ id: SortOption; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'newest', label: 'Terbaru', icon: Clock },
  { id: 'oldest', label: 'Terlama', icon: History },
  { id: 'name', label: 'Nama (A-Z)', icon: ArrowDownAZ },
];

export const MediaView: React.FC<MediaViewProps> = ({ vaultState }) => {
  const [previewDoc, setPreviewDoc] = useState<MediaAttachment | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    isLoading,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isUploading,
    uploadError,
    setUploadError,
    isScanning,
    scanBanner,
    setScanBanner,
    playingId,
    copiedId,
    editingId,
    editTitle,
    setEditTitle,
    deletingId,
    previewMedia,
    setPreviewMedia,
    confirmDeleteMedia,
    setConfirmDeleteMedia,
    showEmptyTrashModal,
    setShowEmptyTrashModal,
    isEmptyingTrash,
    handleConfirmEmptyTrash,
    transcribingId,
    fileInputRef,
    loadData,
    handleOpenCategory,
    handleBackToMain,
    handleFileUpload,
    handleScanStorage,
    toggleAudio,
    handleCopy,
    startEdit,
    saveRename,
    handleRenameKeyDown,
    handleMoveToTrash,
    handleRestoreFromTrash,
    handleDeleteMedia,
    handleEmptyTrash,
    handleTranscribeMediaToNote,
    activeMedia,
    trashedMedia,
    getCategoryCount,
    getLinkedNotes,
    currentCategoryMeta,
    filteredMediaList,
    openModal,
    navigateToNote
  } = useMediaManager(vaultState?.vault);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg-primary p-4 sm:p-8 custom-scrollbar">
      {/* Hidden File Input for Uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* 1. Dynamic Header Section */}
        <MediaHeader
          selectedCategory={selectedCategory}
          currentCategoryMeta={currentCategoryMeta}
          getCategoryCount={getCategoryCount}
          isLoading={isLoading}
          isScanning={isScanning}
          isUploading={isUploading}
          onOpenVoiceMemo={() => openModal('voice-memo')}
          onScanStorage={handleScanStorage}
          onRefresh={loadData}
          onUploadClick={() => fileInputRef.current?.click()}
          onEmptyTrash={handleEmptyTrash}
        />

        {/* Scan Status Banner */}
        {scanBanner && (
          <div className={`p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in ${
            scanBanner.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-500'
              : 'bg-red-500/10 border border-red-500/25 text-red-500'
          }`}>
            <div className="flex items-center gap-2">
              {scanBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{scanBanner.message}</span>
            </div>
            <button onClick={() => setScanBanner(null)} className="hover:opacity-80 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between text-xs text-red-500 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="hover:opacity-80 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Search & Sort Bar (Clean Two-Element Layout) */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder={
                selectedCategory 
                  ? `Cari di ${currentCategoryMeta?.title || 'kategori ini'}...`
                  : 'Cari seluruh file media & rekaman...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-muted outline-hidden focus:ring-1 focus:ring-accent-primary/50 transition-all"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedCategory && (
            <div className="relative shrink-0" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={twMerge(
                  "flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl bg-bg-secondary hover:bg-bg-tertiary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/50 cursor-pointer transition-all",
                  showSortMenu ? "bg-bg-tertiary text-accent-primary" : ""
                )}
              >
                {(() => {
                  const currentOpt = SORT_OPTIONS.find((o) => o.id === sortBy) || SORT_OPTIONS[0];
                  const Icon = currentOpt.icon;
                  return (
                    <>
                      <Icon className="w-3.5 h-3.5 text-accent-primary" />
                      <span>{currentOpt.label}</span>
                    </>
                  );
                })()}
                <ChevronDown className={twMerge("w-3.5 h-3.5 text-text-muted transition-transform duration-150", showSortMenu ? "rotate-180" : "")} />
              </button>

              {/* Floating Custom Sort Dropdown Popover */}
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-bg-secondary rounded-xl shadow-2xl z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-medium text-text-muted">
                    Urutkan Berdasarkan
                  </div>
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setShowSortMenu(false);
                        }}
                        className={twMerge(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors",
                          isActive
                            ? "bg-bg-tertiary text-text-primary font-medium"
                            : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={twMerge("w-3.5 h-3.5", isActive ? "text-accent-primary" : "text-text-muted")} />
                          <span>{opt.label}</span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-accent-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Main Views: Hub Home vs Category Detail */}
        {selectedCategory === null && !searchQuery ? (
          <MediaHubHome
            activeMedia={activeMedia}
            getCategoryCount={getCategoryCount}
            onOpenCategory={handleOpenCategory}
          />
        ) : (
          <MediaCategoryDetail
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            filteredMediaList={filteredMediaList}
            trashedMedia={trashedMedia}
            isLoading={isLoading}
            getLinkedNotes={getLinkedNotes}
            playingId={playingId}
            copiedId={copiedId}
            editingId={editingId}
            editTitle={editTitle}
            transcribingId={transcribingId}
            onEmptyTrash={handleEmptyTrash}
            onOpenVoiceMemo={() => openModal('voice-memo')}
            onUploadClick={() => fileInputRef.current?.click()}
            onToggleAudio={toggleAudio}
            onPreviewImage={(item) => setPreviewMedia(item)}
            onPreviewDocument={(item) => setPreviewDoc(item)}
            onStartEdit={startEdit}
            onEditTitleChange={setEditTitle}
            onRenameKeyDown={handleRenameKeyDown}
            onSaveRename={saveRename}
            onCopyLink={handleCopy}
            onTranscribe={handleTranscribeMediaToNote}
            onMoveToTrash={handleMoveToTrash}
            onRestoreFromTrash={handleRestoreFromTrash}
            onConfirmPermanentDelete={(item) => setConfirmDeleteMedia(item)}
            onNavigateToNote={navigateToNote}
          />
        )}
      </div>

      {/* Confirmation Modal for Permanent Delete */}
      <DeleteConfirmModal
        media={confirmDeleteMedia}
        deletingId={deletingId}
        onClose={() => setConfirmDeleteMedia(null)}
        onConfirm={handleDeleteMedia}
      />

      {/* Confirmation Modal for Empty Trash */}
      <EmptyTrashModal
        isOpen={showEmptyTrashModal}
        itemCount={trashedMedia.length}
        isLoading={isEmptyingTrash}
        onClose={() => setShowEmptyTrashModal(false)}
        onConfirm={handleConfirmEmptyTrash}
      />

      {/* Image Fullscreen Preview Modal */}
      <ImagePreviewModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      {/* Document Fullscreen Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={previewDoc !== null}
          onClose={() => setPreviewDoc(null)}
          url={previewDoc.url}
          title={previewDoc.title || 'Dokumen'}
          filename={previewDoc.url.split('/').pop()?.split('?')[0] || previewDoc.title}
        />
      )}
    </div>
  );
};
