import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Rocket, 
  Sparkles, 
  Disc3,
  ChevronDown,
  Check,
  CheckCircle2,
  Hourglass
} from 'lucide-react';
import { StudioSongRecord, StudioProjectRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';

interface SingleMetadataSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
  lyricVersionsCount?: number;
  onUpdateSong: (patch: Partial<StudioSongRecord>) => void;
  drawerRef?: React.RefObject<HTMLDivElement | null>;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
}

export const SingleMetadataSidebar: React.FC<SingleMetadataSidebarProps> = ({
  isOpen,
  onClose,
  song,
  projects = [],
  onUpdateSong,
  drawerRef,
  backdropRef,
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusContainerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const parentProject = projects.find((p) => p.id === song.projectId);
  const isTrack = Boolean(parentProject || song.projectId);
  const isTrackCompleted = song.status === 'ready' || song.status === 'released';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusContainerRef.current && !statusContainerRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === song.status) || PRODUCTION_STAGES[0];

  return (
    <>
      {/* Backdrop for mobile & desktop touch/click-away */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 ease-out will-change-[opacity] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-over Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`fixed inset-y-0 right-0 z-50 w-80 sm:w-88 bg-bg-secondary shadow-2xl flex flex-col transition-transform duration-300 ease-out will-change-transform select-none ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-bg-secondary">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
              {isTrack ? <Disc3 size={16} /> : <Sparkles size={16} />}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-text-heading truncate">
                {isTrack ? 'Metadata Track' : 'Metadata Single'}
              </h2>
              <p className="text-[11px] text-text-muted truncate">{song.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Tutup Metadata"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 [scrollbar-width:thin]">
          
          {/* TRACK MODE: BOOLEAN TOGGLE STATUS */}
          {isTrack ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Status Pengerjaan
              </label>

              <button
                type="button"
                onClick={() => {
                  onUpdateSong({ status: isTrackCompleted ? 'idea' : 'ready' });
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left ${
                  isTrackCompleted
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isTrackCompleted ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Hourglass size={18} className="text-amber-300 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold">
                      {isTrackCompleted ? 'Selesai' : 'Dalam Pengerjaan'}
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {isTrackCompleted 
                        ? 'Track sudah rampung dan siap' 
                        : 'Track masih dalam tahap pengerjaan'}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isTrackCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'
                }`}>
                  {isTrackCompleted ? 'Rampung' : 'Proses'}
                </span>
              </button>
            </div>
          ) : (
            /* SINGLE MODE: 6-STAGE PRODUCTION STATUS */
            <div className="space-y-1.5" ref={statusContainerRef}>
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Status Produksi
              </label>

              <div className="w-full h-9 relative">
                {!isStatusDropdownOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(true)}
                    className="w-full h-9 px-3 flex items-center justify-between text-xs text-text-primary bg-bg-primary hover:bg-bg-hover/60 rounded-xl cursor-pointer transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">{currentStage.icon}</span>
                      <span className="font-semibold text-text-primary">{currentStage.label}</span>
                    </div>
                    <ChevronDown size={14} className="text-icon-secondary shrink-0" />
                  </button>
                ) : (
                  <div className="absolute top-0 left-0 right-0 z-50 bg-bg-primary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(false)}
                      className="w-full h-9 px-3 flex items-center justify-between text-xs text-text-primary hover:bg-bg-hover/60 cursor-pointer transition-colors text-left font-bold"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">{currentStage.icon}</span>
                        <span>{currentStage.label}</span>
                      </div>
                      <ChevronDown size={14} className="text-accent-primary shrink-0 rotate-180 transition-transform" />
                    </button>

                    <div className="mx-2.5 h-px bg-border-default/30" />

                    <div className="max-h-52 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                      {PRODUCTION_STAGES.map((stage) => {
                        const isSelected = song.status === stage.id;
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => {
                              onUpdateSong({ status: stage.id });
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                              isSelected
                                ? 'bg-bg-secondary text-accent-primary font-bold'
                                : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{stage.icon}</span>
                              <span>{stage.label}</span>
                            </div>
                            {isSelected && <Check size={12} className="text-accent-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRACK MODE: INFORMASI PROYEK & NOMOR TRACK */}
          {isTrack && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Informasi Album & Track
              </label>

              <div className="p-3.5 rounded-2xl bg-bg-primary space-y-2.5 text-xs">
                {/* Album Induk */}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Disc3 size={13} className="text-accent-primary" />
                    <span>Album Induk</span>
                  </span>
                  <span className="font-semibold text-text-primary truncate max-w-[140px] text-right">
                    {parentProject?.title || 'EP / Album'}
                  </span>
                </div>

                <div className="h-px bg-bg-secondary/80" />

                {/* Nomor Track */}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Nomor Track</span>
                  <span className="font-mono font-bold text-accent-primary bg-bg-secondary px-2 py-0.5 rounded-md text-xs">
                    #{song.trackNumber || 1}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL WAKTU */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-accent-primary" />
              <span>Detail Waktu</span>
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3 text-xs">
              {/* Target Tanggal Rilis (HANYA UNTUK SINGLE MANDIRI) */}
              {!isTrack && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                      <span className="flex items-center gap-1">
                        <Rocket size={11} className="text-emerald-400" />
                        <span>Target Rilis</span>
                      </span>
                      {song.targetReleaseDate && (
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ targetReleaseDate: undefined })}
                          className="text-[10px] text-text-muted hover:text-status-error cursor-pointer transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (dateInputRef.current) {
                            if (typeof dateInputRef.current.showPicker === 'function') {
                              dateInputRef.current.showPicker();
                            } else {
                              dateInputRef.current.click();
                            }
                          }
                        }}
                        className="w-full h-9 px-3 flex items-center justify-between text-xs text-text-primary bg-bg-secondary hover:bg-bg-hover/60 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <span className={song.targetReleaseDate ? 'text-text-primary font-medium' : 'text-text-muted'}>
                          {song.targetReleaseDate ? formatDate(song.targetReleaseDate) : 'Pilih tanggal rilis...'}
                        </span>
                        <ChevronDown size={14} className="text-icon-secondary shrink-0" />
                      </button>

                      <input
                        ref={dateInputRef}
                        type="date"
                        value={song.targetReleaseDate || ''}
                        onChange={(e) => onUpdateSong({ targetReleaseDate: e.target.value })}
                        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                  <div className="h-px bg-bg-secondary/80" />
                </>
              )}

              {/* Tanggal Dibuat */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1">
                  <Calendar size={11} />
                  <span>Dibuat</span>
                </span>
                <span className="font-medium text-text-secondary">{formatDate(song.createdAt)}</span>
              </div>

              {/* Terakhir Diperbarui */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1">
                  <Clock size={11} />
                  <span>Diedit</span>
                </span>
                <span className="font-medium text-text-secondary">{formatDate(song.updatedAt)}</span>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
