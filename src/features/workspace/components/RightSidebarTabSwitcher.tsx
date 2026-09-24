import React, { RefObject } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { RightSidebarTab } from '../hooks/useRightSidebarLogic';

export interface TabOption {
  id: RightSidebarTab;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

interface RightSidebarTabSwitcherProps {
  activeTab: RightSidebarTab;
  setActiveTab: (tab: RightSidebarTab) => void;
  isTabMenuOpen: boolean;
  setIsTabMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tabMenuRef: RefObject<HTMLDivElement | null>;
  isKeyboardOpen: boolean;
  tabs: TabOption[];
}

export const RightSidebarTabSwitcher: React.FC<RightSidebarTabSwitcherProps> = ({
  activeTab,
  setActiveTab,
  isTabMenuOpen,
  setIsTabMenuOpen,
  tabMenuRef,
  isKeyboardOpen,
  tabs,
}) => {
  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const CurrentTabIcon = currentTabObj.icon;

  return (
    <div
      ref={tabMenuRef}
      className={twMerge(
        'absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] z-30 bg-bg-quaternary rounded-2xl overflow-hidden transition-all duration-150',
        isKeyboardOpen
          ? 'opacity-0 translate-y-12 pointer-events-none'
          : 'opacity-100 translate-y-0 pointer-events-auto'
      )}
    >
      {/* EXPANDED TAB OPTIONS LIST (Obsidian Style) */}
      {isTabMenuOpen && (
        <div className="animate-in fade-in duration-150">
          <div className="p-1.5 space-y-0.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsTabMenuOpen(false);
                  }}
                  className={twMerge(
                    'w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group',
                    isSelected
                      ? 'bg-bg-hover text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <TabIcon
                      size={15}
                      className={twMerge(
                        'transition-colors duration-150',
                        isSelected ? 'text-text-primary' : 'text-icon-secondary group-hover:text-text-primary'
                      )}
                    />
                    <span className="transition-colors duration-150">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mx-3.5 h-px bg-border-default/20 my-0.5" />
        </div>
      )}

      {/* TRIGGER / ANCHOR BUTTON */}
      <button
        type="button"
        onClick={() => setIsTabMenuOpen((prev) => !prev)}
        className={twMerge(
          'w-full flex items-center justify-between px-4 py-2.5 transition-all cursor-pointer text-xs group',
          isTabMenuOpen
            ? 'text-text-muted/40 hover:text-text-muted/60'
            : 'text-text-primary hover:bg-bg-hover'
        )}
      >
        <div className="flex items-center gap-2.5 font-medium">
          <CurrentTabIcon
            size={15}
            className={twMerge(
              'shrink-0 transition-colors',
              isTabMenuOpen ? 'text-text-muted/40' : 'text-text-primary'
            )}
          />
          <span className="text-xs">{currentTabObj.label}</span>
        </div>
        <ChevronsUpDown
          size={14}
          className={twMerge(
            'shrink-0 transition-colors',
            isTabMenuOpen ? 'text-text-muted/30' : 'text-text-muted group-hover:text-text-primary'
          )}
        />
      </button>
    </div>
  );
};

