import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Music2, 
  Disc3, 
  Search, 
  Plus, 
  Loader2,
  FolderPlus,
} from 'lucide-react';
import { useMusicStudio } from '../hooks/useMusicStudio';
import { MusicProjectCard } from './MusicProjectCard';
import { MusicSongCard } from './MusicSongCard';
import { MusicKanbanPipeline } from './MusicKanbanPipeline';
import { MusicStudioDrawerDock, StudioViewTab } from './MusicStudioDrawerDock';
import { SingleOverviewDashboard } from './SingleOverviewDashboard';
import { ProjectOverviewDashboard } from './ProjectOverviewDashboard';
import { SongStudioEditor } from './SongStudioEditor';
import { NewSongModal } from './NewSongModal';
import { NewProjectModal } from './NewProjectModal';
import { useNavigation } from '../../../context/NavigationContext';
import { MusicProductionStatus, MusicProjectType, MusicReleaseItem } from '../types';

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

  // Unified creation menu state
  const [isCreationMenuOpen, setIsCreationMenuOpen] = useState(false);
  const creationMenuRef = useRef<HTMLDivElement>(null);

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
          updatedAt: new Date(song.updatedAt).getTime() || Date.now(),
          createdAt: new Date(song.createdAt).getTime() || Date.now(),
        });
      }
    });

    // 2. EPs and Albums
    rawProjects.forEach((proj) => {
      list.push({
        id: proj.id,
        kind: 'project',
        type: proj.type || 'album',
        title: proj.title,
        status: proj.status || 'idea',
        updatedAt: new Date(proj.updatedAt).getTime() || Date.now(),
        createdAt: new Date(proj.createdAt).getTime() || Date.now(),
      });
    });

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [rawSongs, rawProjects]);

  // Filtered releases for Pipeline and Daftar
  const filteredItems = useMemo(() => {
    return releaseItems.filter((item) => {
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
  }, [releaseItems, searchQuery, selectedStatusFilter]);

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
        
        {/* Streamlined Clean Header */}
        <header className="flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-bg-secondary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
              <Music2 size={16} />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-text-heading tracking-tight truncate">
              Studio Musik
            </h1>
          </div>

          {/* Center Search Input */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari lagu, album, single..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-default/20 text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            />
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

            {/* TAB 2: DAFTAR RILISAN (SINGLES, EPS, ALBUMS) */}
            {activeTab === 'songs' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-24 [scrollbar-width:thin]">
                {/* Status Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter(null)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                      selectedStatusFilter === null
                        ? 'bg-accent-primary text-accent-contrast'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    Semua ({releaseItems.length})
                  </button>
                  {['idea', 'demo', 'recording', 'mixing', 'ready', 'released'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatusFilter(selectedStatusFilter === st ? null : st)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 capitalize ${
                        selectedStatusFilter === st
                          ? 'bg-accent-primary text-accent-contrast'
                          : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      {st} ({releaseItems.filter((it) => it.status === st).length})
                    </button>
                  ))}
                </div>

                {/* Simplified Releases List */}
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-bg-secondary/40 border border-dashed border-border-default/30 space-y-2">
                    <Music2 size={24} className="mx-auto text-text-muted opacity-40" />
                    <p className="text-xs text-text-muted">Tidak ada rilisan yang cocok dengan pencarian.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredItems.map((item) => (
                      <MusicSongCard
                        key={`${item.kind}-${item.id}`}
                        item={item}
                        onSelectItem={handleSelectItem}
                        onRenameItem={handleStartRename}
                        onUpdateStatus={handleUpdateItemStatus}
                        onDeleteItem={handleStartDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DISCOGRAPHY / ALBUMS */}
            {activeTab === 'projects' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-24 [scrollbar-width:thin]">
                {filteredProjects.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-bg-secondary/40 border border-dashed border-border-default/30 space-y-3">
                    <Disc3 size={32} className="mx-auto text-text-muted opacity-50" />
                    <div>
                      <h3 className="font-semibold text-sm text-text-heading">Belum ada Album atau EP</h3>
                      <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                        Kelompokkan lagu-lagu kamu ke dalam satu proyek album, EP, atau single rilis.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewProjectModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Buat Album / EP Baru</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredProjects.map((project) => (
                      <MusicProjectCard
                        key={project.id}
                        project={project}
                        onSelectSong={(songId) => navigateToMusicSong(songId)}
                        onCreateSongForProject={handleOpenNewSongWithProject}
                        onOpenProjectNote={(projId) => navigateToMusicProject(projId)}
                      />
                    ))}
                  </div>
                )}
              </div>
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
