import React, { useState, useRef, useEffect } from 'react';

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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  };

  const handleInputBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange(localNoteType);
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

  return (
    <div className="space-y-1.5" ref={noteTypeContainerRef}>
      <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
        Note Type
      </label>
      <div className="relative w-full bg-bg-primary rounded-xl transition-all focus-within:ring-1 focus-within:ring-accent-primary/50 overflow-hidden">
        <input
          type="text"
          value={localNoteType}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onFocus={() => setShowNoteTypeSuggestions(true)}
          placeholder="e.g. Daily, Project, Concept"
          className="w-full px-3 py-2 bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
        />
        {isSuggestionsOpen && (
          <div className="animate-in fade-in duration-150">
            <div className="mx-2.5 h-px bg-border-default/30 my-0.5" />
            <div className="max-h-48 overflow-y-auto px-1 pb-1 space-y-0.5">
              {filteredNoteTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(type);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
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
