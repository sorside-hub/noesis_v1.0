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
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { StudioSongRecord, StudioProjectRecord, StudioLyricVersionRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';
import { 
  getLyricVersionsBySongId, 
  saveLyricVersion, 
  deleteLyricVersion, 
} from '../lib/musicStudioStorage';
import { EditorCore } from '../../editor/components/EditorCore';
import { Toolbar } from '../../editor/components/Toolbar';
import { SingleMetadataSidebar } from './SingleMetadataSidebar';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';

interface SingleOverviewDashboardProps {
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
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
  currentSubView = 'overview',
  onBack,
  onOpenFullEditor,
  onOpenPremise,
  onOpenScratchpad,
  onCloseSubView,
  onUpdateSong,
}) => {
  const currentProject = projects.find((p) => p.id === song.projectId);

  // TipTap Editor instance for Premise / Scratchpad note editor (No Sidebar)
  const [activeNoteEditor, setActiveNoteEditor] = useState<Editor | null>(null);

  // Title rename state
  const [titleText, setTitleText] = useState(song.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Versions state
  const [lyricVersions, setLyricVersions] = useState<StudioLyricVersionRecord[]>([]);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionNameInput, setNewVersionNameInput] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [copiedVersionId, setCopiedVersionId] = useState<string | null>(null);

  // Metadata Sidebar state (Slide-over Vault style)
  const [isMetadataSidebarOpen, setIsMetadataSidebarOpen] = useState(false);

  // Vault-style Touch Swipe Physics Gestures (Smooth open & close via slide)
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

  // Load lyric versions
  const loadVersions = async () => {
    if (!song.id) return;
    const list = await getLyricVersionsBySongId(song.id);
    setLyricVersions(list);
  };

  useEffect(() => {
    loadVersions();
  }, [song.id]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== song.title) {
      onUpdateSong({ title: titleText.trim() });
    }
  };

  // Create new version
  const handleCreateNewVersion = async () => {
    const versionName = newVersionNameInput.trim() || `Versi ${lyricVersions.length + 1}`;
    const newVersion: StudioLyricVersionRecord = {
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      songId: song.id,
      versionName,
      content: song.contentLyrics,
      isFinal: false,
      createdAt: new Date().toISOString(),
    };

    await saveLyricVersion(newVersion);
    await loadVersions();
    setIsNewVersionModalOpen(false);
    setNewVersionNameInput('');
  };

  // Toggle version as FINAL / MASTER
  const handleToggleFinalVersion = async (version: StudioLyricVersionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFinalState = !version.isFinal;

    for (const v of lyricVersions) {
      const isTarget = v.id === version.id;
      await saveLyricVersion({
        ...v,
        isFinal: isTarget ? newFinalState : false,
      });
    }

    await loadVersions();
  };

  // Delete version
  const handleDeleteVersion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLyricVersion(id);
    await loadVersions();
  };

  // Copy version text
  const handleCopyVersion = (v: StudioLyricVersionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = v.content.replace(/<[^>]*>/g, '').trim();
    navigator.clipboard.writeText(text);
    setCopiedVersionId(v.id);
    setTimeout(() => setCopiedVersionId(null), 2000);
  };

  // Select version to edit in full editor
  const handleOpenVersionInEditor = (version: StudioLyricVersionRecord) => {
    onUpdateSong({ contentLyrics: version.content });
    onOpenFullEditor();
  };

  // Clean snippet generator for HTML content
  const cleanSnippet = (content?: string) => {
    if (!content) return '';
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === song.status) || PRODUCTION_STAGES[0];

  // =========================================================================
  // VIEW MODE 1: FULL NOTE EDITOR FOR PREMISE (NO SIDEBAR)
  // =========================================================================
  if (currentSubView === 'premise') {
    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <header className="px-3 sm:px-6 py-2.5 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Desktop Back button */}
            <button
              type="button"
              onClick={onCloseSubView}
              className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title={`Kembali ke Ringkasan ${song.title}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
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

        {/* Note Editor Canvas with Rich Text, Slash Commands, and AI Actions */}
        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <EditorCore
            key={`premise-${song.id}`}
            hideTitle={true}
            title=""
            onTitleChange={() => {}}
            initialContent={song.premise || ''}
            onChange={(newContent) => {
              onUpdateSong({ premise: newContent });
            }}
            onEditorReady={(editor) => setActiveNoteEditor(editor)}
          />

          {/* Standard Floating/Docked Note Toolbar */}
          <Toolbar editor={activeNoteEditor} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: FULL NOTE EDITOR FOR RAW BARS (NO SIDEBAR)
  // =========================================================================
  if (currentSubView === 'scratchpad') {
    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <header className="px-3 sm:px-6 py-2.5 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Desktop Back button */}
            <button
              type="button"
              onClick={onCloseSubView}
              className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title={`Kembali ke Ringkasan ${song.title}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
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

        {/* Note Editor Canvas with Rich Text, Slash Commands, Chords, and AI Actions */}
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

          {/* Standard Floating/Docked Note Toolbar */}
          <Toolbar editor={activeNoteEditor} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 3: CLEAN SINGLE OVERVIEW DASHBOARD (WITH METADATA SIDEBAR)
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
      {/* 
        ============================================================
        CLEAN MINIMAL HEADER: 
        Judul Single + Status Dropdown Button + Metadata Sidebar Button (Harmonized Styling)
        ============================================================
      */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Back Button (Desktop only, mobile uses dock/native navigation) */}
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Kembali ke Studio Musik"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Judul Single & Inline Rename */}
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
                  className="px-2 py-0.5 text-xs sm:text-base font-bold text-text-heading bg-bg-primary rounded-lg border border-accent-primary focus:outline-hidden w-full max-w-xs"
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
                <h1 className="text-xs sm:text-base font-bold text-text-heading tracking-tight truncate group-hover:text-accent-primary transition-colors">
                  {song.title || 'Tanpa Judul'}
                </h1>
                <Edit3 size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium text-text-muted truncate">
                Single Release
              </span>
              {currentProject && (
                <span className="text-[10px] text-accent-primary font-medium truncate">
                  • {currentProject.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Harmonized Status Dropdown & Metadata Sidebar Trigger (Far Right) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Status Badge Dropdown: Icon-only on mobile, Icon+Text on desktop */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              title={`Status: ${currentStage.label}`}
              className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${currentStage.bgLight} ${currentStage.color}`}
            >
              <span className="text-xs sm:text-sm">{currentStage.icon}</span>
              {/* Text label shown ONLY on desktop/tablet, hidden on mobile */}
              <span className="hidden sm:inline text-xs">{currentStage.label}</span>
              <ChevronDown size={12} className="hidden sm:inline ml-0.5 opacity-70" />
            </button>

            {isStatusDropdownOpen && (
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
            )}
          </div>

          {/* Metadata Sidebar Toggle Button (Far Right, Matching Height & Shape) */}
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

        </div>
      </header>

      {/* 
        ============================================================
        DASHBOARD BODY: 2 PORTAL BUTTONS + CLEAN VERTICAL VERSIONS
        ============================================================
      */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 [scrollbar-width:thin]">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* TOP ROW: 2 PORTAL CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* PORTAL CARD 1: PREMIS & KONSEP CERITA */}
            <div
              onClick={onOpenPremise}
              className="group p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 text-left"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
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

              <div className="text-[10px] font-semibold text-accent-primary flex items-center gap-1">
                <span>Buka Note Konsep</span>
                <ChevronRight size={10} />
              </div>
            </div>

            {/* PORTAL CARD 2: RAW BARS & IDE MENTAH */}
            <div
              onClick={onOpenScratchpad}
              className="group p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 text-left"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
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

              <div className="text-[10px] font-semibold text-accent-primary flex items-center gap-1">
                <span>Buka Raw Bars Pad</span>
                <ChevronRight size={10} />
              </div>
            </div>

          </div>

          {/* SECTION: RIWAYAT VERSI LIRIK & CHORD */}
          <div className="bg-bg-secondary rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            
            {/* Section Header */}
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
                  <FileText size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-heading">
                    Versi Lirik & Chord
                  </h3>
                  <p className="text-[10px] text-text-muted">
                    Pilih versi untuk langsung membuka editor lirik
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>+ Versi Baru</span>
              </button>
            </div>

            {/* Vertical List of Lyric Versions */}
            <div className="space-y-1.5">
              
              {/* ITEM 1: DRAFT UTAMA (LIVE ACTIVE WRITING) */}
              <div
                onClick={onOpenFullEditor}
                className="group p-3 sm:p-3.5 rounded-xl bg-bg-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors truncate">
                        Draft Utama (Live Writing)
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-bold shrink-0">
                        AKTIF
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 truncate">
                      Lirik & chord aktif saat ini • Klik untuk buka editor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all shrink-0">
                  <span className="text-xs font-semibold hidden sm:inline">Buka Editor</span>
                  <ChevronRight size={15} />
                </div>
              </div>

              {/* ITEMS 2..N: SAVED VERSIONS */}
              {lyricVersions.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleOpenVersionInEditor(v)}
                  className="group p-3 sm:p-3.5 rounded-xl bg-bg-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                      {v.isFinal ? (
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                      ) : (
                        <FileText size={14} className="text-text-muted" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                          {v.versionName}
                        </span>
                        {v.isFinal && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold shrink-0">
                            <Star size={9} className="fill-amber-400" />
                            <span>FINAL MASTER</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Dibuat: {new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions on Version Row */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle Final Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFinalVersion(v, e)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        v.isFinal 
                          ? 'text-amber-400 bg-amber-400/15' 
                          : 'text-text-muted hover:text-amber-400 hover:bg-bg-secondary'
                      }`}
                      title={v.isFinal ? 'Batalkan status Final' : 'Jadikan Versi Final'}
                    >
                      <Star size={13} className={v.isFinal ? 'fill-amber-400' : ''} />
                    </button>

                    {/* Copy Text Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyVersion(v, e)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                      title="Salin lirik versi ini"
                    >
                      {copiedVersionId === v.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>

                    {/* Delete Version Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVersion(v.id, e)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Hapus versi ini"
                    >
                      <Trash2 size={13} />
                    </button>

                    <ChevronRight size={15} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all ml-1" />
                  </div>
                </div>
              ))}

            </div>

          </div>

        </div>
      </div>

      {/* METADATA SLIDE-OVER SIDEBAR (VAULT STYLE PHYSICS & BORDERLESS) */}
      <SingleMetadataSidebar
        isOpen={isMetadataSidebarOpen}
        onClose={() => setIsMetadataSidebarOpen(false)}
        song={song}
        projects={projects}
        lyricVersionsCount={lyricVersions.length}
        onUpdateSong={onUpdateSong}
        drawerRef={rightDrawerRef}
        backdropRef={rightBackdropRef}
      />

      {/* MODAL: TAMBAH VERSI BARU */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                Simpan Versi Lirik Baru
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Kondisi lirik saat ini akan diduplikasi menjadi versi baru.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                Nama Versi
              </label>
              <input
                type="text"
                autoFocus
                placeholder={`Contoh: Versi ${lyricVersions.length + 1} (Revisi Chorus)`}
                value={newVersionNameInput}
                onChange={(e) => setNewVersionNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewVersion()}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
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
    </div>
  );
};
