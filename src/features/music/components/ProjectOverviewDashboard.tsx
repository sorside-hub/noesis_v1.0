import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Plus, 
  Check, 
  Trash2, 
  Copy, 
  ChevronRight, 
  ChevronDown,
  Lightbulb,
  SlidersVertical,
  Save,
  MoreVertical,
  Edit2,
  Disc3,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { StudioProjectRecord, StudioSongRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';
import { 
  deleteStudioProject, 
  saveStudioSong, 
  deleteStudioSong, 
} from '../lib/musicStudioStorage';
import { EditorCore } from '../../editor/components/EditorCore';
import { Toolbar } from '../../editor/components/Toolbar';
import { ProjectMetadataSidebar } from './ProjectMetadataSidebar';
import { useDrawerGestures } from '../../editor/hooks/useDrawerGestures';

interface ProjectOverviewDashboardProps {
  project: StudioProjectRecord;
  projectSongs: StudioSongRecord[];
  onBack: () => void;
  onSelectTrack: (songId: string) => void;
  onUpdateProject: (patch: Partial<StudioProjectRecord>) => void;
  onReloadData: () => Promise<void>;
}

export const ProjectOverviewDashboard: React.FC<ProjectOverviewDashboardProps> = ({
  project,
  projectSongs = [],
  onBack,
  onSelectTrack,
  onUpdateProject,
  onReloadData,
}) => {
  // TipTap Editor instance for Album Premise
  const [activeNoteEditor, setActiveNoteEditor] = useState<Editor | null>(null);
  const [currentSubView, setCurrentSubView] = useState<'overview' | 'premise'>('overview');

  // Title rename state
  const [titleText, setTitleText] = useState(project.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Status & Menu state
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [openTrackMenuId, setOpenTrackMenuId] = useState<string | null>(null);

  // Modals state
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [newTrackTitleInput, setNewTrackTitleInput] = useState('');
  
  const [renamingTrack, setRenamingTrack] = useState<StudioSongRecord | null>(null);
  const [renameTrackTitleInput, setRenameTrackTitleInput] = useState('');

  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);

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
    setTitleText(project.title || '');
  }, [project.title]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenTrackMenuId(null);
      setIsStatusDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== project.title) {
      onUpdateProject({ title: titleText.trim() });
    }
  };

  // Sort tracks ascending: earliest created is Track #1, then Track #2, etc.
  const sortedProjectSongs = useMemo(() => {
    return [...projectSongs].sort((a, b) => {
      if (a.trackNumber && b.trackNumber && a.trackNumber !== b.trackNumber) {
        return a.trackNumber - b.trackNumber;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [projectSongs]);

  // Add new track to project
  const handleCreateTrack = async () => {
    const existingMaxTrack = projectSongs.reduce((max, s) => Math.max(max, s.trackNumber || 0), 0);
    const nextTrackNum = Math.max(existingMaxTrack, projectSongs.length) + 1;
    const title = newTrackTitleInput.trim() || `Track ${nextTrackNum}`;
    const songId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const newSong: StudioSongRecord = {
      id: songId,
      projectId: project.id,
      trackNumber: nextTrackNum,
      title,
      contentLyrics: `<h3>[Intro]</h3>\n<p>[C]</p>\n\n<h3>[Verse 1]</h3>\n<p>Tulis lirik dan chord track ini...</p>\n`,
      status: 'idea',
      musicalKey: 'C',
      bpm: 120,
      capo: 0,
      timeSignature: '4/4',
      tuning: 'Standard (E A D G B E)',
      scratchpad: '',
      createdAt: now,
      updatedAt: now,
    };

    await saveStudioSong(newSong);
    await onReloadData();
    setIsAddTrackModalOpen(false);
    setNewTrackTitleInput('');
    onSelectTrack(songId); // Open track overview immediately
  };

  // Duplicate track
  const handleDuplicateTrack = async (song: StudioSongRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const songId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const existingMaxTrack = projectSongs.reduce((max, s) => Math.max(max, s.trackNumber || 0), 0);
    const nextTrackNum = Math.max(existingMaxTrack, projectSongs.length) + 1;

    const duplicatedSong: StudioSongRecord = {
      ...song,
      id: songId,
      trackNumber: nextTrackNum,
      title: `${song.title} (Salinan)`,
      createdAt: now,
      updatedAt: now,
    };

    await saveStudioSong(duplicatedSong);
    await onReloadData();
  };

  // Save renamed track
  const handleSaveRenameTrack = async () => {
    if (!renamingTrack) return;
    const cleanTitle = renameTrackTitleInput.trim() || renamingTrack.title;
    await saveStudioSong({
      ...renamingTrack,
      title: cleanTitle,
      updatedAt: new Date().toISOString(),
    });
    await onReloadData();
    setRenamingTrack(null);
    setRenameTrackTitleInput('');
  };

  // Delete track
  const handleDeleteTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteStudioSong(id);
    await onReloadData();
  };

  // Delete entire project
  const handleDeleteProject = async () => {
    if (!project.id) return;
    await deleteStudioProject(project.id);
    setIsDeleteProjectModalOpen(false);
    onBack();
  };

  // Helper to extract plain snippet
  const cleanSnippet = (htmlContent?: string) => {
    if (!htmlContent) return '';
    return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === project.status) || PRODUCTION_STAGES[0];
  const premiseSnippet = cleanSnippet(project.description);

  // Total words count across all tracks
  const totalWords = projectSongs.reduce((acc, s) => {
    const plain = (s.contentLyrics || '').replace(/<[^>]*>/g, ' ').trim();
    return acc + (plain ? plain.split(/\s+/).length : 0);
  }, 0);

  // =========================================================================
  // VIEW MODE 1: ALBUM PREMISE / CONCEPT NOTE EDITOR
  // =========================================================================
  if (currentSubView === 'premise') {
    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex flex-col overflow-hidden relative select-none">
        <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary border-b border-border-default flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentSubView('overview')}
              className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title={`Kembali ke Overview ${project.title}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Lightbulb size={14} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-text-heading truncate">
                  Premis & Konsep Cerita {project.type?.toUpperCase()}
                </h2>
                <p className="text-[10px] text-text-muted truncate">
                  {project.title}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentSubView('overview')}
            title="Simpan & kembali ke Overview Album"
            className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </header>

        <div className="flex-1 w-full min-h-0 overflow-hidden relative">
          <EditorCore
            key={`project-premise-${project.id}`}
            hideTitle={true}
            enableChords={false}
            title=""
            onTitleChange={() => {}}
            initialContent={project.description || ''}
            onChange={(newContent) => {
              onUpdateProject({ description: newContent });
            }}
            onEditorReady={(editor) => setActiveNoteEditor(editor)}
          />

          <Toolbar editor={activeNoteEditor} />
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: PROJECT OVERVIEW DASHBOARD (EP / ALBUM)
  // =========================================================================
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
                title="Klik untuk ubah judul album"
              >
                <h1 className="text-sm sm:text-base font-bold text-text-heading tracking-tight truncate group-hover:text-accent-primary transition-colors">
                  {project.title || 'Tanpa Judul Album'}
                </h1>
                <Edit3 size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-muted">
              <span>{project.type === 'ep' ? 'EP' : 'Album'}</span>
              <span>•</span>
              <span>{projectSongs.length} Track</span>
            </div>
          </div>
        </div>

        {/* Right Actions: Status Dropdown + Metadata + Delete Project */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Status Badge Dropdown (No Box / No BG) */}
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
                {/* Full-screen backdrop to close popup on click anywhere */}
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
                        onUpdateProject({ status: st.id });
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                        project.status === st.id
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

          <button
            type="button"
            onClick={() => setIsMetadataSidebarOpen(!isMetadataSidebarOpen)}
            title={isMetadataSidebarOpen ? 'Tutup Metadata' : 'Buka Metadata'}
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
            onClick={() => setIsDeleteProjectModalOpen(true)}
            title="Hapus Proyek Ini"
            className="h-8 w-8 rounded-xl bg-bg-primary hover:bg-status-error-bg/30 text-text-muted hover:text-status-error transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 [scrollbar-width:thin]">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* SECTION 1: PREMIS & KONSEP CERITA ALBUM */}
          <div
            onClick={() => setCurrentSubView('premise')}
            className="group p-4 rounded-2xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 text-left"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Lightbulb size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                    Premis & Konsep Cerita {project.type?.toUpperCase()}
                  </h3>
                </div>
                <ChevronRight size={14} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
              </div>

              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                {premiseSnippet ? (
                  <span className="text-text-secondary">{premiseSnippet}</span>
                ) : (
                  <span className="italic text-text-muted/70">
                    Belum ada premis album. Klik untuk membuka Note Editor cerita & tema besar album...
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* SECTION 2: DAFTAR TRACK (TRACKLIST) */}
          <div className="bg-bg-secondary rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            
            {/* Header Tracklist */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
                  <Disc3 size={14} />
                </div>
                <h3 className="text-xs font-bold text-text-heading">
                  Daftar Track {project.type?.toUpperCase()}
                </h3>
              </div>

              {/* Add Track Button */}
              <button
                type="button"
                onClick={() => setIsAddTrackModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah Track</span>
              </button>
            </div>

            {/* Tracklist Items */}
            <div className="space-y-1.5">
              {projectSongs.length === 0 ? (
                <div 
                  onClick={() => setIsAddTrackModalOpen(true)}
                  className="p-5 rounded-xl bg-bg-primary hover:bg-bg-hover border border-dashed border-border-default/60 hover:border-accent-primary/50 text-center cursor-pointer transition-all space-y-1"
                >
                  <p className="text-xs text-text-muted font-medium">
                    Belum ada track dalam {project.type?.toUpperCase()} ini.
                  </p>
                  <p className="text-[11px] text-accent-primary font-bold">
                    + Klik untuk menambah Track #1
                  </p>
                </div>
              ) : (
                sortedProjectSongs.map((track, index) => {
                  const trackStage = PRODUCTION_STAGES.find((s) => s.id === track.status) || PRODUCTION_STAGES[0];
                  const isLastItem = index === sortedProjectSongs.length - 1 && sortedProjectSongs.length > 1;
                  const displayTrackNumber = track.trackNumber || (index + 1);

                  return (
                    <div
                      key={track.id}
                      onClick={() => onSelectTrack(track.id)}
                      className="group p-2.5 sm:p-3 rounded-xl bg-bg-primary hover:bg-bg-hover transition-all cursor-pointer flex items-center justify-between gap-2.5 relative"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Track Number Badge */}
                        <div className="w-7 h-7 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0 font-mono font-bold text-xs text-accent-primary">
                          #{displayTrackNumber}
                        </div>

                        {/* Title */}
                        <span className="text-xs font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                          {track.title}
                        </span>
                      </div>

                      {/* Right: Boolean Status Icon (Pure Icon, No Box) + 3-Dots Action Menu */}
                      <div className="flex items-center gap-2 shrink-0">
                        {track.status === 'ready' || track.status === 'released' ? (
                          <span 
                            title="Selesai"
                            className="text-emerald-400 text-sm font-bold shrink-0 select-none"
                          >
                            ✓
                          </span>
                        ) : (
                          <span 
                            title="Dalam Pengerjaan"
                            className="text-amber-400 text-xs shrink-0 select-none opacity-80"
                          >
                            ⏳
                          </span>
                        )}

                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenTrackMenuId(openTrackMenuId === track.id ? null : track.id);
                            }}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                            title="Opsi Track"
                          >
                            <MoreVertical size={15} />
                          </button>

                        {openTrackMenuId === track.id && (
                          <div 
                            className={`absolute right-0 w-44 bg-bg-secondary rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                              isLastItem ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingTrack(track);
                                setRenameTrackTitleInput(track.title);
                                setOpenTrackMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Edit2 size={13} className="text-text-muted" />
                              <span>Ubah Nama Track</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                handleDuplicateTrack(track, e);
                                setOpenTrackMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer font-medium"
                            >
                              <Copy size={13} className="text-text-muted" />
                              <span>Duplikat Track</span>
                            </button>

                            <div className="my-1 h-px bg-border-default/30" />

                            <button
                              type="button"
                              onClick={(e) => {
                                handleDeleteTrack(track.id, e);
                                setOpenTrackMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-status-error hover:bg-status-error-bg/30 transition-colors text-left cursor-pointer font-medium"
                            >
                              <Trash2 size={13} />
                              <span>Hapus Track</span>
                            </button>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      </div>

      {/* METADATA SIDEBAR */}
      <ProjectMetadataSidebar
        isOpen={isMetadataSidebarOpen}
        onClose={() => setIsMetadataSidebarOpen(false)}
        project={project}
        tracksCount={projectSongs.length}
        totalWordsCount={totalWords}
        onUpdateProject={onUpdateProject}
        drawerRef={rightDrawerRef}
        backdropRef={rightBackdropRef}
      />

      {/* MODAL: TAMBAH TRACK BARU */}
      {isAddTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                Tambah Track #{projectSongs.length + 1}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Masukkan judul lagu baru untuk {project.title}.
              </p>
            </div>

            <div>
              <input
                type="text"
                autoFocus
                placeholder={`Contoh: Track #${projectSongs.length + 1}`}
                value={newTrackTitleInput}
                onChange={(e) => setNewTrackTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTrack()}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddTrackModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateTrack}
                className="px-4 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Buat Track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RENAME TRACK */}
      {renamingTrack && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                Ubah Nama Track
              </h3>
            </div>

            <div>
              <input
                type="text"
                autoFocus
                value={renameTrackTitleInput}
                onChange={(e) => setRenameTrackTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameTrack()}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRenamingTrack(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRenameTrack}
                className="px-4 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS PROYEK */}
      {isDeleteProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg-secondary rounded-2xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-status-error flex items-center gap-1.5">
                <Trash2 size={16} />
                <span>Hapus {project.type?.toUpperCase()} Ini?</span>
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong className="text-text-primary">"{project.title}"</strong>? Proyek ini akan dihapus dari studio diskografi Anda.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteProjectModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-text-muted hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
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
