import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';
import { scrollElementIntoViewAboveKeyboard } from '../../../utils/scrollUtils';

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
  const expandedCardRef = useRef<HTMLDivElement>(null);

  const { isKeyboardOpen } = useVirtualKeyboard();
  const wasKeyboardOpenRef = useRef(false);

  // Automatically blur cursor & hide dropdown when mobile virtual keyboard closes
  useEffect(() => {
    if (wasKeyboardOpenRef.current && !isKeyboardOpen) {
      inputRef.current?.blur();
      setShowSuggestions(false);
    }
    wasKeyboardOpenRef.current = isKeyboardOpen;
  }, [isKeyboardOpen]);

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
        inputRef.current?.blur();
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

  const handleRemove = (itemToRemove: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(items.filter((item) => item !== itemToRemove));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If focus leaves the container, close suggestions
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setShowSuggestions(false);
    }
  };

  const isSuggestionsOpen = showSuggestions && filteredSuggestions.length > 0;

  // Smart Auto-Scroll when suggestions open or input receives focus
  useEffect(() => {
    if (isSuggestionsOpen && expandedCardRef.current) {
      scrollElementIntoViewAboveKeyboard(expandedCardRef.current);
    }
  }, [isSuggestionsOpen]);

  const renderInputContent = () => (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          inputRef.current?.focus();
        }
      }}
      className="min-h-[36px] px-2.5 py-1 flex flex-wrap gap-1 items-center cursor-text"
    >
      {items.map((item) => (
        <span
          key={item}
          className={twMerge(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all select-none',
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
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove(item, e);
            }}
            className="hover:text-status-error rounded-full p-0.5 cursor-pointer text-text-muted transition-colors leading-none"
            title="Hapus"
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
          onFocus={() => {
            setShowSuggestions(true);
            scrollElementIntoViewAboveKeyboard(containerRef.current);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize={forceLowerCase ? 'none' : undefined}
          autoCorrect={forceLowerCase ? 'off' : undefined}
          spellCheck={forceLowerCase ? false : undefined}
          placeholder={items.length === 0 ? placeholder : 'Add...'}
          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none px-1 py-1 font-medium"
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
  );

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

      <div className="w-full min-h-[36px] relative">
        {!isSuggestionsOpen ? (
          <div className="w-full bg-bg-primary rounded-xl focus-within:ring-1 focus-within:ring-accent-primary/50 transition-all overflow-hidden">
            {renderInputContent()}
          </div>
        ) : (
          /* Single Seamless Floating Card starting at top-0 (Same as NoteType & Status) */
          <div
            ref={expandedCardRef}
            className="absolute top-0 left-0 right-0 z-50 bg-bg-primary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          >
            {renderInputContent()}

            <div className="mx-2.5 h-px bg-border-default/30" />

            <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitValue(suggestion);
                  }}
                  className={twMerge(
                    'w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer font-medium',
                    index === activeIndex ? 'bg-bg-hover text-accent-primary font-bold' : ''
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
