import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Plus, Check, Sliders, Database, Sparkles, Search, CornerDownLeft } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { GraphCustomGroup } from './GraphTypes';

interface GraphGroupsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  customGroups: GraphCustomGroup[];
  setCustomGroups: (val: GraphCustomGroup[]) => void;
  isAddingGroup: boolean;
  setIsAddingGroup: (val: boolean) => void;
  newGroupProp: string;
  setNewGroupProp: (val: string) => void;
  newGroupVal: string;
  setNewGroupVal: (val: string) => void;
  newGroupColor: string;
  setNewGroupColor: (val: string) => void;
  showGroupDropdown: boolean;
  setShowGroupDropdown: (val: boolean) => void;
  availableProperties: any[];
  propertyValuesMap: any;
  handleAddGroup: () => void;
  groupMatchCounts: Record<string, number>;
}

export const GraphGroupsSection: React.FC<GraphGroupsSectionProps> = ({
  isOpen,
  onToggle,
  customGroups,
  setCustomGroups,
  isAddingGroup,
  setIsAddingGroup,
  newGroupProp,
  setNewGroupProp,
  newGroupVal,
  setNewGroupVal,
  newGroupColor,
  setNewGroupColor,
  availableProperties,
  propertyValuesMap,
  handleAddGroup,
  groupMatchCounts,
}) => {
  const [propQuery, setPropQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activePropIndex, setActivePropIndex] = useState(-1);
  const [activeValIndex, setActiveValIndex] = useState(-1);

  const propInputRef = useRef<HTMLInputElement>(null);
  const valInputRef = useRef<HTMLInputElement>(null);

  // Auto focus when adding
  useEffect(() => {
    if (isAddingGroup && !newGroupProp) {
      setPropQuery('');
      setShowSuggestions(true);
      setTimeout(() => propInputRef.current?.focus(), 50);
    }
  }, [isAddingGroup, newGroupProp]);

  // Filter properties based on query
  const filteredProperties = useMemo(() => {
    const q = propQuery.toLowerCase().trim();
    const core = availableProperties.filter((p) => p.group === 'Core Properties' && (!q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)));
    const analysis = availableProperties.filter((p) => p.group === 'Analysis Properties' && (!q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)));
    const custom = availableProperties.filter((p) => p.group === 'Custom Properties' && (!q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)));

    const allItems: Array<{ key: string; label: string; group: string }> = [];
    core.forEach(p => allItems.push({ key: p.key, label: p.label, group: 'Core' }));
    analysis.forEach(p => allItems.push({ key: p.key, label: p.label, group: 'Analysis' }));
    custom.forEach(p => allItems.push({ key: p.key, label: p.label, group: 'Custom' }));

    return {
      core,
      analysis,
      custom,
      allItems,
      totalMatches: allItems.length,
    };
  }, [availableProperties, propQuery]);

  // Filter values based on query
  const availableValues: string[] = useMemo(() => {
    const vals = propertyValuesMap[newGroupProp] || propertyValuesMap.any || [];
    return Array.from(new Set(vals.map((v: any) => String(v).trim()))).filter(Boolean) as string[];
  }, [propertyValuesMap, newGroupProp]);

  const filteredValues = useMemo(() => {
    if (!newGroupVal) return availableValues;
    return availableValues.filter((v: string) => v.toLowerCase().includes(newGroupVal.toLowerCase()));
  }, [availableValues, newGroupVal]);

  const selectProperty = (key: string) => {
    setNewGroupProp(key);
    setPropQuery('');
    setNewGroupVal('');
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
      setIsAddingGroup(false);
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
          setNewGroupVal(filteredValues[activeValIndex]);
          setTimeout(() => handleAddGroup(), 10);
        } else if (newGroupVal.trim()) {
          handleAddGroup();
        }
        return;
      }
    }

    if (e.key === 'Enter' && newGroupVal.trim()) {
      e.preventDefault();
      handleAddGroup();
      return;
    }

    if (e.key === 'Backspace' && !newGroupVal) {
      e.preventDefault();
      setNewGroupProp('');
      setPropQuery('');
      setShowSuggestions(true);
      setTimeout(() => propInputRef.current?.focus(), 50);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsAddingGroup(false);
    }
  };

  const getPropLabel = (key: string) => {
    const found = availableProperties.find((p) => p.key === key);
    return found ? found.label : key;
  };

  return (
    <div className="rounded-xl bg-bg-primary overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={14} className="text-accent-primary" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
          Grup
        </span>
        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary font-mono">
          {customGroups.length}
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {/* Pills List */}
          {customGroups.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {customGroups.map((group) => {
                const matchCount = groupMatchCounts[group.id] || 0;
                const label = getPropLabel(group.property);
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-secondary text-[10px]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-text-muted font-medium">{label}:</span>
                    <span className="text-text-primary font-semibold truncate max-w-[100px]">
                      {group.value}
                    </span>
                    <span className="text-text-muted/50 ml-0.5">({matchCount})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomGroups(customGroups.filter((g) => g.id !== group.id))
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
            !isAddingGroup && (
              <p className="text-[10px] text-text-muted italic leading-relaxed">
                Belum ada grup warna. Klik "+ Tambah Grup" untuk mewarnai berdasarkan properti.
              </p>
            )
          )}

          {/* Unified In-Flow Search & Add Group Form */}
          {isAddingGroup ? (
            <div className="w-full flex flex-col bg-bg-secondary rounded-xl transition-all focus-within:ring-1 focus-within:ring-accent-primary/50 overflow-hidden text-xs animate-in fade-in duration-150">
              {/* Header Input Row */}
              <div className="px-2.5 py-1.5 flex items-center gap-1.5 min-h-[36px]">
                {/* Color Dot Button */}
                <div
                  className="relative shrink-0 w-6 h-6 rounded-md overflow-hidden cursor-pointer bg-bg-primary hover:ring-1 hover:ring-accent-primary/40 transition-all flex items-center justify-center shadow-2xs"
                  title="Pilih Warna"
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: newGroupColor }} />
                  <input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                {!newGroupProp ? (
                  // Step 1: Search Property
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Search size={12} className="text-text-muted shrink-0" />
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
                      placeholder="Cari properti untuk warna..."
                      className="w-full bg-transparent py-0.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                    />
                  </div>
                ) : (
                  // Step 2: Property Selected + Search Value
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-primary text-text-primary shrink-0">
                      <Sliders size={10} className="text-accent-primary" />
                      <span className="max-w-[80px] truncate">{getPropLabel(newGroupProp)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewGroupProp('');
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
                      value={newGroupVal}
                      onChange={(e) => {
                        setNewGroupVal(e.target.value);
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

                {/* Right Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {newGroupProp && newGroupVal.trim() && (
                    <button
                      type="button"
                      onClick={handleAddGroup}
                      className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-primary text-accent-contrast font-medium text-[10px] hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span>Terapkan</span>
                      <CornerDownLeft size={9} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingGroup(false);
                      setNewGroupProp('');
                      setNewGroupVal('');
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

                  {!newGroupProp ? (
                    // Property Suggestions
                    <div className="max-h-44 overflow-y-auto custom-scrollbar px-1 py-1 space-y-1">
                      {filteredProperties.totalMatches === 0 ? (
                        <div className="px-3 py-2 text-center text-text-muted text-[11px]">
                          Tidak ada properti yang cocok
                        </div>
                      ) : (
                        <>
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
                              setNewGroupVal(v);
                              setTimeout(() => handleAddGroup(), 10);
                            }}
                            className={twMerge(
                              'w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-left truncate',
                              isActive ? 'bg-bg-tertiary text-text-primary font-medium' : ''
                            )}
                          >
                            <span className="truncate">{v}</span>
                            {newGroupVal.toLowerCase() === v.toLowerCase() && (
                              <Check size={11} className="text-accent-primary shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                      {filteredValues.length === 0 && (
                        <div className="px-2.5 py-1.5 text-center text-text-muted text-[10px] italic">
                          {newGroupVal ? `Tekan Enter untuk gunakan "${newGroupVal}"` : 'Ketik nilai bebas'}
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
                setIsAddingGroup(true);
                setNewGroupProp('');
                setNewGroupVal('');
                setPropQuery('');
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              <Plus size={14} className="text-accent-primary" /> Tambah Grup
            </button>
          )}
        </div>
      )}
    </div>
  );
};
