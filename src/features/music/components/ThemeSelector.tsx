import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Tag } from 'lucide-react';
import { scrollElementIntoViewAboveKeyboard } from '../../../utils/scrollUtils';

interface ThemeSelectorProps {
  label: string;
  theme?: string;
  existingThemes?: string[];
  placeholder?: string;
  onChange: (val: string | undefined) => void;
  helperText?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  label,
  theme = '',
  existingThemes = [],
  placeholder = 'misal: Patah Hati, Nostalgia, Cyberpunk',
  onChange,
  helperText,
}) => {
  const [localTheme, setLocalTheme] = useState(theme);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with prop when external selection/song changes
  useEffect(() => {
    setLocalTheme(theme || '');
  }, [theme]);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (val: string) => {
    setLocalTheme(val);
    setShowSuggestions(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(val.trim() || undefined);
    }, 200);
  };

  const handleSelectSuggestion = (val: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalTheme(val);
    setShowSuggestions(false);
    onChange(val || undefined);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalTheme('');
    setShowSuggestions(false);
    onChange(undefined);
    inputRef.current?.focus();
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If click was inside container (e.g. suggestion item), don't trigger blur close
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const clean = localTheme.trim();
    onChange(clean || undefined);
    setShowSuggestions(false);
  };

  const filteredThemes = existingThemes.filter(
    (t) =>
      Boolean(t) &&
      t.toLowerCase().includes(localTheme.toLowerCase()) &&
      t.toLowerCase() !== localTheme.trim().toLowerCase()
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

  const isSuggestionsOpen = showSuggestions && filteredThemes.length > 0;

  useEffect(() => {
    if (isSuggestionsOpen && dropdownRef.current) {
      scrollElementIntoViewAboveKeyboard(dropdownRef.current);
    }
  }, [isSuggestionsOpen]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
          {label}
        </label>
        {localTheme && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-text-muted hover:text-status-error transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X size={11} />
            Hapus
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[10px] text-text-muted/80">{helperText}</p>
      )}

      <div className="w-full h-9 relative">
        {/* SINGLE SEAMLESS FLOATING CARD CONTAINER - Dynamic styling while keeping the exact same DOM input node */}
        <div
          className={`w-full bg-bg-primary transition-all duration-100 ${
            isSuggestionsOpen
              ? 'absolute top-0 left-0 right-0 z-50 rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95'
              : 'h-9 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-accent-primary/50 flex items-center pr-2'
          }`}
        >
          {/* SINGLE PERMANENT INPUT FIELD - Never unmounted, focus is never lost */}
          <div className="w-full h-9 flex items-center pr-2">
            <input
              ref={inputRef}
              type="text"
              value={localTheme}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={() => {
                setShowSuggestions(true);
                scrollElementIntoViewAboveKeyboard(containerRef.current);
              }}
              placeholder={placeholder}
              className="w-full h-full px-3 text-xs font-semibold text-text-primary placeholder:text-text-muted/60 focus:outline-none"
            />
            {localTheme && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-text-muted hover:text-status-error hover:bg-bg-hover shrink-0 transition-colors cursor-pointer"
                title="Hapus Tema"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* INTEGRATED SUGGESTIONS LIST - Rendered inside the exact same card */}
          {isSuggestionsOpen && (
            <>
              <div className="mx-2.5 h-px bg-border-default/30" />
              <div
                ref={dropdownRef}
                className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} className="text-accent-primary" />
                  Sugesti Tema
                </div>
                {filteredThemes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents input blur when clicking suggestion
                      handleSelectSuggestion(t);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer font-medium flex items-center justify-between"
                  >
                    <span>{t}</span>
                    <Tag size={11} className="text-text-muted/50" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
