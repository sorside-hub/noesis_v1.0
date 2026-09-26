import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Check, Calendar } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { CustomProperty, PropertyType } from '../../../types/vault';

interface CustomPropertiesSectionProps {
  customProperties: CustomProperty[];
  onChange: (props: CustomProperty[]) => void;
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
          "bg-bg-secondary hover:bg-bg-tertiary rounded-lg text-[10px] text-text-muted hover:text-text-primary px-2 py-1 flex items-center gap-1.5 focus:outline-none cursor-pointer uppercase font-bold tracking-wider transition-colors",
          isOpen ? "bg-bg-tertiary text-text-primary" : ""
        )}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={10} className={twMerge("text-icon-secondary transition-transform duration-150", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-28 bg-bg-secondary rounded-xl shadow-2xl z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
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
                  "w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase text-left cursor-pointer transition-colors",
                  isSelected
                    ? "bg-bg-tertiary text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
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

export const CustomPropertiesSection: React.FC<CustomPropertiesSectionProps> = ({
  customProperties,
  onChange,
}) => {
  const handleAddProperty = () => {
    const newProp: CustomProperty = {
      id: crypto.randomUUID(),
      key: `Property ${customProperties.length + 1}`,
      type: 'text',
      value: '',
    };
    onChange([...customProperties, newProp]);
  };

  const handleUpdateProperty = (id: string, updates: Partial<CustomProperty>) => {
    onChange(
      customProperties.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeleteProperty = (id: string) => {
    onChange(customProperties.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <div className="h-px bg-border-subtle flex-1" />
        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest px-2">
          Custom Properties
        </span>
        <div className="h-px bg-border-subtle flex-1" />
      </div>

      <div className="space-y-2">
        {customProperties.map((prop) => (
          <div key={prop.id} className="flex flex-col gap-2 p-2.5 bg-bg-primary rounded-xl group transition-all shadow-2xs">
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={prop.key}
                  onChange={(e) => handleUpdateProperty(prop.id, { key: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:text-accent-primary w-full"
                  placeholder="Property Name"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <PropertyTypeMenu
                  currentType={prop.type}
                  onSelect={(newType) => handleUpdateProperty(prop.id, { type: newType, value: '' })}
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

            <div className="mt-0.5">
              {prop.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <div className={twMerge(
                    "w-4 h-4 rounded flex items-center justify-center transition-colors",
                    prop.value ? "bg-accent-primary text-accent-contrast" : "bg-bg-secondary"
                  )}>
                    {prop.value && <Check size={12} strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    checked={!!prop.value}
                    onChange={(e) => handleUpdateProperty(prop.id, { value: e.target.checked })}
                    className="hidden"
                  />
                  <span className="text-xs text-text-secondary">{prop.value ? 'True' : 'False'}</span>
                </label>
              ) : prop.type === 'date' ? (
                <div className="relative w-full">
                  <input
                    type="date"
                    value={prop.value || ''}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in e.currentTarget) {
                          (e.currentTarget as any).showPicker();
                        }
                      } catch (err) {
                        // Fallback
                      }
                    }}
                    onChange={(e) => handleUpdateProperty(prop.id, { value: e.target.value })}
                    className="w-full bg-bg-secondary focus:ring-1 focus:ring-accent-primary/50 rounded-lg text-xs text-text-primary px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  />
                </div>
              ) : prop.type === 'number' ? (
                <input
                  type="number"
                  value={prop.value || ''}
                  onChange={(e) => handleUpdateProperty(prop.id, { value: e.target.value })}
                  placeholder="0"
                  className="w-full bg-bg-secondary focus:ring-1 focus:ring-accent-primary/50 rounded-lg text-xs text-text-primary px-2.5 py-1.5 focus:outline-none placeholder:text-text-muted/40"
                />
              ) : (
                <input
                  type="text"
                  value={prop.value || ''}
                  onChange={(e) => handleUpdateProperty(prop.id, { value: e.target.value })}
                  placeholder="Value"
                  className="w-full bg-bg-secondary focus:ring-1 focus:ring-accent-primary/50 rounded-lg text-xs text-text-primary px-2.5 py-1.5 focus:outline-none placeholder:text-text-muted/40"
                />
              )}
            </div>

          </div>
        ))}

        <button
          type="button"
          onClick={handleAddProperty}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-border-default hover:border-accent-primary/40 text-text-muted hover:text-accent-primary rounded-xl text-xs font-medium transition-all group cursor-pointer bg-bg-primary/50 hover:bg-bg-primary"
        >
          <Plus size={13} className="group-hover:scale-110 transition-transform" />
          <span>Add Custom Property</span>
        </button>
      </div>
    </div>
  );
};
