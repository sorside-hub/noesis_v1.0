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
  Unlock,
  Lock,
} from 'lucide-react';
import { StudioBarRecord, StudioSongRecord } from '../types/studioDatabase';
import { MusicBarCard } from './MusicBarCard';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Extract all unique themes from bars
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
      // 1. Status Filter
      if (statusFilter === 'available' && bar.status !== 'available') return false;
      if (statusFilter === 'used' && bar.status !== 'used') return false;

      // 2. Theme Filter
      if (selectedTheme !== 'all' && bar.theme !== selectedTheme) return false;

      // 3. Search Query
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

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none overflow-hidden space-y-3">
      {/* 
        1. SUB-TABS NAVIGATION (BARS, CHORDS, MELODIES)
      */}
      <div className="flex items-center justify-between gap-2 shrink-0 border-b border-border-default/20 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Tab 1: Bar (Lirik & Sajak) - Active */}
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

          {/* Tab 2: Chord & Progresi - Placeholder */}
          <button
            type="button"
            onClick={() => setActiveSubTab('chords')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSubTab === 'chords'
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Music size={14} />
            <span>Chord & Progresi</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-bg-secondary text-text-muted uppercase tracking-tight font-semibold">
              Segera
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
        2. COMING SOON SCREENS FOR CHORDS & MELODIES
      */}
      {activeSubTab !== 'bars' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-bg-secondary text-text-muted flex items-center justify-center">
            {activeSubTab === 'chords' ? <Music size={24} /> : <Mic size={24} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-heading">
              {activeSubTab === 'chords' ? 'Bank Chord & Progresi' : 'Bank Melodi & Voice Memo'}
            </h4>
            <p className="text-xs text-text-muted max-w-sm mt-1">
              {activeSubTab === 'chords'
                ? 'Simpan birama progresi chord, tangga nada favorit, dan transisi lagu. Sedang disiapkan untuk fase selanjutnya!'
                : 'Rekam potongan vokal, humming, atau petikan melodi lewat memo suara. Sedang disiapkan untuk fase selanjutnya!'}
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
        3. MAIN BARS CONTENT & FILTERS
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'available'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Unlock size={11} />
                <span>Fresh ({availableCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('used')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'used'
                    ? 'bg-amber-500/20 text-amber-400 shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Lock size={11} />
                <span>Terpakai ({usedCount})</span>
              </button>
            </div>

            {/* Theme Filter Dropdown */}
            {availableThemes.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-secondary hover:bg-bg-hover text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <Filter size={12} className="text-accent-primary" />
                  <span className="truncate max-w-[90px]">
                    {selectedTheme === 'all' ? 'Semua Tema' : selectedTheme}
                  </span>
                  <ChevronDown size={12} />
                </button>

                {showThemeDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-bg-primary rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-xs font-medium animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme('all');
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer text-left ${
                        selectedTheme === 'all'
                          ? 'bg-accent-primary/20 text-accent-primary font-bold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      <span>Semua Tema</span>
                      {selectedTheme === 'all' && <Check size={12} />}
                    </button>

                    {availableThemes.map((th) => {
                      const isActive = selectedTheme === th;
                      return (
                        <button
                          key={th}
                          type="button"
                          onClick={() => {
                            setSelectedTheme(th);
                            setShowThemeDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-accent-primary/20 text-accent-primary font-bold'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          <span className="truncate">{th}</span>
                          {isActive && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grid of Cards */}
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
    </div>
  );
};
