import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ChipInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  prefix?: string;
  prefixColorClass?: string;
  chipColorClass?: string;
  helperText?: string;
  suggestions?: string[];
  forceLowerCase?: boolean;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  label,
  items,
  onChange,
  placeholder = 'Add...',
  prefix = '',
  prefixColorClass = '',
  chipColorClass = 'bg-bg-secondary text-text-primary',
  helperText,
  suggestions = [],
  forceLowerCase = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedItems = forceLowerCase ? items.map((i) => i.toLowerCase()) : items;
  const filteredSuggestions = suggestions.filter(
    (s) => {
      const checkS = forceLowerCase ? s.toLowerCase() : s;
      return !normalizedItems.includes(checkS) && checkS.toLowerCase().includes(inputValue.toLowerCase());
    }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commitValue = (valToCommit?: string) => {
    const rawVal = valToCommit !== undefined ? valToCommit : (inputRef.current ? inputRef.current.value : inputValue);
    let clean = rawVal.trim();
    if (prefix && clean.startsWith(prefix)) {
      clean = clean.substring(prefix.length).trim();
    }
    if (forceLowerCase) {
      clean = clean.toLowerCase();
    }
    if (!clean) return;

    if (!items.includes(clean)) {
      onChange([...items, clean]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setActiveIndex(-1);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    // Retain focus on this input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const isDelimiter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    return (
      e.key === ',' ||
      e.code === 'Comma' ||
      e.keyCode === 188 ||
      e.which === 188
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
          commitValue(filteredSuggestions[activeIndex]);
        } else {
          commitValue();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue();
      return;
    }

    if (isDelimiter(e)) {
      e.preventDefault();
      commitValue();
    }
  };

  const handleRemove = (itemToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(items.filter((item) => item !== itemToRemove));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const isSuggestionsOpen = showSuggestions && filteredSuggestions.length > 0;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
          {label}
        </label>
        {helperText && (
          <span className="text-[10px] text-text-muted/70 flex-1 truncate lowercase">
            ({helperText})
          </span>
        )}
      </div>
      <div className="relative w-full bg-bg-primary rounded-xl transition-all focus-within:ring-1 focus-within:ring-accent-primary/50 overflow-hidden">
        <div
          onClick={() => inputRef.current?.focus()}
          className="min-h-[34px] px-2.5 py-1 flex flex-wrap gap-1 items-center cursor-text"
        >
          {items.map((item) => (
            <span
              key={item}
              className={twMerge(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all',
                chipColorClass
              )}
            >
              <span className="flex items-center leading-none">
                {prefix && (
                  <span className={twMerge('font-bold select-none mr-0.5', prefixColorClass)}>
                    {prefix}
                  </span>
                )}
                <span>{item}</span>
              </span>
              <button
                type="button"
                onClick={(e) => handleRemove(item, e)}
                className="hover:text-status-error rounded-full p-0.5 cursor-pointer text-text-muted transition-colors leading-none"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1 flex-1 min-w-[100px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                const val = forceLowerCase ? e.target.value.toLowerCase() : e.target.value;
                setInputValue(val);
                setShowSuggestions(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              enterKeyHint="done"
              autoComplete="off"
              autoCapitalize={forceLowerCase ? 'none' : undefined}
              autoCorrect={forceLowerCase ? 'off' : undefined}
              spellCheck={forceLowerCase ? false : undefined}
              placeholder={items.length === 0 ? placeholder : 'Add...'}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none px-1 py-1"
            />
            {inputValue && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  commitValue();
                }}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer shrink-0 transition-colors"
              >
                <Plus size={13} />
              </button>
            )}
          </div>
        </div>
        
        {/* In-flow Suggestions list inside the unified expanding container */}
        {isSuggestionsOpen && (
          <div className="animate-in fade-in duration-150">
            <div className="mx-2.5 h-px bg-border-default/30 my-0.5" />
            <div className="max-h-48 overflow-y-auto px-1 pb-1 space-y-0.5">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitValue(suggestion);
                  }}
                  className={twMerge(
                    'w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer',
                    index === activeIndex ? 'bg-bg-hover' : ''
                  )}
                >
                  {prefix && (
                    <span className={twMerge('font-mono mr-0.5', prefixColorClass || 'text-text-muted')}>
                      {prefix}
                    </span>
                  )}
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
