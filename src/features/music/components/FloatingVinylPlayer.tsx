import React, { useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Shuffle,
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
    isShuffled,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    toggleLoop,
    toggleShuffle,
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

  const hasMultipleTracks = queue.length > 1;

  // Format compact info release: "Single" vs "EP • [Judul]" vs "Album • [Judul]"
  const formattedSubtitle = useMemo(() => {
    if (!currentTrack) return '';
    if (currentTrack.albumTitle) {
      const typeLabel = currentTrack.projectType === 'album' ? 'Album' : 'EP';
      return `${typeLabel} • ${currentTrack.albumTitle}`;
    }
    return 'Single';
  }, [currentTrack]);

  if (!currentTrack) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-15 sm:bottom-16 right-3.5 sm:right-6 z-40 select-none flex items-center justify-end"
    >
      {/* 
        ONE SEAMLESS VIBRANT AMBIENT CAPSULE
        - Translucent glass with bright cover art blur shining through
        - Smooth rounded-l-2xl on left and rounded-r-full on right
      */}
      <div
        className={`transition-all duration-300 ease-out flex items-center justify-end relative ${
          isExpanded
            ? 'w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-[400px] h-14 sm:h-15 pl-4 pr-1 bg-neutral-950/40 backdrop-blur-2xl rounded-l-2xl rounded-r-full overflow-hidden shadow-2xl'
            : 'w-13 h-13 sm:w-14 sm:h-14 p-0 bg-transparent rounded-full overflow-visible'
        }`}
      >
        {/* VIBRANT AMBIENT COVER ART BACKGROUND (Non-pitch-black glass) */}
        {isExpanded && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-l-2xl rounded-r-full -z-10">
            {currentTrack.coverUrl ? (
              <div 
                className="absolute inset-0 bg-cover bg-center blur-2xl scale-125 opacity-75 transition-all duration-500"
                style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-900" />
            )}
            {/* Soft dark tint layer for text readability without darkening to pitch-black */}
            <div className="absolute inset-0 bg-black/35 backdrop-blur-xl" />
          </div>
        )}

        {/* 1. CONTROLS & INFO (Left side inside the capsule) */}
        <div
          className={`transition-all duration-300 ease-out overflow-hidden flex-1 flex flex-col justify-center h-full ${
            isExpanded
              ? 'opacity-100 max-w-[calc(100%-3.5rem)] mr-1 scale-100 pointer-events-auto'
              : 'opacity-0 max-w-0 mr-0 scale-95 pointer-events-none'
          }`}
        >
          {/* TOP ROW: Title & Subtitle on Left, Controls on Right */}
          <div className="flex items-center justify-between gap-1">
            {/* Title & Subtitle */}
            <div className="min-w-0 flex-1 pr-1">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight drop-shadow-sm">
                {currentTrack.title || 'Tanpa Judul'}
              </h4>
              <p className="text-[10px] text-white/70 truncate leading-tight font-medium mt-0.5 drop-shadow-xs">
                {formattedSubtitle}
                {hasMultipleTracks && (
                  <span className="ml-1 font-mono text-white/60">
                    ({currentIndex + 1}/{queue.length})
                  </span>
                )}
              </p>
            </div>

            {/* Inline Controls (⏮️ ⏯️ ⏭️ 🔀 🔁 ✕) */}
            <div className="flex items-center gap-1 shrink-0 text-white/90">
              {/* Prev */}
              <button
                type="button"
                onClick={prevTrack}
                disabled={queue.length <= 1 && currentTime <= 3}
                title="Lagu Sebelumnya"
                className="p-1 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipBack size={12} fill="currentColor" />
              </button>

              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={togglePlay}
                title={isPlaying ? 'Jeda' : 'Putar'}
                className="w-7 h-7 rounded-xl bg-accent-primary text-accent-contrast shadow-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={nextTrack}
                disabled={queue.length <= 1}
                title="Lagu Berikutnya"
                className="p-1 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipForward size={12} fill="currentColor" />
              </button>

              {/* Shuffle Toggle */}
              <button
                type="button"
                onClick={toggleShuffle}
                title={isShuffled ? 'Acak Lagu: Aktif' : 'Acak Lagu: Mati'}
                className={`p-1 transition-colors cursor-pointer ${
                  isShuffled ? 'text-accent-primary font-bold' : 'hover:text-white'
                }`}
              >
                <Shuffle size={12} />
              </button>

              {/* Loop */}
              <button
                type="button"
                onClick={toggleLoop}
                title={isLooping ? 'Ulangi: Aktif' : 'Ulangi: Mati'}
                className={`p-1 transition-colors cursor-pointer ${
                  isLooping ? 'text-accent-primary font-bold' : 'hover:text-white'
                }`}
              >
                <Repeat size={12} />
              </button>

              {/* Close & Stop */}
              <button
                type="button"
                onClick={closePlayer}
                title="Tutup & Hentikan Audio"
                className="p-1 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* BOTTOM ROW: Timeline Scrubber + Timestamps */}
          <div className="space-y-0.5 mt-0.5">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--color-accent-primary, #b45309) ${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%, rgba(255, 255, 255, 0.3) ${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%)`
                }}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer focus:outline-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary [&::-webkit-slider-thumb]:shadow-xs [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-white/70 font-medium px-0.5 leading-none drop-shadow-xs">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* 2. THE VINYL DISK (Full-size Picture Disc Artwork - Centered Vertically) */}
        <div className="relative group shrink-0 my-auto self-center flex items-center justify-center">
          {/* Quick Play/Pause Badge when Collapsed */}
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
              {isPlaying ? <Pause size={8} fill="currentColor" /> : <Play size={8} fill="currentColor" className="ml-0.5" />}
            </button>
          )}

          {/* The Vinyl Disk Button: Full Artwork Picture Disc */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Tutup Kontrol' : `Buka Kontrol: ${currentTrack.title}`}
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full p-0.5 bg-neutral-950 border border-white/20 shadow-xl transition-all cursor-pointer relative overflow-hidden group/disc hover:scale-102 active:scale-95 my-auto self-center"
          >
            {/* Spinning Full Picture Disc Artwork */}
            <div 
              className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden shadow-inner ${
                isPlaying ? 'animate-spin [animation-duration:6s] linear' : ''
              }`}
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              {/* Full Picture Disc Cover Art */}
              {currentTrack.coverUrl ? (
                <img 
                  src={currentTrack.coverUrl} 
                  alt="" 
                  className="w-full h-full object-cover pointer-events-none rounded-full" 
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 text-accent-primary flex items-center justify-center">
                  <Music2 size={14} />
                </div>
              )}

              {/* Overlay Vinyl Groove Rings Texture */}
              <div className="absolute inset-0 rounded-full border border-black/30 pointer-events-none" />
              <div className="absolute inset-2 sm:inset-2.5 rounded-full border border-black/20 pointer-events-none" />
              <div className="absolute inset-4 sm:inset-5 rounded-full border border-black/15 pointer-events-none" />

              {/* Center Spindle Ring & Hole */}
              <div className="absolute inset-0 m-auto w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-neutral-950/80 border border-white/20 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 border border-neutral-600/80" />
              </div>
            </div>

            {isPlaying && (
              <span className="absolute inset-0 rounded-full ring-1 ring-accent-primary/50 pointer-events-none animate-pulse" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
