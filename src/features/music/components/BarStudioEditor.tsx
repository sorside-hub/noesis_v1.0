import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { ArrowLeft, SlidersVertical, Layers, Lock, Unlock, Sparkles, Copy, Check } from 'lucide-react';
import { EditorCore } from '../../editor/components/EditorCore';
import { SongStudioToolbar } from './SongStudioToolbar';
import { InsertAudioModal } from '../../editor/components/InsertAudioModal';
import { CollapsibleReadingDock } from '../../editor/components/CollapsibleReadingDock';
import { BarMetadataSidebar } from './BarMetadataSidebar';
import { StudioBarRecord, StudioSongRecord } from '../types/studioDatabase';
import { calculateBarCount } from '../lib/musicBarUtils';
import { transposeEditorChords } from '../../editor/lib/transposeUtils';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';
import { useNavigation } from '../../../context/NavigationContext';

interface BarStudioEditorProps {
  bar: StudioBarRecord;
  songs: StudioSongRecord[];
  allBars?: StudioBarRecord[];
  onBack: () => void;
  onUpdateBar: (patch: Partial<StudioBarRecord>, debounceMs?: number) => void;
  onDeleteBar: (id: string) => void;
}

export const BarStudioEditor: React.FC<BarStudioEditorProps> = ({
  bar,
  songs,
  allBars = [],
  onBack,
  onUpdateBar,
  onDeleteBar,
}) => {
  const {
    isMobileRightSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar,
  } = useNavigation();

  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const [copied, setCopied] = useState(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const handleInsertAudio = useCallback((audioData: { src: string; title: string }) => {
    if (!tiptapEditor || tiptapEditor.isDestroyed) return;
    const src = audioData.src || (audioData as any).url || '';
    const title = audioData.title || 'Voice Memo';
    if ((tiptapEditor.commands as any).setAudio) {
      (tiptapEditor.chain().focus() as any).setAudio({ src, title }).run();
    } else {
      tiptapEditor.chain().focus().insertContent(`<audio controls src="${src}" title="${title}"></audio>\n\n`).run();
    }
  }, [tiptapEditor]);

  const isSidebarOpen = isDesktopSidebarOpen || isMobileRightSidebarOpen;

  // Calculate bar count dynamically (ignoring empty lines, standalone chords, and section headers)
  const calculatedBarCount = useMemo(() => {
    const count = calculateBarCount(bar.content);
    return Math.max(count, 1);
  }, [bar.content]);

  // Keep bar.barCount in sync with the automatic calculation
  useEffect(() => {
    if (bar.barCount !== calculatedBarCount) {
      onUpdateBar({ barCount: calculatedBarCount });
    }
  }, [calculatedBarCount, bar.barCount, onUpdateBar]);

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

  const handleCloseSidebar = () => {
    setIsDesktopSidebarOpen(false);
    closeMobileRightSidebar();
  };

  // Drawer gestures for mobile swipe
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

  // Handle Transposition for chords written in bars
  const handleTranspose = useCallback(
    (delta: number) => {
      if (!tiptapEditor || tiptapEditor.isDestroyed) return;
      transposeEditorChords(tiptapEditor, delta);
      setTransposeOffset((prev) => prev + delta);
    },
    [tiptapEditor]
  );

  const handleResetTranspose = useCallback(() => {
    if (!tiptapEditor || tiptapEditor.isDestroyed || transposeOffset === 0) return;
    transposeEditorChords(tiptapEditor, -transposeOffset);
    setTransposeOffset(0);
  }, [tiptapEditor, transposeOffset]);

  const handleCopy = async () => {
    const text = bar.content.replace(/<[^>]*>/g, '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="w-full h-full bg-bg-primary text-text-primary select-none flex flex-col overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        HEADER BAR: Borderless, sleek, and intuitive
      */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Back button (Desktop only, hidden on mobile) */}
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:flex w-8 h-8 rounded-xl bg-bg-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all items-center justify-center shrink-0 cursor-pointer active:scale-95"
            title="Kembali ke Bank Ide"
            aria-label="Kembali"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Bar Icon badge */}
          <div className="w-7 h-7 rounded-lg bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
            <Layers size={14} />
          </div>

          {/* Title input */}
          <input
            type="text"
            value={bar.title}
            onChange={(e) => onUpdateBar({ title: e.target.value })}
            placeholder="Judul Ide Bar..."
            className="text-sm sm:text-base font-bold text-text-heading tracking-tight bg-transparent border-none outline-hidden focus:ring-0 p-0 m-0 truncate w-full"
          />
        </div>

        {/* Right Info Badges & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bar Count Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bg-primary text-text-muted text-xs font-mono font-bold">
            <span>{calculatedBarCount} Bar</span>
          </div>

          {/* Theme & Topic Badge */}
          {Boolean((bar.theme && bar.theme.trim()) || (bar.topic && bar.topic.trim())) && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-bg-primary text-accent-primary text-xs font-medium">
              <Sparkles size={11} />
              <span className="truncate max-w-[140px]">
                {bar.theme && bar.topic ? `${bar.theme} • ${bar.topic}` : bar.theme || bar.topic}
              </span>
            </div>
          )}

          {/* Usage Status Pill */}
          <div
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-bold ${
              bar.status === 'used'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {bar.status === 'used' ? <Lock size={11} /> : <Unlock size={11} />}
            <span className="hidden sm:inline">
              {bar.status === 'used' ? 'Terpakai' : 'Fresh'}
            </span>
          </div>

          {/* Quick Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-8 h-8 rounded-xl bg-bg-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Salin Bar"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Toggle Metadata Sidebar */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            className={`w-8 h-8 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
              isSidebarOpen
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'bg-bg-primary hover:bg-bg-hover text-text-muted hover:text-text-primary'
            }`}
            title="Buka Parameter Bar"
            aria-label="Parameter Bar"
          >
            <SlidersVertical size={15} />
          </button>
        </div>
      </header>

      {/* 
        MAIN EDITOR WORKSPACE
      */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-bg-primary">
          {/* TipTap Toolbar */}
          <SongStudioToolbar
            editor={tiptapEditor}
            onOpenAudioModal={() => setIsAudioModalOpen(true)}
          />

          {/* TipTap Editor Body (Identical structure to SongStudioEditor) */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <EditorCore
                noteId={bar.id}
                title={bar.title}
                onTitleChange={(newTitle) => onUpdateBar({ title: newTitle })}
                initialContent={bar.content}
                onChange={(newContent) => {
                  const count = calculateBarCount(newContent);
                  onUpdateBar({ content: newContent, barCount: Math.max(count, 1) }, 300);
                }}
                onEditorReady={(ed) => setTiptapEditor(ed)}
                enableChords={true}
                hideTitle={true}
              />
            </div>
          </div>

          {/* Floating Collapsible Reading Dock on the Right */}
          <CollapsibleReadingDock
            hasChords={true}
            semitones={transposeOffset}
            onTranspose={handleTranspose}
            onReset={handleResetTranspose}
            musicalKey="C"
            bpm={120}
          />
        </main>

        {/* 
          SLIDE-OVER METADATA SIDEBAR
        */}
        {/* Mobile Backdrop */}
        <div
          ref={rightBackdropRef}
          onClick={handleCloseSidebar}
          className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Sidebar Container (Slide-over drawer on mobile, collapsible on desktop) */}
        <aside
          ref={rightDrawerRef}
          className={`fixed lg:static top-0 right-0 h-full w-[310px] sm:w-[340px] z-50 lg:z-10 bg-bg-secondary shadow-2xl lg:shadow-none transition-transform duration-300 ease-out flex flex-col shrink-0 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'
          }`}
        >
          <BarMetadataSidebar
            bar={bar}
            songs={songs}
            allBars={allBars}
            onUpdateBar={onUpdateBar}
            onClose={handleCloseSidebar}
            onDelete={() => {
              if (window.confirm('Yakin ingin menghapus bar ini?')) {
                onDeleteBar(bar.id);
                onBack();
              }
            }}
            calculatedBarCount={calculatedBarCount}
          />
        </aside>
      </div>

      {/* Insert Audio / Voice Memo Modal */}
      <InsertAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onInsertAudio={handleInsertAudio}
      />
    </div>
  );
};
