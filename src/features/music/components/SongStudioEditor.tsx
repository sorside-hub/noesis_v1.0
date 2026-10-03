import React, { useState, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { ArrowLeft, SlidersVertical, Music2, Wand2 } from 'lucide-react';
import { SongStudioToolbar } from './SongStudioToolbar';
import { SongStudioSidebar } from './SongStudioSidebar';
import { BpmTapModal } from './BpmTapModal';
import { InsertAudioModal } from '../../editor/components/InsertAudioModal';
import { EditorCore } from '../../editor/components/EditorCore';
import { transposeEditorChords } from '../../editor/lib/transposeUtils';
import { CollapsibleReadingDock } from '../../editor/components/CollapsibleReadingDock';
import { StudioSongRecord, StudioProjectRecord } from '../types/studioDatabase';
import { useNavigation } from '../../../context/NavigationContext';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';

interface SongStudioEditorProps {
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
  onBack: () => void;
  onUpdateSong: (patch: Partial<StudioSongRecord>) => void;
}

export const SongStudioEditor: React.FC<SongStudioEditorProps> = ({
  song,
  projects = [],
  onBack,
  onUpdateSong,
}) => {
  const { 
    isMobileRightSidebarOpen, 
    openMobileRightSidebar, 
    closeMobileRightSidebar,
    activeModal,
    openModal,
    closeModal
  } = useNavigation();

  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const editorRef = useRef<any>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  // Transpose state for CollapsibleReadingDock
  const [transposeOffset, setTransposeOffset] = useState<number>(0);

  // Desktop sidebar state
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);

  // Handle Transposition
  const handleTranspose = useCallback((delta: number) => {
    if (!tiptapEditor || tiptapEditor.isDestroyed) return;
    transposeEditorChords(tiptapEditor, delta);
    setTransposeOffset((prev) => prev + delta);
  }, [tiptapEditor]);

  const handleResetTranspose = useCallback(() => {
    if (!tiptapEditor || tiptapEditor.isDestroyed || transposeOffset === 0) return;
    transposeEditorChords(tiptapEditor, -transposeOffset);
    setTransposeOffset(0);
  }, [tiptapEditor, transposeOffset]);

  const handleInsertAudio = (audioData: { src: string; title: string }) => {
    if (!tiptapEditor || tiptapEditor.isDestroyed) return;
    const src = audioData.src || (audioData as any).url || '';
    const title = audioData.title || 'Voice Note';
    if ((tiptapEditor.commands as any).setAudio) {
      (tiptapEditor.chain().focus() as any).setAudio({ src, title }).run();
    } else {
      tiptapEditor.chain().focus().insertContent(`<audio controls src="${src}" title="${title}"></audio>\n\n`).run();
    }
  };

  const isSidebarOpen = isDesktopSidebarOpen || isMobileRightSidebarOpen;
  const handleCloseSidebar = () => {
    setIsDesktopSidebarOpen(false);
    closeMobileRightSidebar();
  };

  // Toggle sidebar for both mobile & desktop
  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (isMobileRightSidebarOpen) {
        closeMobileRightSidebar();
      } else {
        openMobileRightSidebar();
      }
    } else {
      setIsDesktopSidebarOpen((prev) => !prev);
    }
  };

  // Vault-style Touch Swipe Physics Gestures (Smooth slide to open / close)
  const {
    rightDrawerRef,
    rightBackdropRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDrawerGestures({
    isMobileSidebarOpen: false,
    openMobileSidebar: () => {},
    closeMobileSidebar: () => {},
    isMobileRightSidebarOpen: isSidebarOpen,
    openMobileRightSidebar: () => openMobileRightSidebar(),
    closeMobileRightSidebar: handleCloseSidebar,
  });

  return (
    <div 
      className="w-full h-full bg-bg-primary text-text-primary select-none flex flex-col overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        ============================================================
        UNIFIED HEADER: MATCHING PREMISE & RAW BARS
        (Back button on desktop, Icon badge + Judul, Simpan button (icon on mobile), and Parameter Sidebar on Far Right)
        ============================================================
      */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Desktop Back button */}
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title={`Kembali ke Ringkasan ${song.title}`}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
              <Music2 size={14} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-text-heading truncate">
                {song.title}
              </h2>
              <p className="text-[10px] text-text-muted truncate">
                Lirik & Chord
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Parameter Musikal Sidebar (Far Right, Matching Height & Shape) */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            title={isSidebarOpen ? 'Tutup Parameter Musikal' : 'Buka Parameter Musikal (Key, BPM, Capo)'}
            className={`h-8 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold ${
              isSidebarOpen
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            <SlidersVertical size={14} className="shrink-0" />
            <span className="hidden sm:inline">Parameter</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Editor Center Canvas (Without inline title) */}
        <div className="flex-1 h-full overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <EditorCore
                key={song.id}
                noteId={song.id}
                ref={editorRef}
                hideTitle={true}
                title=""
                onTitleChange={() => {}}
                initialContent={song.contentLyrics || ''}
                onChange={(newContent) => onUpdateSong({ contentLyrics: newContent })}
                onSelectionChange={setHasSelection}
                onAiMenuStateChange={setIsAiMenuOpen}
                onEditorReady={setTiptapEditor}
                enableChords={true}
              />
            </div>

            {/* Floating AI Actions Button - Mobile & Desktop when text is selected */}
            {hasSelection && !isAiMenuOpen && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editorRef.current?.triggerAiMenu()}
                className="fixed right-4 bottom-24 lg:bottom-12 lg:right-1/2 lg:translate-x-1/2 z-50 flex items-center gap-2.5 bg-accent-primary text-accent-contrast px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-accent-primary font-bold text-[13px] tracking-wide transition-all duration-200 ease-out animate-in fade-in slide-in-from-right-8 lg:slide-in-from-bottom-8 active:scale-95 cursor-pointer [.editor-selecting_&]:pointer-events-none"
                title="AI Actions"
                aria-label="AI Actions"
              >
                <Wand2 size={16} className="text-accent-contrast" />
                <span>AI Actions</span>
              </button>
            )}

            {/* Upgraded Live Performance Dock: Auto-scroll, Key, Transpose, BPM, Capo */}
            <CollapsibleReadingDock
              semitones={transposeOffset}
              onTranspose={handleTranspose}
              onReset={handleResetTranspose}
              musicalKey={song.musicalKey || 'C'}
              onUpdateKey={(k) => onUpdateSong({ musicalKey: k })}
              bpm={song.bpm || 120}
              onOpenBpmModal={() => openModal('song-bpm-modal')}
              capo={song.capo || 0}
              onUpdateCapo={(c) => onUpdateSong({ capo: c })}
            />
          </div>

          {/* Bottom Toolbar for Rich Text, Chords, Audio, and Lyrics formatting */}
          <SongStudioToolbar
            editor={tiptapEditor}
            onOpenAudioModal={() => openModal('song-audio-modal')}
          />
        </div>

        {/* Slide-over Right Musical Parameter Sidebar (Vault Style Touch Gesture Physics & Borderless) */}
        <SongStudioSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          song={song}
          onUpdateSong={onUpdateSong}
          drawerRef={rightDrawerRef}
          backdropRef={rightBackdropRef}
        />
      </div>

      {/* Tap Tempo / BPM Modal */}
      <BpmTapModal
        isOpen={activeModal === 'song-bpm-modal'}
        onClose={closeModal}
        currentBpm={song.bpm}
        onApplyBpm={(newBpm) => onUpdateSong({ bpm: newBpm })}
      />

      {/* Insert Audio / Voice Memo Modal */}
      <InsertAudioModal
        isOpen={activeModal === 'song-audio-modal'}
        onClose={closeModal}
        onInsertAudio={handleInsertAudio}
      />
    </div>
  );
};
