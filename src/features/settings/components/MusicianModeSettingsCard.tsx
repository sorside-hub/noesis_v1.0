import React from 'react';
import { Music2 } from 'lucide-react';
import { useMusicianMode } from '../../music/hooks/useMusicianMode';

export const MusicianModeSettingsCard: React.FC = () => {
  const { isMusicianModeEnabled, setMusicianMode } = useMusicianMode();

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-bg-secondary select-none transition-all border border-border-subtle/40">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon & Text */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isMusicianModeEnabled
                ? 'bg-accent-primary text-accent-contrast shadow-xs'
                : 'bg-bg-primary text-text-muted border border-border-default/40'
            }`}
          >
            <Music2 size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-heading leading-tight truncate">
              Studio Musik
            </h3>
            <p className="text-xs text-text-muted mt-0.5 leading-snug">
              Diskografi album/EP, lirik, chord, dan audio memo.
            </p>
          </div>
        </div>

        {/* Right: Symmetrical Pixel-Perfect Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isMusicianModeEnabled}
          onClick={() => setMusicianMode(!isMusicianModeEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isMusicianModeEnabled ? 'bg-accent-primary' : 'bg-bg-primary border border-border-default/50'
          }`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
              isMusicianModeEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

