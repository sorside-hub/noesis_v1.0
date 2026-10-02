import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Music2, 
  Disc3, 
  Search, 
  Plus, 
  Loader2,
  FolderPlus,
  Clock,
  Calendar,
  ArrowDownAZ,
  BarChart3,
  Check,
  ChevronDown,
  X,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from 'lucide-react';
import { useMusicStudio } from '../hooks/useMusicStudio';
import { MusicKanbanPipeline } from './MusicKanbanPipeline';
import { MusicDiscographyView } from './MusicDiscographyView';
import { MusicStudioDrawerDock, StudioViewTab } from './MusicStudioDrawerDock';
import { SingleOverviewDashboard } from './SingleOverviewDashboard';
import { ProjectOverviewDashboard } from './ProjectOverviewDashboard';
import { SongStudioEditor } from './SongStudioEditor';
import { SongDiscographyReader } from './SongDiscographyReader';
import { NewSongModal } from './NewSongModal';
import { NewProjectModal } from './NewProjectModal';
import { useNavigation } from '../../../context/NavigationContext';
import { MusicProductionStatus, MusicProjectType, MusicReleaseItem } from '../types';

const SORT_OPTIONS: { id: 'updated' | 'created' | 'title' | 'progress'; label: string; icon: React.ElementType }[] = [
  { id: 'updated', label: 'Diubah', icon: Clock },
  { id: 'created', label: 'Dibuat', icon: Calendar },
  { id: 'title', label: 'Nama', icon: ArrowDownAZ },
  { id: 'progress', label: 'Progres', icon: BarChart3 },
];

interface MusicStudioHubProps {
  vaultState?: any;
}

