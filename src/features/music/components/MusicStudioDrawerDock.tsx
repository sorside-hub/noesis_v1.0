import React, { useState, useEffect, useRef } from 'react';
import { Kanban, Disc3, Archive } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type StudioViewTab = 'pipeline' | 'discography' | 'bank';

interface MusicStudioDrawerDockProps {
  activeTab: StudioViewTab;
  setActiveTab: (tab: StudioViewTab) => void;
  songsCount?: number;
  projectsCount?: number;
}

interface StudioNavItem {
  id: StudioViewTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

export const MusicStudioDrawerDock: React.FC<MusicStudioDrawerDockProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const navItems: StudioNavItem[] = [
    {
      id: 'pipeline',
      label: 'Kanban',
      icon: Kanban,
    },
    {
      id: 'discography',
      label: 'Diskografi',
      icon: Disc3,
    },
    {
      id: 'bank',
      label: 'Bank Ide',
      icon: Archive,
    },
  ];

  // Close on outside pointer down
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <div
      ref={dockRef}
      id="music-studio-sliding-dock"
      className={twMerge(
        'fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center transition-transform duration-300 ease-out select-none',
        isOpen ? 'translate-x-0' : 'translate-x-[48px]'
      )}
    >
      {/* 
        TRIGGER TAB (Trapesium Siku-siku Vertikal menempel di tepi kiri dock)
      */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-[32px] h-[58px] flex items-center justify-center cursor-pointer group focus:outline-hidden transition-all active:scale-95 shrink-0"
        title={isOpen ? 'Tutup pilihan tampilan' : `Tampilan aktif: ${currentItem.label}`}
        aria-label="Toggle Studio Views Dock"
      >
        {/* SVG Symmetrical Flat-Face Trapezoid Handle */}
        <svg
          viewBox="0 0 32 58"
          className="absolute inset-0 w-full h-full overflow-visible transition-all drop-shadow-md"
        >
          <path
            d="M 32,0 C 32,5 24,8 12,11 C 4,12 0,15 0,19 L 0,39 C 0,43 4,46 12,47 C 24,50 32,53 32,58 Z"
            style={{
              fill: 'var(--bg-quaternary)',
            }}
            className="group-hover:opacity-95 transition-opacity"
          />
        </svg>

        {/* Current Active Icon safely inside flat face */}
        <div className="relative z-10 flex items-center justify-center w-full h-full pl-1 text-text-primary group-hover:text-accent-primary transition-colors">
          <CurrentIcon size={15} strokeWidth={2} />
        </div>
      </button>

      {/* 
        DOCK PANEL BODY (Matching Hub Dock layout: 48px width, no numbers, no dots)
      */}
      <div className="w-[48px] bg-bg-quaternary rounded-l-2xl p-1.5 flex flex-col items-center gap-1 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              title={item.label}
              aria-label={item.label}
              className={twMerge(
                'w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer group',
                isActive
                  ? 'bg-bg-hover text-text-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
