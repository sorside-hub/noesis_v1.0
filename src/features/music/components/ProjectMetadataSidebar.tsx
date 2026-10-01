import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Rocket, 
  ChevronDown,
  Check,
  Disc3,
} from 'lucide-react';
import { StudioProjectRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';

interface ProjectMetadataSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  project: StudioProjectRecord;
  tracksCount?: number;
  totalWordsCount?: number;
  onUpdateProject: (patch: Partial<StudioProjectRecord>) => void;
  drawerRef?: React.RefObject<HTMLDivElement | null>;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
}

export const ProjectMetadataSidebar: React.FC<ProjectMetadataSidebarProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  drawerRef,
  backdropRef,
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusContainerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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
            <div className="w-8 h-8 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
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
                    <ChevronDown size={14} className="text-accent-primary shrink-0 rotate-180 transition-transform" />
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

          {/* SECTION 2: METADATA WAKTU & TANGGAL */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-accent-primary" />
              <span>Detail Waktu</span>
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                  <span className="flex items-center gap-1">
                    <Rocket size={11} className="text-emerald-400" />
                    <span>Target Rilis</span>
                  </span>
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
                    <span className={project.targetReleaseDate ? 'text-text-primary font-medium' : 'text-text-muted'}>
                      {project.targetReleaseDate ? formatDate(project.targetReleaseDate) : 'Pilih tanggal rilis...'}
                    </span>
                    <ChevronDown size={14} className="text-icon-secondary shrink-0" />
                  </button>

                  <input
                    ref={dateInputRef}
                    type="date"
                    value={project.targetReleaseDate || ''}
                    onChange={(e) => onUpdateProject({ targetReleaseDate: e.target.value })}
                    className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="h-px bg-bg-secondary/80" />

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1">
                  <Calendar size={11} />
                  <span>Dibuat</span>
                </span>
                <span className="font-medium text-text-secondary">{formatDate(project.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1">
                  <Clock size={11} />
                  <span>Diedit</span>
                </span>
                <span className="font-medium text-text-secondary">{formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
