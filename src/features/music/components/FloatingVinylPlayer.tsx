import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  X, 
  Music2 
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const FloatingVinylPlayer: React.FC = () => {
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    isExpanded,
    isLooping,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    toggleLoop,
    setIsExpanded,
    closePlayer,
  } = useMusicPlayer();

  const containerRef = useRef<HTMLDivElement>(null);

  // Close expand when clicking anywhere outside
  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isExpanded, setIsExpanded]);

  if (!currentTrack) return null;

  const hasMultipleTracks = queue.length > 1;

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-20 right-3 sm:bottom-22 sm:right-6 z-40 select-none flex items-center justify-end"
    >
      {/* 1. SLIDE-OUT EXPANDED CARD (Appears to the LEFT of the vinyl) */}
      <div
        className={`transition-all duration-300 ease-out transform origin-right overflow-hidden ${
          isExpanded
            ? 'w-[calc(100vw-5.5rem)] max-w-[290px] sm:max-w-[340px] opacity-100 scale-100 mr-2 sm:mr-2.5 pointer-events-auto shadow-2xl'
            : 'w-0 max-w-0 opacity-0 scale-95 mr-0 pointer-events-none'
        }`}
      >
        <div className="bg-bg-primary/95 backdrop-blur-xl border border-border-default/30 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 shadow-2xl min-w-[270px] sm:min-w-[320px]">
          
          {/* ROW 1: TITLE & CLOSE STOP BUTTON */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-text-heading truncate">
                {currentTrack.title || 'Tanpa Judul'}
              </h4>
              <p className="text-[10px] text-text-muted truncate">
                {currentTrack.subtitle || currentTrack.albumTitle || 'Rilis Resmi'}
                {hasMultipleTracks && (
                  <span className="ml-1 font-mono opacity-80">
                    ({currentIndex + 1}/{queue.length})
                  </span>
                )}
              </p>
            </div>

            {/* Stop / Close Player */}
            <button
              type="button"
              onClick={closePlayer}
              title="Tutup & Hentikan Audio"
              className="p-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {/* ROW 2: TIMELINE / SEEKBAR */}
          <div className="space-y-1">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-accent-primary focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-text-muted font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ROW 3: PLAYBACK CONTROLS */}
          <div className="flex items-center justify-between pt-0.5">
            {/* Loop toggle */}
            <button
              type="button"
              onClick={toggleLoop}
              title={isLooping ? 'Ulangi: Aktif' : 'Ulangi: Mati'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLooping 
                  ? 'text-accent-primary bg-accent-primary/15' 
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <Repeat size={13} />
            </button>

            {/* Main buttons: Prev, Play/Pause, Next */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevTrack}
                disabled={!hasMultipleTracks && currentTime <= 3}
                title="Lagu Sebelumnya"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipBack size={14} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                title={isPlaying ? 'Jeda' : 'Putar'}
                className="w-8 h-8 rounded-xl bg-accent-primary text-accent-contrast shadow-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                disabled={!hasMultipleTracks || currentIndex >= queue.length - 1}
                title="Lagu Berikutnya"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipForward size={14} />
              </button>
            </div>

            {/* Spacer for symmetry */}
            <div className="w-6" />
          </div>

        </div>
      </div>

      {/* 2. THE VINYL DISK (Anchored on the RIGHT) */}
      <div className="relative group shrink-0">
        {/* Corner Play/Pause Badge (When Collapsed) */}
        {!isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? 'Jeda' : 'Putar'}
            className="absolute -top-1 -right-1 z-50 w-5 h-5 rounded-full bg-accent-primary text-accent-contrast shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause size={8} /> : <Play size={8} className="ml-0.5" />}
          </button>
        )}

        {/* The Vinyl Disk Button: Click toggles Expand/Collapse */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Tutup Kontrol' : `Buka Kontrol: ${currentTrack.title}`}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-1 bg-neutral-950 border-2 transition-all cursor-pointer relative overflow-hidden group/disc ${
            isExpanded 
              ? 'border-accent-primary shadow-xl scale-102 ring-2 ring-accent-primary/40' 
              : 'border-neutral-700/80 shadow-2xl hover:scale-105 active:scale-95'
          }`}
        >
          {/* Spinning Groove & Artwork */}
          <div 
            className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden transition-all ${
              isPlaying ? 'animate-spin [animation-duration:5s] linear' : ''
            }`}
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          >
            {/* Vinyl Groove Rings Texture */}
            <div className="absolute inset-0 rounded-full border border-neutral-800/80 pointer-events-none" />
            <div className="absolute inset-1.5 rounded-full border border-neutral-800/60 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-neutral-800/40 pointer-events-none" />

            {/* Center Artwork Label */}
            <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-bg-primary relative flex items-center justify-center border border-neutral-900 shadow-inner">
              {currentTrack.coverUrl ? (
                <img 
                  src={currentTrack.coverUrl} 
                  alt="" 
                  className="w-full h-full object-cover pointer-events-none" 
                />
              ) : (
                <div className="w-full h-full bg-accent-primary/20 text-accent-primary flex items-center justify-center">
                  <Music2 size={11} />
                </div>
              )}

              {/* Center Spindle Hole */}
              <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-neutral-950 border border-neutral-600/80 pointer-events-none" />
            </div>
          </div>

          {/* Glowing outline pulse when playing */}
          {isPlaying && (
            <span className="absolute inset-0 rounded-full ring-2 ring-accent-primary/50 pointer-events-none animate-pulse" />
          )}
        </button>
      </div>

    </div>
  );
};
