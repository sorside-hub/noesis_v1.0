import React from 'react';
import { 
  Music2, 
  Disc3, 
  ArrowRightLeft, 
  X, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { StudioProjectRecord, StudioSongRecord } from '../types/studioDatabase';

interface MoveSongProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: StudioSongRecord;
  projects: StudioProjectRecord[];
  allSongs?: StudioSongRecord[];
  onMoveToProject: (songId: string, targetProjectId: string) => Promise<void> | void;
  onConvertToSingle: (songId: string) => Promise<void> | void;
}

export const MoveSongProjectModal: React.FC<MoveSongProjectModalProps> = ({
  isOpen,
  onClose,
  song,
  projects = [],
  allSongs = [],
  onMoveToProject,
  onConvertToSingle,
}) => {
  if (!isOpen) return null;

  const currentProjectId = song.projectId;
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const isCurrentlyTrack = !!currentProjectId;

  // Other available projects (excluding current project if it's already a track there)
  const availableProjects = projects.filter((p) => p.id !== currentProjectId);

  const handleSelectSingle = async () => {
    await onConvertToSingle(song.id);
    onClose();
  };

  const handleSelectProject = async (targetProjectId: string) => {
    await onMoveToProject(song.id, targetProjectId);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-bg-secondary w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 border border-border-default/20 flex flex-col max-h-[85vh] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 pb-1 border-b border-border-default/20">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
                <ArrowRightLeft size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-heading truncate">
                  Pindahkan Lagu
                </h3>
                <p className="text-[11px] text-text-muted truncate">
                  "{song.title || 'Tanpa Judul'}"
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Location Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-primary text-xs text-text-muted">
          <span className="shrink-0 font-medium">Status Saat Ini:</span>
          {isCurrentlyTrack && currentProject ? (
            <span className="font-semibold text-text-primary flex items-center gap-1.5 truncate">
              <Disc3 size={13} className="text-sky-400 shrink-0" />
              Track #{song.trackNumber || '?'} di {currentProject.type?.toUpperCase()} "{currentProject.title}"
            </span>
          ) : (
            <span className="font-semibold text-accent-primary flex items-center gap-1.5">
              <Music2 size={13} className="shrink-0" />
              Single Mandiri
            </span>
          )}
        </div>

        {/* Destination List (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 [scrollbar-width:thin]">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">
            Pilih Format / Tujuan
          </div>

          {/* Option 1: Convert to Single (If currently a Track in EP/Album) */}
          {isCurrentlyTrack && (
            <button
              type="button"
              onClick={handleSelectSingle}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-bg-primary hover:bg-bg-hover text-left transition-all cursor-pointer group active:scale-[0.99] border border-border-default/30 hover:border-accent-primary/40 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0 group-hover:bg-accent-primary group-hover:text-accent-contrast transition-colors">
                  <Music2 size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors flex items-center gap-1.5">
                    <span>Keluarkan Jadi Single Mandiri</span>
                    <Sparkles size={12} className="text-amber-400" />
                  </div>
                  <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                    Lepaskan dari {currentProject?.title || 'album'} dan jadikan lagu Single mandiri
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Option 2: Move to an EP / Album */}
          {availableProjects.length === 0 ? (
            <div className="p-4 rounded-2xl bg-bg-primary/60 border border-dashed border-border-default/60 text-center space-y-1">
              <Layers size={18} className="mx-auto text-text-muted/60" />
              <p className="text-xs text-text-muted font-medium">
                Belum ada EP atau Album lain yang tersedia.
              </p>
              <p className="text-[10px] text-text-muted/80">
                Buat EP / Album baru terlebih dahulu di menu Studio Musik (+).
              </p>
            </div>
          ) : (
            availableProjects.map((proj) => {
              const projTracks = allSongs.filter((s) => s.projectId === proj.id);
              const trackCount = projTracks.length;
              const typeLabel = proj.type?.toUpperCase() || 'ALBUM';

              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => handleSelectProject(proj.id)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-bg-primary hover:bg-bg-hover text-left transition-all cursor-pointer group active:scale-[0.99] border border-border-default/20 hover:border-accent-primary/40 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <Disc3 size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors truncate">
                        {proj.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5">
                        <span className="font-semibold text-text-secondary">{typeLabel}</span>
                        <span>•</span>
                        <span>{trackCount} Track</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Akan jadi Track #{trackCount + 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-bg-secondary text-[10px] font-semibold text-text-muted group-hover:bg-accent-primary group-hover:text-accent-contrast transition-colors shrink-0">
                    Pilih
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-2 border-t border-border-default/20 flex items-center justify-between text-[11px] text-text-muted">
          <span>Semua lirik, versi & audio tetap utuh</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-bg-hover text-text-primary text-xs font-medium hover:bg-bg-primary transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
