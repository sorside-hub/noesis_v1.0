import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Plus, X, Sparkles, Sliders, Database, ChevronDown } from 'lucide-react';
import { EnrichedNoteItem } from '../types';

export interface DynamicFilter {
  id: string;
  property: string; // 'type' | 'status' | 'tags' | 'keywords' | 'concepts' | 'emotion' | custom property key
  value: string;
}

interface HubFilterBarProps {
  notes: EnrichedNoteItem[];
  filters: DynamicFilter[];
  onChange: (filters: DynamicFilter[]) => void;
}

// Fixed Core & Analysis property definitions
export const CORE_PROPERTIES = [
  { key: 'type', label: 'Note Type' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
];

export const ANALYSIS_PROPERTIES = [
  { key: 'keywords', label: 'Keywords' },
  { key: 'concepts', label: 'Concepts' },
  { key: 'emotion', label: 'Emotion' },
];

export const getPropertyLabel = (key: string): string => {
  const core = CORE_PROPERTIES.find(p => p.key === key);
  if (core) return core.label;
  const analysis = ANALYSIS_PROPERTIES.find(p => p.key === key);
  if (analysis) return analysis.label;
  if (key === 'noteType') return 'Note Type';
  return key; // Return custom property name as-is
};

export const isAnalysisProperty = (key: string): boolean => {
  return ANALYSIS_PROPERTIES.some(p => p.key === key);
};

export const isCoreProperty = (key: string): boolean => {
  return CORE_PROPERTIES.some(p => p.key === key) || key === 'noteType';
};

export const HubFilterBar: React.FC<HubFilterBarProps> = ({ notes, filters, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProp, setNewProp] = useState('');
  const [newVal, setNewVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique Custom Properties from all notes
  const customKeys = useMemo(() => {
    const keys = new Set<string>();
    const knownKeys = new Set([
      'type', 'noteType', 'status', 'tags', 'aliases', 'title',
      'keywords', 'concepts', 'emotion', 'summary',
      'id', 'note_id', 'user_id', 'created_at', 'updated_at', 'customProperties'
    ]);

    notes.forEach(note => {
      if (note.properties) {
        Object.keys(note.properties).forEach(k => {
          if (!knownKeys.has(k) && k.trim()) {
            keys.add(k.trim());
          }
        });
      }
    });

    return Array.from(keys).sort();
  }, [notes]);

  // Extract dynamic values for auto-complete for the selected property
  const propertyValues = useMemo(() => {
    if (!newProp) return [];
    const values = new Set<string>();
    let hasEmpty = false;

    notes.forEach(note => {
      let val = note.properties?.[newProp];
      if (val === undefined || val === null) {
        val = (note as any)[newProp];
      }
      if ((val === undefined || val === null) && newProp === 'type') {
        val = note.type || note.properties?.['noteType'];
      }

      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        hasEmpty = true;
      } else {
        if (typeof val === 'boolean') {
          values.add('true');
          values.add('false');
        } else if (Array.isArray(val)) {
          val.forEach(v => {
            if (v !== undefined && v !== null) {
              const str = String(v).trim();
              if (str) values.add(str);
            }
          });
        } else {
          const str = String(val).trim();
          if (str) values.add(str);
        }
      }
    });

    if (hasEmpty) {
      values.add('-');
    }

    // Provide sensible defaults for status if none found in notes
    if (newProp === 'status' && values.size === 0) {
      ['Inbox', 'Inbox (Refine)', 'Inbox (Keeper)', 'Idea', 'Draft', 'In Progress', 'Completed', 'Archived'].forEach(s => values.add(s));
    }

    return Array.from(values).sort();
  }, [newProp, notes]);

  const addFilter = () => {
    if (newProp && newVal.trim()) {
      onChange([
        ...filters,
        {
          id: Math.random().toString(36).substring(2, 9),
          property: newProp,
          value: newVal.trim(),
        },
      ]);
      setIsAdding(false);
      setNewProp('');
      setNewVal('');
    }
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 w-full text-xs">
      {/* Active Filters & Add Button Row */}
      {!isAdding && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 w-full">
          {filters.length > 0 && (
            <span className="hidden sm:inline-flex text-[11px] font-medium text-text-muted items-center gap-1 shrink-0 mr-0.5">
              <Filter size={11} className="text-text-muted" /> Filters:
            </span>
          )}

          {filters.map(filter => {
            const isAnalysis = isAnalysisProperty(filter.property);
            const isCore = isCoreProperty(filter.property);
            const label = getPropertyLabel(filter.property);

            return (
              <div
                key={filter.id}
                className="group flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs bg-bg-secondary hover:bg-bg-hover/80 text-text-primary transition-all shrink-0 cursor-default"
              >
                {isAnalysis && <Sparkles size={11} className="text-purple-400 shrink-0" />}
                {isCore && <Sliders size={11} className="text-accent-primary shrink-0" />}
                {!isAnalysis && !isCore && <Database size={11} className="text-blue-400 shrink-0" />}
                
                <span className="text-text-muted font-normal">{label}</span>
                <span className="text-text-muted/40 font-mono text-[10px]">:</span>
                <span className="font-medium text-text-primary">{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="text-text-muted/70 hover:text-red-400 hover:bg-bg-primary/50 p-0.5 rounded ml-0.5 cursor-pointer transition-colors"
                  title="Hapus Filter"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
          >
            <Plus size={12} className="text-text-muted group-hover:text-text-primary transition-colors" />
            <span>{filters.length === 0 ? 'Add Filter' : 'Filter'}</span>
          </button>

          {filters.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-[11px] font-medium text-text-muted hover:text-status-error transition-colors cursor-pointer shrink-0 ml-1 px-1 py-0.5 rounded"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Add Filter Form - Compact 1-Row Layout */}
      {isAdding && (
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg bg-bg-secondary transition-all animate-in fade-in duration-150 w-full relative">
          {/* Property Select */}
          <div className="shrink-0 max-w-[110px] sm:max-w-[140px]">
            <select
              value={newProp}
              onChange={(e) => {
                setNewProp(e.target.value);
                setNewVal('');
              }}
              className="w-full bg-bg-primary hover:bg-bg-primary/90 rounded-md px-2 py-1 text-[11px] sm:text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/40 cursor-pointer transition-all truncate"
            >
              <option value="" className="bg-bg-primary text-text-muted">
                -- Properti --
              </option>

              {/* 1. Core Properties */}
              <optgroup label="Core" className="bg-bg-primary text-accent-primary font-semibold">
                {CORE_PROPERTIES.map(p => (
                  <option key={p.key} value={p.key} className="bg-bg-primary text-text-primary font-normal">
                    {p.label}
                  </option>
                ))}
              </optgroup>

              {/* 2. Custom Properties */}
              {customKeys.length > 0 && (
                <optgroup label="Custom" className="bg-bg-primary text-blue-400 font-semibold">
                  {customKeys.map(k => (
                    <option key={k} value={k} className="bg-bg-primary text-text-primary font-normal">
                      {k}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* 3. Analysis Properties (AI) */}
              <optgroup label="AI" className="bg-bg-primary text-purple-400 font-semibold">
                {ANALYSIS_PROPERTIES.map(p => (
                  <option key={p.key} value={p.key} className="bg-bg-primary text-text-primary font-normal">
                    {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Dynamic Auto-complete Value Input with Floating Overlay Dropdown */}
          <div 
            className="relative flex-1 min-w-0 bg-bg-primary rounded-md flex items-center focus-within:ring-1 focus-within:ring-accent-primary/40" 
            ref={dropdownRef}
          >
            <input
              type="text"
              value={newVal}
              disabled={!newProp}
              onChange={(e) => {
                setNewVal(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (newProp) setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProp && newVal.trim()) {
                  addFilter();
                  setShowDropdown(false);
                }
              }}
              placeholder={newProp ? `Nilai ${getPropertyLabel(newProp)}...` : 'Pilih properti dulu...'}
              className="w-full bg-transparent pl-2 pr-6 py-1 text-[11px] sm:text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed truncate"
              autoFocus
            />
            {newProp && (
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-1 text-text-muted hover:text-text-primary cursor-pointer p-0.5"
              >
                <ChevronDown size={11} className={`transition-transform duration-150 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Floating Autocomplete Dropdown Popup */}
            {showDropdown && newProp && propertyValues.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary rounded-lg shadow-xl z-50 py-1 border border-border-default/60 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 min-w-[140px]">
                {propertyValues
                  .filter(v => v.toLowerCase().includes(newVal.toLowerCase()))
                  .map(v => (
                    <button
                      key={v}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewVal(v);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1 text-[11px] sm:text-xs text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer truncate"
                    >
                      {v}
                    </button>
                  ))}
                {propertyValues.filter(v => v.toLowerCase().includes(newVal.toLowerCase())).length === 0 && (
                  <div className="px-2.5 py-1.5 text-[11px] text-text-muted text-center italic">
                    Tidak ada opsi cocok
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: Add & Cancel */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={addFilter}
              disabled={!newProp || !newVal.trim()}
              className="px-2 sm:px-2.5 py-1 rounded-md bg-accent-primary text-accent-contrast font-medium text-[11px] sm:text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewProp('');
                setNewVal('');
                setShowDropdown(false);
              }}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title="Batal"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
