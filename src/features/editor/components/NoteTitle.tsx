import React, { useRef, useEffect, useState, useCallback } from 'react';

interface NoteTitleProps {
  title: string;
  onChange: (newTitle: string) => void;
  onEnterPress?: () => void;
  isReadOnly?: boolean;
}

export const NoteTitle: React.FC<NoteTitleProps> = ({
  title,
  onChange,
  onEnterPress,
  isReadOnly = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localTitle, setLocalTitle] = useState(title);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTitleRef = useRef(title);
  const localTitleRef = useRef(title);

  localTitleRef.current = localTitle;

  const flushTitle = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const currentVal = localTitleRef.current;
    if (currentVal !== lastSavedTitleRef.current) {
      lastSavedTitleRef.current = currentVal;
      onChange(currentVal);
    }
  }, [onChange]);

  // Sync title prop to localTitle when switching notes or when not focused
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setLocalTitle(title);
      lastSavedTitleRef.current = title;
      localTitleRef.current = title;
    }
  }, [title]);

  // Auto resize height based on content smoothly
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [localTitle, adjustHeight]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const observer = new ResizeObserver(() => {
      adjustHeight();
    });

    observer.observe(textarea);
    return () => observer.disconnect();
  }, [adjustHeight]);

  // Flush on unmount or note switch
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        const currentVal = localTitleRef.current;
        if (currentVal !== lastSavedTitleRef.current) {
          onChange(currentVal);
        }
      }
    };
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      flushTitle();
      if (onEnterPress) {
        onEnterPress();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      <textarea
        ref={textareaRef}
        rows={1}
        value={localTitle}
        readOnly={isReadOnly}
        onChange={(e) => {
          if (isReadOnly) return;
          const val = e.target.value;
          setLocalTitle(val);
          localTitleRef.current = val;
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            flushTitle();
          }, 250);
        }}
        onBlur={() => {
          if (!isReadOnly) {
            flushTitle();
          }
        }}
        onKeyDown={isReadOnly ? undefined : handleKeyDown}
        placeholder="Untitled"
        className={`w-full resize-none overflow-hidden bg-transparent text-[20px] font-serif font-bold leading-[1.35] text-text-primary placeholder:text-text-secondary/50 focus:outline-none border-none p-0 tracking-tight block min-h-[30px] break-words whitespace-pre-wrap ${
          isReadOnly ? 'cursor-default select-text' : ''
        }`}
        aria-label="Note Title"
      />
    </div>
  );
};
