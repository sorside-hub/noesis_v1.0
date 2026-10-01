import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { CustomProperty, PropertyType } from '../../../types/vault';

interface CustomPropertiesSectionProps {
  customProperties: CustomProperty[];
  onChange: (props: CustomProperty[]) => void;
  activeNodeId?: string;
  existingPropertyKeys?: string[];
  existingPropertyValuesByKey?: Record<string, string[]>;
}

const PROPERTY_TYPES: Array<{ id: PropertyType; label: string }> = [
  { id: 'text', label: 'TEXT' },
  { id: 'number', label: 'NUMBER' },
  { id: 'date', label: 'DATE' },
  { id: 'checkbox', label: 'BOOLEAN' },
];

interface PropertyTypeMenuProps {
  currentType: PropertyType;
  onSelect: (type: PropertyType) => void;
}

const PropertyTypeMenu: React.FC<PropertyTypeMenuProps> = ({ currentType, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = PROPERTY_TYPES.find((t) => t.id === currentType)?.label || 'TEXT';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          "bg-bg-secondary hover:bg-bg-tertiary rounded-lg text-[10px] text-text-muted hover:text-text-primary px-2 py-1 flex items-center gap-1.5 focus:outline-none cursor-pointer uppercase font-bold tracking-wider transition-colors select-none",
          isOpen ? "bg-bg-tertiary text-text-primary ring-1 ring-accent-primary/50" : ""
        )}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={10} className={twMerge("text-icon-secondary transition-transform duration-150", isOpen ? "rotate-180 text-accent-primary" : "")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-32 bg-bg-secondary rounded-xl shadow-2xl ring-1 ring-accent-primary/60 z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
          {PROPERTY_TYPES.map((t) => {
            const isSelected = currentType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setIsOpen(false);
                }}
                className={twMerge(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase text-left cursor-pointer transition-colors",
                  isSelected
                    ? "bg-bg-tertiary text-accent-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary/80"
                )}
              >
                <span>{t.label}</span>
                {isSelected && <Check size={10} className="text-accent-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* 1. PROPERTY KEY INPUT WITH STABLE FOCUS & CLEAN DROPDOWN POPUP           */
/* ========================================================================= */
interface PropertyKeyInputProps {
  value: string;
  onChangeKey: (newKey: string) => void;
  existingKeys?: string[];
}

const PropertyKeyInput: React.FC<PropertyKeyInputProps> = ({
  value,
  onChangeKey,
  existingKeys = [],
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = existingKeys.filter(
    (k) => k.toLowerCase().includes(value.toLowerCase()) && k.toLowerCase() !== value.trim().toLowerCase()
  );

  const isSuggestionsOpen = showSuggestions && filteredSuggestions.length > 0;

  const handleSelect = (selectedKey: string) => {
    onChangeKey(selectedKey);
    setShowSuggestions(false);
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChangeKey(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
            setShowSuggestions(false);
          }
          if (e.key === 'Escape') {
            setShowSuggestions(false);
          }
        }}
        placeholder="Property Name..."
        className="bg-transparent text-xs font-semibold text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:text-accent-primary w-full py-1"
      />

      {isSuggestionsOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[160px] max-w-full bg-bg-secondary rounded-xl shadow-2xl ring-1 ring-accent-primary/50 z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-0.5">
            {filteredSuggestions.map((keyOpt) => (
              <button
                key={keyOpt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(keyOpt);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors cursor-pointer font-medium truncate"
              >
                {keyOpt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* 2. PROPERTY VALUE INPUT WITH STABLE FOCUS & CLEAN DROPDOWN POPUP         */
/* ========================================================================= */
interface PropertyValueInputProps {
  propertyKey: string;
  type: PropertyType;
  value: any;
  onChangeValue: (newVal: any) => void;
  existingValuesByKey?: Record<string, string[]>;
}

const PropertyValueInput: React.FC<PropertyValueInputProps> = ({
  propertyKey,
  type,
  value,
  onChangeValue,
  existingValuesByKey = {},
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const strVal = value !== undefined && value !== null ? String(value) : '';
  const historicalValues = propertyKey.trim() ? existingValuesByKey[propertyKey.trim()] || [] : [];
  const filteredSuggestions = historicalValues.filter(
    (v) => v.toLowerCase().includes(strVal.toLowerCase()) && v.toLowerCase() !== strVal.trim().toLowerCase()
  );

  const isSuggestionsOpen = showSuggestions && filteredSuggestions.length > 0 && (type === 'text' || type === 'number');

  const handleSelect = (selectedVal: string) => {
    onChangeValue(type === 'number' ? parseFloat(selectedVal) || selectedVal : selectedVal);
    setShowSuggestions(false);
  };

  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer py-0.5 select-none">
        <div className={twMerge(
          "w-4 h-4 rounded flex items-center justify-center transition-colors",
          value ? "bg-accent-primary text-accent-contrast" : "bg-bg-secondary"
        )}>
          {value && <Check size={11} className="stroke-[3]" />}
        </div>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChangeValue(e.target.checked)}
          className="sr-only"
        />
        <span className="text-xs text-text-secondary font-medium">
          {value ? 'True' : 'False'}
        </span>
      </label>
    );
  }

  if (type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChangeValue(e.target.value)}
        className="bg-bg-secondary text-xs text-text-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-primary w-full font-mono cursor-pointer"
      />
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => {
          onChangeValue(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
            setShowSuggestions(false);
          }
          if (e.key === 'Escape') {
            setShowSuggestions(false);
          }
        }}
        placeholder={type === 'number' ? '0' : 'Value...'}
        className="bg-bg-secondary text-xs text-text-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-primary w-full font-medium"
      />

      {isSuggestionsOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary rounded-xl shadow-2xl ring-1 ring-accent-primary/50 z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-0.5">
            {filteredSuggestions.map((valOpt) => (
              <button
                key={valOpt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(valOpt);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors cursor-pointer font-medium truncate"
              >
                {valOpt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* MAIN CUSTOM PROPERTIES SECTION                                             */
/* ========================================================================= */
export const CustomPropertiesSection: React.FC<CustomPropertiesSectionProps> = ({
  customProperties,
  onChange,
  activeNodeId,
  existingPropertyKeys = [],
  existingPropertyValuesByKey = {},
}) => {
  const [localProperties, setLocalProperties] = useState<CustomProperty[]>(customProperties);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state ONLY when active node ID changes
  useEffect(() => {
    setLocalProperties(customProperties);
  }, [activeNodeId]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateLocalProperty = (id: string, updates: Partial<CustomProperty>) => {
    setLocalProperties((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChange(updated);
      }, 250);

      return updated;
    });
  };

  const handleAddProperty = () => {
    const newProp: CustomProperty = {
      id: crypto.randomUUID(),
      key: '',
      type: 'text',
      value: '',
    };
    const updated = [...localProperties, newProp];
    setLocalProperties(updated);
    onChange(updated);
  };

  const handleDeleteProperty = (id: string) => {
    const updated = localProperties.filter((p) => p.id !== id);
    setLocalProperties(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <div className="h-px bg-border-subtle flex-1" />
        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest px-2 select-none">
          Custom Properties
        </span>
        <div className="h-px bg-border-subtle flex-1" />
      </div>

      <div className="space-y-2">
        {localProperties.map((prop) => (
          <div key={prop.id} className="flex flex-col gap-2 p-2.5 bg-bg-primary rounded-xl group transition-all shadow-2xs">
            
            {/* Property Key & Type Header */}
            <div className="flex items-center justify-between gap-2">
              <PropertyKeyInput
                value={prop.key}
                onChangeKey={(newKey) => updateLocalProperty(prop.id, { key: newKey })}
                existingKeys={existingPropertyKeys}
              />

              <div className="flex items-center gap-2 shrink-0">
                <PropertyTypeMenu
                  currentType={prop.type}
                  onSelect={(newType) => {
                    updateLocalProperty(prop.id, { type: newType, value: '' });
                    onChange(
                      localProperties.map((p) => (p.id === prop.id ? { ...p, type: newType, value: '' } : p))
                    );
                  }}
                />
                
                <button
                  type="button"
                  onClick={() => handleDeleteProperty(prop.id)}
                  title="Delete property"
                  className="p-1 rounded-lg text-status-error/80 hover:text-status-error bg-status-error-bg/30 hover:bg-status-error-bg transition-all cursor-pointer shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Property Value Input */}
            <div className="mt-0.5">
              <PropertyValueInput
                propertyKey={prop.key}
                type={prop.type}
                value={prop.value}
                onChangeValue={(newVal) => updateLocalProperty(prop.id, { value: newVal })}
                existingValuesByKey={existingPropertyValuesByKey}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddProperty}
          className="w-full py-2 px-3 rounded-xl bg-bg-primary hover:bg-bg-secondary/60 text-text-muted hover:text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-dashed border-border-default/60 hover:border-accent-primary/50 cursor-pointer select-none"
        >
          <Plus size={13} className="text-accent-primary" />
          <span>Add Custom Property</span>
        </button>
      </div>
    </div>
  );
};
