import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { HubSubView } from '../types';

interface NavItem {
  id: HubSubView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  category: 'metadata' | 'discovery';
}

interface HubMobileDrawerDockProps {
  activeSubView: HubSubView;
  setActiveSubView: (view: HubSubView) => void;
  navItems: NavItem[];
  inboxCount?: number;
}

export const HubMobileDrawerDock: React.FC<HubMobileDrawerDockProps> = ({
  activeSubView,
  setActiveSubView,
  navItems,
  inboxCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

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

  const currentItem = navItems.find((item) => item.id === activeSubView) || navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <div
      ref={dockRef}
      id="hub-mobile-sliding-dock"
      className={twMerge(
        'fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center transition-transform duration-300 ease-out select-none lg:hidden',
        isOpen ? 'translate-x-0' : 'translate-x-[48px]'
      )}
    >
      {/* 
        TRIGGER TAB (Trapesium Siku-siku Vertikal menempel di tepi kiri dock)
        Saat dock tertutup (translate-x-[48px]), bagian tab ini tetap menempel di tepi kanan layar.
      */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-[30px] h-[54px] flex flex-col items-center justify-center cursor-pointer group focus:outline-hidden transition-all active:scale-95 shrink-0"
        title={isOpen ? 'Tutup pilihan tampilan' : `Tampilan aktif: ${currentItem.label}`}
        aria-label="Toggle HUB Views Dock"
      >
        {/* SVG Curved Handle */}
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

        {/* Icon di dalam trigger tab */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full mt-2.5 pr-0.5 text-text-primary group-hover:text-accent-primary transition-colors">
          <CurrentIcon size={14} strokeWidth={2} />
        </div>
      </button>

      {/* 
        PANEL SLIDER VIEW (DOCK BODY)
        Lebar 48px, tersusun rapi dalam satu kolom vertikal (hanya icon).
      */}
      <div className="w-[48px] bg-bg-quaternary rounded-l-2xl p-1.5 flex flex-col items-center gap-1 shrink-0">
        {/* Tombol Lipat / Tutup Kecil di Atas */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-7 h-5 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded transition-colors cursor-pointer"
          title="Lipat panel ke kanan"
          aria-label="Fold Dock"
        >
          <ChevronRight size={13} />
        </button>

        {/* Group 1: Metadata Views (Inbox, Table, Board, Concepts) */}
        {navItems
          .filter((i) => i.category === 'metadata')
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeSubView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSubView(item.id);
                  setIsOpen(false);
                }}
                className={twMerge(
                  'relative w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer group',
                  isActive
                    ? 'bg-bg-hover text-text-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                )}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />

                {/* Badge Dot untuk Inbox jika ada item */}
                {item.id === 'inbox' && inboxCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary" />
                )}
              </button>
            );
          })}

        {/* Inset Divider */}
        <div className="w-6 border-t border-border-default/20 my-0.5" />

        {/* Group 2: Discovery & Visuals (Graph View) */}
        {navItems
          .filter((i) => i.category === 'discovery')
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeSubView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSubView(item.id);
                  setIsOpen(false);
                }}
                className={twMerge(
                  'w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer group',
                  isActive
                    ? 'bg-bg-hover text-text-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                )}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              </button>
            );
          })}
      </div>
    </div>
  );
};
