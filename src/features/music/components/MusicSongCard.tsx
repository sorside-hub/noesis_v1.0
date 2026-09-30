import React, { useState } from 'react';
import { Music2, Mic, Clock, ChevronRight, Hash, MoreVertical } from 'lucide-react';
import { SongItem, MusicProductionStatus, PRODUCTION_STAGES } from '../types';

interface MusicSongCardProps {
  song: SongItem;
  onSelectSong: (songId: string) => void;
  onUpdateStatus?: (songId: string, status: MusicProductionStatus) => void;
}

export const MusicSongCard: React.FC<MusicSongCardProps> = ({
  song,
  onSelectSong,
  onUpdateStatus,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const currentStage = PRODUCTION_STAGES.find(s => s.id === song.status) || PRODUCTION_STAGES[0];

  return (
    <div 
      onClick={() => onSelectSong(song.id)}
      className="group relative p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-all cursor-pointer select-none flex flex-col justify-between gap-2.5"
    >
      {/* Top row: Title + Status Dropdown */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-semibold text-text-heading group-hover:text-accent-primary transition-colors truncate">
              {song.title}
            </h4>
            {song.hasAudioMemo && (
              <span title="Terdapat rekaman audio / memo" className="flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary font-medium shrink-0">
                <Mic size={10} className="mr-0.5" /> Demo
              </span>
            )}
          </div>

          {song.project && (
            <p className="text-[11px] text-text-muted mt-0.5 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 shrink-0" />
              {song.project}
            </p>
          )}
        </div>

        {/* Status Badge & Clickable Selector */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${currentStage.bgLight} ${currentStage.color}`}
          >
            <span>{currentStage.icon}</span>
            <span>{currentStage.label}</span>
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-bg-secondary rounded-xl shadow-xl p-1 z-30 ring-1 ring-border-default/40 backdrop-blur-md">
              {PRODUCTION_STAGES.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    if (onUpdateStatus) onUpdateStatus(song.id, stage.id);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    song.status === stage.id
                      ? 'bg-accent-primary text-accent-contrast font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{stage.icon}</span>
                    <span>{stage.label}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Snippet Preview */}
      {song.snippet && (
        <p className="text-xs text-text-muted/80 line-clamp-2 leading-relaxed">
          {song.snippet}
        </p>
      )}

      {/* Musical Chips: Key, BPM, Tuning, Capo */}
      <div className="flex items-center justify-between pt-1 border-t border-border-default/20 text-[11px] text-text-muted">
        <div className="flex items-center gap-2 flex-wrap">
          {song.key && (
            <span className="px-1.5 py-0.5 rounded-md bg-bg-primary/80 font-mono font-medium text-text-primary text-[10px]">
              Key: {song.key}
            </span>
          )}
          {song.bpm && (
            <span className="px-1.5 py-0.5 rounded-md bg-bg-primary/80 font-mono text-text-secondary text-[10px]">
              {song.bpm} BPM
            </span>
          )}
          {song.capo !== undefined && song.capo > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-bg-primary/80 text-text-secondary text-[10px]">
              Capo {song.capo}
            </span>
          )}
        </div>

        <ChevronRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </div>
  );
};
