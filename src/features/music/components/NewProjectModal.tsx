import React, { useState, useEffect } from 'react';
import { X, Disc3 } from 'lucide-react';
import { MusicProjectType } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  initialType?: MusicProjectType;
  onClose: () => void;
  onSubmit: (params: {
    title: string;
    type: MusicProjectType;
    genre?: string;
    targetReleaseDate?: string;
    description?: string;
  }) => Promise<void>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  initialType = 'ep',
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MusicProjectType>(initialType);
  const [genre, setGenre] = useState('');
  const [targetReleaseDate, setTargetReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        genre: genre.trim() || undefined,
        targetReleaseDate: targetReleaseDate.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
      setTitle('');
      setType('ep');
      setGenre('');
      setTargetReleaseDate('');
      setDescription('');
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
              <Disc3 size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-heading">Buat Proyek {type.toUpperCase()}</h3>
              <p className="text-[11px] text-text-muted">Kelola koleksi lagu & diskografi rilisanmu</p>
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
          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Nama {type === 'ep' ? 'EP / Mini Album' : 'Album'} <span className="text-accent-primary">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={type === 'ep' ? 'Contoh: Titik Temu (EP)' : 'Contoh: Mahakarya (Album)'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Tipe Rilisan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['ep', 'album'] as MusicProjectType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-semibold uppercase rounded-xl transition-all cursor-pointer ${
                    type === t
                      ? 'bg-accent-primary text-accent-contrast shadow-xs'
                      : 'bg-bg-primary text-text-muted hover:text-text-primary'
                  }`}
                >
                  {t === 'ep' ? 'EP (Mini Album)' : 'Full Album'}
                </button>
              ))}
            </div>
          </div>

          {/* Genre & Target Release Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Genre
              </label>
              <input
                type="text"
                placeholder="Pop, Folk, Rock"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Target Rilis
              </label>
              <input
                type="date"
                value={targetReleaseDate}
                onChange={(e) => setTargetReleaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          {/* Description / Concept */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Konsep / Catatan Proyek
            </label>
            <textarea
              rows={2}
              placeholder="Ceritakan konsep cerita, sound target, atau referensi album ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary resize-none"
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
