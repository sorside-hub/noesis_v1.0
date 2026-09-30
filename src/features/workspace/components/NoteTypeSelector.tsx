import React, { useState, useRef, useEffect } from 'react';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';
import { scrollElementIntoViewAboveKeyboard } from '../../../utils/scrollUtils';

interface NoteTypeSelectorProps {
  noteType: string;
  existingNoteTypes?: string[];
  activeNodeId: string;
  onChange: (val: string) => void;
}

export const NoteTypeSelector: React.FC<NoteTypeSelectorProps> = ({
  noteType,
  existingNoteTypes = [],
  activeNodeId,
  onChange,
}) => {
  const [localNoteType, setLocalNoteType] = useState(noteType);
  const [showNoteTypeSuggestions, setShowNoteTypeSuggestions] = useState(false);
  const noteTypeContainerRef = useRef<HTMLDivElement>(null);
  const expandedCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isKeyboardOpen } = useVirtualKeyboard();
  const wasKeyboardOpenRef = useRef(false);

  // When mobile virtual keyboard closes, immediately remove cursor focus & hide suggestions
  useEffect(() => {
    if (wasKeyboardOpenRef.current && !isKeyboardOpen) {
      inputRef.current?.blur();
      setShowNoteTypeSuggestions(false);
    }
    wasKeyboardOpenRef.current = isKeyboardOpen;
  }, [isKeyboardOpen]);

  // Keep local noteType in sync with prop changes
  useEffect(() => {
    setLocalNoteType(noteType);
  }, [noteType, activeNodeId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (val: string) => {
    setLocalNoteType(val);
    setShowNoteTypeSuggestions(true);
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
    setLocalNoteType(val);
    setShowNoteTypeSuggestions(false);
    onChange(val);
    inputRef.current?.blur();
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange(localNoteType);
    
    // Close suggestions if focus left the container
    if (noteTypeContainerRef.current && !noteTypeContainerRef.current.contains(e.relatedTarget as Node)) {
      setShowNoteTypeSuggestions(false);
    }
  };

  const filteredNoteTypes = existingNoteTypes.filter(
    (type) =>
      type.toLowerCase().includes(localNoteType.toLowerCase()) &&
      type.toLowerCase() !== localNoteType.trim().toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (noteTypeContainerRef.current && !noteTypeContainerRef.current.contains(e.target as Node)) {
        setShowNoteTypeSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuggestionsOpen = showNoteTypeSuggestions && filteredNoteTypes.length > 0;

  // Smart Auto-Scroll when suggestions open or focus occurs
  useEffect(() => {
    if (isSuggestionsOpen) {
      scrollElementIntoViewAboveKeyboard(expandedCardRef.current);
    }
  }, [isSuggestionsOpen]);

  return (
    <div className="space-y-1.5" ref={noteTypeContainerRef}>
      <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
        Note Type
      </label>
      <div className="w-full h-9 relative">
        {!isSuggestionsOpen ? (
          <div className="w-full h-9 bg-bg-primary rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-accent-primary/50 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={localNoteType}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={() => {
                setShowNoteTypeSuggestions(true);
                scrollElementIntoViewAboveKeyboard(noteTypeContainerRef.current);
              }}
              placeholder="e.g. Daily, Project, Concept"
              className="w-full h-full px-3 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
            />
          </div>
        ) : (
          /* Single Seamless Floating Card starting at top-0 */
          <div
            ref={expandedCardRef}
            className="absolute top-0 left-0 right-0 z-50 bg-bg-primary rounded-2xl shadow-2xl ring-1 ring-accent-primary/60 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          >
            <input
              ref={inputRef}
              type="text"
              value={localNoteType}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={() => setShowNoteTypeSuggestions(true)}
              placeholder="e.g. Daily, Project, Concept"
              className="w-full h-9 px-3 text-xs font-semibold text-text-primary placeholder:text-text-muted/60 focus:outline-none"
            />
            <div className="mx-2.5 h-px bg-border-default/30" />
            <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
              {filteredNoteTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(type);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer font-medium"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
