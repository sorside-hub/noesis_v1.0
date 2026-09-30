import React, { useState } from 'react';
import { Disc3, Calendar, ChevronDown, ChevronUp, Music2, Plus } from 'lucide-react';
import { MusicProject, MusicProductionStatus } from '../types';

interface MusicProjectCardProps {
  project: MusicProject;
  onSelectSong: (songId: string) => void;
  onCreateSongForProject?: (projectName: string) => void;
  onOpenProjectNote?: (projectId: string) => void;
  onUpdateStatus?: (songId: string, status: MusicProductionStatus) => void;
}

export const MusicProjectCard: React.FC<MusicProjectCardProps> = ({
  project,
  onSelectSong,
  onCreateSongForProject,
  onOpenProjectNote,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedTracks = project.songs.filter(
    s => s.status === 'ready' || s.status === 'released'
  ).length;
  const totalTracks = project.songs.length;
  const progressPercent = totalTracks > 0 ? Math.round((completedTracks / totalTracks) * 100) : 0;

  const typeBadgeColor = 
    project.type === 'album' 
      ? 'bg-purple-500/15 text-purple-400' 
      : project.type === 'ep' 
        ? 'bg-indigo-500/15 text-indigo-400' 
        : 'bg-emerald-500/15 text-emerald-400';

  return (
    <div className="rounded-2xl bg-bg-secondary p-3.5 sm:p-4 space-y-3 transition-all select-none">
      {/* Project Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Cover icon */}
          <div className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center shrink-0 text-accent-primary">
            <Disc3 size={20} className="opacity-90" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                onClick={() => onOpenProjectNote && !project.id.startsWith('implicit_') && onOpenProjectNote(project.id)}
                className="text-sm sm:text-base font-bold text-text-heading hover:text-accent-primary transition-colors cursor-pointer truncate"
              >
                {project.title}
              </h3>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0 ${typeBadgeColor}`}>
                {project.type}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-text-muted mt-0.5 flex-wrap">
              {project.genre && <span>{project.genre}</span>}
              {project.releaseDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {project.releaseDate}
                </span>
              )}
              <span>{totalTracks} lagu</span>
            </div>
          </div>
        </div>

        {/* Quick Add Song & Toggle Expand */}
        <div className="flex items-center gap-1 shrink-0">
          {onCreateSongForProject && (
            <button
              type="button"
              onClick={() => onCreateSongForProject(project.title)}
              title="Tambah Lagu ke Proyek Ini"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <Plus size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Sembunyikan Tracklist' : 'Tampilkan Tracklist'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalTracks > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium text-text-muted">
            <span>Progres Produksi Track</span>
            <span>{completedTracks} / {totalTracks} lagu ({progressPercent}%)</span>
          </div>
          <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-primary transition-all duration-300 rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      )}

      {/* Tracklist Items */}
      {isExpanded && (
        <div className="pt-1 space-y-1.5">
          {project.songs.length === 0 ? (
            <div className="py-4 text-center rounded-xl bg-bg-primary/50 text-xs text-text-muted">
              Belum ada lagu yang dimasukkan ke proyek ini.
              {onCreateSongForProject && (
                <button
                  type="button"
                  onClick={() => onCreateSongForProject(project.title)}
                  className="block mx-auto mt-1.5 text-accent-primary hover:underline font-medium cursor-pointer"
                >
                  + Tambah Lagu Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border-default/20 bg-bg-primary/60 rounded-xl overflow-hidden">
              {project.songs.map((song, index) => (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song.id)}
                  className="px-3 py-2 flex items-center justify-between hover:bg-bg-hover transition-colors cursor-pointer group select-none text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-text-muted w-4 shrink-0 text-right">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-text-primary group-hover:text-accent-primary truncate">
                      {song.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {song.key && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-secondary text-text-secondary">
                        {song.key}
                      </span>
                    )}
                    {song.bpm && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-secondary text-text-secondary">
                        {song.bpm}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted font-medium capitalize">
                      {song.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
