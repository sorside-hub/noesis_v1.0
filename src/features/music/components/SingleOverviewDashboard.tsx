import React, { useState, useEffect } from 'react';
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
  Flame, 
  Lightbulb,
  SlidersVertical,
  Save,
  MoreVertical,
  Edit2,
  Focus,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { StudioSongRecord, StudioProjectRecord, StudioLyricVersionRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';
import { 
  getLyricVersionsBySongId, 
  saveLyricVersion, 
  deleteLyricVersion, 
  deleteStudioSong,
} from '../lib/musicStudioStorage';
import { EditorCore } from '../../editor/components/EditorCore';
import { Toolbar } from '../../editor/components/Toolbar';
import { SingleMetadataSidebar } from './SingleMetadataSidebar';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';

interface SingleOverviewDashboardProps {
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
  allSongs?: StudioSongRecord[];
  currentSubView?: 'overview' | 'editor' | 'premise' | 'scratchpad';
  onBack: () => void;
  onOpenFullEditor: () => void;
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

  // Title rename state
  const [titleText, setTitleText] = useState(song.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Versions state
  const [lyricVersions, setLyricVersions] = useState<StudioLyricVersionRecord[]>([]);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionTitleInput, setNewVersionTitleInput] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [copiedVersionId, setCopiedVersionId] = useState<string | null>(null);
  const [openVersionMenuId, setOpenVersionMenuId] = useState<string | null>(null);

  // Version Rename Modal state
  const [renamingVersion, setRenamingVersion] = useState<StudioLyricVersionRecord | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Delete Song Modal state
  const [isDeleteSongModalOpen, setIsDeleteSongModalOpen] = useState(false);

  // Metadata Sidebar state
  const [isMetadataSidebarOpen, setIsMetadataSidebarOpen] = useState(false);

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
    openMobileRightSidebar: () => setIsMetadataSidebarOpen(true),
    closeMobileRightSidebar: () => setIsMetadataSidebarOpen(false),
  });

  useEffect(() => {
    setTitleText(song.title || '');
  }, [song.title]);

  // Load lyric versions (Sorted ASCENDING so v1 is at the top)
  const loadVersions = async () => {
    if (!song.id) return;
    const list = await getLyricVersionsBySongId(song.id);
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setLyricVersions(list);
  };

  useEffect(() => {
    loadVersions();
  }, [song.id]);

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

  // Next version prefix calculation (e.g. v1, v2, v3)
  const nextVersionPrefix = `v${lyricVersions.length + 1}`;

  // Create new version with smart "v1", "v2" prefix + optional title
  const handleCreateNewVersion = async () => {
    const customTitle = newVersionTitleInput.trim();
    const versionName = customTitle ? `${nextVersionPrefix} - ${customTitle}` : nextVersionPrefix;

    const isFirst = lyricVersions.length === 0;
    const newVersion: StudioLyricVersionRecord = {
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      songId: song.id,
      versionName,
      content: song.contentLyrics || '',
      isFinal: isFirst, // First version created is focused by default
      createdAt: new Date().toISOString(),
    };

    if (isFirst) {
      for (const v of lyricVersions) {
        await saveLyricVersion({ ...v, isFinal: false });
      }
    }

    await saveLyricVersion(newVersion);
    await loadVersions();
    setIsNewVersionModalOpen(false);
    setNewVersionTitleInput('');
  };

  // Toggle or Set focused version
  const handleToggleFocusedVersion = async (version: StudioLyricVersionRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isCurrentlyFocused = !!version.isFinal;
    const targetState = !isCurrentlyFocused;

    for (const v of lyricVersions) {
      const isTarget = v.id === version.id;
      await saveLyricVersion({
        ...v,
        isFinal: isTarget ? targetState : false,
      });
    }

    if (targetState) {
      onUpdateSong({ contentLyrics: version.content });
    }
    await loadVersions();
  };

  // Open rename modal
  const handleOpenRenameModal = (version: StudioLyricVersionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingVersion(version);
    setRenameTitleInput(version.versionName);
    setOpenVersionMenuId(null);
  };

  // Save renamed version
  const handleSaveRename = async () => {
    if (!renamingVersion) return;
    const cleanTitle = renameTitleInput.trim() || renamingVersion.versionName;
    await saveLyricVersion({
      ...renamingVersion,
      versionName: cleanTitle,
    });
    await loadVersions();
    setRenamingVersion(null);
    setRenameTitleInput('');
  };

  // Delete version
  const handleDeleteVersion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLyricVersion(id);
    await loadVersions();
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

  // Open version in editor
  const handleOpenVersionInEditor = (v: StudioLyricVersionRecord) => {
    onUpdateSong({ contentLyrics: v.content });
    onOpenFullEditor();
  };

  // =========================================================================
  // VIEW MODE 1: PREMISE & KONSEP CERITA EDITOR
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
                  Premis & Konsep Cerita
                </h2>
                <p className="text-[10px] text-text-muted truncate">
                  {song.title}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseSubView}
            title="Simpan & kembali ke Ringkasan Single"
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </header>

        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <EditorCore
            key={`premise-${song.id}`}
            hideTitle={true}
            enableChords={false}
            title=""
            onTitleChange={() => {}}
            initialContent={song.premise || ''}
            onChange={(newContent) => {
              onUpdateSong({ premise: newContent });
            }}
            onEditorReady={(editor) => setActiveNoteEditor(editor)}
          />

          <Toolbar editor={activeNoteEditor} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: RAW BARS & IDE MENTAH EDITOR
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
              <div className="w-7 h-7 rounded-lg bg-bg-primary text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                <Flame size={14} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-text-heading truncate">
                  Raw Bars & Ide Mentah
                </h2>
                <p className="text-[10px] text-text-muted truncate">
                  {song.title}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseSubView}
            title="Simpan & kembali ke Ringkasan Single"
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </header>

        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <EditorCore
            key={`scratchpad-${song.id}`}
            hideTitle={true}
            enableChords={true}
            title=""
            onTitleChange={() => {}}
            initialContent={song.scratchpad || ''}
            onChange={(newContent) => {
              onUpdateSong({ scratchpad: newContent });
            }}
            onEditorReady={(editor) => setActiveNoteEditor(editor)}
          />

          <Toolbar editor={activeNoteEditor} />
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
                  <span className="text-accent-primary font-medium truncate">{currentProject.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {currentProject ? (
            /* Track mode: Boolean Toggle Button (No Box / No BG) */
            <button
              type="button"
              onClick={() => {
                const isCurrentlyDone = song.status === 'ready' || song.status === 'released';
                onUpdateSong({ status: isCurrentlyDone ? 'idea' : 'ready' });
              }}
              title={song.status === 'ready' || song.status === 'released' ? 'Status: Selesai (Klik untuk ubah)' : 'Status: Dalam Pengerjaan (Klik untuk tandai selesai)'}
              className={`h-8 flex items-center gap-1.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                song.status === 'ready' || song.status === 'released'
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span className="text-sm font-bold">{song.status === 'ready' || song.status === 'released' ? '✓' : '⏳'}</span>
              <span className="hidden sm:inline text-xs">
                {song.status === 'ready' || song.status === 'released' ? 'Selesai' : 'Dalam Proses'}
              </span>
            </button>
          ) : (
            /* Single mode: 6-Stage Dropdown (No Box / No BG) */
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                title={`Status: ${currentStage.label}`}
                className={`h-8 flex items-center gap-1.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${currentStage.color} hover:opacity-80`}
              >
                <span className="text-xs sm:text-sm">{currentStage.icon}</span>
                <span className="hidden sm:inline text-xs">{currentStage.label}</span>
                <ChevronDown size={12} className="hidden sm:inline ml-0.5 opacity-70" />
              </button>

              {isStatusDropdownOpen && (
                <>
                  {/* Backdrop click-away for mobile & desktop */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsStatusDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-bg-secondary rounded-2xl shadow-2xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    {PRODUCTION_STAGES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          onUpdateSong({ status: st.id });
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                          song.status === st.id
                            ? 'bg-bg-hover font-bold text-text-primary'
                            : 'hover:bg-bg-hover/60 text-text-secondary'
                        }`}
                      >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMetadataSidebarOpen(!isMetadataSidebarOpen)}
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
            
            {/* PORTAL CARD 1: PREMIS & KONSEP CERITA */}
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
                      Premis & Konsep Cerita
                    </h3>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {premiseSnippet ? (
                    <span className="text-text-secondary">{premiseSnippet}</span>
                  ) : (
                    <span className="italic text-text-muted/70">
                      Belum ada premis. Klik untuk membuka Note Editor cerita & tema lagu...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* PORTAL CARD 2: RAW BARS & IDE MENTAH */}
            <div
              onClick={onOpenScratchpad}
              className="group p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 text-left"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-bg-primary text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
                      <Flame size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                      Raw Bars & Ide Mentah
                    </h3>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {scratchpadSnippet ? (
                    <span className="text-text-secondary font-mono">{scratchpadSnippet}</span>
                  ) : (
                    <span className="italic text-text-muted/70">
                      Klik untuk membuka Note Editor rima kasar & bar mentah...
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
                lyricVersions.map((v, index) => {
                  const isFocused = !!v.isFinal;
                  const isLastItem = index === lyricVersions.length - 1 && lyricVersions.length > 1;

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleOpenVersionInEditor(v)}
                      className="group p-3 sm:p-3.5 rounded-xl bg-bg-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center justify-between gap-3 relative"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon Box (FileText or Star) */}
                        <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0 text-text-muted">
                          {isFocused ? (
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                          ) : (
                            <FileText size={14} className="text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                              {v.versionName}
                            </span>
                            {isFocused && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-bold shrink-0">
                                <Focus size={10} />
                                <span>FOKUS</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Dibuat: {formatDate(v.createdAt)}
                          </p>
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

                            {/* Option 2: Ubah Nama Versi */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenRenameModal(v, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Edit2 size={13} className="text-text-muted" />
                              <span>Ubah Nama Versi</span>
                            </button>

                            {/* Option 3: Salin Lirik */}
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

                            {/* Option 4: Hapus Versi */}
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
        onClose={() => setIsMetadataSidebarOpen(false)}
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
                Kondisi lirik saat ini akan disimpan sebagai versi baru.
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewVersion()}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
                />
              </div>
              <p className="text-[10px] text-text-muted italic">
                *Bisa langsung tekan Enter untuk menyimpan dengan nama <strong className="text-text-secondary">{nextVersionPrefix}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsNewVersionModalOpen(false);
                  setNewVersionTitleInput('');
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateNewVersion}
                className="px-4 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Simpan Versi
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
