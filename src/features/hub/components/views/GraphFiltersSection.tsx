import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, X, Filter, Check, Sliders, Database, Sparkles, Layers, Search, CornerDownLeft } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { GraphFilter, DisplaySettings } from './GraphTypes';

export interface GraphFiltersSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  customFilters: GraphFilter[];
  setCustomFilters: (val: GraphFilter[]) => void;
  isAddingFilter: boolean;
  setIsAddingFilter: (val: boolean) => void;
  newFilterProp: string;
  setNewFilterProp: (val: string) => void;
  newFilterVal: string;
  setNewFilterVal: (val: string) => void;
  showFilterDropdown: boolean;
  setShowFilterDropdown: (val: boolean) => void;
  availableProperties: any[];
  propertyValuesMap: any;
  handleAddFilter: () => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (val: DisplaySettings) => void;
}

export const GraphFiltersSection: React.FC<GraphFiltersSectionProps> = ({
  isOpen,
  onToggle,
  customFilters,
  setCustomFilters,
  isAddingFilter,
  setIsAddingFilter,
  newFilterProp,
  setNewFilterProp,
  newFilterVal,
  setNewFilterVal,
  availableProperties,
  propertyValuesMap,
  handleAddFilter,
  displaySettings,
  setDisplaySettings,
}) => {
  const [propQuery, setPropQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activePropIndex, setActivePropIndex] = useState(-1);
  const [activeValIndex, setActiveValIndex] = useState(-1);

  const propInputRef = useRef<HTMLInputElement>(null);
  const valInputRef = useRef<HTMLInputElement>(null);

  // Auto focus when adding
  useEffect(() => {
    if (isAddingFilter && !newFilterProp) {
      setPropQuery('');
      setShowSuggestions(true);
      setTimeout(() => propInputRef.current?.focus(), 50);
    }
  }, [isAddingFilter, newFilterProp]);

  // Filter properties based on query
  const filteredProperties = useMemo(() => {
    const q = propQuery.toLowerCase().trim();
    const core = availableProperties.filter((p) => p.group === 'Core Properties' && (!q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)));
    const analysis = availableProperties.filter((p) => p.group === 'Analysis Properties' && (!q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)));
    const custom = availableProperties.filter((p) => p.group === 'Custom Properties' && (!q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)));
    
    const showAny = !q || 'semua properti'.includes(q) || 'any'.includes(q);

    const allItems: Array<{ key: string; label: string; group: string }> = [];
    if (showAny) {
      allItems.push({ key: 'any', label: 'Semua Properti', group: 'Any' });
    }
    core.forEach(p => allItems.push({ key: p.key, label: p.label, group: 'Core' }));
    analysis.forEach(p => allItems.push({ key: p.key, label: p.label, group: 'Analysis' }));
    custom.forEach(p => allItems.push({ key: p.key, label: p.label, group: 'Custom' }));

    return {
      showAny,
      core,
      analysis,
      custom,
      allItems,
      totalMatches: allItems.length,
    };
  }, [availableProperties, propQuery]);

  // Filter values based on query
  const availableValues: string[] = useMemo(() => {
    const vals = propertyValuesMap[newFilterProp] || propertyValuesMap.any || [];
    return Array.from(new Set(vals.map((v: any) => String(v).trim()))).filter(Boolean) as string[];
  }, [propertyValuesMap, newFilterProp]);

  const filteredValues = useMemo(() => {
    if (!newFilterVal) return availableValues;
    return availableValues.filter((v: string) => v.toLowerCase().includes(newFilterVal.toLowerCase()));
  }, [availableValues, newFilterVal]);

  const selectProperty = (key: string) => {
    setNewFilterProp(key);
    setPropQuery('');
    setNewFilterVal('');
    setShowSuggestions(true);
    setActivePropIndex(-1);
    setActiveValIndex(-1);
    setTimeout(() => valInputRef.current?.focus(), 50);
  };

  const handlePropKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = filteredProperties.allItems;
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
      setIsAddingFilter(false);
    }
  };

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
          setNewFilterVal(filteredValues[activeValIndex]);
          setTimeout(() => handleAddFilter(), 10);
        } else if (newFilterVal.trim()) {
          handleAddFilter();
        }
        return;
      }
    }

    if (e.key === 'Enter' && newFilterVal.trim()) {
      e.preventDefault();
      handleAddFilter();
      return;
    }

    if (e.key === 'Backspace' && !newFilterVal) {
      e.preventDefault();
      setNewFilterProp('');
      setPropQuery('');
      setShowSuggestions(true);
      setTimeout(() => propInputRef.current?.focus(), 50);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsAddingFilter(false);
    }
  };

  const getPropLabel = (key: string) => {
    if (key === 'any') return 'Semua Properti';
    const found = availableProperties.find((p) => p.key === key);
    return found ? found.label : key;
  };

  return (
    <div className="bg-bg-primary rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-bg-secondary flex items-center justify-center text-text-muted">
            <Filter size={12} />
          </div>
          <span className="text-xs font-semibold text-text-primary tracking-wide">
            Filter Graph
          </span>
        </div>
        <div className="flex items-center gap-2">
          {customFilters.length > 0 && (
            <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary font-mono">
              {customFilters.length}
            </span>
          )}
          {isOpen ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {customFilters.length > 1 && (
            <div className="flex items-center justify-between px-2 py-1.5 bg-bg-secondary rounded-lg">
              <span className="text-[10px] text-text-muted font-medium">Logika Kombinasi:</span>
              <div className="flex items-center gap-1 bg-bg-primary p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setDisplaySettings({ ...displaySettings, filterMatchMode: 'all' })}
                  className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                    displaySettings.filterMatchMode === 'all'
                      ? 'bg-accent-primary text-accent-contrast font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ALL (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setDisplaySettings({ ...displaySettings, filterMatchMode: 'any' })}
                  className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                    displaySettings.filterMatchMode === 'any'
                      ? 'bg-accent-primary text-accent-contrast font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ANY (OR)
                </button>
              </div>
            </div>
          )}

          {/* Pills List */}
          {customFilters.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {customFilters.map((filter) => {
                const label = getPropLabel(filter.property);
                return (
                  <div
                    key={filter.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-secondary text-[10px]"
                  >
                    <span className="text-text-muted font-medium">{label}:</span>
                    <span className="text-text-primary font-semibold truncate max-w-[100px]">
                      {filter.value}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomFilters(customFilters.filter((f) => f.id !== filter.id))
                      }
                      className="ml-1 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingFilter && (
              <p className="text-[10px] text-text-muted italic leading-relaxed">
                Belum ada filter. Klik "+ Tambah Filter" untuk menyembunyikan node.
              </p>
            )
          )}

          {/* Unified In-Flow Search & Add Filter Form */}
          {isAddingFilter ? (
            <div className="w-full flex flex-col bg-bg-secondary rounded-xl transition-all focus-within:ring-1 focus-within:ring-accent-primary/50 overflow-hidden text-xs animate-in fade-in duration-150">
              {/* Header Input Row */}
              <div className="px-2.5 py-1.5 flex items-center gap-1.5 min-h-[36px]">
                {!newFilterProp ? (
                  // Step 1: Search Property
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Search size={12} className="text-text-muted shrink-0 ml-0.5" />
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
                      placeholder="Cari properti (misal: tags, status)..."
                      className="w-full bg-transparent py-0.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                    />
                  </div>
                ) : (
                  // Step 2: Property Selected + Search Value
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-primary text-text-primary shrink-0">
                      {newFilterProp === 'any' ? (
                        <Layers size={10} className="text-text-muted" />
                      ) : (
                        <Sliders size={10} className="text-accent-primary" />
                      )}
                      <span className="max-w-[90px] truncate">{getPropLabel(newFilterProp)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewFilterProp('');
                          setPropQuery('');
                          setShowSuggestions(true);
                          setTimeout(() => propInputRef.current?.focus(), 50);
                        }}
                        className="hover:text-status-error text-text-muted p-0.5 rounded-full cursor-pointer transition-colors"
                      >
                        <X size={9} />
                      </button>
                    </span>

                    <span className="text-text-muted/50 font-mono text-xs select-none">:</span>

                    <input
                      ref={valInputRef}
                      type="text"
                      value={newFilterVal}
                      onChange={(e) => {
                        setNewFilterVal(e.target.value);
                        setShowSuggestions(true);
                        setActiveValIndex(-1);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={handleValKeyDown}
                      placeholder="Ketik/pilih nilai..."
                      className="flex-1 min-w-0 bg-transparent py-0.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                    />
                  </div>
                )}

                {/* Right Action */}
                <div className="flex items-center gap-1 shrink-0">
                  {newFilterProp && newFilterVal.trim() && (
                    <button
                      type="button"
                      onClick={handleAddFilter}
                      className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-primary text-accent-contrast font-medium text-[10px] hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span>Terapkan</span>
                      <CornerDownLeft size={9} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFilter(false);
                      setNewFilterProp('');
                      setNewFilterVal('');
                    }}
                    className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* In-flow Expandable Suggestions */}
              {showSuggestions && (
                <div className="animate-in fade-in duration-150">
                  <div className="mx-2 h-px bg-border-subtle/30 my-0.5" />

                  {!newFilterProp ? (
                    // Property Suggestions
                    <div className="max-h-44 overflow-y-auto custom-scrollbar px-1 py-1 space-y-1">
                      {filteredProperties.totalMatches === 0 ? (
                        <div className="px-3 py-2 text-center text-text-muted text-[11px]">
                          Tidak ada properti yang cocok
                        </div>
                      ) : (
                        <>
                          {filteredProperties.showAny && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectProperty('any');
                              }}
                              className={twMerge(
                                'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                activePropIndex === 0 ? 'bg-bg-tertiary text-text-primary' : ''
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <Layers size={11} className="text-text-muted" />
                                <span className="font-medium">Semua Properti</span>
                              </div>
                              <span className="text-[10px] text-text-muted">Global</span>
                            </button>
                          )}

                          {filteredProperties.core.length > 0 && (
                            <div>
                              <div className="px-2 py-0.5 text-[9px] font-semibold text-accent-primary uppercase tracking-wider flex items-center gap-1">
                                <Sliders size={9} /> Core Properties
                              </div>
                              {filteredProperties.core.map((p) => {
                                const itemIndex = filteredProperties.allItems.findIndex(it => it.key === p.key);
                                return (
                                  <button
                                    key={p.key}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      selectProperty(p.key);
                                    }}
                                    className={twMerge(
                                      'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                      itemIndex === activePropIndex ? 'bg-bg-tertiary text-text-primary' : ''
                                    )}
                                  >
                                    <span className="font-medium">{p.label}</span>
                                    <span className="text-[10px] text-text-muted">Core</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {filteredProperties.analysis.length > 0 && (
                            <div>
                              <div className="px-2 py-0.5 text-[9px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={9} /> Analysis Properties
                              </div>
                              {filteredProperties.analysis.map((p) => {
                                const itemIndex = filteredProperties.allItems.findIndex(it => it.key === p.key);
                                return (
                                  <button
                                    key={p.key}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      selectProperty(p.key);
                                    }}
                                    className={twMerge(
                                      'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                      itemIndex === activePropIndex ? 'bg-bg-tertiary text-text-primary' : ''
                                    )}
                                  >
                                    <span className="font-medium">{p.label}</span>
                                    <span className="text-[10px] text-purple-400">AI</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {filteredProperties.custom.length > 0 && (
                            <div>
                              <div className="px-2 py-0.5 text-[9px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                <Database size={9} /> Custom Properties
                              </div>
                              {filteredProperties.custom.map((p) => {
                                const itemIndex = filteredProperties.allItems.findIndex(it => it.key === p.key);
                                return (
                                  <button
                                    key={p.key}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      selectProperty(p.key);
                                    }}
                                    className={twMerge(
                                      'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left',
                                      itemIndex === activePropIndex ? 'bg-bg-tertiary text-text-primary' : ''
                                    )}
                                  >
                                    <span className="font-medium truncate">{p.label}</span>
                                    <span className="text-[10px] text-blue-400">Custom</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // Value Suggestions
                    <div className="max-h-40 overflow-y-auto custom-scrollbar px-1 py-1 space-y-0.5">
                      <div className="px-2 py-0.5 text-[9px] font-medium text-text-muted">
                        Pilihan Nilai
                      </div>
                      {filteredValues.map((v, idx) => {
                        const isActive = idx === activeValIndex;
                        return (
                          <button
                            key={v}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewFilterVal(v);
                              setTimeout(() => handleAddFilter(), 10);
                            }}
                            className={twMerge(
                              'w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left truncate',
                              isActive ? 'bg-bg-tertiary text-text-primary font-medium' : ''
                            )}
                          >
                            <span className="truncate">{v}</span>
                            {newFilterVal.toLowerCase() === v.toLowerCase() && (
                              <Check size={11} className="text-accent-primary shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                      {filteredValues.length === 0 && (
                        <div className="px-2.5 py-1.5 text-center text-text-muted text-[10px] italic">
                          {newFilterVal ? `Tekan Enter untuk gunakan "${newFilterVal}"` : 'Ketik nilai bebas'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsAddingFilter(true);
                setNewFilterProp('');
                setNewFilterVal('');
                setPropQuery('');
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              <Plus size={14} className="text-accent-primary" /> Tambah Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
