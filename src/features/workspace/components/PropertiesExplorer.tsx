import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  SlidersHorizontal,
  Hash,
  Type,
  Calendar,
  CheckSquare,
  ListFilter,
  Tag as TagIcon,
  Smile,
  Layers,
  Sparkles,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import {
  PropertyItem,
  PropertyValueGroup,
  PropertyNoteItem,
  VaultPropertiesData,
} from '../utils/propertyUtils';

export type PropertyTabScope = 'all' | 'core' | 'custom';
export type PropertySortMode = 'name' | 'count';

interface PropertiesExplorerProps {
  propertiesData: VaultPropertiesData;
  searchQuery: string;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCloseMobile: () => void;
  expandedProperties?: Set<string>;
  setExpandedProperties?: React.Dispatch<React.SetStateAction<Set<string>>>;
  scope?: PropertyTabScope;
  setScope?: React.Dispatch<React.SetStateAction<PropertyTabScope>>;
  sortMode?: PropertySortMode;
  setSortMode?: React.Dispatch<React.SetStateAction<PropertySortMode>>;
}

export const PropertiesExplorer: React.FC<PropertiesExplorerProps> = ({
  propertiesData,
  searchQuery,
  activeFileId,
  onSelectFile,
  onCloseMobile,
  expandedProperties: externalExpandedProps,
  setExpandedProperties: externalSetExpandedProps,
  scope: externalScope,
  setScope: externalSetScope,
  sortMode: externalSortMode,
  setSortMode: externalSetSortMode,
}) => {
  const [internalScope, setInternalScope] = useState<PropertyTabScope>('all');
  const [internalSortMode, setInternalSortMode] = useState<PropertySortMode>('count');
  const [internalExpandedProps, setInternalExpandedProps] = useState<Set<string>>(new Set());
  const [expandedValueGroups, setExpandedValueGroups] = useState<Set<string>>(new Set());

  const scope = externalScope ?? internalScope;
  const setScope = externalSetScope ?? setInternalScope;
  const sortMode = externalSortMode ?? internalSortMode;
  const setSortMode = externalSetSortMode ?? setInternalSortMode;

  const expandedProps = externalExpandedProps ?? internalExpandedProps;
  const setExpandedProps = externalSetExpandedProps ?? setInternalExpandedProps;

  const query = searchQuery.toLowerCase().trim();

  // Toggle single property expansion
  const toggleProperty = (propId: string) => {
    setExpandedProps((prev) => {
      const next = new Set(prev);
      if (next.has(propId)) {
        next.delete(propId);
      } else {
        next.add(propId);
      }
      return next;
    });
  };

  // Toggle value group expansion inside a property
  const toggleValueGroup = (groupKey: string) => {
    setExpandedValueGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Filter properties based on search query and scope
  const filterAndSortProps = (items: PropertyItem[]) => {
    return items
      .filter((prop) => {
        if (!query) return true;
        const matchesKey = prop.label.toLowerCase().includes(query) || prop.key.toLowerCase().includes(query);
        const matchesValues = prop.valueGroups.some((vg) =>
          vg.displayValue.toLowerCase().includes(query)
        );
        const matchesNotes = prop.allNotes.some((n) =>
          n.name.toLowerCase().includes(query)
        );
        return matchesKey || matchesValues || matchesNotes;
      })
      .sort((a, b) => {
        if (sortMode === 'count') {
          const countDiff = b.totalNotesCount - a.totalNotesCount;
          if (countDiff !== 0) return countDiff;
        }
        return a.label.localeCompare(b.label);
      });
  };

  const filteredCoreProps = useMemo(
    () => filterAndSortProps(propertiesData.coreProperties),
    [propertiesData.coreProperties, query, sortMode]
  );

  const filteredCustomProps = useMemo(
    () => filterAndSortProps(propertiesData.customProperties),
    [propertiesData.customProperties, query, sortMode]
  );

  const totalFilteredCount =
    (scope === 'custom' ? 0 : filteredCoreProps.length) +
    (scope === 'core' ? 0 : filteredCustomProps.length);

  // Property type icon selector
  const getPropertyIcon = (prop: PropertyItem) => {
    if (prop.key === 'noteType') return <Layers size={13} className="text-accent-primary" />;
    if (prop.key === 'status') return <ListFilter size={13} className="text-amber-500" />;
    if (prop.key === 'tags') return <TagIcon size={13} className="text-emerald-500" />;
    if (prop.key === 'emotion') return <Smile size={13} className="text-rose-500" />;
    if (prop.key === 'aliases') return <Type size={13} className="text-blue-500" />;

    switch (prop.type) {
      case 'number':
        return <Hash size={13} className="text-purple-400" />;
      case 'date':
        return <Calendar size={13} className="text-cyan-400" />;
      case 'checkbox':
        return <CheckSquare size={13} className="text-emerald-400" />;
      case 'select':
        return <ListFilter size={13} className="text-amber-400" />;
      case 'list':
        return <TagIcon size={13} className="text-emerald-400" />;
      default:
        return <Type size={13} className="text-icon-accent" />;
    }
  };

  // Render a single Note item
  const renderNoteItem = (note: PropertyNoteItem, customValueLabel?: string) => {
    const isActive = activeFileId === note.id;
    return (
      <div
        key={`${note.id}-${customValueLabel || note.displayValue}`}
        onClick={() => {
          onSelectFile(note.id);
          onCloseMobile();
        }}
        className={twMerge(
          'group flex items-center justify-between py-1 px-2 rounded-md text-xs cursor-pointer transition-colors',
          isActive
            ? 'bg-accent-primary/10 text-accent-primary font-medium'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText
            size={12}
            className={twMerge(
              'shrink-0',
              isActive ? 'text-accent-primary' : 'text-icon-accent group-hover:text-text-primary'
            )}
          />
          <span className="truncate">{note.name}</span>
        </div>

        {customValueLabel && customValueLabel !== note.name && (
          <span className="text-[10px] text-text-muted shrink-0 ml-2 max-w-[100px] truncate px-1.5 py-0.2 rounded bg-bg-surface">
            {customValueLabel}
          </span>
        )}
      </div>
    );
  };

  // Render a Property Card/Row
  const renderPropertyRow = (prop: PropertyItem) => {
    const isExpanded = expandedProps.has(prop.id) || !!query;
    const hasMultipleGroups = prop.valueGroups.length > 1;

    return (
      <div key={prop.id} className="flex flex-col">
        {/* Main Property Item Header */}
        <div
          onClick={() => toggleProperty(prop.id)}
          className={twMerge(
            'flex items-center justify-between py-1.5 px-2 rounded-lg text-xs cursor-pointer select-none transition-colors group',
            isExpanded ? 'bg-bg-surface text-text-primary' : 'hover:bg-bg-hover text-text-secondary hover:text-text-primary'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-icon-accent shrink-0 group-hover:text-text-primary transition-transform">
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>

            <span className="shrink-0">{getPropertyIcon(prop)}</span>

            <span className="font-medium truncate text-text-primary">{prop.label}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-bg-secondary text-text-muted">
              {prop.totalNotesCount}
            </span>
          </div>
        </div>

        {/* Expanded Content: Values and Matching Notes */}
        {isExpanded && (
          <div className="pl-5 pr-1 py-1 space-y-1">
            {hasMultipleGroups ? (
              // Distinct values group list
              prop.valueGroups.map((vg, idx) => {
                const groupKey = `${prop.id}_val_${idx}`;
                const isGroupExpanded = expandedValueGroups.has(groupKey) || !!query;

                return (
                  <div key={groupKey} className="flex flex-col">
                    {/* Value group row */}
                    <div
                      onClick={() => toggleValueGroup(groupKey)}
                      className={twMerge(
                        'flex items-center justify-between py-1 px-1.5 rounded-md text-[11px] cursor-pointer select-none transition-colors group',
                        isGroupExpanded
                          ? 'text-text-primary font-medium bg-bg-surface/50'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-icon-accent shrink-0">
                          {isGroupExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </span>
                        <span className="truncate text-text-primary">{vg.displayValue}</span>
                      </div>
                      <span className="text-[10px] text-text-muted shrink-0 ml-2">
                        {vg.notes.length}
                      </span>
                    </div>

                    {/* Notes in this value group */}
                    {isGroupExpanded && (
                      <div className="pl-4 py-0.5 space-y-0.5">
                        {vg.notes.map((note) => renderNoteItem(note))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Single group or flat notes list
              <div className="space-y-0.5">
                {prop.allNotes.map((note) => renderNoteItem(note, note.displayValue))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-1 py-1 select-none">
      {/* Main Properties List Area */}
      {totalFilteredCount === 0 ? (
        <div className="py-8 px-4 text-center text-text-muted flex flex-col items-center justify-center space-y-2">
          <SlidersHorizontal size={24} className="text-text-muted/60" />
          <p className="text-xs font-medium text-text-secondary">
            {query ? 'Tidak ada properti yang cocok' : 'Belum ada properti terdeteksi'}
          </p>
          <p className="text-[11px] text-text-muted leading-relaxed max-w-[200px]">
            {query
              ? `Tidak ditemukan properti dengan kata kunci "${query}".`
              : 'Tambahkan Type, Status, Tags, atau Custom Properties di sidebar kanan catatanmu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* SECTION: Core Properties */}
          {(scope === 'all' || scope === 'core') && filteredCoreProps.length > 0 && (
            <div className="space-y-1">
              {scope === 'all' && (
                <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-text-muted">
                  <span>Core Properties</span>
                  <span>{filteredCoreProps.length}</span>
                </div>
              )}
              <div className="space-y-0.5">
                {filteredCoreProps.map(renderPropertyRow)}
              </div>
            </div>
          )}

          {/* SECTION: Custom Properties */}
          {(scope === 'all' || scope === 'custom') && filteredCustomProps.length > 0 && (
            <div className="space-y-1">
              {scope === 'all' && (
                <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-text-muted">
                  <span>Custom Properties</span>
                  <span>{filteredCustomProps.length}</span>
                </div>
              )}
              <div className="space-y-0.5">
                {filteredCustomProps.map(renderPropertyRow)}
              </div>
            </div>
          )}

          {/* Empty Custom Properties notice in Custom view */}
          {scope === 'custom' && filteredCustomProps.length === 0 && !query && (
            <div className="py-6 px-4 text-center text-text-muted flex flex-col items-center justify-center space-y-2">
              <Sparkles size={20} className="text-accent-primary/60" />
              <p className="text-xs font-medium text-text-secondary">Belum ada Custom Property</p>
              <p className="text-[11px] text-text-muted leading-relaxed max-w-[200px]">
                Buka catatan apa saja dan tambahkan atribut khusus di tab Properties (sidebar kanan).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
