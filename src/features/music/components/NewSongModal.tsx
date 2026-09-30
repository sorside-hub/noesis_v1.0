import React, { useState, useEffect } from 'react';
import { X, Music2, Sparkles, Hash, Disc3 } from 'lucide-react';
import { MusicProject, MusicProductionStatus, PRODUCTION_STAGES } from '../types';

interface NewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    title: string;
    key?: string;
    bpm?: number;
    project?: string;
    genre?: string;
    status?: MusicProductionStatus;
  }) => Promise<void>;
  projects: MusicProject[];
  defaultProject?: string;
  defaultStatus?: MusicProductionStatus;
}

const COMMON_KEYS = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'Bm', 'F#m', 'F', 'Bb'];

export const NewSongModal: React.FC<NewSongModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  defaultProject,
  defaultStatus = 'idea',
}) => {
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState<string>('');
  const [project, setProject] = useState(defaultProject || '');
  const [status, setStatus] = useState<MusicProductionStatus>(defaultStatus);
  const [genre, setGenre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultProject !== undefined) setProject(defaultProject);
  }, [defaultProject]);

  useEffect(() => {
    if (defaultStatus !== undefined) setStatus(defaultStatus);
  }, [defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        key: key.trim() || undefined,
        bpm: bpm ? parseInt(bpm, 10) : undefined,
        project: project.trim() || undefined,
        genre: genre.trim() || undefined,
        status,
      });
      onClose();
      // Reset
      setTitle('');
      setKey('');
      setBpm('');
      setProject('');
      setGenre('');
      setStatus('idea');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-md bg-bg-secondary rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 ring-1 ring-border-default/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
              <Music2 size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-heading">Buat Lagu Baru</h3>
              <p className="text-[11px] text-text-muted">Lirik, chord, nada dasar & struktur lagu</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Song Title */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Judul Lagu <span className="text-accent-primary">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Senja di Ujung Kota"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Key & BPM Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Nada Dasar (Key)
              </label>
              <input
                type="text"
                placeholder="Misal: G, Am, C"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary uppercase"
              />
              {/* Common key presets */}
              <div className="flex gap-1 mt-1.5 overflow-x-auto [scrollbar-width:none]">
                {COMMON_KEYS.slice(0, 6).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKey(k)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                      key === k ? 'bg-accent-primary text-accent-contrast' : 'bg-bg-primary text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Tempo (BPM)
              </label>
              <input
                type="number"
                placeholder="Misal: 110"
                min={30}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          {/* Stage / Pipeline Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Tahap Produksi (Pipeline)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRODUCTION_STAGES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`px-2 py-1.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-1.5 ${
                    status === st.id
                      ? 'border-accent-primary bg-accent-primary/10 text-text-heading font-semibold ring-1 ring-accent-primary/40'
                      : 'border-border-default/20 bg-bg-primary text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="text-xs">{st.icon}</span>
                  <span className="text-[11px] truncate">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project (Album/EP) Assignment */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Masukkan ke Album / EP (Opsional)
            </label>
            <input
              type="text"
              list="project-suggestions"
              placeholder="Pilih atau ketik nama Album / Single"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            />
            <datalist id="project-suggestions">
              {projects.map((p) => (
                <option key={p.id} value={p.title} />
              ))}
            </datalist>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Genre / Mood
            </label>
            <input
              type="text"
              placeholder="Misal: Indie Pop, Acoustic, Rock"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-xl text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Lagu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