export const MusicStudioHub: React.FC<MusicStudioHubProps> = () => {
  const { 
    rawSongs,
    projects, 
    rawProjects,
    isLoading,
    reloadData,
    createNewSong, 
    createNewProject, 
    updateSongStatus,
    updateSongRecord,
    updateProjectRecord,
    removeSong,
    removeProject,
  } = useMusicStudio();

  const { 
    musicProjectId,
    musicSongId, 
    musicSubView,
    navigateToMusicProject,
    navigateToMusicSong, 
    navigateToMusicSubView,
    goBack,
  } = useNavigation();

  // Active view tab managed via Drawer Dock
  const [activeTab, setActiveTab] = useState<StudioViewTab>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'progress'>('updated');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Unified creation menu state
  const [isCreationMenuOpen, setIsCreationMenuOpen] = useState(false);
  const creationMenuRef = useRef<HTMLDivElement>(null);

  // Custom Sort Menu Popover state
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isNewSongModalOpen, setIsNewSongModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [initialProjectType, setInitialProjectType] = useState<MusicProjectType>('ep');
  const [targetProjectForSong, setTargetProjectForSong] = useState<string | undefined>(undefined);
  const [targetStageForSong, setTargetStageForSong] = useState<MusicProductionStatus | undefined>(undefined);

  // Rename Modal state
  const [renamingItem, setRenamingItem] = useState<MusicReleaseItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Delete Confirmation Modal state
  const [deletingItem, setDeletingItem] = useState<MusicReleaseItem | null>(null);

  // Close creation dropdown on outside click
  useEffect(() => {
    if (!isCreationMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (creationMenuRef.current && !creationMenuRef.current.contains(e.target as Node)) {
        setIsCreationMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isCreationMenuOpen]);

  // Close sort menu popover on outside click
  useEffect(() => {
    if (!showSortMenu) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [showSortMenu]);

  // Combine Singles, EPs, and Albums into unified release items for Pipeline & Daftar
  const releaseItems: MusicReleaseItem[] = useMemo(() => {
    const list: MusicReleaseItem[] = [];

    // 1. Standalone songs as Singles (songs without parent project in rawProjects)
    rawSongs.forEach((song) => {
      const parent = rawProjects.find((p) => p.id === song.projectId);
      if (!parent) {
        list.push({
          id: song.id,
          kind: 'song',
          type: 'single',
          title: song.title,
          status: song.status,
          coverUrl: song.coverUrl,
          progress: song.progress || 0,
          progressNote: song.progressNote,
          updatedAt: new Date(song.updatedAt).getTime() || Date.now(),
          createdAt: new Date(song.createdAt).getTime() || Date.now(),
        });
      }
    });

    // 2. EPs and Albums
    rawProjects.forEach((proj) => {
      const projectSongs = rawSongs.filter((s) => s.projectId === proj.id);
      const totalTrackProgress = projectSongs.reduce((sum, s) => sum + (s.progress || 0), 0);
      const projProgress =
        projectSongs.length > 0
          ? Math.round(totalTrackProgress / projectSongs.length)
          : 0;

      list.push({
        id: proj.id,
        kind: 'project',
        type: proj.type || 'album',
        title: proj.title,
        status: proj.status || 'idea',
        coverUrl: proj.coverUrl,
        progress: projProgress,
        progressNote: proj.progressNote,
        updatedAt: new Date(proj.updatedAt).getTime() || Date.now(),
        createdAt: new Date(proj.createdAt).getTime() || Date.now(),
      });
    });

    return list;
  }, [rawSongs, rawProjects]);

  // Filtered and Sorted releases for Pipeline and Daftar
  const filteredItems = useMemo(() => {
    const filtered = releaseItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesType = item.type.toLowerCase().includes(q);
        if (!matchesTitle && !matchesType) return false;
      }

      if (selectedStatusFilter) {
        if (item.status !== selectedStatusFilter) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'created') {
        cmp = a.createdAt - b.createdAt;
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'progress') {
        cmp = (a.progress || 0) - (b.progress || 0);
      } else {
        // default 'updated'
        cmp = a.updatedAt - b.updatedAt;
      }

      if (sortBy === 'title') {
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [releaseItems, searchQuery, selectedStatusFilter, sortBy, sortOrder]);

  // Filtered projects for Discography Tab
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.genre?.toLowerCase().includes(q) ||
      p.songs.some(s => s.title.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const handleSelectItem = (item: MusicReleaseItem) => {
    if (item.kind === 'song') {
      navigateToMusicSong(item.id);
    } else {
      navigateToMusicProject(item.id);
    }
  };

  const handleUpdateItemStatus = async (item: MusicReleaseItem, newStatus: MusicProductionStatus) => {
    if (item.kind === 'song') {
      await updateSongStatus(item.id, newStatus);
    } else {
      await updateProjectRecord(item.id, { status: newStatus });
    }
  };

  // Trigger rename
  const handleStartRename = (item: MusicReleaseItem) => {
    setRenamingItem(item);
    setRenameInputValue(item.title);
  };

  const handleConfirmRename = async () => {
    if (!renamingItem) return;
    const newTitle = renameInputValue.trim();
    if (!newTitle) return;

    if (renamingItem.kind === 'song') {
      await updateSongRecord(renamingItem.id, { title: newTitle });
    } else {
      await updateProjectRecord(renamingItem.id, { title: newTitle });
    }

    setRenamingItem(null);
    setRenameInputValue('');
  };

  // Trigger delete
  const handleStartDelete = (item: MusicReleaseItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    if (deletingItem.kind === 'song') {
      await removeSong(deletingItem.id);
    } else {
      await removeProject(deletingItem.id);
    }

    setDeletingItem(null);
  };

  const handleCreateSongSubmit = async (params: {
    title: string;
    key?: string;
    bpm?: number;
    project?: string;
    genre?: string;
    status?: MusicProductionStatus;
  }) => {
    const newId = await createNewSong(params);
    if (newId) {
      navigateToMusicSong(newId);
    }
  };

  const handleCreateProjectSubmit = async (params: {
    title: string;
    type: any;
    genre?: string;
    targetReleaseDate?: string;
    description?: string;
  }) => {
    const newId = await createNewProject(params);
    if (newId) {
      navigateToMusicProject(newId);
    }
  };

  const handleOpenNewSongWithProject = (projectName: string) => {
    setTargetProjectForSong(projectName);
    setTargetStageForSong('idea');
    setIsNewSongModalOpen(true);
  };

  const handleOpenNewSongInStage = (stage: MusicProductionStatus) => {
    setTargetProjectForSong(undefined);
    setTargetStageForSong(stage);
    setIsNewSongModalOpen(true);
  };

  // Active editing song record
  const activeEditingSong = musicSongId 
    ? rawSongs.find((s) => s.id === musicSongId)
    : null;

  // Active selected project record (EP / Album)
  const activeSelectedProject = musicProjectId
    ? rawProjects.find((p) => p.id === musicProjectId)
    : null;

  // Level 3: Render Fullscreen Lyric/Chord Studio Editor
  if (activeEditingSong && musicSubView === 'editor') {
    return (
      <SongStudioEditor
        song={activeEditingSong}
        projects={rawProjects}
        onBack={() => {
          goBack();
        }}
        onUpdateSong={(patch) => {
          updateSongRecord(activeEditingSong.id, patch);
        }}
      />
    );
  }

  // Level 1.5: Render Discography Clean Performance Reader Mode
  if (activeEditingSong && musicSubView === 'reader') {
    return (
      <SongDiscographyReader
        song={activeEditingSong}
        projects={rawProjects}
        onBack={() => {
          goBack();
        }}
        onOpenOverview={() => {
          navigateToMusicSubView(activeEditingSong.id, 'overview');
        }}
        onUpdateSong={(patch) => {
          updateSongRecord(activeEditingSong.id, patch);
        }}
      />
    );
  }

  // Level 2 & 3: Render Single/Track Overview Dashboard
  if (activeEditingSong) {
    return (
      <SingleOverviewDashboard
        song={activeEditingSong}
        projects={rawProjects}
        allSongs={rawSongs}
        currentSubView={musicSubView || 'overview'}
        onBack={() => {
          goBack();
        }}
        onOpenFullEditor={() => {
          navigateToMusicSubView(activeEditingSong.id, 'editor');
        }}
        onOpenPremise={() => {
          navigateToMusicSubView(activeEditingSong.id, 'premise');
        }}
        onOpenScratchpad={() => {
          navigateToMusicSubView(activeEditingSong.id, 'scratchpad');
        }}
        onCloseSubView={() => {
          navigateToMusicSubView(activeEditingSong.id, 'overview');
        }}
        onUpdateSong={(patch) => {
          updateSongRecord(activeEditingSong.id, patch);
        }}
      />
    );
  }

  // Level 2: Render EP / Album Project Overview Dashboard
  if (activeSelectedProject) {
    const projectTracks = rawSongs
      .filter((s) => s.projectId === activeSelectedProject.id)
      .sort((a, b) => {
        if (a.trackNumber && b.trackNumber && a.trackNumber !== b.trackNumber) {
          return a.trackNumber - b.trackNumber;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    return (
      <ProjectOverviewDashboard
        project={activeSelectedProject}
        projectSongs={projectTracks}
        onBack={() => goBack()}
        onSelectTrack={(songId) => navigateToMusicSong(songId)}
        onUpdateProject={(patch) => updateProjectRecord(activeSelectedProject.id, patch)}
        onReloadData={reloadData}
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-bg-primary text-text-primary select-none flex flex-col overflow-hidden">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 pb-2 space-y-2.5 flex-1 flex flex-col min-h-0">
        
        {/* Streamlined Clean Header (BARIS 1) */}
        <header className="flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-bg-secondary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
              <Music2 size={16} />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-text-heading tracking-tight truncate">
              Studio Musik
            </h1>
          </div>

          {/* Unified (+) Action Button & Dropdown */}
          <div className="relative shrink-0" ref={creationMenuRef}>
            <button
              type="button"
              onClick={() => setIsCreationMenuOpen(!isCreationMenuOpen)}
              className="w-8 h-8 rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-95 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              title="Buat Single, EP, atau Album Baru"
              aria-label="Tambah Baru"
            >
              <Plus size={18} />
            </button>

            {/* Creation Menu Popup - NO BORDER */}
            {isCreationMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-bg-secondary rounded-2xl shadow-2xl p-1.5 z-50 select-none animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                
                {/* 1. SINGLE */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsCreationMenuOpen(false);
                    const newId = await createNewSong({
                      title: 'Single Baru',
                      status: 'idea',
                    });
                    if (newId) {
                      navigateToMusicSong(newId);
                    }
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-bg-hover text-left transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent-primary group-hover:text-accent-contrast transition-colors">
                    <Music2 size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                      Single
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Buat & langsung buka lembar lagu single baru
                    </p>
                  </div>
                </button>

                <div className="h-px bg-border-default/20 my-1" />

                {/* 2. EP */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsCreationMenuOpen(false);
                    const newId = await createNewProject({
                      title: 'EP Baru',
                      type: 'ep',
                    });
                    if (newId) {
                      navigateToMusicProject(newId);
                    }
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-bg-hover text-left transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <Disc3 size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-heading group-hover:text-sky-400 transition-colors">
                      EP (Mini Album)
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Buat & langsung buka overview mini album baru
                    </p>
                  </div>
                </button>

                {/* 3. ALBUM */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsCreationMenuOpen(false);
                    const newId = await createNewProject({
                      title: 'Album Baru',
                      type: 'album',
                    });
                    if (newId) {
                      navigateToMusicProject(newId);
                    }
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-bg-hover text-left transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <FolderPlus size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-heading group-hover:text-purple-400 transition-colors">
                      Full Album
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Buat & langsung buka overview album lagu baru
                    </p>
                  </div>
                </button>

              </div>
            )}
          </div>
        </header>

        {/* Search & Sort Bar (BARIS 2 - 1 Baris Elegan, Dipisah Seperti di Halaman Media) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Search Bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari lagu, album, single..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-bg-secondary border border-border-default/20 hover:border-accent-primary/40 focus:border-accent-primary/60 text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. Custom Popover Sort Menu */}
          <div className="relative shrink-0" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-bg-secondary hover:bg-bg-hover border border-border-default/20 hover:border-accent-primary/40 text-text-primary cursor-pointer transition-all active:scale-95 ${
                showSortMenu ? 'border-accent-primary/60 bg-bg-hover ring-1 ring-accent-primary/20' : ''
              }`}
            >
              {(() => {
                const currentOpt = SORT_OPTIONS.find((o) => o.id === sortBy) || SORT_OPTIONS[0];
                const Icon = currentOpt.icon;
                return (
                  <>
                    <Icon size={13} className="text-text-muted shrink-0" />
                    <span className="hidden sm:inline">{currentOpt.label}</span>
                  </>
                );
              })()}
              <ChevronDown size={13} className={`text-text-muted transition-transform duration-150 ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Custom Sort Dropdown Popover */}
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-bg-secondary rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 border border-border-default/20">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-bg-hover text-text-primary font-semibold'
                          : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={13} className={isActive ? 'text-text-primary' : 'text-text-muted'} />
                        <span className={isActive ? 'text-text-primary' : 'text-text-muted'}>{opt.label}</span>
                      </div>
                      {isActive && <Check size={13} className="text-text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Sort Direction Toggle Button (Opsi 1: Atas ke Bawah / Bawah ke Atas) */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-bg-secondary hover:bg-bg-hover border border-border-default/20 hover:border-accent-primary/40 text-text-primary cursor-pointer transition-all active:scale-95 shrink-0 group"
            title={
              sortOrder === 'desc'
                ? 'Urutan: Menurun / Atas ke Bawah (Klik untuk ganti Menaik)'
                : 'Urutan: Menaik / Bawah ke Atas (Klik untuk ganti Menurun)'
            }
            aria-label="Ubah arah urutan"
          >
            {sortOrder === 'desc' ? (
              <ArrowDownWideNarrow size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />
            ) : (
              <ArrowUpNarrowWide size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />
            )}
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-text-muted text-xs gap-2 flex-1">
            <Loader2 size={20} className="animate-spin text-accent-primary" />
            <span>Memuat Studio Musik...</span>
          </div>
        )}

        {/* Main Tab Content */}
        {!isLoading && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* TAB 1: PIPELINE KANBAN TRIAGE (SINGLES, EPS, ALBUMS) */}
            {activeTab === 'pipeline' && (
              <div className="w-full h-full flex-1 min-h-0 overflow-hidden">
                <MusicKanbanPipeline
                  items={filteredItems}
                  onSelectItem={handleSelectItem}
                  onRenameItem={handleStartRename}
                  onUpdateStatus={handleUpdateItemStatus}
                  onDeleteItem={handleStartDelete}
                />
              </div>
            )}

            {/* TAB 2: DISCOGRAPHY / PLAYLIST VIEW (RELEASED WORKS & CATALOG) */}
            {activeTab === 'discography' && (
              <MusicDiscographyView
                projects={rawProjects}
                songs={rawSongs}
                onSelectSong={(songId) => navigateToMusicSubView(songId, 'reader')}
                onSelectProject={(projId) => navigateToMusicProject(projId)}
                searchQuery={searchQuery}
              />
            )}
          </div>
        )}

      </div>

      {/* Rename Modal - NO BORDER */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bg-secondary w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-text-heading">Ubah Judul {renamingItem.type.toUpperCase()}</h3>
            <input
              type="text"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename();
                if (e.key === 'Escape') setRenamingItem(null);
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-bg-primary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              autoFocus
              placeholder="Masukkan judul baru..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renameInputValue.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - NO BORDER */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bg-secondary w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-text-heading">Hapus {deletingItem.type.toUpperCase()}?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Apakah kamu yakin ingin menghapus "{deletingItem.title}"? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-500 text-white shadow-xs hover:bg-red-600 transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Side Drawer Dock */}
      <MusicStudioDrawerDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        songsCount={releaseItems.length}
        projectsCount={projects.length}
      />

      {/* New Song Modal */}
      <NewSongModal
        isOpen={isNewSongModalOpen}
        onClose={() => setIsNewSongModalOpen(false)}
        projects={projects}
        defaultProject={targetProjectForSong}
        defaultStatus={targetStageForSong}
        onSubmit={handleCreateSongSubmit}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        initialType={initialProjectType}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProjectSubmit}
      />
    </div>
  );
};
