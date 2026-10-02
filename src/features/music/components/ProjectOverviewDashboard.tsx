import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  GripVertical,
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
import { useNavigation } from '../../../context/NavigationContext';

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

  // Drag and Drop state for true Floating Kanban Card reordering (using handle only)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverTargetIndex, setHoverTargetIndex] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStartDataRef = useRef<{
    startIndex: number;
    startY: number;
    itemHeights: number[];
    itemTops: number[];
    currentTargetIndex: number;
  } | null>(null);

  // Handle pointer down specifically on the handle (⋮⋮)
  const handleHandlePointerDown = (index: number, e: React.PointerEvent) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    e.preventDefault();
    e.stopPropagation();

    const heights = itemRefs.current.map((el) => (el ? el.getBoundingClientRect().height + 6 : 52));
    const tops = itemRefs.current.map((el) => (el ? el.getBoundingClientRect().top : 0));

    dragStartDataRef.current = {
      startIndex: index,
      startY: e.clientY,
      itemHeights: heights,
      itemTops: tops,
      currentTargetIndex: index,
    };

    setDraggingIndex(index);
    setHoverTargetIndex(index);
    setDragOffsetY(0);

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!dragStartDataRef.current) return;
      const { startIndex, startY, itemHeights, itemTops } = dragStartDataRef.current;
      const deltaY = moveEvt.clientY - startY;
      setDragOffsetY(deltaY);

      // Determine which slot the pointer is hovering over
      let newTarget = startIndex;
      const currentY = moveEvt.clientY;
      for (let j = 0; j < itemTops.length; j++) {
        const top = itemTops[j];
        const h = itemHeights[j];
        const mid = top + h / 2;
        if (currentY > mid) {
          newTarget = j;
        }
      }
      newTarget = Math.max(0, Math.min(sortedProjectSongs.length - 1, newTarget));
      dragStartDataRef.current.currentTargetIndex = newTarget;
      setHoverTargetIndex(newTarget);
    };

    const onPointerUp = async () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const startData = dragStartDataRef.current;
      dragStartDataRef.current = null;

      if (!startData) {
        setDraggingIndex(null);
        setHoverTargetIndex(null);
        setDragOffsetY(0);
        return;
      }

      const { startIndex, currentTargetIndex } = startData;
      setDraggingIndex(null);
      setHoverTargetIndex(null);
      setDragOffsetY(0);

      if (startIndex !== currentTargetIndex && currentTargetIndex >= 0) {
        const updated = [...sortedProjectSongs];
        const [movedItem] = updated.splice(startIndex, 1);
        updated.splice(currentTargetIndex, 0, movedItem);

        const savePromises = updated.map((t, idx) => {
          const newTrackNum = idx + 1;
          if (t.trackNumber !== newTrackNum) {
            return saveStudioSong({
              ...t,
              trackNumber: newTrackNum,
              updatedAt: new Date().toISOString(),
            });
          }
          return Promise.resolve();
        });

        await Promise.all(savePromises);
        await onReloadData();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
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
  // VIEW MODE 1: ALBUM CONCEPT NOTE EDITOR
  // =========================================================================
  if (currentSubView === 'premise') {
    return (
      <div className="w-full h-full bg-bg-primary text-text-primary flex flex-col overflow-hidden relative select-none">
        <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-secondary flex items-center justify-between gap-3 shrink-0">
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
              <div className="w-7 h-7 rounded-lg bg-bg-primary text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Lightbulb size={14} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-text-heading truncate">
                  {project.title}
                </h2>
                <p className="text-[10px] text-text-muted truncate">
                  Konsep
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
          
          {/* Read-Only Status & Progress Info Badge */}
          {(() => {
            if (project.status === 'released') {
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

            if (project.status === 'ready') {
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

            const totalCount = projectSongs.length;
            const totalProgressSum = projectSongs.reduce(
              (sum, s) => sum + (s.progress !== undefined ? s.progress : (s.status === 'ready' || s.status === 'released' ? 100 : 0)),
              0
            );
            const percent = totalCount > 0 ? Math.round(totalProgressSum / totalCount) : 0;
            const colorClass = percent === 100 ? 'text-emerald-400' : percent >= 50 ? 'text-amber-400' : 'text-text-muted';
            return (
              <div 
                title={`Tahapan Album: ${currentStage.label} (${percent}%) - Ubah di Metadata Sidebar`}
                className={`h-8 flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold select-none bg-bg-primary ${colorClass}`}
              >
                <span className="text-xs sm:text-sm">{currentStage.icon}</span>
                <span className="hidden sm:inline text-xs font-bold">{currentStage.label} ({percent}%)</span>
                <span className="sm:hidden text-xs font-bold font-mono">{percent}%</span>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={() => isMetadataSidebarOpen ? closeMobileRightSidebar() : openMobileRightSidebar()}
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
          
          {/* SECTION 1: KONSEP ALBUM */}
          <div
            onClick={() => setCurrentSubView('premise')}
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

          {/* SECTION 2: DAFTAR TRACK (TRACKLIST) */}
          <div className="bg-bg-secondary rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            
            {/* Header Tracklist */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
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
                  const trackProg = track.progress !== undefined ? track.progress : (track.status === 'ready' || track.status === 'released' ? 100 : 0);
                  const trackProgColorClass = trackProg === 100 ? 'text-emerald-400' : trackProg >= 50 ? 'text-amber-400' : 'text-text-muted';

                  const isFloating = draggingIndex === index;
                  let translateY = 0;
                  if (draggingIndex !== null && hoverTargetIndex !== null) {
                    if (isFloating) {
                      translateY = dragOffsetY;
                    } else if (draggingIndex < hoverTargetIndex) {
                      if (index > draggingIndex && index <= hoverTargetIndex) {
                        translateY = -52;
                      }
                    } else if (draggingIndex > hoverTargetIndex) {
                      if (index < draggingIndex && index >= hoverTargetIndex) {
                        translateY = 52;
                      }
                    }
                  }

                  return (
                    <div
                      key={track.id}
                      ref={(el) => { itemRefs.current[index] = el; }}
                      onClick={() => {
                        if (draggingIndex === null) {
                          onSelectTrack(track.id);
                        }
                      }}
                      style={{
                        transform: `translate3d(0, ${translateY}px, 0)`,
                        zIndex: isFloating ? 50 : 1,
                      }}
                      className={`group p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2.5 relative select-none cursor-pointer ${
                        isFloating
                          ? 'bg-bg-secondary shadow-2xl ring-2 ring-accent-primary scale-[1.02] cursor-grabbing backdrop-blur-md opacity-95 pointer-events-none'
                          : 'bg-bg-primary hover:bg-bg-hover transition-transform duration-200 ease-out'
                      }`}
                    >
                      {/* LEFT CONTENT: DRAG HANDLE + TRACK NO. + (BARIS 1 JUDUL & BARIS 2 % + CATATAN) */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Drag Handle (⋮⋮) */}
                        <div
                          onPointerDown={(e) => handleHandlePointerDown(index, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-text-muted/60 hover:text-text-primary p-1 -ml-1 rounded-md cursor-grab active:cursor-grabbing hover:bg-bg-secondary transition-colors shrink-0 touch-none"
                          title="Tahan dan geser (⋮⋮) untuk mengubah urutan track"
                        >
                          <GripVertical size={14} />
                        </div>

                        {/* Track Number Badge */}
                        <div className="w-7 h-7 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0 font-mono font-bold text-xs text-text-muted">
                          #{displayTrackNumber}
                        </div>

                        {/* Judul Track & Info Status/Progress */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate block">
                            {track.title || 'Tanpa Judul'}
                          </span>

                          {/* BARIS 2: PROGRES % + CATATAN (HANYA MUNCUL DI TAHAP IDE S/D MIX & MASTER) */}
                          {!(track.status === 'ready' || track.status === 'released' || project.status === 'ready' || project.status === 'released') && (
                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted min-w-0 w-full truncate font-medium mt-0.5">
                              <span className={`font-mono font-bold shrink-0 ${trackProgColorClass}`}>
                                {trackProg}%
                              </span>
                              {track.progressNote && track.progressNote.trim() && (
                                <>
                                  <span className="shrink-0 opacity-40">•</span>
                                  <span className="truncate italic text-text-muted/80">
                                    {track.progressNote}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT CONTENT: TITIK 3 MENU (VERTICALLY CENTERED) */}
                      <div className="relative shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTrackMenuId(openTrackMenuId === track.id ? null : track.id);
                          }}
                          className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                          title="Opsi Track"
                        >
                          <MoreVertical size={14} />
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
                  );
                })
              )}
            </div>

          </div>

        </div>
      </div>

      {/* METADATA SIDEBAR */}
      {(() => {
        const totalCount = projectSongs.length;
        const totalProgressSum = projectSongs.reduce(
          (sum, s) => sum + (s.progress !== undefined ? s.progress : (s.status === 'ready' || s.status === 'released' ? 100 : 0)),
          0
        );
        const percent = totalCount > 0 ? Math.round(totalProgressSum / totalCount) : 0;
        const completedCount = projectSongs.filter(s => (s.progress || 0) === 100 || s.status === 'ready' || s.status === 'released').length;
        return (
          <ProjectMetadataSidebar
            isOpen={isMetadataSidebarOpen}
            onClose={closeMobileRightSidebar}
            project={project}
            tracksCount={totalCount}
            completedTracks={completedCount}
            totalTracks={totalCount}
            progressPercent={percent}
            totalWordsCount={totalWords}
            onUpdateProject={onUpdateProject}
            drawerRef={rightDrawerRef}
            backdropRef={rightBackdropRef}
          />
        );
      })()}

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
