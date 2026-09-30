import React from 'react';
import { Music2, Disc3, Sparkles, Layers } from 'lucide-react';

interface MusicOverviewStatsProps {
  stats: {
    totalSongs: number;
    totalProjects: number;
    ideaCount: number;
    inProgressCount: number;
    readyCount: number;
    releasedCount: number;
  };
  onFilterStatus?: (status: string | null) => void;
  selectedStatus?: string | null;
}

export const MusicOverviewStats: React.FC<MusicOverviewStatsProps> = ({
  stats,
  onFilterStatus,
  selectedStatus,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
      {/* Total Songs */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus(null)}
        className={`p-3 rounded-xl transition-all cursor-pointer select-none bg-bg-secondary hover:bg-bg-hover ${
          selectedStatus === null ? 'ring-1 ring-accent-primary/40' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-text-muted">Total Lagu</span>
          <Music2 size={14} className="text-accent-primary opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-text-heading">
            {stats.totalSongs}
          </span>
          <span className="text-[10px] text-text-muted">track</span>
        </div>
      </div>

      {/* Projects (Album / EP / Single) */}
      <div className="p-3 rounded-xl bg-bg-secondary select-none">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-text-muted">Proyek Rilisan</span>
          <Disc3 size={14} className="text-indigo-400 opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-text-heading">
            {stats.totalProjects}
          </span>
          <span className="text-[10px] text-text-muted">Album/EP</span>
        </div>
      </div>

      {/* In Production */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('demo')}
        className={`p-3 rounded-xl transition-all cursor-pointer select-none bg-bg-secondary hover:bg-bg-hover ${
          selectedStatus === 'demo' ? 'ring-1 ring-accent-primary/40' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-text-muted">Proses Produksi</span>
          <Layers size={14} className="text-blue-400 opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-text-heading">
            {stats.inProgressCount}
          </span>
          <span className="text-[10px] text-text-muted">lagu aktif</span>
        </div>
      </div>

      {/* Ready / Released */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('ready')}
        className={`p-3 rounded-xl transition-all cursor-pointer select-none bg-bg-secondary hover:bg-bg-hover ${
          selectedStatus === 'ready' ? 'ring-1 ring-accent-primary/40' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-text-muted">Siap / Rilis</span>
          <Sparkles size={14} className="text-emerald-400 opacity-80" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-text-heading">
            {stats.readyCount + stats.releasedCount}
          </span>
          <span className="text-[10px] text-text-muted">selesai</span>
        </div>
      </div>
    </div>
  );
};
