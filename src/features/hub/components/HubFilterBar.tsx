import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Plus, X, Sparkles, Sliders, Database, Search, Check, CornerDownLeft } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
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
  const [propQuery, setPropQuery] = useState('');
  const [newVal, setNewVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activePropIndex, setActivePropIndex] = useState(-1);
  const [activeValIndex, setActiveValIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const propInputRef = useRef<HTMLInputElement>(null);
  const valInputRef = useRef<HTMLInputElement>(null);

  // Close suggestions or form on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus property input when opening add form
  useEffect(() => {
    if (isAdding && !newProp) {
      setShowSuggestions(true);
      setTimeout(() => {
        propInputRef.current?.focus();
      }, 50);
    }
  }, [isAdding, newProp]);

  // Extract unique Custom Properties from all notes
  const customKeys = useMemo(() => {
    const keys = new Set<string>();

    notes.forEach(note => {
      if (note.customProperties && typeof note.customProperties === 'object') {
        Object.keys(note.customProperties).forEach(k => {
          if (k && k.trim()) {
            keys.add(k.trim());
          }
        });
      }
    });

    return Array.from(keys).sort();
  }, [notes]);

  // Filtered property suggestions based on user search
  const filteredPropGroups = useMemo(() => {
    const q = propQuery.toLowerCase().trim();

    const core = CORE_PROPERTIES.filter(p => !q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q));
    const custom = customKeys.filter(k => !q || k.toLowerCase().includes(q));
    const ai = ANALYSIS_PROPERTIES.filter(p => !q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q));

    // Flatten for keyboard index navigation
    const allItems: Array<{ key: string; label: string; group: 'core' | 'custom' | 'ai' }> = [
      ...core.map(p => ({ key: p.key, label: p.label, group: 'core' as const })),
      ...custom.map(k => ({ key: k, label: k, group: 'custom' as const })),
      ...ai.map(p => ({ key: p.key, label: p.label, group: 'ai' as const })),
    ];

    return {
      core,
      custom,
      ai,
      allItems,
      totalMatches: allItems.length
    };
  }, [propQuery, customKeys]);

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

  const filteredValues = useMemo(() => {
    if (!newVal) return propertyValues;
    return propertyValues.filter(v => v.toLowerCase().includes(newVal.toLowerCase()));
  }, [propertyValues, newVal]);

  const selectProperty = (key: string) => {
    setNewProp(key);
    setPropQuery('');
    setNewVal('');
    setActivePropIndex(-1);
    setActiveValIndex(-1);
    setShowSuggestions(true);
    setTimeout(() => {
      valInputRef.current?.focus();
    }, 50);
  };

  const addFilter = (overrideVal?: string) => {
    const valToApply = (overrideVal !== undefined ? overrideVal : newVal).trim();
    if (newProp && valToApply) {
      onChange([
        ...filters,
        {
          id: Math.random().toString(36).substring(2, 9),
          property: newProp,
          value: valToApply,
        },
      ]);
      resetForm();
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setNewProp('');
    setNewVal('');
    setPropQuery('');
    setShowSuggestions(false);
    setActivePropIndex(-1);
    setActiveValIndex(-1);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id));
  };

  // Keyboard navigation for Property selection
  const handlePropKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = filteredPropGroups.allItems;
    if (list.length > 0 && showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePropIndex(prev => (prev < list.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePropIndex(prev => (prev > 0 ? prev - 1 : list.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activePropIndex >= 0 && activePropIndex < list.length) {
          selectProperty(list[activePropIndex].key);
        } else if (list.length > 0) {
          selectProperty(list[0].key);
        }
        return;
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      resetForm();
    }
  };

  // Keyboard navigation for Value selection
  const handleValKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredValues.length > 0 && showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveValIndex(prev => (prev < filteredValues.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveValIndex(prev => (prev > 0 ? prev - 1 : filteredValues.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeValIndex >= 0 && activeValIndex < filteredValues.length) {
          addFilter(filteredValues[activeValIndex]);
        } else {
          addFilter();
        }
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      addFilter();
      return;
    }

    if (e.key === 'Backspace' && !newVal) {
      e.preventDefault();
      setNewProp('');
      setPropQuery('');
      setShowSuggestions(true);
      setTimeout(() => {
        propInputRef.current?.focus();
      }, 50);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full text-xs">
      {/* 1. Active Filters & Add Button Row */}
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
                className="group flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs bg-bg-secondary hover:bg-bg-hover text-text-primary transition-all shrink-0 cursor-default"
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
            onClick={() => {
              setIsAdding(true);
              setNewProp('');
              setNewVal('');
              setPropQuery('');
            }}
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

      {/* 2. Unified Expanding Filter Input Card (ChipInput Inspired) */}
      {isAdding && (
        <div 
          ref={containerRef}
          className="w-full flex flex-col bg-bg-secondary rounded-xl transition-all focus-within:ring-1 focus-within:ring-accent-primary/50 overflow-hidden text-xs animate-in fade-in duration-150"
        >
          {/* Top Unified Input Row */}
          <div className="min-h-[36px] px-2.5 py-1 flex items-center gap-1.5 flex-wrap">
            {!newProp ? (
              // Step 1: Search / Select Property
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                <Search size={13} className="text-text-muted shrink-0 ml-0.5" />
                <input
                  ref={propInputRef}
                  type="text"
                  value={propQuery}
                  onChange={(e) => {
                    setPropQuery(e.target.value);
                    setShowSuggestions(true);
                    setActivePropIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handlePropKeyDown}
                  placeholder="Cari atau pilih properti..."
                  className="w-full bg-transparent py-1 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />
              </div>
            ) : (
              // Step 2: Property Chip + Value Input
              <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-bg-primary text-text-primary shrink-0">
                  {isAnalysisProperty(newProp) ? (
                    <Sparkles size={11} className="text-purple-400 shrink-0" />
                  ) : isCoreProperty(newProp) ? (
                    <Sliders size={11} className="text-accent-primary shrink-0" />
                  ) : (
                    <Database size={11} className="text-blue-400 shrink-0" />
                  )}
                  <span className="max-w-[120px] truncate">{getPropertyLabel(newProp)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProp('');
                      setPropQuery('');
                      setShowSuggestions(true);
                      setTimeout(() => propInputRef.current?.focus(), 50);
                    }}
                    className="hover:text-status-error text-text-muted p-0.5 rounded-full cursor-pointer transition-colors ml-0.5"
                    title="Ganti Properti"
                  >
                    <X size={10} />
                  </button>
                </span>

                <span className="text-text-muted/50 font-mono text-xs select-none">:</span>

                <input
                  ref={valInputRef}
                  type="text"
                  value={newVal}
                  onChange={(e) => {
                    setNewVal(e.target.value);
                    setShowSuggestions(true);
                    setActiveValIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleValKeyDown}
                  placeholder={`Ketik atau pilih nilai ${getPropertyLabel(newProp)}...`}
                  className="flex-1 min-w-[100px] bg-transparent py-1 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />
              </div>
            )}

            {/* Right-Side Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {newProp && newVal.trim() && (
                <button
                  type="button"
                  onClick={() => addFilter()}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-primary text-accent-contrast font-medium text-[11px] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <span>Terapkan</span>
                  <CornerDownLeft size={10} />
                </button>
              )}
              <button
                type="button"
                onClick={resetForm}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                title="Batal"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* In-flow Expandable Suggestions (Unified Container) */}
          {showSuggestions && (
            <div className="animate-in fade-in duration-150">
              <div className="mx-2.5 h-px bg-border-subtle/30 my-0.5" />

              {!newProp ? (
                // 1. Property Suggestions List
                <div className="max-h-56 overflow-y-auto custom-scrollbar px-1 py-1 space-y-1">
                  {filteredPropGroups.totalMatches === 0 ? (
                    <div className="px-3 py-2.5 text-center text-text-muted text-[11px]">
                      Tidak ada properti yang cocok
                    </div>
                  ) : (
                    <>
                      {/* Core Group */}
                      {filteredPropGroups.core.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold text-accent-primary uppercase tracking-wider flex items-center gap-1">
                            <Sliders size={10} /> Core Properties
                          </div>
                          {filteredPropGroups.core.map((p) => {
                            const itemIndex = filteredPropGroups.allItems.findIndex(it => it.key === p.key);
                            const isActive = itemIndex === activePropIndex;
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectProperty(p.key);
                                }}
                                className={twMerge(
                                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                  isActive ? 'bg-bg-tertiary text-text-primary font-medium' : ''
                                )}
                              >
                                <span className="font-medium">{p.label}</span>
                                <span className="text-[10px] text-text-muted">Core</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Custom Group */}
                      {filteredPropGroups.custom.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <Database size={10} /> Custom Properties
                          </div>
                          {filteredPropGroups.custom.map((k) => {
                            const itemIndex = filteredPropGroups.allItems.findIndex(it => it.key === k);
                            const isActive = itemIndex === activePropIndex;
                            return (
                              <button
                                key={k}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectProperty(k);
                                }}
                                className={twMerge(
                                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                  isActive ? 'bg-bg-tertiary text-text-primary font-medium' : ''
                                )}
                              >
                                <span className="font-medium truncate">{k}</span>
                                <span className="text-[10px] text-blue-400/80">Custom</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* AI Group */}
                      {filteredPropGroups.ai.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> AI Properties
                          </div>
                          {filteredPropGroups.ai.map((p) => {
                            const itemIndex = filteredPropGroups.allItems.findIndex(it => it.key === p.key);
                            const isActive = itemIndex === activePropIndex;
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectProperty(p.key);
                                }}
                                className={twMerge(
                                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                  isActive ? 'bg-bg-tertiary text-text-primary font-medium' : ''
                                )}
                              >
                                <span className="font-medium">{p.label}</span>
                                <span className="text-[10px] text-purple-400/80">AI</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // 2. Value Suggestions List
                <div className="max-h-48 overflow-y-auto custom-scrollbar px-1 py-1 space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-medium text-text-muted">
                    Pilihan Nilai Tersedia
                  </div>
                  {filteredValues.map((v, idx) => {
                    const isActive = idx === activeValIndex;
                    return (
                      <button
                        key={v}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addFilter(v);
                        }}
                        className={twMerge(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left truncate',
                          isActive ? 'bg-bg-tertiary text-text-primary font-medium' : ''
                        )}
                      >
                        <span className="truncate">{v}</span>
                        {newVal.toLowerCase() === v.toLowerCase() && (
                          <Check size={12} className="text-accent-primary shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                  {filteredValues.length === 0 && (
                    <div className="px-3 py-2 text-center text-text-muted text-[11px] italic">
                      {newVal ? `Tekan Enter untuk menerapkan "${newVal}"` : 'Belum ada data nilai di vault'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
