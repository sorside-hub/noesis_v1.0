import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Inbox,
  Table2, 
  SquareKanban, 
  Waypoints, 
  Network, 
  Search, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  Database,
  ArrowRight,
  X,
  Eye,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { VaultData, FileNode } from '../../../types/vault';
import { useNavigation } from '../../../context/NavigationContext';
import { HubSubView } from '../types';

import { useHubData } from '../hooks/useHubData';
import { TableView } from './views/TableView';
import { BoardView, getBoardColumns, BOARD_COLUMNS_STORAGE_KEY } from './views/BoardView';
import { InboxTriageView } from './views/InboxTriageView';
import { ConceptsView } from './views/ConceptsView';

import { GraphView } from './views/GraphView';
import { HubFilterBar, DynamicFilter } from './HubFilterBar';
import { HubMobileDrawerDock } from './HubMobileDrawerDock';
import { isSameOrDescendantTag } from '../../workspace/utils/tagUtils';
import { classifyNoteTriageStatus } from '../utils/triageUtils';

interface HubViewProps {
  vault: VaultData | null;
  vaultState?: any;
}

export const HubView: React.FC<HubViewProps> = ({ vault, vaultState }) => {
  const [activeSubView, setActiveSubView] = useState<HubSubView>('inbox');
  const [tabSearchQueries, setTabSearchQueries] = useState<Record<string, string>>({
    inbox: '',
    table: '',
    board: '',
    concepts: '',
    graph: ''
  });
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [tabFilters, setTabFilters] = useState<Record<string, DynamicFilter[]>>({
    inbox: [],
    table: [],
    board: [],
    concepts: [],
    graph: []
  });
  const { navigateToNote } = useNavigation();

  // Use Data Aggregator
  const { notes: allFiles, isLoading } = useHubData(vault);

  // Derive board columns dynamically
  const allBoardColumns = useMemo(() => {
    return getBoardColumns(allFiles);
  }, [allFiles]);

  // Board columns visibility state with local storage persistence
  const [boardVisibleColumns, setBoardVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(BOARD_COLUMNS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {
      console.error('Failed to load board columns from local storage', e);
    }
    return new Set(allBoardColumns);
  });

  const [isBoardColDropdownOpen, setIsBoardColDropdownOpen] = useState(false);
  const boardColDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BOARD_COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(boardVisibleColumns)));
    } catch (e) {
      console.error('Failed to save board columns to local storage', e);
    }
  }, [boardVisibleColumns]);

  // Close dropdown or empty search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (boardColDropdownRef.current && !boardColDropdownRef.current.contains(target)) {
        setIsBoardColDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        // If search input is empty or contains only whitespace, auto-close search on outside click
        const currentQuery = tabSearchQueries[activeSubView] || '';
        if (!currentQuery.trim()) {
          setIsMobileSearchOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [tabSearchQueries, activeSubView]);

  const toggleBoardColumn = (col: string) => {
    setBoardVisibleColumns(prev => {
      // If all are currently visible, solo mode: activate only this one
      if (prev.size === allBoardColumns.length) {
        return new Set([col]);
      }
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const toggleAllBoardColumns = () => {
    if (boardVisibleColumns.size === allBoardColumns.length) {
      setBoardVisibleColumns(new Set()); // Hide all
    } else {
      setBoardVisibleColumns(new Set(allBoardColumns)); // Show all
    }
  };

  // Filter notes by search query and dynamic properties
  const filteredNotes = React.useMemo(() => {
    let result = allFiles;

    const currentFilters = tabFilters[activeSubView] || [];
    if (currentFilters.length > 0) {
      result = result.filter(note => {
        return currentFilters.every(filter => {
          const propKey = filter.property;
          let val = note.properties?.[propKey];
          if (val === undefined || val === null) {
            val = (note as any)[propKey];
          }
          if ((val === undefined || val === null) && propKey === 'type') {
            val = note.type || note.properties?.['noteType'];
          }

          const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

          if (filter.value === '-') {
            return isEmpty;
          }

          if (isEmpty) return false;
          
          const filterValLower = filter.value.toLowerCase().trim().replace(/^#/, '');
          if (!filterValLower) return true;
          
          if (Array.isArray(val)) {
            if (propKey === 'tags') {
              return val.some(v => isSameOrDescendantTag(String(v), filterValLower));
            }
            return val.some(v => String(v).toLowerCase().includes(filterValLower));
          }
          if (typeof val === 'boolean') {
            return String(val).toLowerCase() === filterValLower;
          }
          return String(val).toLowerCase().includes(filterValLower);
        });
      });
    }

    const currentSearchQuery = tabSearchQueries[activeSubView] || '';
    if (currentSearchQuery.trim()) {
      const query = currentSearchQuery.toLowerCase().trim().replace(/^#/, '');
      result = result.filter(note => {
        const matchTitle = note.title.toLowerCase().includes(query);
        const matchTags = note.tags?.some(tag => tag.toLowerCase().includes(query) || isSameOrDescendantTag(tag, query));
        const matchSummary = note.summary?.toLowerCase().includes(query);
        const matchConcepts = note.concepts?.some(concept => concept.toLowerCase().includes(query));
        
        return matchTitle || matchTags || matchSummary || matchConcepts;
      });
    }

    return result;
  }, [allFiles, tabSearchQueries, tabFilters, activeSubView]);

  // Aggregate high-level stats (using unfiltered allFiles for global context)
  const stats = React.useMemo(() => {
    let tagCount = new Set<string>();
    let statusCounts: Record<string, number> = {};

    allFiles.forEach(file => {
      file.tags?.forEach(t => tagCount.add(t));
      if (file.status) {
        statusCounts[file.status] = (statusCounts[file.status] || 0) + 1;
      }
    });

    const inboxFolderNode = Object.values(vault?.nodes || {}).find(
      (n) =>
        n.type === 'folder' &&
        (n.name.toLowerCase() === '00-inbox' ||
          n.name.toLowerCase() === '00 - inbox' ||
          n.name.toLowerCase() === 'inbox')
    );
    const inboxFolderId = inboxFolderNode?.id || null;

    const inboxCount = allFiles.filter(
      (f) => classifyNoteTriageStatus(f, inboxFolderId) !== null
    ).length;

    return {
      totalNotes: allFiles.length,
      totalTags: tagCount.size,
      statusCounts,
      inboxCount
    };
  }, [allFiles, vault]);

  const navItems: { id: HubSubView; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; category: 'metadata' | 'discovery' }[] = [
    { id: 'inbox', label: 'Inbox Triage', icon: Inbox, category: 'metadata' },
    { id: 'table', label: 'Table Matrix', icon: Table2, category: 'metadata' },
    { id: 'board', label: 'Board / Kanban', icon: SquareKanban, category: 'metadata' },
    { id: 'concepts', label: 'Peta Konsep', icon: Waypoints, category: 'metadata' },
    { id: 'graph', label: 'Graph View', icon: Network, category: 'discovery' },
  ];

  return (
    <div className="flex-1 h-full flex flex-col lg:flex-row bg-bg-primary text-text-primary overflow-hidden select-none">
      {/* 1. Desktop Left Hub Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border-default bg-bg-surface/70 shrink-0 select-none">
        {/* Hub Header */}
        <div className="px-3.5 py-2.5 border-b border-border-default flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary shrink-0">
            <Database size={15} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-tight text-text-heading">HUB Directory</h2>
            <p className="text-[10px] text-text-muted">Knowledge Matrix & Views</p>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Group 1: Metadata Views */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-text-muted/70 uppercase">
              Metadata & Views
            </div>
            <div className="space-y-0.5">
              {navItems.filter(i => i.category === 'metadata').map((item) => {
                const Icon = item.icon;
                const isActive = activeSubView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubView(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent-primary' : 'text-text-muted'} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={13} className="text-accent-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Knowledge Discovery (Future-Proof Modules) */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-text-muted/70 uppercase">
              Discovery & Visuals
            </div>
            <div className="space-y-0.5">
              {navItems.filter(i => i.category === 'discovery').map((item) => {
                const Icon = item.icon;
                const isActive = activeSubView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubView(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} strokeWidth={1.8} className="text-text-muted" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Vault Metric Footer */}
        <div className="p-3 border-t border-border-default bg-bg-surface/90 text-xs">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5">
            <span>Vault Total</span>
            <span className="font-semibold text-text-primary">{stats.totalNotes} Notes</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Indexed Tags</span>
            <span className="font-semibold text-text-primary">{stats.totalTags} Tags</span>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace / Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Collapsible Side Edge Drawer Dock */}
        <HubMobileDrawerDock
          activeSubView={activeSubView}
          setActiveSubView={setActiveSubView}
          navItems={navItems}
          inboxCount={stats.inboxCount}
        />

        {/* Top Header / Action Bar */}
        <div className="relative z-30 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 border-b border-border-default bg-bg-primary flex flex-row items-center justify-between gap-2.5 shrink-0 min-h-[42px]">
          {/* Title - Hidden on mobile if search is open */}
          <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
            <h1 className="text-sm sm:text-base font-semibold text-text-heading capitalize">
              {navItems.find(i => i.id === activeSubView)?.label || 'HUB View'}
            </h1>
          </div>

          {/* Right Header Actions: Column settings (Board on mobile) + Search */}
          {activeSubView !== 'graph' && (
            <div className={`flex items-center justify-end gap-1.5 sm:gap-2 ${isMobileSearchOpen ? 'w-full sm:w-auto' : ''}`}>
              {/* Mobile Column Settings Dropdown (Only on Board view, hidden when mobile search is open) */}
              {activeSubView === 'board' && !isMobileSearchOpen && (
                <div className="lg:hidden relative z-50" ref={boardColDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBoardColDropdownOpen(!isBoardColDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-secondary text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors shadow-2xs cursor-pointer"
                    title="Column Visibility"
                  >
                    <Eye size={12} className="text-accent-primary" />
                    <span>{boardVisibleColumns.size}/{allBoardColumns.length}</span>
                    <ChevronDown size={11} className={`transition-transform duration-150 ${isBoardColDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isBoardColDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1.5 w-52 bg-bg-secondary rounded-xl shadow-2xl z-50 flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-150 border border-bg-elevated/40">
                      <button
                        type="button"
                        onClick={toggleAllBoardColumns}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors border-b border-border-default/40 cursor-pointer"
                      >
                        {boardVisibleColumns.size === allBoardColumns.length ? (
                          <CheckSquare size={14} className="text-accent-primary" />
                        ) : (
                          <Square size={14} className="text-text-muted" />
                        )}
                        Select All
                      </button>
                      
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {allBoardColumns.map(col => {
                          const isVisible = boardVisibleColumns.has(col);
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => toggleBoardColumn(col)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
                            >
                              {isVisible ? (
                                <CheckSquare size={14} className="text-accent-primary shrink-0" />
                              ) : (
                                <Square size={14} className="text-text-muted shrink-0" />
                              )}
                              <span className="truncate">{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search Container with Auto-expand and Right-side Close Icon */}
              <div ref={searchContainerRef} className={`relative flex items-center ${isMobileSearchOpen ? 'w-full' : ''}`}>
                {!isMobileSearchOpen ? (
                  <>
                    {/* Mobile: Search Icon Only Button */}
                    <button 
                      type="button"
                      onClick={() => setIsMobileSearchOpen(true)}
                      className="sm:hidden p-1.5 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
                      title="Search"
                    >
                      <Search size={15} />
                    </button>

                    {/* Desktop: Standard Search Input */}
                    <div className="hidden sm:block relative w-44 focus-within:w-60 transition-all duration-200">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        value={tabSearchQueries[activeSubView] || ''}
                        onChange={(e) => setTabSearchQueries(prev => ({ ...prev, [activeSubView]: e.target.value }))}
                        placeholder={`Search ${activeSubView}...`}
                        className="w-full pl-7 pr-7 py-1 text-xs bg-bg-surface border border-border-default rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
                      />
                      {tabSearchQueries[activeSubView] && (
                        <button 
                          type="button"
                          onClick={() => setTabSearchQueries(prev => ({ ...prev, [activeSubView]: '' }))}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                          title="Clear search"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  /* Mobile: Expanded Search Input with Right-aligned Close Button */
                  <div className="flex sm:hidden relative w-full items-center animate-in fade-in zoom-in-95 duration-150">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={tabSearchQueries[activeSubView] || ''}
                      onChange={(e) => setTabSearchQueries(prev => ({ ...prev, [activeSubView]: e.target.value }))}
                      placeholder={`Search ${activeSubView}...`}
                      autoFocus
                      className="w-full pl-7 pr-7 py-1 text-xs bg-bg-surface border border-border-default rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setTabSearchQueries(prev => ({ ...prev, [activeSubView]: '' }));
                        setIsMobileSearchOpen(false);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                      title="Close search"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Independent Tab Filter Bar */}
        {activeSubView !== 'graph' && activeSubView !== 'inbox' && (
          <div className="px-3 sm:px-4 lg:px-5 py-1.5 bg-bg-primary">
            <HubFilterBar 
              notes={allFiles} 
              filters={tabFilters[activeSubView] || []} 
              onChange={(newFilters) => setTabFilters(prev => ({ ...prev, [activeSubView]: newFilters }))} 
            />
          </div>
        )}

        {/* Sub-View Content Canvas Container */}
        <div className={`flex-1 ${activeSubView === 'graph' || activeSubView === 'inbox' || activeSubView === 'board' ? 'overflow-hidden p-2 lg:p-4' : 'overflow-y-auto p-4 lg:p-6'} custom-scrollbar flex flex-col`}>
          {/* Active View Container */}
          <div className={`w-full flex-1 flex flex-col ${activeSubView === 'graph' || activeSubView === 'inbox' || activeSubView === 'board' ? 'h-full min-h-0' : 'max-w-7xl mx-auto space-y-4'}`}>

            {/* Active Sub-View Rendering */}
            <div className={`w-full flex-1 flex flex-col ${activeSubView === 'graph' || activeSubView === 'inbox' || activeSubView === 'board' ? 'h-full min-h-0' : ''}`}>
              {activeSubView === 'inbox' && (
                <InboxTriageView
                  notes={filteredNotes}
                  vault={vault}
                  onOpenNote={navigateToNote}
                  onUpdateNoteProperty={(id, prop, val) => vaultState?.updateNoteMetadata(id, { [prop]: val })}
                  onMoveNote={(id, targetFolderId) => vaultState?.moveNode(id, targetFolderId)}
                  onDeleteNote={(id) => vaultState?.deleteNode(id)}
                />
              )}
              {activeSubView === 'table' && (
                <TableView notes={filteredNotes} filters={tabFilters['table'] || []} onOpenNote={navigateToNote} />
              )}
              {activeSubView === 'board' && (
                <BoardView 
                  notes={filteredNotes} 
                  filters={tabFilters['board'] || []} 
                  visibleColumns={boardVisibleColumns}
                  onToggleColumn={toggleBoardColumn}
                  onToggleAll={toggleAllBoardColumns}
                  onOpenNote={navigateToNote}
                  onUpdateNoteProperty={(id, prop, val) => vaultState?.updateNoteMetadata(id, { [prop]: val })}
                />
              )}
              {activeSubView === 'concepts' && (
                <ConceptsView notes={filteredNotes} onOpenNote={navigateToNote} />
              )}
              {activeSubView === 'graph' && (
                <GraphView notes={filteredNotes} onOpenNote={navigateToNote} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
