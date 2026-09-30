import React from 'react';
import { Music2, Sparkles, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMusicianMode } from '../../music/hooks/useMusicianMode';

export const MusicianModeSettingsCard: React.FC = () => {
  const { isMusicianModeEnabled, setMusicianMode } = useMusicianMode();

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-bg-secondary select-none transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isMusicianModeEnabled 
              ? 'bg-accent-primary text-accent-contrast shadow-xs' 
              : 'bg-bg-primary text-text-muted'
          }`}>
            <Music2 size={18} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-heading">
                Mode Studio Musik (Musician Suite)
              </h3>
              {isMusicianModeEnabled && (
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-accent-primary/15 text-accent-primary uppercase tracking-wider">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted leading-relaxed max-w-lg">
              Fitur khusus musisi & songwriter untuk mengelola diskografi (Album/EP), lirik dengan chord, nada dasar (Key/BPM), dan pipeline rekaman.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isMusicianModeEnabled}
          onClick={() => setMusicianMode(!isMusicianModeEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isMusicianModeEnabled ? 'bg-accent-primary' : 'bg-bg-primary border border-border-default/40'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              isMusicianModeEnabled ? 'translate-x-5' : 'translate-x-0.5 mt-0.5'
            }`}
          />
        </button>
      </div>

      {isMusicianModeEnabled && (
        <div className="mt-3 pt-3 border-t border-border-default/20 text-[11px] text-text-muted flex items-center gap-1.5">
          <Check size={13} className="text-accent-primary shrink-0" />
          <span>Tab <strong>Music Studio</strong> kini muncul di navigasi utama aplikasi.</span>
        </div>
      )}
    </div>
  );
};
