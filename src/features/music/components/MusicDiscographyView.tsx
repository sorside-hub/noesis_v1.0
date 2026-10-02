import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  Disc3, 
  Play, 
  Pause, 
  Music2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { StudioProjectRecord, StudioSongRecord } from '../types/studioDatabase';
import { MusicProjectType } from '../types';

interface MusicDiscographyViewProps {
  projects: StudioProjectRecord[];
  songs: StudioSongRecord[];
  onSelectSong: (songId: string) => void;
  onSelectProject: (projectId: string) => void;
  searchQuery?: string;
}

type UnifiedDiscographyItem = 
  | {
      kind: 'project';
      id: string;
      title: string;
      type: MusicProjectType;
      genre?: string;
      releaseDate?: string;
      coverUrl?: string;
      updatedAt: string;
      createdAt: string;
      tracks: StudioSongRecord[];
      rawProject: StudioProjectRecord;
    }
  | {
      kind: 'single';
      id: string;
      title: string;
      type: 'single';
      genre?: string;
      releaseDate?: string;
      coverUrl?: string;
      updatedAt: string;
      createdAt: string;
      audioUrl?: string;
      musicalKey?: string;
      bpm?: number;
      rawSong: StudioSongRecord;
    };

export const MusicDiscographyView: React.FC<MusicDiscographyViewProps> = ({
  projects,
  songs,
  onSelectSong,
  searchQuery = '',
}) => {
  const [filterType, setFilterType] = useState<'all' | 'albums' | 'singles'>('all');
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({});

  // Scroll persistence
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedY = sessionStorage.getItem('music_discography_scroll_y');
    if (savedY && listContainerRef.current) {
      const targetY = parseFloat(savedY);
      const raf = requestAnimationFrame(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTop = targetY;
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  const handleListScroll = useCallback(() => {
    if (listContainerRef.current) {
      sessionStorage.setItem('music_discography_scroll_y', String(listContainerRef.current.scrollTop));
    }
  }, []);

  // Audio preview state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = (song: StudioSongRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song.audioUrl) return;

    if (playingSongId === song.id) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(song.audioUrl);
      newAudio.onended = () => setPlayingSongId(null);
      newAudio.onerror = () => setPlayingSongId(null);
      newAudio.play().catch(() => setPlayingSongId(null));
      audioRef.current = newAudio;
      setPlayingSongId(song.id);
    }
  };

  const toggleExpand = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjectIds((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const query = searchQuery.toLowerCase().trim();

  // Unified items list (Projects + Standalone Singles, all strictly released)
  const unifiedItems = useMemo<UnifiedDiscographyItem[]>(() => {
    const list: UnifiedDiscographyItem[] = [];

    // 1. Released Projects (Albums & EPs)
    projects
      .filter((p) => p.status === 'released')
      .forEach((proj) => {
        const projectSongs = songs
          .filter((s) => s.projectId === proj.id)
          .sort((a, b) => {
            if (a.trackNumber && b.trackNumber && a.trackNumber !== b.trackNumber) {
              return a.trackNumber - b.trackNumber;
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

        list.push({
          kind: 'project',
          id: proj.id,
          title: proj.title,
          type: proj.type,
          genre: proj.genre,
          releaseDate: proj.targetReleaseDate,
          coverUrl: proj.coverUrl,
          updatedAt: proj.updatedAt,
          createdAt: proj.createdAt,
          tracks: projectSongs,
          rawProject: proj,
        });
      });

    // 2. Released Standalone Singles
    songs
      .filter((s) => {
        const isStandalone = !s.projectId || !projects.some((p) => p.id === s.projectId);
        return isStandalone && s.status === 'released';
      })
      .forEach((song) => {
        list.push({
          kind: 'single',
          id: song.id,
          title: song.title,
          type: 'single',
          genre: song.genre,
          releaseDate: song.targetReleaseDate,
          coverUrl: song.coverUrl,
          updatedAt: song.updatedAt,
          createdAt: song.createdAt,
          audioUrl: song.audioUrl,
          musicalKey: song.musicalKey,
          bpm: song.bpm,
          rawSong: song,
        });
      });

    // Sort by release date (or updatedAt) descending
    list.sort((a, b) => {
      const timeA = a.releaseDate ? new Date(a.releaseDate).getTime() : new Date(a.updatedAt).getTime();
      const timeB = b.releaseDate ? new Date(b.releaseDate).getTime() : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });

    return list;
  }, [projects, songs]);

  // Filter based on selected tab and search query
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Tab Filter
      if (filterType === 'albums' && item.kind !== 'project') {
        return false;
      }
      if (filterType === 'singles' && item.kind !== 'single') {
        return false;
      }

      // Search Query
      if (query) {
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchGenre = item.genre?.toLowerCase().includes(query);
        return matchTitle || matchGenre;
      }

      return true;
    });
  }, [unifiedItems, filterType, query]);

  return (
    <div className="flex-1 min-h-0 flex flex-col select-none overflow-hidden">
      {/* FILTER TABS (FIXED AT TOP, DOES NOT SCROLL WITH LIST) */}
      <div className="flex justify-center w-full shrink-0 pb-3 pt-1 bg-bg-primary z-10">
        <div className="flex items-center gap-1.5 p-1 bg-bg-secondary rounded-xl border border-border-default/20">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterType('albums')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'albums'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            EP / Album
          </button>
          <button
            type="button"
            onClick={() => setFilterType('singles')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'singles'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Single
          </button>
        </div>
      </div>

      {/* SCROLLABLE LIST CONTAINER */}
      <div 
        ref={listContainerRef}
        onScroll={handleListScroll}
        className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pb-24 [scrollbar-width:thin]"
      >
        {/* EMPTY STATE */}
        {filteredItems.length === 0 && (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-bg-secondary/40 border border-dashed border-border-default/30 space-y-3 max-w-md mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-bg-primary text-text-secondary mx-auto flex items-center justify-center">
              <Disc3 size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base text-text-heading">
                Belum Ada Karya yang Dirilis
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Karya album, EP, atau single yang berstatus rilis akan otomatis tampil di sini.
              </p>
            </div>
          </div>
        )}

        {/* UNIFIED DISCOGRAPHY LIST */}
        {filteredItems.length > 0 && (
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const isExpanded = item.kind === 'project' && !!expandedProjectIds[item.id];
              const isSingle = item.kind === 'single';

              return (
                <div 
                  key={item.id}
                  className="rounded-2xl bg-bg-secondary overflow-hidden shadow-xs hover:shadow-md transition-all group border border-border-default/20"
                >
                  {/* MAIN ROW: IDENTICAL ACROSS SINGLE, EP, AND ALBUM */}
                  <div 
                    onClick={(e) => {
                      if (item.kind === 'project') {
                        toggleExpand(item.id, e);
                      } else {
                        onSelectSong(item.id);
                      }
                    }}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-bg-hover transition-colors"
                  >
                    {/* LEFT: ICON + INFO */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* ICON / COVER ART BOX */}
                      {item.coverUrl ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-bg-primary shrink-0 transition-transform group-hover:scale-105 border border-border-default/20 shadow-xs">
                          <img 
                            src={item.coverUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-bg-primary text-text-secondary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:text-accent-primary border border-border-default/10 shadow-xs">
                          {isSingle ? <Music2 size={22} /> : <Disc3 size={22} />}
                        </div>
                      )}

                      {/* TEXT CONTENT: JUDUL + INFO SUB-TEXT */}
                      <div className="min-w-0 flex-1">
                        {/* ROW 1: JUDUL */}
                        <h3 className="text-xs sm:text-sm font-bold text-text-heading group-hover:text-accent-primary transition-colors truncate">
                          {item.title || 'Tanpa Judul'}
                        </h3>

                        {/* ROW 2: INFO TYPE • (TRACKS) • TANGGAL RILIS (MUTED TEXT, NO BADGES) */}
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5 truncate font-medium">
                          <span className="shrink-0">
                            {item.kind === 'project' 
                              ? item.type === 'album' ? 'Album' : 'EP' 
                              : 'Single'}
                          </span>

                          {item.kind === 'project' && (
                            <>
                              <span className="shrink-0 opacity-40">•</span>
                              <span className="shrink-0">{item.tracks.length} Track</span>
                            </>
                          )}

                          {item.genre && (
                            <>
                              <span className="shrink-0 opacity-40">•</span>
                              <span className="shrink-0 truncate">{item.genre}</span>
                            </>
                          )}

                          {item.releaseDate && (
                            <>
                              <span className="shrink-0 opacity-40">•</span>
                              <span className="shrink-0 font-mono">{item.releaseDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Audio Play preview for single */}
                      {isSingle && item.audioUrl && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePlay(item.rawSong, e)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            playingSongId === item.id 
                              ? 'bg-accent-primary text-accent-contrast shadow-xs' 
                              : 'bg-bg-primary text-text-muted hover:text-text-primary'
                          }`}
                          title={playingSongId === item.id ? 'Jeda preview' : 'Putar preview'}
                        >
                          {playingSongId === item.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                        </button>
                      )}

                      {/* Accordion toggle icon for EP / Album */}
                      {!isSingle && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(item.id, e)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-bg-primary text-accent-primary shadow-xs'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-primary'
                          }`}
                          title={isExpanded ? 'Tutup daftar track' : 'Buka daftar track'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EXPANDED TRACKLIST FOR EP / ALBUM (CLEAN: NUMBER & TITLE ONLY) */}
                  {item.kind === 'project' && isExpanded && (
                    <div className="border-t border-border-default/15 bg-bg-primary/40 divide-y divide-border-default/10 animate-in fade-in duration-150">
                      {item.tracks.length === 0 ? (
                        <div className="px-5 py-4 text-center text-xs text-text-muted">
                          Belum ada track dalam {item.type === 'album' ? 'Album' : 'EP'} ini.
                        </div>
                      ) : (
                        item.tracks.map((track, idx) => {
                          const trackNum = track.trackNumber || idx + 1;

                          return (
                            <div
                              key={track.id}
                              onClick={() => onSelectSong(track.id)}
                              className="px-4 sm:px-5 py-2.5 flex items-center gap-3.5 hover:bg-bg-hover transition-colors cursor-pointer group/track"
                            >
                              <span className="text-[11px] font-mono text-text-muted w-5 text-center shrink-0">
                                {trackNum < 10 ? `0${trackNum}` : trackNum}
                              </span>

                              <span className="text-xs font-semibold text-text-primary group-hover/track:text-accent-primary transition-colors truncate">
                                {track.title}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
