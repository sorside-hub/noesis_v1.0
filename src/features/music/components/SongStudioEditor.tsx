import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { ArrowLeft, SlidersVertical, FileText, Wand2, Lock, Unlock, Sparkles } from 'lucide-react';
import { SongStudioToolbar } from './SongStudioToolbar';
import { SongStudioSidebar } from './SongStudioSidebar';
import { LyricBrainstormCompanion, SavedLyricSelection } from './LyricBrainstormCompanion';
import { BpmTapModal } from './BpmTapModal';
import { InsertAudioModal } from '../../editor/components/InsertAudioModal';
import { InsertBarModal } from './InsertBarModal';
import { EditorCore } from '../../editor/components/EditorCore';
import { transposeEditorChords } from '../../editor/lib/transposeUtils';
import { CollapsibleReadingDock } from '../../editor/components/CollapsibleReadingDock';
import { StudioSongRecord, StudioProjectRecord, StudioBarRecord } from '../types/studioDatabase';
import { getLyricVersionById } from '../lib/musicStudioStorage';
import { useStudioBars } from '../hooks/useStudioBars';
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
  const [isBrainstormOpen, setIsBrainstormOpen] = useState<boolean>(false);
  const [initialBrainstormSelection, setInitialBrainstormSelection] = useState<SavedLyricSelection | null>(null);
  const { isKeyboardOpen } = useVirtualKeyboard();
  const [isInsertBarModalOpen, setIsInsertBarModalOpen] = useState<boolean>(false);

  // Hook for bars and relations
  const { bars, updateBar } = useStudioBars();
  const usedBars = bars.filter((b) => b.usedInSongId === song.id);

  const isSidebarOpen = isDesktopSidebarOpen || isMobileRightSidebarOpen;
  const shouldShowMobileLock = !isKeyboardOpen && !isSidebarOpen;

  // Listen for audio and insert-bar modal triggers from slash command
  useEffect(() => {
    const handleOpenModal = (e: CustomEvent) => {
      if (e.detail === 'audio') {
        openModal('song-audio-modal');
      } else if (e.detail === 'insert-bar') {
        setIsInsertBarModalOpen(true);
      }
    };
    window.addEventListener('noesis:open-modal' as any, handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('noesis:open-modal' as any, handleOpenModal as EventListener);
    };
  }, [openModal]);

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

  // Insert bar text into editor & mark status used in Supabase
  const handleInsertBar = useCallback(
    (barToInsert: StudioBarRecord) => {
      if (!tiptapEditor || tiptapEditor.isDestroyed) return;

      const rawContent = barToInsert.content || '';
      // Ensure clean insertion at cursor
      if (rawContent) {
        tiptapEditor.chain().focus().insertContent(`\n${rawContent}\n`).run();
      }

      // Automatically update status to 'used' and associate with current song
      updateBar(barToInsert.id, {
        status: 'used',
        usedInSongId: song.id,
      });

      setIsInsertBarModalOpen(false);
    },
    [tiptapEditor, updateBar, song.id]
  );

  // Unlink bar from song & restore status to 'available' (Fresh) in Supabase
  const handleUnlinkBar = useCallback(
    (barId: string) => {
      updateBar(barId, {
        status: 'available',
        usedInSongId: null,
      });
    },
    [updateBar]
  );

  const handleCloseSidebar = () => {
    setIsDesktopSidebarOpen(false);
    closeMobileRightSidebar();
  };

  // Open brainstorm and capture active selection while clearing DOM selection to prevent native mobile popups
  const handleOpenBrainstorm = useCallback(() => {
    let captured: SavedLyricSelection | null = null;
    if (tiptapEditor && !tiptapEditor.isDestroyed) {
      const { from, to, empty } = tiptapEditor.state.selection;
      if (!empty && from !== to) {
        const text = tiptapEditor.state.doc.textBetween(from, to, ' ').trim();
        if (text) {
          captured = { from, to, text };
          setInitialBrainstormSelection(captured);
        }
        // Collapse selection and blur editor DOM so phone / browser native popups disappear
        tiptapEditor.commands.setTextSelection(to);
        tiptapEditor.view.dom.blur();
        if (typeof window !== 'undefined' && window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
      }
    }
    setIsBrainstormOpen(true);
    if (isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1280) {
      handleCloseSidebar();
    }
  }, [tiptapEditor, isSidebarOpen]);

  const handleToggleBrainstorm = useCallback(() => {
    if (isBrainstormOpen) {
      setIsBrainstormOpen(false);
      setInitialBrainstormSelection(null);
    } else {
      handleOpenBrainstorm();
    }
  }, [isBrainstormOpen, handleOpenBrainstorm]);

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

          {/* Toggle AI Lyric Brainstorm Companion */}
          <button
            type="button"
            onClick={handleToggleBrainstorm}
            title={isBrainstormOpen ? 'Tutup Brainstorm Lirik AI' : 'Buka Brainstorm Lirik AI (Metafor, Rima & Diksi)'}
            className={`h-8 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold ${
              isBrainstormOpen
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles size={14} className="shrink-0" />
            <span className="hidden sm:inline">Brainstorm</span>
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

            {/* Floating Selection Actions - AI Actions & Lyric Brainstorm */}
            {hasSelection && !isAiMenuOpen && (
              <div className="fixed right-4 bottom-24 lg:bottom-12 lg:right-1/2 lg:translate-x-1/2 z-50 flex items-center gap-2 [.editor-selecting_&]:pointer-events-none animate-in fade-in slide-in-from-right-8 lg:slide-in-from-bottom-8">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editorRef.current?.triggerAiMenu()}
                  className="flex items-center gap-2 bg-bg-secondary/95 text-text-primary px-3.5 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-border-default/40 font-bold text-[12.5px] tracking-wide transition-all duration-200 ease-out active:scale-95 cursor-pointer backdrop-blur-md hover:bg-bg-hover"
                  title="AI Actions (Vault)"
                  aria-label="AI Actions"
                >
                  <Wand2 size={15} className="text-accent-primary" />
                  <span>AI Actions</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleOpenBrainstorm}
                  className="flex items-center gap-2 bg-accent-primary text-accent-contrast px-3.5 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-accent-primary font-bold text-[12.5px] tracking-wide transition-all duration-200 ease-out active:scale-95 cursor-pointer"
                  title="Brainstorm Lirik AI (Metafor, Rima, Diksi)"
                  aria-label="Brainstorm Lirik"
                >
                  <Sparkles size={15} className="text-accent-contrast" />
                  <span>Brainstorm</span>
                </button>
              </div>
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

          {/* Bottom Toolbar for Rich Text, Chords, Audio, and Lyrics formatting (Hidden in reading/locked mode) */}
          {!isLocked && (
            <SongStudioToolbar
              editor={tiptapEditor}
              onOpenAudioModal={() => openModal('song-audio-modal')}
              onOpenInsertBarModal={() => setIsInsertBarModalOpen(true)}
              onToggleBrainstorm={handleToggleBrainstorm}
              isBrainstormOpen={isBrainstormOpen}
            />
          )}
        </div>

        {/* Desktop AI Lyric Brainstorm Companion Sidebar (Side-by-side with Editor) */}
        {isBrainstormOpen && (
          <div className="hidden lg:flex w-80 xl:w-96 shrink-0 h-full overflow-hidden border-l border-border-default/30 z-20">
            <LyricBrainstormCompanion
              song={song}
              activeVersionId={activeVersionId}
              editor={tiptapEditor}
              isOpen={isBrainstormOpen}
              onClose={() => {
                setIsBrainstormOpen(false);
                setInitialBrainstormSelection(null);
              }}
              initialSelection={initialBrainstormSelection}
              className="w-full h-full border-l-0"
            />
          </div>
        )}

        {/* Slide-over Right Musical Parameter Sidebar (Vault Style Touch Gesture Physics & Borderless) */}
        <SongStudioSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          song={song}
          onUpdateSong={onUpdateSong}
          drawerRef={rightDrawerRef}
          backdropRef={rightBackdropRef}
          usedBars={usedBars}
          onUnlinkBar={handleUnlinkBar}
          onOpenInsertBarModal={() => setIsInsertBarModalOpen(true)}
        />
      </div>

      {/* Mobile Slide-over Drawer for Brainstorm Companion */}
      {isBrainstormOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => {
              setIsBrainstormOpen(false);
              setInitialBrainstormSelection(null);
            }} 
          />
          <div className="relative ml-auto w-full max-w-sm sm:max-w-md h-full bg-bg-secondary shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200">
            <LyricBrainstormCompanion
              song={song}
              activeVersionId={activeVersionId}
              editor={tiptapEditor}
              isOpen={isBrainstormOpen}
              onClose={() => {
                setIsBrainstormOpen(false);
                setInitialBrainstormSelection(null);
              }}
              initialSelection={initialBrainstormSelection}
              className="w-full h-full border-l-0"
            />
          </div>
        </div>
      )}

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

      {/* Insert Bar Modal */}
      <InsertBarModal
        isOpen={isInsertBarModalOpen}
        onClose={() => setIsInsertBarModalOpen(false)}
        bars={bars}
        onSelectBar={handleInsertBar}
      />
    </div>
  );
};
