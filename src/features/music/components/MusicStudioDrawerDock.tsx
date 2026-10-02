import React, { useState, useEffect, useRef } from 'react';
import { Kanban, Disc3 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type StudioViewTab = 'pipeline' | 'discography';

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
        className="relative w-[30px] h-[54px] flex flex-col items-center justify-center cursor-pointer group focus:outline-hidden transition-all active:scale-95 shrink-0"
        title={isOpen ? 'Tutup pilihan tampilan' : `Tampilan aktif: ${currentItem.label}`}
        aria-label="Toggle Studio Views Dock"
      >
        {/* SVG Curved Handle matching Hub style */}
        <svg
          viewBox="0 0 30 54"
          className="absolute inset-0 w-full h-full overflow-visible transition-all"
        >
          <path
            d="M 30 0 L 14 12 Q 2 18 2 24 L 2 48 Q 2 54 7 54 L 30 54 Z"
            style={{
              fill: 'var(--bg-quaternary)',
            }}
            className="group-hover:opacity-95 transition-opacity"
          />
        </svg>

        {/* Current Active Icon inside Handle - No numbers, no dots */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full mt-2.5 pr-0.5 text-text-primary group-hover:text-accent-primary transition-colors">
          <CurrentIcon size={14} strokeWidth={2} />
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
