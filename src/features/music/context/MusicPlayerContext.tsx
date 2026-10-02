import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

export interface PlayableTrack {
  id: string;
  title: string;
  subtitle?: string;
  audioUrl: string;
  coverUrl?: string;
  projectId?: string;
  albumTitle?: string;
}

interface MusicPlayerContextType {
  currentTrack: PlayableTrack | null;
  queue: PlayableTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  isLooping: boolean;
  playTrack: (track: PlayableTrack, queue?: PlayableTrack[]) => void;
  playAlbum: (albumTitle: string, coverUrl: string | undefined, tracks: { id: string; title: string; audioUrl?: string; coverUrl?: string }[]) => void;
  togglePlay: () => void;
  seekTo: (timeInSeconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLoop: () => void;
  setIsExpanded: (expanded: boolean) => void;
  closePlayer: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Handle track transition
  const playTrackAtIndex = useCallback((trackList: PlayableTrack[], index: number) => {
    if (index < 0 || index >= trackList.length) return;
    const track = trackList[index];
    if (!track?.audioUrl) return;

    setCurrentTrack(track);
    setQueue(trackList);
    setCurrentIndex(index);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback error:', err);
        setIsPlaying(false);
      });
    }
  }, []);

  // On track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else if (currentIndex < queue.length - 1) {
        playTrackAtIndex(queue, currentIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentIndex, queue, isLooping, playTrackAtIndex]);

  const playTrack = useCallback((track: PlayableTrack, newQueue?: PlayableTrack[]) => {
    if (!track.audioUrl) return;
    const finalQueue = newQueue && newQueue.length > 0 ? newQueue : [track];
    const targetIdx = finalQueue.findIndex((t) => t.id === track.id);
    const validIdx = targetIdx !== -1 ? targetIdx : 0;
    playTrackAtIndex(finalQueue, validIdx);
  }, [playTrackAtIndex]);

  const playAlbum = useCallback((
    albumTitle: string,
    coverUrl: string | undefined,
    tracks: { id: string; title: string; audioUrl?: string; coverUrl?: string }[]
  ) => {
    const validTracks: PlayableTrack[] = tracks
      .filter((t) => Boolean(t.audioUrl))
      .map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: albumTitle,
        albumTitle,
        audioUrl: t.audioUrl!,
        coverUrl: t.coverUrl || coverUrl,
      }));

    if (validTracks.length === 0) return;

    playTrackAtIndex(validTracks, 0);
  }, [playTrackAtIndex]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.warn);
    }
  }, [isPlaying, currentTrack]);

  const seekTo = useCallback((timeInSeconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
  }, []);

  const nextTrack = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      playTrackAtIndex(queue, currentIndex + 1);
    }
  }, [currentIndex, queue, playTrackAtIndex]);

  const prevTrack = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else if (currentIndex > 0) {
      playTrackAtIndex(queue, currentIndex - 1);
    } else {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [currentIndex, queue, playTrackAtIndex]);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsExpanded(false);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        isExpanded,
        isLooping,
        playTrack,
        playAlbum,
        togglePlay,
        seekTo,
        nextTrack,
        prevTrack,
        toggleLoop,
        setIsExpanded,
        closePlayer,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
