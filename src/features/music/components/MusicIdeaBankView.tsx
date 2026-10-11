import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Layers, 
  Music, 
  Mic, 
  Sparkles, 
  Filter, 
  ChevronDown,
  Check,
  Star,
  Wand2,
} from 'lucide-react';
import { StudioBarRecord, StudioSongRecord, StudioChordProgressionRecord } from '../types/studioDatabase';
import { MusicBarCard } from './MusicBarCard';
import { MusicChordCard } from './MusicChordCard';
import { ChordGeneratorModal } from './ChordGeneratorModal';
import { ChordProgressionEditorModal } from './ChordProgressionEditorModal';
import { useStudioChords } from '../hooks/useStudioChords';
import { ROOT_KEYS, MOOD_CATEGORIES } from '../lib/chordTheory';

export type BankSubTab = 'bars' | 'chords' | 'melodies';

interface MusicIdeaBankViewProps {
  bars: StudioBarRecord[];
  songs?: StudioSongRecord[];
  onOpenBarEditor: (bar: StudioBarRecord) => void;
  onCreateNewBar: () => void;
  onDuplicateBar?: (barId: string) => void;
  onDeleteBar?: (barId: string) => void;
}

export const MusicIdeaBankView: React.FC<MusicIdeaBankViewProps> = ({
  bars,
  songs = [],
  onOpenBarEditor,
  onCreateNewBar,
  onDuplicateBar,
  onDeleteBar,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<BankSubTab>('bars');

  // --- Bars State & Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // --- Chords State & Filters ---
  const {
    progressions,
    isLoading: isChordsLoading,
    playingId,
    activeStepIndex,
    playProgression,
    stopPlayback,
    playSingleChord,
    createNewProgression,
    updateProgression,
    removeProgression,
    duplicateProgression,
    toggleFavoriteProgression,
  } = useStudioChords();

  const [chordSearch, setChordSearch] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<string>('all');
  const [favoriteOnlyFilter, setFavoriteOnlyFilter] = useState<boolean>(false);
  const [showKeyDropdown, setShowKeyDropdown] = useState(false);

  // Modals
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isManualEditorOpen, setIsManualEditorOpen] = useState(false);
  const [editingProgression, setEditingProgression] = useState<StudioChordProgressionRecord | null>(null);

  // Available bar themes
  const availableThemes = useMemo(() => {
    const set = new Set<string>();
    bars.forEach((b) => {
      if (b.theme && b.theme.trim()) set.add(b.theme.trim());
    });
    return Array.from(set).sort();
  }, [bars]);

  // Counts
  const availableCount = useMemo(() => bars.filter((b) => b.status === 'available').length, [bars]);
  const usedCount = useMemo(() => bars.filter((b) => b.status === 'used').length, [bars]);

  // Filtered bars
  const filteredBars = useMemo(() => {
    return bars.filter((bar) => {
      if (statusFilter === 'available' && bar.status !== 'available') return false;
      if (statusFilter === 'used' && bar.status !== 'used') return false;
      if (selectedTheme !== 'all' && bar.theme !== selectedTheme) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = bar.title.toLowerCase().includes(q);
        const contentMatch = bar.content.toLowerCase().includes(q);
        const themeMatch = bar.theme?.toLowerCase().includes(q) || false;
        const topicMatch = bar.topic?.toLowerCase().includes(q) || false;
        const notesMatch = bar.notes?.toLowerCase().includes(q) || false;
        if (!titleMatch && !contentMatch && !themeMatch && !topicMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bars, statusFilter, selectedTheme, searchQuery]);

  // Filtered chord progressions
  const filteredProgressions = useMemo(() => {
    return progressions.filter((prog) => {
      // 1. Favorites Filter
      if (favoriteOnlyFilter && !prog.isFavorite) return false;

      // 2. Mood Filter
      if (selectedMoodFilter !== 'all' && prog.mood.toLowerCase() !== selectedMoodFilter.toLowerCase()) {
        return false;
      }

      // 3. Key Filter
      if (selectedKeyFilter !== 'all' && prog.key !== selectedKeyFilter) {
        return false;
      }

      // 4. Search Query
      if (chordSearch.trim()) {
        const q = chordSearch.toLowerCase().trim();
        const titleMatch = prog.title.toLowerCase().includes(q);
        const keyMatch = `${prog.key} ${prog.scale}`.toLowerCase().includes(q);
        const moodMatch = prog.mood.toLowerCase().includes(q);
        const chordsMatch = prog.chords.some((c) => c.toLowerCase().includes(q));
        const romansMatch = prog.romans.some((r) => r.toLowerCase().includes(q));
        const genreMatch = prog.genre?.toLowerCase().includes(q) || false;
        const descMatch = prog.description?.toLowerCase().includes(q) || false;
        if (!titleMatch && !keyMatch && !moodMatch && !chordsMatch && !romansMatch && !genreMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [progressions, favoriteOnlyFilter, selectedMoodFilter, selectedKeyFilter, chordSearch]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none overflow-hidden space-y-3">
      {/* 
        1. SUB-TABS NAVIGATION (BARS, CHORDS, MELODIES)
      */}
      <div className="flex items-center justify-between gap-2 shrink-0 border-b border-border-default/20 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Tab 1: Bar (Lirik & Sajak) */}
          <button
            type="button"
            onClick={() => setActiveSubTab('bars')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'bars'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <Layers size={14} />
            <span>Bar (Lirik)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'bars'
                  ? 'bg-black/20 text-accent-contrast'
                  : 'bg-bg-secondary text-text-muted'
              }`}
            >
              {bars.length}
            </span>
          </button>

          {/* Tab 2: Chord & Progresi - NOW FULLY ACTIVE */}
          <button
            type="button"
            onClick={() => setActiveSubTab('chords')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'chords'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <Music size={14} />
            <span>Chord & Progresi</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'chords'
                  ? 'bg-black/20 text-accent-contrast'
                  : 'bg-bg-secondary text-text-muted'
              }`}
            >
              {progressions.length}
            </span>
          </button>

          {/* Tab 3: Melodi & Voice Memo - Placeholder */}
          <button
            type="button"
            onClick={() => setActiveSubTab('melodies')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'melodies'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Mic size={14} />
            <span>Melodi & Voice</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-bg-secondary text-text-muted uppercase tracking-tight font-semibold">
              Segera
            </span>
          </button>
        </div>
      </div>

      {/* 
        2. COMING SOON SCREEN FOR MELODIES
      */}
      {activeSubTab === 'melodies' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-bg-secondary text-text-muted flex items-center justify-center">
            <Mic size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-heading">
              Bank Melodi & Voice Memo
            </h4>
            <p className="text-xs text-text-muted max-w-sm mt-1">
              Rekam potongan vokal, humming, atau petikan melodi lewat memo suara. Sedang disiapkan untuk fase selanjutnya!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab('bars')}
            className="px-3 py-1.5 rounded-xl bg-bg-secondary hover:bg-bg-hover text-xs font-semibold text-accent-primary transition-colors cursor-pointer"
          >
            Kembali ke Bank Bar
          </button>
        </div>
      )}

      {/* 
        3. CHORD & PROGRESI SUB-TAB VIEW
      */}
      {activeSubTab === 'chords' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2.5">
          {/* Top Control Bar: Search + Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={chordSearch}
                onChange={(e) => setChordSearch(e.target.value)}
                placeholder="Cari akor, kunci nada, mood, atau derajat Romawi..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
              />
              {chordSearch && (
                <button
                  type="button"
                  onClick={() => setChordSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Actions: Generator & Manual Add */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-primary text-accent-contrast text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={13} />
                <span>Generator Progresi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProgression(null);
                  setIsManualEditorOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bg-secondary hover:bg-bg-hover text-text-primary text-xs font-semibold transition-colors cursor-pointer border border-border-default/40"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Manual</span>
              </button>
            </div>
          </div>

          {/* Filter Bar: Mood Chips, Key Dropdown, Favorites Toggle */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1">
            {/* Mood Category Filters */}
            <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMoodFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMoodFilter === 'all'
                    ? 'bg-bg-primary text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Semua Mood
              </button>

              {MOOD_CATEGORIES.map((m) => {
                const isActive = selectedMoodFilter.toLowerCase() === m.id.toLowerCase();
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMoodFilter(m.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-bg-primary text-text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.id}</span>
                  </button>
                );
              })}
            </div>

            {/* Root Key Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowKeyDropdown(!showKeyDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  selectedKeyFilter !== 'all'
                    ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary font-bold'
                    : 'bg-bg-secondary border-border-default/40 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Music size={12} />
                <span>{selectedKeyFilter === 'all' ? 'Semua Kunci' : `Kunci ${selectedKeyFilter}`}</span>
                <ChevronDown size={12} />
              </button>

              {showKeyDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-36 bg-bg-surface border border-border-default rounded-xl shadow-xl z-30 p-1 max-h-48 overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKeyFilter('all');
                      setShowKeyDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer ${
                      selectedKeyFilter === 'all'
                        ? 'bg-accent-primary/10 text-accent-primary font-bold'
                        : 'text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <span>Semua Kunci</span>
                    {selectedKeyFilter === 'all' && <Check size={12} />}
                  </button>
                  {ROOT_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setSelectedKeyFilter(k);
                        setShowKeyDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer ${
                        selectedKeyFilter === k
                          ? 'bg-accent-primary/10 text-accent-primary font-bold'
                          : 'text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      <span className="font-mono">{k}</span>
                      {selectedKeyFilter === k && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Filter Toggle */}
            <button
              type="button"
              onClick={() => setFavoriteOnlyFilter(!favoriteOnlyFilter)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                favoriteOnlyFilter
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                  : 'bg-bg-secondary border-border-default/40 text-text-muted hover:text-text-primary'
              }`}
            >
              <Star size={12} className={favoriteOnlyFilter ? 'fill-amber-400' : ''} />
              <span>Favorit</span>
            </button>
          </div>

          {/* Grid of Chord Progression Cards */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-16">
            {filteredProgressions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-bg-secondary text-text-muted flex items-center justify-center mb-3">
                  <Music size={22} className="text-accent-primary opacity-80" />
                </div>
                <h4 className="text-sm font-bold text-text-heading">
                  {chordSearch || selectedMoodFilter !== 'all' || selectedKeyFilter !== 'all' || favoriteOnlyFilter
                    ? 'Tidak ada progresi yang cocok'
                    : 'Belum Ada Progresi Chord'}
                </h4>
                <p className="text-xs text-text-muted max-w-sm mt-1 mb-4 leading-relaxed">
                  {chordSearch || selectedMoodFilter !== 'all' || selectedKeyFilter !== 'all' || favoriteOnlyFilter
                    ? 'Coba ubah kata kunci pencarian atau sesuaikan filter mood dan kunci nada.'
                    : 'Gunakan Generator Progresi untuk inspirasi harmoni instan atau buat progresi manual.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGeneratorOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary text-accent-contrast text-xs font-bold hover:opacity-95 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Sparkles size={14} />
                    <span>Buka Generator Progresi</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredProgressions.map((prog) => (
                  <MusicChordCard
                    key={prog.id}
                    progression={prog}
                    isPlaying={playingId === prog.id}
                    activeChordIndex={playingId === prog.id ? activeStepIndex : -1}
                    onPlay={playProgression}
                    onStop={stopPlayback}
                    onPlaySingleChord={playSingleChord}
                    onEdit={(p) => {
                      setEditingProgression(p);
                      setIsManualEditorOpen(true);
                    }}
                    onToggleFavorite={toggleFavoriteProgression}
                    onDuplicate={duplicateProgression}
                    onDelete={removeProgression}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        4. MAIN BARS CONTENT & FILTERS
      */}
      {activeSubTab === 'bars' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2.5">
          {/* Filter & Search Bar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bar, lirik, topik, atau rima..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-bg-primary text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Semua ({bars.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'available'
                    ? 'bg-bg-primary text-emerald-500 font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span>Segar</span>
                <span className="text-[10px] font-mono">({availableCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('used')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'used'
                    ? 'bg-bg-primary text-text-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span>Terpakai</span>
                <span className="text-[10px] font-mono">({usedCount})</span>
              </button>
            </div>

            {/* Theme Dropdown Filter */}
            {availableThemes.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    selectedTheme !== 'all'
                      ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary font-bold'
                      : 'bg-bg-secondary border-border-default/40 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Filter size={12} />
                  <span>{selectedTheme === 'all' ? 'Semua Tema' : selectedTheme}</span>
                  <ChevronDown size={12} />
                </button>

                {showThemeDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-40 bg-bg-surface border border-border-default rounded-xl shadow-xl z-30 p-1 max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme('all');
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer ${
                        selectedTheme === 'all'
                          ? 'bg-accent-primary/10 text-accent-primary font-bold'
                          : 'text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      <span>Semua Tema</span>
                      {selectedTheme === 'all' && <Check size={12} />}
                    </button>
                    {availableThemes.map((thm) => {
                      const isActive = selectedTheme === thm;
                      return (
                        <button
                          key={thm}
                          type="button"
                          onClick={() => {
                            setSelectedTheme(thm);
                            setShowThemeDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer ${
                            isActive
                              ? 'bg-accent-primary/10 text-accent-primary font-bold'
                              : 'text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          <span className="truncate">{thm}</span>
                          {isActive && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grid of Bar Cards */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-16">
            {filteredBars.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-bg-secondary text-text-muted flex items-center justify-center mb-3">
                  <Layers size={22} className="text-accent-primary opacity-80" />
                </div>
                <h4 className="text-sm font-bold text-text-heading">
                  {searchQuery || statusFilter !== 'all' || selectedTheme !== 'all'
                    ? 'Tidak ada bar yang cocok'
                    : 'Belum Ada Ide Bar'}
                </h4>
                <p className="text-xs text-text-muted max-w-sm mt-1 mb-4 leading-relaxed">
                  {searchQuery || statusFilter !== 'all' || selectedTheme !== 'all'
                    ? 'Coba ganti filter atau kata kunci pencarian kamu.'
                    : 'Tulis potongan 4-bar, 8-bar, atau rima lirik mentah kamu agar tidak hilang.'}
                </p>
                <button
                  type="button"
                  onClick={onCreateNewBar}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary text-accent-contrast text-xs font-bold hover:opacity-95 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus size={14} />
                  <span>Tulis Bar Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredBars.map((bar) => (
                  <MusicBarCard
                    key={bar.id}
                    bar={bar}
                    songs={songs}
                    onSelect={onOpenBarEditor}
                    onDuplicate={onDuplicateBar}
                    onDelete={onDeleteBar}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        MODALS: GENERATOR & MANUAL EDITOR
      */}
      <ChordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSaveToBank={async (data) => {
          await createNewProgression(data);
        }}
      />

      <ChordProgressionEditorModal
        isOpen={isManualEditorOpen}
        onClose={() => {
          setIsManualEditorOpen(false);
          setEditingProgression(null);
        }}
        initialData={editingProgression}
        onSave={async (data) => {
          if (editingProgression) {
            await updateProgression(editingProgression.id, data);
          } else {
            await createNewProgression(data);
          }
        }}
        onDelete={async (id) => {
          await removeProgression(id);
        }}
      />
    </div>
  );
};
