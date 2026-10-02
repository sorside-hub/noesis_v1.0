import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  ChevronDown,
  Check,
  Disc3,
  Image as ImageIcon,
} from 'lucide-react';
import { StudioProjectRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';
import { InsertImageModal } from '../../editor/components/InsertImageModal';

interface ProjectMetadataSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  project: StudioProjectRecord;
  tracksCount?: number;
  completedTracks?: number;
  totalTracks?: number;
  progressPercent?: number;
  totalWordsCount?: number;
  onUpdateProject: (patch: Partial<StudioProjectRecord>) => void;
  drawerRef?: React.RefObject<HTMLDivElement | null>;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
}

export const ProjectMetadataSidebar: React.FC<ProjectMetadataSidebarProps> = ({
  isOpen,
  onClose,
  project,
  completedTracks = 0,
  totalTracks = 0,
  progressPercent = 0,
  onUpdateProject,
  drawerRef,
  backdropRef,
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const statusContainerRef = useRef<HTMLDivElement>(null);

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

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === project.status) || PRODUCTION_STAGES[0];
  const isReadyOrReleased = project.status === 'ready' || project.status === 'released';

  return (
    <>
      {/* Backdrop */}
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
            <div className="w-8 h-8 rounded-xl bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
              <Disc3 size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-text-heading truncate">Metadata {project.type === 'ep' ? 'EP' : 'Album'}</h2>
              <p className="text-[11px] text-text-muted truncate">{project.title}</p>
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
          
          {/* SECTION 1: STATUS PRODUKSI PROYEK (DROPDOWN) */}
          <div className="space-y-1.5" ref={statusContainerRef}>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Status Produksi Proyek
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
                    <ChevronDown size={14} className="text-text-primary shrink-0 rotate-180 transition-transform" />
                  </button>

                  <div className="mx-2.5 h-px bg-border-default/30" />

                  <div className="max-h-52 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                    {PRODUCTION_STAGES.map((stage) => {
                      const isSelected = project.status === stage.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            onUpdateProject({ status: stage.id });
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                            isSelected
                              ? 'bg-bg-secondary text-text-primary font-bold'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{stage.icon}</span>
                            <span>{stage.label}</span>
                          </div>
                          {isSelected && <Check size={12} className="text-text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: PROGRES PROYEK (Hanya jika belum ready/released) */}
          {!isReadyOrReleased && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block truncate">
                  Progres {currentStage.label}
                </label>
                {(() => {
                  const colorClass = progressPercent === 100 ? 'text-emerald-400' : progressPercent >= 50 ? 'text-amber-400' : 'text-text-muted';
                  return (
                    <span className={`text-[11px] font-mono font-bold bg-bg-primary px-2 py-0.5 rounded-lg shrink-0 ${colorClass}`}>
                      {progressPercent}%
                    </span>
                  );
                })()}
              </div>

              <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-text-muted font-medium">
                    <span>Rampung Track</span>
                    <span className="font-mono text-text-secondary">{completedTracks} / {totalTracks} lagu</span>
                  </div>
                  <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-primary rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Progress Comment / Note Field */}
                <input
                  type="text"
                  placeholder="Catatan progres proyek (misal: '3/6 track beres')..."
                  value={project.progressNote || ''}
                  onChange={(e) => onUpdateProject({ progressNote: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-default/20 text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>
          )}

          {/* SECTION: COVER ART UTAMA ALBUM / EP (MUNCUL DI TAHAP READY & RELEASED) */}
          {isReadyOrReleased && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Cover Art {project.type === 'ep' ? 'EP' : 'Album'}
                </label>
                {project.coverUrl && (
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Terpasang
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3">
                {!project.coverUrl ? (
                  <button
                    type="button"
                    onClick={() => setIsCoverModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary hover:bg-bg-hover text-accent-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ImageIcon size={14} />
                    <span>Lampirkan Cover Art {project.type === 'ep' ? 'EP' : 'Album'}</span>
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    {/* Cover Image Preview */}
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-bg-secondary">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-bg-primary shrink-0 shadow-xs border border-border-default/20">
                        <img 
                          src={project.coverUrl} 
                          alt="Cover Art" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {project.title || 'Cover Artwork'}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">
                          Artwork 1:1 Resmi {project.type === 'ep' ? 'EP' : 'Album'}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Ganti / Hapus */}
                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsCoverModalOpen(true)}
                        className="px-2.5 py-1 text-[11px] font-medium text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
                      >
                        Ganti Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateProject({ coverUrl: undefined })}
                        className="px-2.5 py-1 text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: METADATA WAKTU & TANGGAL */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Detail Waktu
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                  <span>{isReadyOrReleased ? 'Tanggal Rilis' : 'Target Rilis'}</span>
                  {project.targetReleaseDate && (
                    <button
                      type="button"
                      onClick={() => onUpdateProject({ targetReleaseDate: undefined })}
                      className="text-[10px] text-text-muted hover:text-status-error cursor-pointer transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                
                <div className="relative w-full h-9 group">
                  {/* Visual presentation layer */}
                  <div className="w-full h-9 px-3 flex items-center justify-between text-xs bg-bg-secondary group-hover:bg-bg-hover/60 rounded-xl transition-colors pointer-events-none">
                    <span className={project.targetReleaseDate ? 'text-text-primary font-medium' : 'text-text-muted'}>
                      {project.targetReleaseDate ? formatDate(project.targetReleaseDate) : 'Pilih tanggal rilis...'}
                    </span>
                    <ChevronDown size={14} className="text-icon-secondary shrink-0" />
                  </div>

                  {/* Native transparent date input overlay */}
                  <input
                    type="date"
                    value={project.targetReleaseDate || ''}
                    onChange={(e) => onUpdateProject({ targetReleaseDate: e.target.value || undefined })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Pilih tanggal rilis"
                  />
                </div>
              </div>

              <div className="h-px bg-bg-secondary/80" />

              {/* Tanggal Dibuat */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-icon-secondary" />
                  <span>Dibuat</span>
                </div>
                <span className="font-mono text-text-secondary">{formatDate(project.createdAt)}</span>
              </div>

              {/* Terakhir Diubah */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-icon-secondary" />
                  <span>Diubah</span>
                </div>
                <span className="font-mono text-text-secondary">{formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* MODAL LAMPIRKAN COVER ART ALBUM / EP */}
      <InsertImageModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        customTitle={`Lampirkan Cover Art ${project.type === 'ep' ? 'EP' : 'Album'}`}
        uploadTabLabel="Unggah Cover"
        libraryTabLabel="Pustaka Cover"
        submitButtonLabel="Gunakan Sebagai Cover Art"
        onInsertImage={({ src }) => {
          onUpdateProject({ coverUrl: src });
          setIsCoverModalOpen(false);
        }}
      />
    </>
  );
};
