import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Circle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface StatusOption {
  value: string;
  label: string;
  dotColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'None (-)', dotColor: 'bg-text-muted/40' },
  { value: 'Inbox', label: 'Inbox', dotColor: 'bg-blue-400' },
  { value: 'Inbox (Refine)', label: 'Inbox (Refine)', dotColor: 'bg-indigo-400' },
  { value: 'Inbox (Keeper)', label: 'Inbox (Keeper)', dotColor: 'bg-cyan-400' },
  { value: 'Idea', label: 'Idea', dotColor: 'bg-yellow-400' },
  { value: 'Draft', label: 'Draft', dotColor: 'bg-amber-400' },
  { value: 'In Progress', label: 'In Progress', dotColor: 'bg-orange-400' },
  { value: 'Completed', label: 'Completed', dotColor: 'bg-emerald-400' },
  { value: 'Archived', label: 'Archived', dotColor: 'bg-zinc-500' },
];

interface StatusSelectorProps {
  status: string;
  onChange: (val: string) => void;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = STATUS_OPTIONS.find(o => o.value === status) || {
    value: status,
    label: status || 'Select status...',
    dotColor: status ? 'bg-accent-primary' : 'bg-text-muted/40',
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
        Status
      </label>
      <div 
        className={twMerge(
          "w-full bg-bg-primary rounded-xl transition-all overflow-hidden",
          isOpen ? "ring-1 ring-accent-primary/50" : ""
        )}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 flex items-center justify-between text-xs text-text-primary hover:bg-bg-secondary/40 cursor-pointer transition-colors text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <span className={twMerge("w-2 h-2 rounded-full shrink-0", currentOption.dotColor)} />
            <span className={status ? "font-medium" : "text-text-muted/60"}>
              {currentOption.label}
            </span>
          </div>
          <ChevronDown 
            size={14} 
            className={twMerge(
              "text-icon-secondary shrink-0 transition-transform duration-150", 
              isOpen ? "rotate-180 text-accent-primary" : ""
            )} 
          />
        </button>

        {/* In-flow Expandable Status List */}
        {isOpen && (
          <div className="animate-in fade-in duration-150">
            <div className="mx-2.5 h-px bg-border-default/30 my-0.5" />
            <div className="max-h-48 overflow-y-auto custom-scrollbar px-1 pb-1 space-y-0.5">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={twMerge(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left",
                      isSelected 
                        ? "bg-bg-secondary text-text-primary font-medium" 
                        : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/70"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={twMerge("w-2 h-2 rounded-full shrink-0", opt.dotColor)} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={12} className="text-accent-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
