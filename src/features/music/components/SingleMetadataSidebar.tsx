import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Rocket, 
  FolderKanban, 
  Sparkles, 
  Tag
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
  lyricVersionsCount = 0,
  onUpdateSong,
  drawerRef,
  backdropRef,
}) => {
  const currentProject = projects.find((p) => p.id === song.projectId);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const wordCount = (text?: string) => {
    if (!text) return 0;
    const plain = text.replace(/<[^>]*>/g, ' ').trim();
    return plain ? plain.split(/\s+/).length : 0;
  };

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

      {/* Slide-over Drawer Panel (Vault style physics & seamless borderless design) */}
      <aside
        ref={drawerRef}
        className={`fixed inset-y-0 right-0 z-50 w-80 sm:w-88 bg-bg-secondary shadow-2xl flex flex-col transition-transform duration-300 ease-out will-change-transform select-none ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header (No border) */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-bg-secondary">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-text-heading truncate">Metadata Single</h2>
              <p className="text-[11px] text-text-muted truncate">{song.title}</p>
            </div>
          </div>

          {/* Close button (Hidden on mobile, mobile uses swipe/backdrop gesture) */}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex p-1.5 rounded-xl hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Tutup Metadata"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content (Borderless cards) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 [scrollbar-width:thin]">
          
          {/* SECTION 1: STATUS ALUR KERJA PRODUKSI */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Status Produksi
            </label>

            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-bg-primary rounded-2xl">
              {PRODUCTION_STAGES.map((stage) => {
                const isActive = song.status === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => onUpdateSong({ status: stage.id })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isActive
                        ? `${stage.bgLight} ${stage.color} shadow-xs`
                        : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="text-sm">{stage.icon}</span>
                    <span className="truncate">{stage.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: METADATA WAKTU & TANGGAL */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-accent-primary" />
              <span>Detail Waktu</span>
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3 text-xs">
              {/* Target Tanggal Rilis */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                  <span className="flex items-center gap-1">
                    <Rocket size={11} className="text-emerald-400" />
                    <span>Target Rilis</span>
                  </span>
                </div>
                <input
                  type="date"
                  value={song.targetReleaseDate || ''}
                  onChange={(e) => onUpdateSong({ targetReleaseDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-bg-secondary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary cursor-pointer"
                />
              </div>

              <div className="h-px bg-bg-secondary/80" />

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

          {/* SECTION 3: INFORMASI PROYEK & DISKOGRAFI */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <FolderKanban size={12} className="text-accent-primary" />
              <span>Proyek & Diskografi</span>
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3 text-xs">
              {/* Proyek / Album */}
              <div className="space-y-1">
                <span className="text-[11px] text-text-muted block">Album / Proyek</span>
                <select
                  value={song.projectId || ''}
                  onChange={(e) => onUpdateSong({ projectId: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-bg-secondary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary cursor-pointer"
                >
                  <option value="">Single Mandiri (Non-Album)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre */}
              <div className="space-y-1">
                <span className="text-[11px] text-text-muted block">Genre Musik</span>
                <input
                  type="text"
                  placeholder="Contoh: Pop, Indie Folk, R&B..."
                  value={song.genre || ''}
                  onChange={(e) => onUpdateSong({ genre: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-bg-secondary text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: STATISTIK SINGLE */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} className="text-accent-primary" />
              <span>Statistik & Catatan</span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-bg-primary">
                <span className="text-[10px] text-text-muted block">Versi Lirik</span>
                <span className="text-sm font-bold text-text-heading">{lyricVersionsCount} versi</span>
              </div>
              <div className="p-3 rounded-2xl bg-bg-primary">
                <span className="text-[10px] text-text-muted block">Kata Lirik</span>
                <span className="text-sm font-bold text-text-heading">{wordCount(song.contentLyrics)} kata</span>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
