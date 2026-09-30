import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Music2, 
  Disc3, 
  Search, 
  Plus, 
  Loader2,
  FolderPlus,
  ListMusic,
  Kanban
} from 'lucide-react';
import { useMusicStudio } from '../hooks/useMusicStudio';
import { MusicProjectCard } from './MusicProjectCard';
import { MusicSongCard } from './MusicSongCard';
import { MusicKanbanPipeline } from './MusicKanbanPipeline';
import { MusicStudioDrawerDock, StudioViewTab } from './MusicStudioDrawerDock';
import { SingleOverviewDashboard } from './SingleOverviewDashboard';
import { SongStudioEditor } from './SongStudioEditor';
import { NewSongModal } from './NewSongModal';
import { NewProjectModal } from './NewProjectModal';
import { useNavigation } from '../../../context/NavigationContext';
import { MusicProductionStatus } from '../types';

interface MusicStudioHubProps {
  vaultState?: any;
}

export const MusicStudioHub: React.FC<MusicStudioHubProps> = () => {
  const { 
    songs, 
    rawSongs,
    projects, 
    rawProjects,
    isLoading,
    createNewSong, 
    createNewProject, 
    updateSongStatus,
    updateSongRecord,
  } = useMusicStudio();

  const { 
    musicSongId, 
    musicSubView,
    navigateToMusicSong, 
    navigateToMusicSubView,
    goBack 
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
  const [targetProjectForSong, setTargetProjectForSong] = useState<string | undefined>(undefined);
  const [targetStageForSong, setTargetStageForSong] = useState<MusicProductionStatus | undefined>(undefined);

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

  const handleOpenSongInEditor = (songId: string) => {
    navigateToMusicSong(songId); // opens overview dashboard with history pushed
  };

  // Filtered songs
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = song.title.toLowerCase().includes(q);
        const matchesKey = song.key?.toLowerCase().includes(q);
        const matchesProject = song.project?.toLowerCase().includes(q);
        const matchesGenre = song.genre?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesProject && !matchesGenre) return false;
      }

      if (selectedStatusFilter) {
        if (song.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [songs, searchQuery, selectedStatusFilter]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.genre?.toLowerCase().includes(q) ||
      p.songs.some(s => s.title.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

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
      handleOpenSongInEditor(newId);
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
      setActiveTab('projects');
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

  // Active editing song record from dedicated storage
  const activeEditingSong = musicSongId 
    ? rawSongs.find((s) => s.id === musicSongId)
    : null;

  // Level 3: Render Fullscreen Lyric/Chord Studio Editor
  if (activeEditingSong && musicSubView === 'editor') {
    return (
      <SongStudioEditor
        song={activeEditingSong}
        projects={rawProjects}
        onBack={() => {
          navigateToMusicSubView(activeEditingSong.id, 'overview');
        }}
        onUpdateSong={(patch) => {
          updateSongRecord(activeEditingSong.id, patch);
        }}
      />
    );
  }

  // Level 2 & 3: Render Single Overview Dashboard (Overview, Premise Note, or Scratchpad Note)
  if (activeEditingSong) {
    return (
      <SingleOverviewDashboard
        song={activeEditingSong}
        projects={rawProjects}
        currentSubView={musicSubView || 'overview'}
        onBack={() => {
          navigateToMusicSong(null);
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

  return (
    <div className="relative w-full h-full bg-bg-primary text-text-primary select-none flex flex-col overflow-hidden">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 pb-2 space-y-2.5 flex-1 flex flex-col min-h-0">
        
        {/* Streamlined Clean Header with Unified (+) Button */}
        <header className="flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent-primary text-accent-contrast flex items-center justify-center shrink-0 shadow-xs">
              <Music2 size={16} />
            </div>
            <div className="flex items-center gap-2 truncate">
              <h1 className="text-base sm:text-lg font-bold text-text-heading tracking-tight truncate">
                Studio Musik
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary shrink-0">
                {songs.length}
              </span>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari lagu, album, key..."
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
              title="Buat Lagu atau Album Baru"
              aria-label="Tambah Baru"
            >
              <Plus size={18} />
            </button>

            {/* Creation Menu Popup */}
            {isCreationMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-bg-secondary/95 backdrop-blur-md rounded-2xl shadow-2xl p-1.5 z-50 border border-border-default/40 select-none animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreationMenuOpen(false);
                    setTargetProjectForSong(undefined);
                    setTargetStageForSong('idea');
                    setIsNewSongModalOpen(true);
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-bg-hover text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent-primary group-hover:text-accent-contrast transition-colors">
                    <Music2 size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                      Lagu Baru
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Tulis lirik, chord, dan atur nada dasar
                    </p>
                  </div>
                </button>

                <div className="h-px bg-border-default/20 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsCreationMenuOpen(false);
                    setIsNewProjectModalOpen(true);
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-bg-hover text-left transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <FolderPlus size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text-heading group-hover:text-sky-400 transition-colors">
                      Album / EP Baru
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Kelompokkan lagu dalam satu proyek diskografi
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
            {/* TAB 1: PIPELINE KANBAN TRIAGE (HERO EXPERIENCE) */}
            {activeTab === 'pipeline' && (
              <div className="w-full h-full flex-1 min-h-0 overflow-hidden">
                <MusicKanbanPipeline
                  songs={filteredSongs}
                  onSelectSong={handleOpenSongInEditor}
                  onUpdateStatus={updateSongStatus}
                  onCreateSongInStage={handleOpenNewSongInStage}
                />
              </div>
            )}

            {/* TAB 2: ALL SONGS LIST */}
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
                    Semua ({songs.length})
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
                      {st} ({songs.filter((s) => s.status === st).length})
                    </button>
                  ))}
                </div>

                {/* Songs Grid */}
                {filteredSongs.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-bg-secondary/40 border border-dashed border-border-default/30 space-y-2">
                    <Music2 size={24} className="mx-auto text-text-muted opacity-40" />
                    <p className="text-xs text-text-muted">Tidak ada lagu yang cocok dengan pencarian.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filteredSongs.map((song) => (
                      <MusicSongCard
                        key={song.id}
                        song={song}
                        onSelectSong={handleOpenSongInEditor}
                        onUpdateStatus={updateSongStatus}
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
                        onSelectSong={handleOpenSongInEditor}
                        onCreateSongForProject={handleOpenNewSongWithProject}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Floating Side Drawer Dock */}
      <MusicStudioDrawerDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        songsCount={songs.length}
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
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProjectSubmit}
      />
    </div>
  );
};
