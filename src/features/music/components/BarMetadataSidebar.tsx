import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Music2, 
  Check, 
  Trash2, 
  Copy, 
  Layers, 
  ChevronDown,
  Calendar,
  Clock,
} from 'lucide-react';
import { StudioBarRecord, StudioSongRecord } from '../types/studioDatabase';
import { ThemeSelector } from './ThemeSelector';

interface BarMetadataSidebarProps {
  bar: StudioBarRecord;
  songs: StudioSongRecord[];
  allBars?: StudioBarRecord[];
  onUpdateBar: (patch: Partial<StudioBarRecord>) => void;
  onClose: () => void;
  onDelete: () => void;
  calculatedBarCount?: number;
}

const RHYME_SCHEMES = [
  { id: 'Bebas', label: 'Bebas / Free Flow' },
  { id: 'AABB', label: 'A-A-B-B (Kupon)' },
  { id: 'ABAB', label: 'A-B-A-B (Silang)' },
  { id: 'AAAA', label: 'A-A-A-A (Monorima)' },
  { id: 'ABBA', label: 'A-B-B-A (Peluk)' },
];

export const BarMetadataSidebar: React.FC<BarMetadataSidebarProps> = ({
  bar,
  songs,
  allBars = [],
  onUpdateBar,
  onClose,
  onDelete,
  calculatedBarCount = 4,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);

  // Suggestions strictly from actual existing songs & bars in the library (no hardcoded defaults)
  const allExistingThemes = useMemo(() => {
    const list = new Set<string>();
    if (Array.isArray(songs)) {
      songs.forEach((s) => {
        if (s.theme && s.theme.trim()) list.add(s.theme.trim());
      });
    }
    if (Array.isArray(allBars)) {
      allBars.forEach((b) => {
        if (b.theme && b.theme.trim() && b.theme.trim().toLowerCase() !== 'bebas') {
          list.add(b.theme.trim());
        }
      });
    }
    return Array.from(list);
  }, [songs, allBars]);

  // Suggestions strictly from actual existing topics in bars
  const existingTopics = useMemo(() => {
    const list = new Set<string>();
    if (Array.isArray(allBars)) {
      allBars.forEach((b) => {
        if (b.topic && b.topic.trim()) list.add(b.topic.trim());
      });
    }
    return Array.from(list);
  }, [allBars]);

  // Format date matching SingleMetadataSidebar (DD MMM YYYY, without time)
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

  const handleCopyText = async () => {
    // Strip HTML tags for clean clipboard text
    const text = bar.content.replace(/<[^>]*>/g, '').trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy bar content:', err);
    }
  };

  const selectedSong = songs.find((s) => s.id === bar.usedInSongId);

  return (
    <div className="w-full h-full flex flex-col bg-bg-secondary text-text-primary select-none overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0 bg-bg-secondary border-b border-border-default/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-bg-primary text-accent-primary flex items-center justify-center shrink-0 shadow-xs">
            <Layers size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-text-heading truncate">Parameter Bar</h2>
            <p className="text-[11px] text-text-muted truncate">{bar.title || 'Tanpa Judul'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          title="Tutup Panel"
          aria-label="Tutup"
        >
          <X size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar">
        {/* 1. Status Pemakaian (Fresh vs Terpakai) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Status Pemakaian
          </label>

          <div className="grid grid-cols-2 gap-1.5 bg-bg-primary p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onUpdateBar({ status: 'available', usedInSongId: null })}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                bar.status === 'available'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Fresh (Bebas)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateBar({ status: 'used' });
                setShowSongPicker(true);
              }}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                bar.status === 'used'
                  ? 'bg-amber-500/20 text-amber-400 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>Terpakai</span>
            </button>
          </div>

          {/* Tautkan ke Lagu Dropdown */}
          {bar.status === 'used' && (
            <div className="pt-1.5">
              <label className="text-[10px] font-medium text-text-muted mb-1 block">
                Dipakai di Lagu:
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSongPicker(!showSongPicker)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-bg-primary rounded-xl text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Music2 size={13} className="text-accent-primary shrink-0" />
                    <span className="truncate">
                      {selectedSong ? selectedSong.title : 'Pilih lagu dari Studio...'}
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-text-muted shrink-0" />
                </button>

                {showSongPicker && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-bg-primary rounded-xl shadow-2xl p-1.5 z-30 max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                    {songs.length === 0 ? (
                      <div className="p-2 text-center text-[10px] text-text-muted">
                        Belum ada lagu di Studio Musik.
                      </div>
                    ) : (
                      songs.map((s) => {
                        const isCurrent = bar.usedInSongId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onUpdateBar({ usedInSongId: s.id });
                              setShowSongPicker(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                              isCurrent
                                ? 'bg-accent-primary/20 text-accent-primary'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                            }`}
                          >
                            <span className="truncate">{s.title}</span>
                            {isCurrent && <Check size={12} className="text-accent-primary shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Panjang Bar (Terhitung Otomatis) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Panjang Bar
          </label>

          <div className="px-3 py-2 bg-bg-primary rounded-xl flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              Terhitung Otomatis
            </span>
            <span className="text-xs font-mono font-bold text-accent-primary px-2.5 py-0.5 rounded-lg bg-accent-primary/10">
              {calculatedBarCount} Bar
            </span>
          </div>
          <p className="text-[10px] text-text-muted leading-relaxed">
            Dihitung otomatis dari baris lirik (mengabaikan baris kosong, chord terpisah, dan judul bait).
          </p>
        </div>

        {/* 3. Tema / Vibe (ThemeSelector) */}
        <ThemeSelector
          label="Tema / Vibe"
          theme={bar.theme}
          existingThemes={allExistingThemes}
          placeholder="Tulis tema bar..."
          onChange={(val) => onUpdateBar({ theme: val || '' })}
          helperText="Nuansa emosi atau payung besar ide bar ini"
        />

        {/* 4. Topik Cerita (ThemeSelector) */}
        <ThemeSelector
          label="Topik Cerita"
          theme={bar.topic}
          existingThemes={existingTopics}
          placeholder="Tulis topik cerita..."
          onChange={(val) => onUpdateBar({ topic: val || '' })}
          helperText="Subjek spesifik atau cerita konkret yang dibahas"
        />

        {/* 5. Skema Rima (Rhyme Scheme) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Skema Rima
          </label>

          <div className="space-y-1">
            {RHYME_SCHEMES.map((scheme) => {
              const active = (bar.rhymeScheme || 'Bebas') === scheme.id;
              return (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => onUpdateBar({ rhymeScheme: scheme.id })}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                    active
                      ? 'bg-accent-primary/20 text-accent-primary font-bold'
                      : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <span>{scheme.label}</span>
                  {active && <Check size={12} className="text-accent-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Catatan Tambahan (Notes) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Catatan Tambahan
          </label>

          <textarea
            value={bar.notes || ''}
            onChange={(e) => onUpdateBar({ notes: e.target.value })}
            placeholder="Catatan nada, instrumen, atau inspirasi..."
            rows={3}
            className="w-full px-3 py-2 bg-bg-primary rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary resize-none font-medium custom-scrollbar"
          />
        </div>

        {/* 7. Info Tanggal Dibuat & Diubah */}
        <div className="pt-3 border-t border-border-default/20 space-y-2">
          {/* Tanggal Dibuat */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-text-muted" />
              <span>Dibuat</span>
            </div>
            <span className="font-mono text-text-secondary">{formatDate(bar.createdAt)}</span>
          </div>

          {/* Terakhir Diubah */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-text-muted" />
              <span>Diubah</span>
            </div>
            <span className="font-mono text-text-secondary">{formatDate(bar.updatedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 space-y-2 border-t border-border-default/20">
          {/* Copy Bar to Clipboard */}
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-accent-primary text-accent-contrast font-bold text-xs hover:opacity-95 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Lirik Bar'}</span>
          </button>

          {/* Delete Bar */}
          <button
            type="button"
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-status-error hover:bg-status-error/10 font-medium text-xs transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Hapus Bar Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
