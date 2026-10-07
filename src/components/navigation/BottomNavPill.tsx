import React from 'react';
import { Folder, LayoutGrid, MessageSquare, HardDrive, Settings, Disc3 } from 'lucide-react';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';
import { useNavigation } from '../../context/NavigationContext';
import { useMusicianMode } from '../../features/music/hooks/useMusicianMode';

export type ActiveTab = 'vault' | 'hub' | 'chat' | 'media' | 'music' | 'settings';

interface BottomNavPillProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNavPill: React.FC<BottomNavPillProps> = ({ activeTab, onTabChange }) => {
  const { isMobileRightSidebarOpen } = useNavigation();
  const { isKeyboardOpen } = useVirtualKeyboard();
  const { isMusicianModeEnabled } = useMusicianMode();

  const shouldShow = !isKeyboardOpen && !isMobileRightSidebarOpen;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Silently catch if not supported or disabled
      }
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      triggerHaptic();
    }
    onTabChange(tab);
  };

  return (
    <div
      className={`fixed lg:hidden z-40 transition-all duration-200 ease-out bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto ${
        shouldShow
          ? 'translate-y-0 opacity-100'
          : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex items-center justify-center select-none">
        {/* SVG Background for Trapezoid Shape: /    \ */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none drop-shadow-xl"
          preserveAspectRatio="none"
          viewBox="0 0 300 38"
        >
          <path
            d="M 0,38 C 10,38 18,24 24,10 C 27,3 33,0 40,0 L 260,0 C 267,0 273,3 276,10 C 282,24 290,38 300,38 Z"
            style={{ fill: 'var(--bg-quaternary)' }}
          />
        </svg>

        {/* Buttons Row - Short, Compact, Minimal Vertical Footprint */}
        <nav
          aria-label="Main Navigation"
          className="relative z-10 flex flex-row items-center gap-1 sm:gap-1.5 px-6 pt-1 pb-1"
        >
          <button
            type="button"
            aria-label="Vault"
            title="Vault"
            onClick={() => handleTabChange('vault')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
              activeTab === 'vault'
                ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
            }`}
          >
            <Folder size={14} />
          </button>

          <button
            type="button"
            aria-label="Hub"
            title="Hub"
            onClick={() => handleTabChange('hub')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
              activeTab === 'hub'
                ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
            }`}
          >
            <LayoutGrid size={14} />
          </button>

          {isMusicianModeEnabled && (
            <button
              type="button"
              aria-label="Music Studio"
              title="Music Studio Hub"
              onClick={() => handleTabChange('music')}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
                activeTab === 'music'
                  ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                  : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
              }`}
            >
              <Disc3 size={14} />
            </button>
          )}

          <button
            type="button"
            aria-label="Chat"
            title="Chat"
            onClick={() => handleTabChange('chat')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
              activeTab === 'chat'
                ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
            }`}
          >
            <MessageSquare size={14} />
          </button>

          <button
            type="button"
            aria-label="Media"
            title="Media Library"
            onClick={() => handleTabChange('media')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
              activeTab === 'media'
                ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
            }`}
          >
            <HardDrive size={14} />
          </button>

          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            onClick={() => handleTabChange('settings')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
              activeTab === 'settings'
                ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary/10'
            }`}
          >
            <Settings size={14} />
          </button>
        </nav>
      </div>
    </div>
  );
};
