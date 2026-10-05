import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Sparkles, 
  Disc3,
  ChevronDown,
  Check,
  Upload,
  Play,
  Pause,
  Music2,
  Image as ImageIcon,
} from 'lucide-react';
import { StudioSongRecord, StudioProjectRecord } from '../types/studioDatabase';
import { PRODUCTION_STAGES } from '../types';
import { saveStudioSong } from '../lib/musicStudioStorage';
import { InsertAudioModal } from '../../editor/components/InsertAudioModal';
import { InsertImageModal } from '../../editor/components/InsertImageModal';
import { ThemeSelector } from './ThemeSelector';

interface SingleMetadataSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  song: StudioSongRecord;
  projects?: StudioProjectRecord[];
  allSongs?: StudioSongRecord[];
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
  allSongs = [],
  onUpdateSong,
  drawerRef,
  backdropRef,
}) => {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusContainerRef = useRef<HTMLDivElement>(null);

  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const trackDropdownRef = useRef<HTMLDivElement>(null);

  const parentProject = projects.find((p) => p.id === song.projectId);
  const isTrack = Boolean(parentProject || song.projectId);
  const isTrackCompleted = song.status === 'ready' || song.status === 'released';
  const isReadyOrReleased = song.status === 'ready' || song.status === 'released' || parentProject?.status === 'ready' || parentProject?.status === 'released';

  const existingThemes = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(allSongs)) {
      allSongs.forEach((s) => {
        if (s.theme && s.theme.trim()) set.add(s.theme.trim());
      });
    }
    if (Array.isArray(projects)) {
      projects.forEach((p) => {
        if (p.theme && p.theme.trim()) set.add(p.theme.trim());
      });
    }
    return Array.from(set);
  }, [allSongs, projects]);

  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [song.audioUrl]);

  const handleToggleSidebarAudio = () => {
    if (!song.audioUrl) return;

    if (isPlayingAudio) {
      audioPlayerRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioPlayerRef.current || audioPlayerRef.current.src !== song.audioUrl) {
        audioPlayerRef.current = new Audio(song.audioUrl);
        audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
        audioPlayerRef.current.onerror = () => setIsPlayingAudio(false);
      }
      audioPlayerRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  // Sibling tracks in the same parent project
  const siblingTracks = useMemo(() => {
    if (!song.projectId) return [];
    return allSongs
      .filter((s) => s.projectId === song.projectId)
      .sort((a, b) => {
        if (a.trackNumber && b.trackNumber && a.trackNumber !== b.trackNumber) {
          return a.trackNumber - b.trackNumber;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allSongs, song.projectId]);

  // Handle reordering track number with smart auto-shift
  const handleTrackNumberChange = async (targetTrackNumber: number) => {
    if (!song.projectId || siblingTracks.length <= 1) {
      onUpdateSong({ trackNumber: targetTrackNumber });
      return;
    }

    const currentIndex = siblingTracks.findIndex((s) => s.id === song.id);
    const targetIndex = targetTrackNumber - 1;

    if (currentIndex === -1 || currentIndex === targetIndex) return;

    const reordered = [...siblingTracks];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Apply new track numbers to all sibling tracks
    for (let i = 0; i < reordered.length; i++) {
      const item = reordered[i];
      const newNum = i + 1;
      if (item.id === song.id) {
        onUpdateSong({ trackNumber: newNum });
      } else if (item.trackNumber !== newNum) {
        await saveStudioSong({
          ...item,
          trackNumber: newNum,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusContainerRef.current && !statusContainerRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (trackDropdownRef.current && !trackDropdownRef.current.contains(e.target as Node)) {
        setIsTrackDropdownOpen(false);
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

  const currentStage = PRODUCTION_STAGES.find((s) => s.id === song.status) || PRODUCTION_STAGES[0];

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
              {isTrack ? <Disc3 size={16} /> : <Sparkles size={16} />}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-text-heading truncate">
                {isTrack ? 'Metadata Track' : 'Metadata Single'}
              </h2>
              <p className="text-[11px] text-text-muted truncate">{song.title}</p>
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
          
          {/* STATUS PRODUKSI (HANYA UNTUK SINGLE, TRACK MENGINDIKASIKAN ALBUM) */}
          {!isTrack && (
            <div className="space-y-1.5" ref={statusContainerRef}>
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Status Produksi
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
                        const isSelected = song.status === stage.id;
                        return (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => {
                              onUpdateSong({ status: stage.id, progress: 0 });
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
          )}

          {/* TRACK MODE: INFORMASI PROYEK & NOMOR TRACK */}
          {isTrack && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Informasi Album & Track
              </label>

              <div className="p-3.5 rounded-2xl bg-bg-primary space-y-2.5 text-xs">
                {/* Album Induk - Tanpa Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Album Induk</span>
                  <span className="font-semibold text-text-primary truncate max-w-[140px] text-right">
                    {parentProject?.title || 'EP / Album'}
                  </span>
                </div>

                <div className="h-px bg-bg-secondary/80" />

                {/* Nomor Track - Custom Animated Dropdown (Pas dengan ukuran input, tidak membesar/melebar) */}
                <div className="flex items-center justify-between" ref={trackDropdownRef}>
                  <span className="text-text-muted">Nomor Track</span>
                  {siblingTracks.length > 1 ? (
                    <div className="w-20 h-8 relative">
                      {!isTrackDropdownOpen ? (
                        <button
                          type="button"
                          onClick={() => setIsTrackDropdownOpen(true)}
                          className="w-full h-8 px-2 text-xs font-mono font-semibold text-text-primary hover:text-text-primary bg-bg-secondary hover:bg-bg-hover/50 rounded-xl flex items-center justify-between gap-1 cursor-pointer transition-colors"
                          title="Ubah urutan nomor track dalam album"
                        >
                          <span className="truncate w-full text-center">
                            #{song.trackNumber || 1}
                          </span>
                          <ChevronDown size={12} className="text-text-muted shrink-0" />
                        </button>
                      ) : (
                        <div className="absolute top-0 left-0 right-0 w-full z-50 bg-bg-secondary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => setIsTrackDropdownOpen(false)}
                            className="w-full h-8 px-2 text-xs font-mono font-bold text-text-primary hover:bg-bg-hover/50 flex items-center justify-between gap-1 cursor-pointer transition-colors"
                          >
                            <span className="truncate w-full text-center">
                              #{song.trackNumber || 1}
                            </span>
                            <ChevronDown size={12} className="text-text-primary shrink-0 rotate-180 transition-transform" />
                          </button>

                          <div className="mx-2 h-px bg-border-default/30" />

                          <div className="max-h-44 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                            {siblingTracks.map((_, idx) => {
                              const trackNum = idx + 1;
                              const isSelected = (song.trackNumber || 1) === trackNum;
                              return (
                                <button
                                  key={trackNum}
                                  type="button"
                                  onClick={() => {
                                    handleTrackNumberChange(trackNum);
                                    setIsTrackDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-colors text-left ${
                                    isSelected
                                      ? 'bg-bg-primary text-text-primary font-bold'
                                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/60'
                                  }`}
                                >
                                  <span>#{trackNum}</span>
                                  {isSelected && <Check size={11} className="text-text-primary shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono font-semibold text-text-primary bg-bg-secondary px-2.5 py-0.5 rounded-md text-xs">
                      #{song.trackNumber || 1}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMA LAGU / TRACK */}
          <ThemeSelector
            label={`Tema ${isTrack ? 'Track' : 'Lagu'}`}
            theme={song.theme}
            existingThemes={existingThemes}
            placeholder={`Tulis tema ${isTrack ? 'track' : 'lagu'}...`}
            onChange={(newTheme) => onUpdateSong({ theme: newTheme || '' })}
          />

          {/* PROGRES STAGE AKTIF / TRACK (Hanya jika belum ready/released) */}
          {!isReadyOrReleased && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block truncate">
                  {isTrack ? 'Progres Lirik Track' : `Progres ${currentStage.label}`}
                </label>
                {(() => {
                  const prog = song.progress || 0;
                  const colorClass = prog === 100 ? 'text-emerald-400' : prog >= 50 ? 'text-amber-400' : 'text-text-muted';
                  return (
                    <span className={`text-[11px] font-mono font-bold bg-bg-primary px-2 py-0.5 rounded-lg shrink-0 ${colorClass}`}>
                      {prog}%
                    </span>
                  );
                })()}
              </div>

              <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3">
                {/* Slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={song.progress || 0}
                  onChange={(e) => onUpdateSong({ progress: Number(e.target.value) })}
                  className="w-full accent-accent-primary h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
                />

                {/* Quick Preset Buttons */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-semibold">
                  {[0, 25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateSong({ progress: preset })}
                      className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                        (song.progress || 0) === preset
                          ? 'bg-accent-primary text-accent-contrast shadow-xs'
                          : 'bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>

                {/* Progress Comment / Note Field */}
                <input
                  type="text"
                  placeholder="Catatan progres (misal: 'Chorus kurang mantab')..."
                  value={song.progressNote || ''}
                  onChange={(e) => onUpdateSong({ progressNote: e.target.value })}
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

          {/* COVER ART & AUDIO RILIS / MASTER (MUNCUL DI TAHAP READY & RELEASED) */}
          {isReadyOrReleased && (
            <div className="space-y-4">
              
              {/* COVER ART RILIS (HANYA UNTUK SINGLE MANDIRI, BUKAN TRACK ALBUM) */}
              {!isTrack && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                      Cover Art Rilis
                    </label>
                    {song.coverUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Terpasang
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3">
                    {!song.coverUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsCoverModalOpen(true)}
                        className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary hover:bg-bg-hover text-accent-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <ImageIcon size={14} />
                        <span>Lampirkan Cover Art</span>
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Cover Image Preview */}
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-bg-secondary">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-bg-primary shrink-0 shadow-xs border border-border-default/20">
                            <img 
                              src={song.coverUrl} 
                              alt="Cover Art" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-text-primary truncate">
                              {song.title || 'Cover Artwork'}
                            </p>
                            <p className="text-[10px] text-text-muted truncate">
                              Artwork 1:1 Resmi
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
                            onClick={() => onUpdateSong({ coverUrl: undefined })}
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

              {/* AUDIO RILIS / MASTER (UNTUK SINGLE & TRACK) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                    Audio Rilis / Master
                  </label>
                  {song.audioUrl && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Terpasang
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3">
                  {!song.audioUrl ? (
                    <button
                      type="button"
                      onClick={() => setIsAudioModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary hover:bg-bg-hover text-accent-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload size={14} />
                      <span>Lampirkan Audio Rilis</span>
                    </button>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Audio Preview Item */}
                      <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-bg-secondary">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={handleToggleSidebarAudio}
                            className="w-8 h-8 rounded-lg bg-bg-primary text-accent-primary hover:scale-105 flex items-center justify-center shrink-0 cursor-pointer transition-transform"
                            title={isPlayingAudio ? 'Jeda' : 'Putar'}
                          >
                            {isPlayingAudio ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-text-primary truncate">
                              {song.title || 'Audio Master'}
                            </p>
                            <p className="text-[10px] text-text-muted truncate">
                              Audio Rilis Resmi
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions: Ganti / Hapus */}
                      <div className="flex items-center justify-end gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsAudioModalOpen(true)}
                          className="px-2.5 py-1 text-[11px] font-medium text-text-muted hover:text-text-primary bg-bg-secondary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
                        >
                          Ganti Audio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (audioPlayerRef.current) {
                              audioPlayerRef.current.pause();
                              setIsPlayingAudio(false);
                            }
                            onUpdateSong({ audioUrl: undefined });
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* DETAIL WAKTU */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Detail Waktu
            </label>

            <div className="p-3.5 rounded-2xl bg-bg-primary space-y-3 text-xs">
              {/* Target Tanggal Rilis (HANYA UNTUK SINGLE MANDIRI) */}
              {!isTrack && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                      <span>{(song.status === 'ready' || song.status === 'released') ? 'Tanggal Rilis' : 'Target Rilis'}</span>
                      {song.targetReleaseDate && (
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ targetReleaseDate: undefined })}
                          className="text-[10px] text-text-muted hover:text-status-error cursor-pointer transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    
                    <div className="relative w-full h-9 group">
                      {/* Visual presentation layer */}
                      <div className="w-full h-9 px-3 flex items-center justify-between text-xs bg-bg-secondary group-hover:bg-bg-hover/60 rounded-xl transition-colors pointer-events-none">
                        <span className={song.targetReleaseDate ? 'text-text-primary font-medium' : 'text-text-muted'}>
                          {song.targetReleaseDate ? formatDate(song.targetReleaseDate) : 'Pilih tanggal rilis...'}
                        </span>
                        <ChevronDown size={14} className="text-icon-secondary shrink-0" />
                      </div>

                      {/* Native transparent date input overlay */}
                      <input
                        type="date"
                        value={song.targetReleaseDate || ''}
                        onChange={(e) => onUpdateSong({ targetReleaseDate: e.target.value || undefined })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title="Pilih tanggal rilis"
                      />
                    </div>
                  </div>
                  <div className="h-px bg-bg-secondary/80" />
                </>
              )}

              {/* Tanggal Dibuat */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-icon-secondary" />
                  <span>Dibuat</span>
                </div>
                <span className="font-mono text-text-secondary">{formatDate(song.createdAt)}</span>
              </div>

              {/* Terakhir Diubah */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-icon-secondary" />
                  <span>Diubah</span>
                </div>
                <span className="font-mono text-text-secondary">{formatDate(song.updatedAt)}</span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* MODAL LAMPIRKAN AUDIO RILIS (2 TAB: UNGGAH & PUSTAKA) */}
      <InsertAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        allowRecord={false}
        modalTitle="Lampirkan Audio Rilis"
        defaultTitle={song.title || 'Audio Rilis'}
        submitButtonText="Simpan Audio Rilis"
        onInsertAudio={({ src }) => {
          onUpdateSong({ audioUrl: src });
          setIsAudioModalOpen(false);
        }}
      />

      {/* MODAL LAMPIRKAN COVER ART RILIS */}
      <InsertImageModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        customTitle="Lampirkan Cover Art"
        uploadTabLabel="Unggah Cover"
        libraryTabLabel="Pustaka Cover"
        submitButtonLabel="Gunakan Sebagai Cover Art"
        onInsertImage={({ src }) => {
          onUpdateSong({ coverUrl: src });
          setIsCoverModalOpen(false);
        }}
      />
    </>
  );
};
