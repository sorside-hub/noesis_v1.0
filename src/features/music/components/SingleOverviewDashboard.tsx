import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  FileText, 
  Plus, 
  Check, 
  Star, 
  Trash2, 
  Copy, 
  ChevronRight, 
  ChevronDown,
  Compass, 
  Lightbulb,
  SlidersVertical,
  MoreVertical,
  Edit2,
  Focus,
  Wand2,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { StudioSongRecord, StudioProjectRecord, StudioLyricVersionRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';
import { 
  getLyricVersionsBySongId, 
  saveLyricVersion, 
  deleteLyricVersion, 
  deleteStudioSong,
  isDefaultTemplate,
} from '../lib/musicStudioStorage';
import { EditorCore, EditorCoreRef } from '../../editor/components/EditorCore';
import { Toolbar } from '../../editor/components/Toolbar';
import { SingleMetadataSidebar } from './SingleMetadataSidebar';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';
import { useNavigation, MusicSubView } from '../../../context/NavigationContext';

interface SingleOverviewDashboardProps {
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
  allSongs?: StudioSongRecord[];
  currentSubView?: MusicSubView;
  onBack: () => void;
  onOpenFullEditor: (versionId?: string) => void;
  onOpenPremise: () => void;
  onOpenScratchpad: () => void;
  onCloseSubView: () => void;
  onUpdateSong: (patch: Partial<StudioSongRecord>) => void;
}

export const SingleOverviewDashboard: React.FC<SingleOverviewDashboardProps> = ({
  song,
  projects = [],
  allSongs = [],
  currentSubView = 'overview',
  onBack,
  onOpenFullEditor,
  onOpenPremise,
  onOpenScratchpad,
  onCloseSubView,
  onUpdateSong,
}) => {
  const currentProject = projects.find((p) => p.id === song.projectId);

  // TipTap Editor instance for Premise / Scratchpad note editor
  const [activeNoteEditor, setActiveNoteEditor] = useState<Editor | null>(null);
  const subViewEditorRef = useRef<EditorCoreRef>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  // Title rename state
  const [titleText, setTitleText] = useState(song.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Versions state
  const [lyricVersions, setLyricVersions] = useState<StudioLyricVersionRecord[]>([]);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionTitleInput, setNewVersionTitleInput] = useState('');
  const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);
  const isCreatingVersionRef = useRef(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [copiedVersionId, setCopiedVersionId] = useState<string | null>(null);
  const [openVersionMenuId, setOpenVersionMenuId] = useState<string | null>(null);

  // Version Rename Modal state
  const [renamingVersion, setRenamingVersion] = useState<StudioLyricVersionRecord | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Delete Song Modal state
  const [isDeleteSongModalOpen, setIsDeleteSongModalOpen] = useState(false);

  // Metadata Sidebar state from global NavigationContext
  const {
    isMobileRightSidebarOpen: isMetadataSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar,
  } = useNavigation();

  // Touch Swipe Physics Gestures
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
    isMobileRightSidebarOpen: isMetadataSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar,
  });

  useEffect(() => {
    setTitleText(song.title || '');
  }, [song.title]);

  // Load lyric versions (Sorted ASCENDING so v1 is at the top)
  const loadVersions = async () => {
    if (!song.id) return;
    const list = await getLyricVersionsBySongId(song.id);
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // 1. Auto-clean any legacy dummy template from stored versions
    const cleaned = list.map((v) => {
      if (isDefaultTemplate(v.content)) {
        const fixed = { ...v, content: '' };
        saveLyricVersion(fixed).catch(console.warn);
        return fixed;
      }
      return v;
    });

    // 2. Auto-deduplicate any exact duplicate version names caused by rapid taps
    const seenNames = new Set<string>();
    const deduplicated: StudioLyricVersionRecord[] = [];
    const duplicatesToDelete: StudioLyricVersionRecord[] = [];

    cleaned.forEach((v) => {
      const key = v.versionName.trim().toLowerCase();
      if (seenNames.has(key)) {
        duplicatesToDelete.push(v);
      } else {
        seenNames.add(key);
        deduplicated.push(v);
      }
    });

    if (duplicatesToDelete.length > 0) {
      duplicatesToDelete.forEach((dup) => {
        deleteLyricVersion(dup.id).catch(console.warn);
      });
    }

    // 3. Ensure only ONE version can be isFocused at a time
    let hasFocused = false;
    const finalNormalized = deduplicated.map((v) => {
      if (v.isFocused) {
        if (!hasFocused) {
          hasFocused = true;
          return v;
        } else {
          const unfocused = { ...v, isFocused: false };
          saveLyricVersion(unfocused).catch(console.warn);
          return unfocused;
        }
      }
      return v;
    });

    setLyricVersions(finalNormalized);
  };

  // Sorted versions:
  // Tier 1: FINAL (Score 2) - At the very top
  // Tier 2: FOKUS (Score 1) - Right below Final (or top if no Final)
  // Tier 3: Other regular versions (Score 0) - Chronological ASCENDING (v1, v2, v3...)
  const sortedLyricVersions = useMemo(() => {
    return [...lyricVersions].sort((a, b) => {
      const aFinal = a.isFocused !== undefined ? !!a.isFinal : false;
      const bFinal = b.isFocused !== undefined ? !!b.isFinal : false;
      const aFocused = a.isFocused !== undefined ? !!a.isFocused : !!a.isFinal;
      const bFocused = b.isFocused !== undefined ? !!b.isFocused : !!b.isFinal;

      const aScore = aFinal ? 2 : aFocused ? 1 : 0;
      const bScore = bFinal ? 2 : bFocused ? 1 : 0;

      if (aScore !== bScore) {
        return bScore - aScore; // Higher score comes first
      }

      // If scores are equal, sort chronologically ASCENDING
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [lyricVersions]);

  useEffect(() => {
    loadVersions();
  }, [song.id]);

  // Clean legacy dummy template from current song if present
  useEffect(() => {
    if (song.contentLyrics && isDefaultTemplate(song.contentLyrics)) {
      onUpdateSong({ contentLyrics: '' });
    }
  }, [song.id, song.contentLyrics]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenVersionMenuId(null);
      setIsStatusDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return isoString;
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== song.title) {
      onUpdateSong({ title: titleText.trim() });
    }
  };

  // Open version in editor
  const handleOpenVersionInEditor = (v: StudioLyricVersionRecord) => {
    const cleanContent = isDefaultTemplate(v.content) ? '' : (v.content || '');
    onUpdateSong({ contentLyrics: cleanContent });
    onOpenFullEditor(v.id);
  };

  // Next version prefix calculation (e.g. v1, v2, v3)
  const nextVersionPrefix = `v${lyricVersions.length + 1}`;

  // Create new version with smart "v1", "v2" prefix + optional title (INSTANT OPTIMISTIC UI)
  const handleCreateNewVersion = () => {
    if (isCreatingVersionRef.current) return;
    isCreatingVersionRef.current = true;
    setIsSubmittingVersion(true);

    try {
      const customTitle = newVersionTitleInput.trim();
      const versionName = customTitle ? `${nextVersionPrefix} - ${customTitle}` : nextVersionPrefix;

      const isFirst = lyricVersions.length === 0;
      // If user specifically checked "Salin dari versi aktif" AND there are existing versions:
      const initialContent = copyFromPrevious && lyricVersions.length > 0
        ? (song.contentLyrics || '')
        : '';

      const newVersion: StudioLyricVersionRecord = {
        id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        songId: song.id,
        versionName,
        content: initialContent,
        isFocused: isFirst, // First version created is focused by default
        isFinal: false,
        createdAt: new Date().toISOString(),
      };

      // 1. Instant 0ms Optimistic UI update
      const updatedList = isFirst
        ? [newVersion, ...lyricVersions.map((v) => ({ ...v, isFocused: false }))]
        : [...lyricVersions, newVersion];

      setLyricVersions(updatedList);
      setIsNewVersionModalOpen(false);
      setNewVersionTitleInput('');
      setCopyFromPrevious(false);

      // 2. Non-blocking background persistence
      if (isFirst) {
        lyricVersions.forEach((v) => saveLyricVersion({ ...v, isFocused: false }).catch(console.warn));
      }
      saveLyricVersion(newVersion).catch(console.warn);

      // Open immediately in full editor for seamless songwriting
      handleOpenVersionInEditor(newVersion);
    } finally {
      setTimeout(() => {
        isCreatingVersionRef.current = false;
        setIsSubmittingVersion(false);
      }, 500);
    }
  };

  // Toggle or Set focused version (INSTANT OPTIMISTIC UI)
  const handleToggleFocusedVersion = (version: StudioLyricVersionRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isCurrentlyFocused = version.isFocused !== undefined ? !!version.isFocused : !!version.isFinal;
    const targetState = !isCurrentlyFocused;

    // 1. Instant 0ms Optimistic UI update
    const updatedList = lyricVersions.map((v) => ({
      ...v,
      isFocused: v.id === version.id ? targetState : false,
    }));
    setLyricVersions(updatedList);

    if (targetState) {
      onUpdateSong({ contentLyrics: version.content });
    }

    // 2. Persist in background without blocking UI
    const changedRecords = updatedList.filter((v) => {
      const orig = lyricVersions.find((o) => o.id === v.id);
      return (orig?.isFocused !== undefined ? orig.isFocused : orig?.isFinal) !== v.isFocused;
    });

    Promise.all(changedRecords.map((v) => saveLyricVersion(v))).catch((err) => {
      console.warn('[MusicStudio] Failed to persist focused version:', err);
    });
  };

  // Toggle or Set final version (INSTANT OPTIMISTIC UI)
  const handleToggleFinalVersion = (version: StudioLyricVersionRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isCurrentlyFinal = !!version.isFinal;
    const targetState = !isCurrentlyFinal;

    // 1. Instant 0ms Optimistic UI update
    const updatedList = lyricVersions.map((v) => ({
      ...v,
      isFinal: v.id === version.id ? targetState : false,
    }));
    setLyricVersions(updatedList);

    // 2. Persist in background without blocking UI
    const changedRecords = updatedList.filter((v) => {
      const orig = lyricVersions.find((o) => o.id === v.id);
      return !!orig?.isFinal !== v.isFinal;
    });

    Promise.all(changedRecords.map((v) => saveLyricVersion(v))).catch((err) => {
      console.warn('[MusicStudio] Failed to persist final version:', err);
    });
  };

  // Open rename modal
  const handleOpenRenameModal = (version: StudioLyricVersionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingVersion(version);
    setRenameTitleInput(version.versionName);
    setOpenVersionMenuId(null);
  };

  // Save renamed version (INSTANT OPTIMISTIC UI)
  const handleSaveRename = () => {
    if (!renamingVersion) return;
    const cleanTitle = renameTitleInput.trim() || renamingVersion.versionName;
    const updatedRecord = {
      ...renamingVersion,
      versionName: cleanTitle,
    };

    setLyricVersions((prev) => prev.map((v) => (v.id === updatedRecord.id ? updatedRecord : v)));
    setRenamingVersion(null);
    setRenameTitleInput('');

    saveLyricVersion(updatedRecord).catch((err) => {
      console.warn('[MusicStudio] Failed to persist renamed version:', err);
    });
  };

  // Delete version (INSTANT OPTIMISTIC UI)
  const handleDeleteVersion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = lyricVersions.filter((v) => v.id !== id);
    setLyricVersions(remaining);
    deleteLyricVersion(id).catch((err) => {
      console.warn('[MusicStudio] Failed to delete lyric version:', err);
    });

    // If no versions left, clear song lyrics so no ghost content remains!
    if (remaining.length === 0) {
      onUpdateSong({ contentLyrics: '' });
    } else {
      const deletedWasFocused = lyricVersions.find((v) => v.id === id)?.isFocused;
      if (deletedWasFocused) {
        // Transfer focus to the remaining first version
        const newFocus = remaining[0];
        const updated = remaining.map((v) => ({ ...v, isFocused: v.id === newFocus.id }));
        setLyricVersions(updated);
        saveLyricVersion({ ...newFocus, isFocused: true }).catch(console.warn);
        onUpdateSong({ contentLyrics: newFocus.content || '' });
      }
    }
  };

  // Delete entire single
  const handleDeleteEntireSong = async () => {
    if (!song.id) return;
    await deleteStudioSong(song.id);
    setIsDeleteSongModalOpen(false);
    onBack();
  };

  // Copy version text
  const handleCopyVersion = (v: StudioLyricVersionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = (v.content || '').replace(/<[^>]*>/g, '').trim();
    navigator.clipboard.writeText(text);
    setCopiedVersionId(v.id);
    setTimeout(() => setCopiedVersionId(null), 2000);
  };

  // Helper to extract plain text snippet
  const cleanSnippet = (htmlContent?: string) => {
    if (!htmlContent) return '';
    const plain = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain;
  };

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === song.status) || PRODUCTION_STAGES[0];

  // =========================================================================
  // VIEW MODE 1: KONSEP LAGU EDITOR
  // =========================================================================
  if (currentSubView === 'premise') {
    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex flex-col overflow-hidden relative">
        <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onCloseSubView}
              className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title={`Kembali ke Ringkasan ${song.title}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-bg-primary text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Lightbulb size={14} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-text-heading truncate">
                  {song.title}
                </h2>
                <p className="text-[10px] text-text-muted truncate">
                  Konsep
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <EditorCore
            key={`premise-${song.id}`}
            ref={subViewEditorRef}
            hideTitle={true}
            enableChords={false}
            title=""
            onTitleChange={() => {}}
            initialContent={song.premise || ''}
            onChange={(newContent) => {
              onUpdateSong({ premise: newContent });
            }}
            onSelectionChange={setHasSelection}
            onAiMenuStateChange={setIsAiMenuOpen}
            onEditorReady={(editor) => setActiveNoteEditor(editor)}
          />

          <Toolbar editor={activeNoteEditor} />

          {/* Floating AI Actions Button - Mobile & Desktop when text is selected */}
          {hasSelection && !isAiMenuOpen && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => subViewEditorRef.current?.triggerAiMenu()}
              className="fixed right-4 bottom-24 lg:bottom-12 lg:right-1/2 lg:translate-x-1/2 z-50 flex items-center gap-2.5 bg-accent-primary text-accent-contrast px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-accent-primary font-bold text-[13px] tracking-wide transition-all duration-200 ease-out animate-in fade-in slide-in-from-right-8 lg:slide-in-from-bottom-8 active:scale-95 cursor-pointer [.editor-selecting_&]:pointer-events-none"
              title="AI Actions"
              aria-label="AI Actions"
            >
              <Wand2 size={16} className="text-accent-contrast" />
              <span>AI Actions</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: REFERENSI & IDE MUSIK EDITOR
  // =========================================================================
  if (currentSubView === 'scratchpad') {
    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex flex-col overflow-hidden relative">
        <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onCloseSubView}
              className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title={`Kembali ke Ringkasan ${song.title}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-bg-primary text-cyan-400 flex items-center justify-center shrink-0 shadow-xs">
                <Compass size={14} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-text-heading truncate">
                  {song.title}
                </h2>
                <p className="text-[10px] text-text-muted truncate">
                  Referensi
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <EditorCore
            key={`scratchpad-${song.id}`}
            ref={subViewEditorRef}
            hideTitle={true}
            enableChords={true}
            title=""
            onTitleChange={() => {}}
            initialContent={song.scratchpad || ''}
            onChange={(newContent) => {
              onUpdateSong({ scratchpad: newContent });
            }}
            onSelectionChange={setHasSelection}
            onAiMenuStateChange={setIsAiMenuOpen}
            onEditorReady={(editor) => setActiveNoteEditor(editor)}
          />

          <Toolbar editor={activeNoteEditor} />

          {/* Floating AI Actions Button - Mobile & Desktop when text is selected */}
          {hasSelection && !isAiMenuOpen && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => subViewEditorRef.current?.triggerAiMenu()}
              className="fixed right-4 bottom-24 lg:bottom-12 lg:right-1/2 lg:translate-x-1/2 z-50 flex items-center gap-2.5 bg-accent-primary text-accent-contrast px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-accent-primary font-bold text-[13px] tracking-wide transition-all duration-200 ease-out animate-in fade-in slide-in-from-right-8 lg:slide-in-from-bottom-8 active:scale-95 cursor-pointer [.editor-selecting_&]:pointer-events-none"
              title="AI Actions"
              aria-label="AI Actions"
            >
              <Wand2 size={16} className="text-accent-contrast" />
              <span>AI Actions</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 3: CLEAN SINGLE OVERVIEW DASHBOARD
  // =========================================================================
  const premiseSnippet = cleanSnippet(song.premise);
  const scratchpadSnippet = cleanSnippet(song.scratchpad);

  return (
    <div 
      className="w-full h-full bg-bg-primary text-text-primary select-none flex flex-col overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* HEADER */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Kembali ke Studio Musik"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  onBlur={handleTitleSubmit}
                  className="px-2 py-0.5 text-sm sm:text-base font-bold text-text-heading bg-bg-primary rounded-lg border border-accent-primary focus:outline-hidden w-full max-w-xs"
                />
                <button
                  type="button"
                  onClick={handleTitleSubmit}
                  className="p-1 rounded-md bg-accent-primary text-accent-contrast text-xs cursor-pointer"
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 cursor-pointer max-w-full"
                title="Klik untuk ubah judul lagu"
              >
                <h1 className="text-sm sm:text-base font-bold text-text-heading tracking-tight truncate group-hover:text-accent-primary transition-colors">
                  {song.title || 'Tanpa Judul'}
                </h1>
                <Edit3 size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-muted">
              <span>{currentProject ? 'Track' : 'Single'}</span>
              {currentProject && (
                <>
                  <span>•</span>
                  <span className="text-text-muted font-medium truncate">{currentProject.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(() => {
            const isReleased = song.status === 'released' || currentProject?.status === 'released';
            if (isReleased) {
              return (
                <div 
                  title="Status Rilis Resmi"
                  className="h-8 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold select-none bg-bg-primary text-emerald-400"
                >
                  <span className="text-xs sm:text-sm">🎉</span>
                  <span className="text-xs font-bold">Released</span>
                </div>
              );
            }

            const isReady = song.status === 'ready' || currentProject?.status === 'ready';
            if (isReady) {
              return (
                <div 
                  title="Status Siap Rilis"
                  className="h-8 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold select-none bg-bg-primary text-emerald-400"
                >
                  <span className="text-xs sm:text-sm">✨</span>
                  <span className="text-xs font-bold">Ready</span>
                </div>
              );
            }

            const prog = song.progress || 0;
            const colorClass = prog === 100 ? 'text-emerald-400' : prog >= 50 ? 'text-amber-400' : 'text-text-muted';
            return currentProject ? (
              /* Track Mode Info Badge (Only Track Progress %) */
              <div 
                title={`Progres Lirik Track: ${prog}% (${prog === 100 ? 'Selesai' : 'Dalam Proses'})`}
                className={`h-8 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold select-none bg-bg-primary ${colorClass}`}
              >
                <span className="text-xs sm:text-sm">{prog === 100 ? '✓' : '⏳'}</span>
                <span className="hidden sm:inline text-xs font-bold">
                  {prog === 100 ? '100% Selesai' : `${prog}% Dalam Proses`}
                </span>
                <span className="sm:hidden text-xs font-bold font-mono">{prog}%</span>
              </div>
            ) : (
              /* Single Mode Info Badge (Stage + Progress %) */
              <div 
                title={`Tahapan Produksi: ${currentStage.label} (${prog}%) - Ubah di Metadata Sidebar`}
                className={`h-8 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold select-none bg-bg-primary ${colorClass}`}
              >
                <span className="text-xs sm:text-sm">{currentStage.icon}</span>
                <span className="hidden sm:inline text-xs font-bold">{currentStage.label} ({prog}%)</span>
                <span className="sm:hidden text-xs font-bold font-mono">{prog}%</span>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={() => isMetadataSidebarOpen ? closeMobileRightSidebar() : openMobileRightSidebar()}
            title={isMetadataSidebarOpen ? 'Tutup Metadata Single' : 'Buka Metadata Single'}
            className={`h-8 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isMetadataSidebarOpen
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            <SlidersVertical size={14} className="shrink-0" />
            <span className="hidden sm:inline">Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteSongModalOpen(true)}
            title="Hapus Single Ini"
            className="h-8 w-8 rounded-xl bg-bg-primary hover:bg-status-error-bg/30 text-text-muted hover:text-status-error transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 [scrollbar-width:thin]">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* TOP ROW: 2 PORTAL CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* PORTAL CARD 1: KONSEP */}
            <div
              onClick={onOpenPremise}
              className="group p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 text-left"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-bg-primary text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                      <Lightbulb size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                      Konsep
                    </h3>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {premiseSnippet ? (
                    <span className="text-text-secondary">{premiseSnippet}</span>
                  ) : (
                    <span className="italic text-text-muted/70">
                      Belum ada konsep. Klik untuk membuka editor...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* PORTAL CARD 2: REFERENSI */}
            <div
              onClick={onOpenScratchpad}
              className="group p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 text-left"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-bg-primary text-cyan-400 flex items-center justify-center shrink-0 shadow-xs">
                      <Compass size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                      Referensi
                    </h3>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {scratchpadSnippet ? (
                    <span className="text-text-secondary font-mono">{scratchpadSnippet}</span>
                  ) : (
                    <span className="italic text-text-muted/70">
                      Belum ada referensi. Klik untuk membuka editor...
                    </span>
                  )}
                </p>
              </div>
            </div>

          </div>

          {/* SECTION: RIWAYAT VERSI LIRIK & CHORD */}
          <div className="bg-bg-secondary rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            
            {/* Section Header */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={14} />
                </div>
                <h3 className="text-xs font-bold text-text-heading">
                  Versi Lirik & Chord
                </h3>
              </div>

              {/* Simplified + Versi Button */}
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>Versi</span>
              </button>
            </div>

            {/* Vertical List of Lyric Versions */}
            <div className="space-y-1.5">
              {lyricVersions.length === 0 ? (
                <div 
                  onClick={() => setIsNewVersionModalOpen(true)}
                  className="p-4 rounded-xl bg-bg-primary hover:bg-bg-hover border border-dashed border-border-default/60 hover:border-accent-primary/50 text-center cursor-pointer transition-all space-y-1"
                >
                  <p className="text-xs text-text-muted font-medium">
                    Belum ada versi lirik yang tersimpan.
                  </p>
                  <p className="text-[11px] text-accent-primary font-bold">
                    + Klik untuk membuat versi {nextVersionPrefix}
                  </p>
                </div>
              ) : (
                sortedLyricVersions.map((v, index) => {
                  const isFocused = v.isFocused !== undefined ? !!v.isFocused : !!v.isFinal;
                  const isFinal = v.isFocused !== undefined ? !!v.isFinal : false;
                  const isLastItem = index === sortedLyricVersions.length - 1 && sortedLyricVersions.length > 1;

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleOpenVersionInEditor(v)}
                      className="group p-3 sm:p-3.5 rounded-xl bg-bg-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center justify-between gap-3 relative"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon Box: Star only when Final, FileText otherwise */}
                        <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0 text-text-muted">
                          {isFinal ? (
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                          ) : (
                            <FileText size={14} className={isFocused ? 'text-emerald-400' : 'text-text-muted'} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                              {v.versionName}
                            </span>
                            {isFocused && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-bold shrink-0">
                                <Focus size={10} />
                                <span>FOKUS</span>
                              </span>
                            )}
                            {isFinal && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold shrink-0">
                                <Star size={10} className="fill-amber-400" />
                                <span>FINAL</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3-Dots Action Menu Button */}
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenVersionMenuId(openVersionMenuId === v.id ? null : v.id);
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                          title="Opsi Versi"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openVersionMenuId === v.id && (
                          <div 
                            className={`absolute right-0 w-48 bg-bg-secondary rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                              isLastItem ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                          >
                            {/* Option 1: Toggle Fokus Versi */}
                            <button
                              type="button"
                              onClick={(e) => {
                                handleToggleFocusedVersion(v, e);
                                setOpenVersionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Focus size={13} className={isFocused ? 'text-emerald-400' : 'text-text-muted'} />
                              <span>{isFocused ? 'Lepas Fokus' : 'Fokuskan Versi Ini'}</span>
                            </button>

                            {/* Option 2: Toggle Final Versi */}
                            <button
                              type="button"
                              onClick={(e) => {
                                handleToggleFinalVersion(v, e);
                                setOpenVersionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Star size={13} className={isFinal ? 'text-amber-400 fill-amber-400' : 'text-text-muted'} />
                              <span>{isFinal ? 'Hapus Status Final' : 'Jadikan Versi Final'}</span>
                            </button>

                            {/* Option 3: Ubah Nama Versi */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenRenameModal(v, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Edit2 size={13} className="text-text-muted" />
                              <span>Ubah Nama Versi</span>
                            </button>

                            {/* Option 4: Salin Lirik */}
                            <button
                              type="button"
                              onClick={(e) => {
                                handleCopyVersion(v, e);
                                setOpenVersionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Copy size={13} className="text-text-muted" />
                              <span>{copiedVersionId === v.id ? 'Tersalin!' : 'Salin Lirik'}</span>
                            </button>

                            <div className="my-1 h-px bg-border-default/30" />

                            {/* Option 5: Hapus Versi */}
                            <button
                              type="button"
                              onClick={(e) => {
                                handleDeleteVersion(v.id, e);
                                setOpenVersionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-status-error hover:bg-status-error-bg/30 transition-colors text-left cursor-pointer font-medium"
                            >
                              <Trash2 size={13} />
                              <span>Hapus Versi</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      </div>

      {/* METADATA SLIDE-OVER SIDEBAR */}
      <SingleMetadataSidebar
        isOpen={isMetadataSidebarOpen}
        onClose={closeMobileRightSidebar}
        song={song}
        projects={projects}
        allSongs={allSongs}
        lyricVersionsCount={lyricVersions.length}
        onUpdateSong={onUpdateSong}
        drawerRef={rightDrawerRef}
        backdropRef={rightBackdropRef}
      />

      {/* MODAL: TAMBAH VERSI BARU WITH AUTOMATIC "v1", "v2" PREFIX */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                Buat Versi Lirik Baru
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Mulai draf lirik baru dari kanvas kosong.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary block">
                Nama / Judul Versi
              </label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-accent-primary/15 text-accent-primary text-xs font-mono font-bold rounded-xl shrink-0">
                  {nextVersionPrefix}
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Judul opsional (misal: Chorus Alternatif)..."
                  value={newVersionTitleInput}
                  onChange={(e) => setNewVersionTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNewVersion();
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
                />
              </div>
              <p className="text-[10px] text-text-muted italic">
                *Bisa langsung tekan Enter untuk menyimpan dengan nama <strong className="text-text-secondary">{nextVersionPrefix}</strong>.
              </p>

              {lyricVersions.length > 0 && (
                <label className="flex items-center gap-2 pt-2 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={copyFromPrevious}
                    onChange={(e) => setCopyFromPrevious(e.target.checked)}
                    className="rounded-md border-border-default text-accent-primary focus:ring-accent-primary"
                  />
                  <span>Salin lirik dari versi saat ini</span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsNewVersionModalOpen(false);
                  setNewVersionTitleInput('');
                  setCopyFromPrevious(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingVersion}
                onClick={handleCreateNewVersion}
                className="px-4 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingVersion ? 'Menyimpan...' : 'Simpan Versi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RENAME VERSI */}
      {renamingVersion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                Ubah Nama Versi
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Masukkan nama baru untuk versi lirik ini.
              </p>
            </div>

            <div>
              <input
                type="text"
                autoFocus
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRenamingVersion(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="px-4 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Simpan Nama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS SINGLE */}
      {isDeleteSongModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-status-error flex items-center gap-1.5">
                <Trash2 size={16} />
                <span>Hapus Single Ini?</span>
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus lagu <strong className="text-text-primary">"{song.title}"</strong>? Seluruh draf, premis, dan riwayat versi lirik akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteSongModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteEntireSong}
                className="px-4 py-1.5 rounded-xl bg-status-error text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
