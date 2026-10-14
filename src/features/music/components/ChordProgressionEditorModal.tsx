import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Music,
  Check,
  Play,
  Square,
  Wand2,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  ROOT_KEYS,
  RootKey,
  SCALE_TYPES,
  ScaleType,
  MOOD_CATEGORIES,
  convertRomansToChords,
  playChordSound,
  playProgressionSequence,
} from '../lib/chordTheory';
import { StudioChordProgressionRecord } from '../types/studioDatabase';
import { FamilyChordSelector } from './FamilyChordSelector';

interface ChordProgressionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudioChordProgressionRecord | null;
  onSave: (data: Partial<StudioChordProgressionRecord>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const ChordProgressionEditorModal: React.FC<ChordProgressionEditorModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [key, setKey] = useState<RootKey>('C');
  const [scale, setScale] = useState<ScaleType>('Major');
  const [mood, setMood] = useState('Melankolis');
  const [romansInput, setRomansInput] = useState('');
  const [chordsInput, setChordsInput] = useState('');
  const [bpm, setBpm] = useState<number>(80);
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const stopAudio = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setIsPlaying(false);
    setActiveStep(-1);
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setKey((initialData.key as RootKey) || 'C');
        setScale((initialData.scale as ScaleType) || 'Major');
        setMood(initialData.mood || 'Melankolis');
        setRomansInput((initialData.romans || []).join(' - '));
        setChordsInput((initialData.chords || []).join(' - '));
        setBpm(initialData.bpm || 80);
        setGenre(initialData.genre || '');
        setDescription(initialData.description || '');
        setNotes(initialData.notes || '');
      } else {
        setTitle('');
        setKey('C');
        setScale('Major');
        setMood('Melankolis');
        setRomansInput('vi - IV - I - V');
        setChordsInput('Am - F - C - G');
        setBpm(80);
        setGenre('Pop Ballad');
        setDescription('');
        setNotes('');
      }
    }
  }, [isOpen, initialData]);

  // Clean arrays
  const parsedRomans = romansInput
    .split(/[-–—, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedChords = chordsInput
    .split(/[-–—, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Auto calculate chords from Roman numerals
  const handleAutoConvertRomans = () => {
    if (parsedRomans.length === 0) return;
    const computed = convertRomansToChords(parsedRomans, key, scale);
    setChordsInput(computed.join(' - '));
  };

  // Handle click on family chord chip
  const handleSelectFamilyChord = (chord: string, roman: string) => {
    setChordsInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} - ${chord}` : chord;
    });
    setRomansInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} - ${roman}` : roman;
    });
  };

  const handleRemoveLastChord = () => {
    if (parsedChords.length > 0) {
      setChordsInput(parsedChords.slice(0, -1).join(' - '));
    }
    if (parsedRomans.length > 0) {
      setRomansInput(parsedRomans.slice(0, -1).join(' - '));
    }
  };

  const handleClearChords = () => {
    setChordsInput('');
    setRomansInput('');
  };

  // Handle Play sequence
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (parsedChords.length === 0) return;

    setIsPlaying(true);
    setActiveStep(0);

    const stopFn = playProgressionSequence({
      chords: parsedChords,
      bpm: bpm || 80,
      onStepChange: (idx) => {
        setActiveStep(idx);
      },
      onComplete: () => {
        setIsPlaying(false);
        setActiveStep(-1);
        stopAudioRef.current = null;
      },
    });

    stopAudioRef.current = stopFn;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const finalTitle = title.trim() || `${parsedChords.join(' - ')} (${key} ${scale})`;
    setIsSaving(true);
    try {
      await onSave({
        title: finalTitle,
        key,
        scale,
        mood,
        romans: parsedRomans.length > 0 ? parsedRomans : ['I'],
        chords: parsedChords.length > 0 ? parsedChords : [key],
        bpm: Number(bpm) || 80,
        genre: genre.trim(),
        description: description.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save progression:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-bg-surface border border-border-default/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden select-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Music size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                {initialData ? 'Edit Progresi Chord' : 'Buat Progresi Manual'}
              </h3>
              <p className="text-[11px] text-text-muted">
                Atur derajat nada, akor, tempo, dan suasana harmoni
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Judul Progresi */}
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Judul / Nama Progresi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Reff Sedih Mengalun, Intro Pop Rock"
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
            />
          </div>

          {/* Key, Scale, Mood Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Key */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Kunci Nada (Key)
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value as RootKey)}
                className="w-full px-2.5 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs font-mono font-bold focus:outline-none focus:border-accent-primary cursor-pointer"
              >
                {ROOT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Tangga Nada
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as ScaleType)}
                className="w-full px-2.5 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary cursor-pointer"
              >
                {SCALE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Mood / Vibe
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary cursor-pointer"
              >
                {MOOD_CATEGORIES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emoji} {m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Derajat Romawi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Derajat Romawi (Romans)
              </label>
              <button
                type="button"
                onClick={handleAutoConvertRomans}
                className="flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-semibold cursor-pointer"
              >
                <Wand2 size={12} />
                <span>Ubah ke Akor Kunci {key}</span>
              </button>
            </div>
            <input
              type="text"
              value={romansInput}
              onChange={(e) => setRomansInput(e.target.value)}
              placeholder="Contoh: vi - IV - I - V atau i - iv - v - i"
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs font-mono focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Pisahkan dengan spasi, strip (-), atau koma. Contoh: <code>vi - IV - I - V</code>
            </p>
          </div>

          {/* Rekomendasi Akor Keluarga (Family Chords) */}
          <FamilyChordSelector
            rootKey={key}
            scale={scale}
            onSelectChord={handleSelectFamilyChord}
            onRemoveLastChord={handleRemoveLastChord}
            onClearChords={handleClearChords}
            currentChords={parsedChords}
            currentRomans={parsedRomans}
          />

          {/* Deret Chord */}
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Deret Akor (Chords)
            </label>
            <input
              type="text"
              value={chordsInput}
              onChange={(e) => setChordsInput(e.target.value)}
              placeholder="Contoh: Am - F - C - G"
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs font-bold font-mono focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
            />

            {/* Interactive Chord Preview Buttons */}
            {parsedChords.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                {parsedChords.map((chord, idx) => {
                  const isStepActive = isPlaying && activeStep === idx;
                  return (
                    <button
                      key={`edit-chord-${idx}`}
                      type="button"
                      onClick={() => playChordSound(chord, 1.2)}
                      title={`Klik dengar ${chord}`}
                      className={`min-w-[40px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isStepActive
                          ? 'bg-accent-primary text-accent-contrast border-accent-primary scale-105'
                          : 'bg-bg-secondary text-text-heading border-border-default/40 hover:border-accent-primary'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{chord}</span>
                        {isStepActive && <Volume2 size={11} className="animate-pulse" />}
                      </div>
                    </button>
                  );
                })}

                {/* Audition Button */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    isPlaying
                      ? 'bg-rose-500 text-white'
                      : 'bg-bg-secondary hover:bg-bg-hover text-accent-primary border border-border-default/40'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square size={11} className="fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play size={11} className="fill-current" />
                      <span>Tes Suara</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Tempo & Genre */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Tempo Rekomendasi (BPM)
              </label>
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Pop, Indie, R&B, Rock"
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Deskripsi & Catatan Musisi */}
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Deskripsi Karakter Harmoni & Catatan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan transisi chord, feel dinamika, atau ide penempatan di lagu..."
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border-default/50 text-text-primary text-xs focus:outline-none focus:border-accent-primary placeholder:text-text-muted resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border-default/30">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Yakin ingin menghapus progresi ini?')) {
                    await onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Hapus</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check size={14} />
                <span>{initialData ? 'Simpan Perubahan' : 'Simpan Progresi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
