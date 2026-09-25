import React, { useRef, useState, useEffect } from 'react';
import {
  FolderTree,
  Hash,
  Bookmark,
  SlidersHorizontal,
  ChevronsUpDown,
  SquarePen,
  FolderPlus,
  Search,
  ChevronsDownUp,
  ListFilter,
  ArrowUpDown,
  Layers,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { SidebarTabMode } from '../hooks/useLeftSidebarLogic';

export interface LeftSidebarTabOption {
  id: SidebarTabMode;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

interface LeftSidebarTabSwitcherProps {
  activeTab: SidebarTabMode;
  setActiveTab: (tab: SidebarTabMode) => void;
  isKeyboardOpen: boolean;
  onCreateNote: (parentId: string | null) => void;
  onCreateFolder: () => void;
  onCreateBookmarkGroup?: () => void;
  onCloseMobile: () => void;
  isTreeSearchOpen: boolean;
  setIsTreeSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  areAllFoldersCollapsed: boolean;
  handleToggleExpandCollapseAll: () => void;
  areAllTagsCollapsed: boolean;
  handleToggleExpandCollapseAllTags?: () => void;
  areAllGroupsCollapsed: boolean;
  handleToggleExpandCollapseAllGroups?: () => void;
  areAllPropertiesCollapsed?: boolean;
  handleToggleExpandCollapseAllProperties?: () => void;
  // Contextual controls for Tags
  tagViewMode?: 'tree' | 'flat';
  onToggleTagViewMode?: () => void;
  tagSortMode?: 'name' | 'count';
  onToggleTagSortMode?: () => void;
  // Contextual controls for Properties
  propertyScope?: 'all' | 'core' | 'custom';
  onCyclePropertyScope?: () => void;
  propertySortMode?: 'name' | 'count';
  onTogglePropertySortMode?: () => void;
}

export const LeftSidebarTabSwitcher: React.FC<LeftSidebarTabSwitcherProps> = ({
  activeTab,
  setActiveTab,
  isKeyboardOpen,
  onCreateNote,
  onCreateFolder,
  onCreateBookmarkGroup,
  onCloseMobile,
  isTreeSearchOpen,
  setIsTreeSearchOpen,
  areAllFoldersCollapsed,
  handleToggleExpandCollapseAll,
  areAllTagsCollapsed,
  handleToggleExpandCollapseAllTags,
  areAllGroupsCollapsed,
  handleToggleExpandCollapseAllGroups,
  areAllPropertiesCollapsed = false,
  handleToggleExpandCollapseAllProperties,
  tagViewMode = 'tree',
  onToggleTagViewMode,
  tagSortMode = 'name',
  onToggleTagSortMode,
  propertyScope = 'all',
  onCyclePropertyScope,
  propertySortMode = 'count',
  onTogglePropertySortMode,
}) => {
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const tabMenuRef = useRef<HTMLDivElement>(null);

  const tabs: LeftSidebarTabOption[] = [
    { id: 'files', label: 'Files', icon: FolderTree },
    { id: 'tags', label: 'Tags', icon: Hash },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'properties', label: 'Properties', icon: SlidersHorizontal },
  ];

  // Close tab menu when clicked outside
  useEffect(() => {
    if (!isTabMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(e.target as Node)) {
        setIsTabMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTabMenuOpen]);

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const CurrentTabIcon = currentTabObj.icon;

  // Determine expand/collapse state & handler based on active tab
  const getExpandCollapseProps = () => {
    switch (activeTab) {
      case 'tags':
        return {
          isCollapsed: areAllTagsCollapsed,
          onToggle: handleToggleExpandCollapseAllTags,
          title: areAllTagsCollapsed ? 'Buka Semua Tag' : 'Tutup Semua Tag',
        };
      case 'bookmarks':
        return {
          isCollapsed: areAllGroupsCollapsed,
          onToggle: handleToggleExpandCollapseAllGroups,
          title: areAllGroupsCollapsed ? 'Buka Semua Grup' : 'Tutup Semua Grup',
        };
      case 'properties':
        return {
          isCollapsed: areAllPropertiesCollapsed,
          onToggle: handleToggleExpandCollapseAllProperties,
          title: areAllPropertiesCollapsed ? 'Buka Semua Properti' : 'Tutup Semua Properti',
        };
      case 'files':
      default:
        return {
          isCollapsed: areAllFoldersCollapsed,
          onToggle: handleToggleExpandCollapseAll,
          title: areAllFoldersCollapsed ? 'Buka Semua Folder' : 'Tutup Semua Folder',
        };
    }
  };

  const expandCollapse = getExpandCollapseProps();

  return (
    <div
      className={twMerge(
        'absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none transition-all duration-150',
        isKeyboardOpen && 'hidden'
      )}
    >
      {/* 1. SOFT GRADIENT FADE (Obsidian style - no harsh line) */}
      <div className="w-full h-8 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent pointer-events-none" />

      {/* 2. SOLID BOTTOM SECTION FOR ICONS & TAB SWITCHER */}
      <div className="w-full bg-bg-secondary px-3 pb-3 pt-0 flex flex-col items-center gap-1.5 pointer-events-auto">
        {/* ----------------------------------------------------------- */}
        {/* COMPACT CONTEXTUAL DOCK (Close spacing, unified pill)     */}
        {/* ----------------------------------------------------------- */}
        <div className="w-full flex items-center justify-center select-none py-0.5">
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-bg-primary shadow-xs border-0">
            {/* 1. Contextual Action Buttons */}
            {activeTab === 'files' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onCreateNote(null);
                    onCloseMobile();
                  }}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border-0"
                  title="Catatan Baru"
                  aria-label="Catatan Baru"
                >
                  <SquarePen size={15} />
                </button>
                <button
                  type="button"
                  onClick={onCreateFolder}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border-0"
                  title="Folder Baru"
                  aria-label="Folder Baru"
                >
                  <FolderPlus size={15} />
                </button>
              </>
            )}

            {activeTab === 'tags' && (
              <>
                <button
                  type="button"
                  onClick={onToggleTagViewMode}
                  className={twMerge(
                    "p-1.5 rounded-lg transition-colors cursor-pointer border-0",
                    tagViewMode === 'flat'
                      ? "text-accent-primary bg-bg-hover"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  )}
                  title={tagViewMode === 'tree' ? "Ganti ke Tampilan Daftar" : "Ganti ke Tampilan Hirarki"}
                  aria-label="Ganti Tampilan Tag"
                >
                  {tagViewMode === 'tree' ? <FolderTree size={15} /> : <ListFilter size={15} />}
                </button>
                <button
                  type="button"
                  onClick={onToggleTagSortMode}
                  className={twMerge(
                    "p-1.5 rounded-lg transition-colors cursor-pointer border-0",
                    tagSortMode === 'count'
                      ? "text-accent-primary bg-bg-hover"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  )}
                  title={tagSortMode === 'name' ? "Urutkan berdasarkan Jumlah Catatan" : "Urutkan berdasarkan Nama (A-Z)"}
                  aria-label="Urutkan Tag"
                >
                  <ArrowUpDown size={15} />
                </button>
              </>
            )}

            {activeTab === 'bookmarks' && (
              <button
                type="button"
                onClick={onCreateBookmarkGroup}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border-0"
                title="Grup Bookmark Baru"
                aria-label="Grup Bookmark Baru"
              >
                <FolderPlus size={15} />
              </button>
            )}

            {activeTab === 'properties' && (
              <>
                <button
                  type="button"
                  onClick={onCyclePropertyScope}
                  className={twMerge(
                    "p-1.5 rounded-lg transition-colors cursor-pointer border-0",
                    propertyScope !== 'all'
                      ? "text-accent-primary bg-bg-hover"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  )}
                  title={`Filter Scope: ${propertyScope === 'all' ? 'Semua' : propertyScope === 'core' ? 'Core' : 'Custom'} (Klik untuk ganti)`}
                  aria-label="Ganti Filter Properti"
                >
                  <Layers size={15} />
                </button>
                <button
                  type="button"
                  onClick={onTogglePropertySortMode}
                  className={twMerge(
                    "p-1.5 rounded-lg transition-colors cursor-pointer border-0",
                    propertySortMode === 'count'
                      ? "text-accent-primary bg-bg-hover"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  )}
                  title={propertySortMode === 'count' ? "Urutkan berdasarkan Nama (A-Z)" : "Urutkan berdasarkan Jumlah Catatan"}
                  aria-label="Urutkan Properti"
                >
                  <ArrowUpDown size={15} />
                </button>
              </>
            )}

            {/* Subtle Divider */}
            <div className="w-px h-3.5 bg-border-default/40 mx-0.5" />

            {/* 2. Global Utilities (Search & Expand/Collapse) */}
            <button
              type="button"
              onClick={() => setIsTreeSearchOpen((prev) => !prev)}
              className={twMerge(
                'p-1.5 rounded-lg transition-colors cursor-pointer border-0',
                isTreeSearchOpen
                  ? 'bg-bg-hover text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              )}
              title={isTreeSearchOpen ? 'Tutup pencarian' : 'Cari'}
              aria-label="Pencarian"
            >
              <Search size={15} />
            </button>

            {expandCollapse.onToggle && (
              <button
                type="button"
                onClick={expandCollapse.onToggle}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border-0"
                title={expandCollapse.title}
                aria-label={expandCollapse.title}
              >
                {expandCollapse.isCollapsed ? (
                  <ChevronsUpDown size={15} />
                ) : (
                  <ChevronsDownUp size={15} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* FLOATING TAB SWITCHER PILL (Clean, Borderless, No Counter)  */}
        {/* ----------------------------------------------------------- */}
        <div
          ref={tabMenuRef}
          className="w-full relative bg-bg-primary rounded-2xl border-0 transition-all duration-150 shadow-sm"
        >
          {/* EXPANDED TAB OPTIONS LIST (Opens Upwards Above Footer) */}
          {isTabMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-bg-primary rounded-2xl shadow-2xl border-0 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
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
                      'w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group border-0',
                      isSelected
                        ? 'bg-bg-secondary text-text-primary font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <TabIcon
                        size={15}
                        className={twMerge(
                          'transition-colors duration-150',
                          isSelected
                            ? 'text-accent-primary'
                            : 'text-icon-secondary group-hover:text-text-primary'
                        )}
                      />
                      <span className="transition-colors duration-150">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TRIGGER / ANCHOR BUTTON */}
          <button
            type="button"
            onClick={() => setIsTabMenuOpen((prev) => !prev)}
            className={twMerge(
              'w-full flex items-center justify-between px-4 py-2.5 transition-all cursor-pointer text-xs group rounded-2xl border-0',
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
                  isTabMenuOpen ? 'text-text-muted/40' : 'text-accent-primary'
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
      </div>
    </div>
  );
};
