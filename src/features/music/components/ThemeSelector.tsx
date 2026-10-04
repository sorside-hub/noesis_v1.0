import React, { useState, useRef, useEffect } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';
import { scrollElementIntoViewAboveKeyboard } from '../../../utils/scrollUtils';

interface ThemeSelectorProps {
  theme: string;
  existingThemes?: string[];
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme,
  existingThemes = [],
  onChange,
  label = 'Tema',
  placeholder = 'Contoh: Cinta, Patah Hati, Nostalgia, Perjalanan...',
}) => {
  const [localTheme, setLocalTheme] = useState(theme);
  const [showThemeSuggestions, setShowThemeSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const expandedCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isKeyboardOpen } = useVirtualKeyboard();
  const wasKeyboardOpenRef = useRef(false);

  // When mobile virtual keyboard closes, immediately remove cursor focus & hide suggestions
  useEffect(() => {
    if (wasKeyboardOpenRef.current && !isKeyboardOpen) {
      inputRef.current?.blur();
      setShowThemeSuggestions(false);
    }
    wasKeyboardOpenRef.current = isKeyboardOpen;
  }, [isKeyboardOpen]);

  // Keep local theme in sync with prop changes
  useEffect(() => {
    setLocalTheme(theme || '');
  }, [theme]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (val: string) => {
    setLocalTheme(val);
    setShowThemeSuggestions(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(val);
    }, 250);
  };

  const handleSelectSuggestion = (val: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalTheme(val);
    setShowThemeSuggestions(false);
    onChange(val);
    inputRef.current?.blur();
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange(localTheme);
    
    // Close suggestions if focus left the container
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setShowThemeSuggestions(false);
    }
  };

  const filteredThemes = existingThemes.filter(
    (t) =>
      t &&
      t.toLowerCase().includes(localTheme.toLowerCase()) &&
      t.toLowerCase() !== localTheme.trim().toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowThemeSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuggestionsOpen = showThemeSuggestions && filteredThemes.length > 0;

  // Smart Auto-Scroll when suggestions open or focus occurs
  useEffect(() => {
    if (isSuggestionsOpen) {
      scrollElementIntoViewAboveKeyboard(expandedCardRef.current);
    }
  }, [isSuggestionsOpen]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-[11px] font-bold text-text-muted tracking-wider uppercase flex items-center justify-between">
        <span>{label}</span>
        {localTheme && (
          <span className="text-[10px] text-accent-primary font-medium lowercase font-mono">
            #{localTheme.toLowerCase().replace(/\s+/g, '-')}
          </span>
        )}
      </label>
      <div className="w-full h-9 relative">
        {!isSuggestionsOpen ? (
          <div className="w-full h-9 bg-bg-primary rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-accent-primary/50 transition-all border border-border-default/20">
            <input
              ref={inputRef}
              type="text"
              value={localTheme}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={() => {
                setShowThemeSuggestions(true);
                scrollElementIntoViewAboveKeyboard(containerRef.current);
              }}
              placeholder={placeholder}
              className="w-full h-full px-3 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-hidden"
            />
          </div>
        ) : (
          /* Single Seamless Floating Card starting at top-0 matching Vault NoteTypeSelector */
          <div
            ref={expandedCardRef}
            className="absolute top-0 left-0 right-0 z-50 bg-bg-primary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100 border border-border-default/30"
          >
            <input
              ref={inputRef}
              type="text"
              value={localTheme}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={() => setShowThemeSuggestions(true)}
              placeholder={placeholder}
              className="w-full h-9 px-3 text-xs font-semibold text-text-primary placeholder:text-text-muted/60 focus:outline-hidden"
            />
            <div className="mx-2.5 h-px bg-border-default/30" />
            <div className="max-h-48 overflow-y-auto [scrollbar-width:thin] p-1 space-y-0.5">
              {filteredThemes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(t);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer font-medium flex items-center justify-between group"
                >
                  <span className="truncate">{t}</span>
                  <span className="text-[10px] text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    Pilih
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
