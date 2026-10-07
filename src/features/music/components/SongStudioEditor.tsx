import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { ArrowLeft, SlidersVertical, FileText, Wand2, Lock, Unlock } from 'lucide-react';
import { SongStudioToolbar } from './SongStudioToolbar';
import { SongStudioSidebar } from './SongStudioSidebar';
import { BpmTapModal } from './BpmTapModal';
import { InsertAudioModal } from '../../editor/components/InsertAudioModal';
import { EditorCore } from '../../editor/components/EditorCore';
import { transposeEditorChords } from '../../editor/lib/transposeUtils';
import { CollapsibleReadingDock } from '../../editor/components/CollapsibleReadingDock';
import { StudioSongRecord, StudioProjectRecord } from '../types/studioDatabase';
import { getLyricVersionById } from '../lib/musicStudioStorage';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { useNavigation } from '../../../context/NavigationContext';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';

interface SongStudioEditorProps {
  song: StudioSongRecord;
  activeVersionId?: string | null;
  projects?: StudioProjectRecord[];
  onBack: () => void;
  onUpdateSong: (patch: Partial<StudioSongRecord>) => void;
}

export const SongStudioEditor: React.FC<SongStudioEditorProps> = ({
  song,
  activeVersionId,
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

  const [versionName, setVersionName] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(false);
  const { isKeyboardOpen } = useVirtualKeyboard();

  const isSidebarOpen = isDesktopSidebarOpen || isMobileRightSidebarOpen;
  const shouldShowMobileLock = !isKeyboardOpen && !isSidebarOpen;

  useEffect(() => {
    if (!activeVersionId) {
      setVersionName(null);
      return;
    }
    getLyricVersionById(activeVersionId).then((ver) => {
      if (ver) {
        setVersionName(ver.versionName);
      }
    });
  }, [activeVersionId]);

  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const editorRef = useRef<any>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  // Transpose state for CollapsibleReadingDock
  const [transposeOffset, setTransposeOffset] = useState<number>(0);

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
              <FileText size={14} />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-text-heading truncate">
              {song.title}
            </h2>
            {versionName && (
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-bg-primary text-text-muted font-mono text-[10.5px] font-medium tracking-wide shadow-2xs">
                {versionName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Lock / Reading Mode Toggle (Desktop only, hidden on mobile) */}
          <button
            type="button"
            onClick={() => setIsLocked((prev) => !prev)}
            title={isLocked ? 'Buka Kunci (Mode Edit)' : 'Kunci Catatan (Mode Membaca)'}
            className={`hidden sm:flex w-8 h-8 items-center justify-center rounded-xl transition-all cursor-pointer shrink-0 ${
              isLocked
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-medium'
                : 'bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>

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
              <ErrorBoundary>
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
                  isReadOnly={isLocked}
                />
              </ErrorBoundary>
            </div>

            {/* Mobile Floating Reading Lock Button - Fixed position at bottom right */}
            <button
              type="button"
              onClick={() => setIsLocked((prev) => !prev)}
              className={`sm:hidden fixed right-3 sm:right-4 bottom-3 sm:bottom-3.5 z-40 flex items-center justify-center w-9 h-9 rounded-full bg-bg-quaternary border border-border-default/20 shadow-md transition-all duration-150 ease-out active:scale-95 cursor-pointer ${
                shouldShowMobileLock
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-20 opacity-0 pointer-events-none'
              } ${
                isLocked
                  ? 'text-accent-primary font-semibold'
                  : 'text-text-primary hover:text-accent-primary'
              }`}
              title={isLocked ? 'Buka Kunci (Mode Edit)' : 'Kunci Catatan (Mode Membaca)'}
              aria-label={isLocked ? 'Buka Kunci (Mode Edit)' : 'Kunci Catatan (Mode Membaca)'}
            >
              {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
            </button>

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
              onAutoLock={() => setIsLocked(true)}
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
