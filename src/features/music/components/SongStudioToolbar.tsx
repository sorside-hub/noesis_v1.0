import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { 
  Undo, 
  Redo, 
  Bold, 
  Italic, 
  Highlighter, 
  Mic, 
  Music, 
  ListPlus,
  ChevronDown
} from 'lucide-react';

interface SongStudioToolbarProps {
  editor: Editor | null;
  onOpenAudioModal: () => void;
}

const SONG_SECTIONS = [
  { label: 'Intro', tag: '<h3>[Intro]</h3>' },
  { label: 'Verse 1', tag: '<h3>[Verse 1]</h3>' },
  { label: 'Verse 2', tag: '<h3>[Verse 2]</h3>' },
  { label: 'Pre-Chorus', tag: '<h3>[Pre-Chorus]</h3>' },
  { label: 'Chorus / Reff', tag: '<h3>[Chorus]</h3>' },
  { label: 'Bridge', tag: '<h3>[Bridge]</h3>' },
  { label: 'Solo / Interlude', tag: '<h3>[Solo]</h3>' },
  { label: 'Outro', tag: '<h3>[Outro]</h3>' },
];

export const SongStudioToolbar: React.FC<SongStudioToolbarProps> = ({
  editor,
  onOpenAudioModal,
}) => {
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const sectionButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ bottom?: number; top?: number; left: number }>({ left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [, setTick] = useState(0);

  // Close section menu when clicking/touching anywhere outside
  useEffect(() => {
    if (!showSectionMenu) return;

    const handlePointerDown = (e: Event) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      if (sectionButtonRef.current && sectionButtonRef.current.contains(target)) {
        return;
      }
      setShowSectionMenu(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
    };
  }, [showSectionMenu]);

  // Close menu when mobile keyboard closes or visualViewport changes
  useEffect(() => {
    if (isMobile && !isKeyboardOpen) {
      setShowSectionMenu(false);
    }
  }, [isMobile, isKeyboardOpen]);

  useEffect(() => {
    const handleClose = () => {
      if (showSectionMenu) {
        setShowSectionMenu(false);
      }
    };
    window.addEventListener('resize', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [showSectionMenu]);

  // Detect mobile viewport width
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Re-render Toolbar on any editor state change
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setTick((t) => t + 1);
    };

    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('focus', handleUpdate);
    editor.on('blur', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('focus', handleUpdate);
      editor.off('blur', handleUpdate);
    };
  }, [editor]);

  // Track editor focus
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.closest('.ProseMirror') || target.closest('.tiptap'))) {
        setIsFocused(true);
      } else if (!target?.closest('.song-toolbar-container')) {
        setIsFocused(false);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (related && (related.closest('.song-toolbar-container') || related.closest('.ProseMirror') || related.closest('.tiptap'))) {
        return;
      }
      setIsFocused(false);
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Mobile keyboard & visualViewport tracking
  useEffect(() => {
    let maxKnownHeight = window.innerHeight;

    const checkKeyboardAndOffset = () => {
      const currentHeight = window.innerHeight;
      if (currentHeight > maxKnownHeight) {
        maxKnownHeight = currentHeight;
      }

      const vv = window.visualViewport;
      let offset = 0;
      let keyboardDetected = false;

      if (vv) {
        const layoutHeight = window.innerHeight;
        const visualBottom = vv.height + vv.offsetTop;
        const rawOffset = layoutHeight - visualBottom;

        offset = rawOffset > 2 ? Math.round(rawOffset) : 0;
        
        if (offset > 40 || (maxKnownHeight > 0 && vv.height < maxKnownHeight * 0.85)) {
          keyboardDetected = true;
        }
      }

      const heightDifference = maxKnownHeight - currentHeight;
      if (heightDifference > 100) {
        keyboardDetected = true;
      }

      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouch) {
        keyboardDetected = true;
      }

      setBottomOffset(offset);
      setIsKeyboardOpen(keyboardDetected);
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', checkKeyboardAndOffset, { passive: true });
      vv.addEventListener('scroll', checkKeyboardAndOffset, { passive: true });
    }
    window.addEventListener('resize', checkKeyboardAndOffset, { passive: true });
    window.addEventListener('scroll', checkKeyboardAndOffset, { passive: true });
    
    checkKeyboardAndOffset();

    return () => {
      if (vv) {
        vv.removeEventListener('resize', checkKeyboardAndOffset);
        vv.removeEventListener('scroll', checkKeyboardAndOffset);
      }
      window.removeEventListener('resize', checkKeyboardAndOffset);
      window.removeEventListener('scroll', checkKeyboardAndOffset);
    };
  }, []);

  if (!editor) return null;

  const insertChordToken = () => {
    if (!editor) return;
    const { state } = editor;
    const { from, to, empty } = state.selection;

    if (!empty) {
      const selectedText = state.doc.textBetween(from, to, ' ');
      if (selectedText.startsWith('[') && selectedText.endsWith(']') && !selectedText.startsWith('[[')) {
        // Unwrap if already enclosed in brackets
        const unwrapped = selectedText.slice(1, -1);
        editor.chain().focus().command(({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.insertText(unwrapped, from, to));
          return true;
        }).run();
      } else {
        // Wrap selected text into [Chord]
        const wrapped = `[${selectedText.trim()}]`;
        editor.chain().focus().command(({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.insertText(wrapped, from, to));
          return true;
        }).run();
      }
    } else {
      // Option B: Insert [] and place cursor right inside [ | ]
      editor.chain().focus().command(({ tr, dispatch }) => {
        if (dispatch) {
          tr.insertText('[]');
          dispatch(tr);
        }
        return true;
      }).run();
      
      const insertPos = editor.state.selection.from;
      editor.chain().focus().setTextSelection(insertPos - 1).run();
    }
  };

  const insertSection = (htmlTag: string) => {
    editor.chain().focus().insertContent(`\n${htmlTag}\n<p></p>`).run();
    setShowSectionMenu(false);
  };

  const handleToggleSectionMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showSectionMenu) {
      setShowSectionMenu(false);
      return;
    }
    if (sectionButtonRef.current) {
      const rect = sectionButtonRef.current.getBoundingClientRect();
      const menuWidth = 180;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
      if (isMobile) {
        setMenuPosition({
          bottom: window.innerHeight - rect.top + 8,
          left,
        });
      } else {
        setMenuPosition({
          top: rect.bottom + 6,
          left,
        });
      }
    }
    setShowSectionMenu(true);
  };

  const isToolbarStripVisible = !isMobile || (isFocused && isKeyboardOpen);
  if (!isToolbarStripVisible) return null;

  const baseClasses = "flex items-center gap-1.5 p-2 bg-bg-secondary border-border-default/20 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none text-xs song-toolbar-container";
  const mobileClasses = "fixed left-0 right-0 border-t shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-50 transition-none";
  const desktopClasses = "border-b relative";

  return (
    <div 
      className={`${baseClasses} ${isMobile ? mobileClasses : desktopClasses}`}
      style={isMobile ? { bottom: `${bottomOffset}px` } : undefined}
    >
      {/* Undo & Redo */}
      <button
        type="button"
        title="Undo"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 cursor-pointer shrink-0"
      >
        <Undo size={14} />
      </button>

      <button
        type="button"
        title="Redo"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 cursor-pointer shrink-0"
      >
        <Redo size={14} />
      </button>

      <div className="w-px h-4 bg-border-default/30 mx-0.5 shrink-0" />

      {/* Insert Chord */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertChordToken}
        title="Sisip Chord (Contoh: [G])"
        className="px-2.5 py-1 flex items-center gap-1 rounded-lg bg-accent-primary/10 text-accent-primary font-semibold hover:bg-accent-primary/20 transition-colors cursor-pointer shrink-0"
      >
        <Music size={13} />
        <span>+ Chord</span>
      </button>

      {/* Insert Section Dropdown */}
      <button
        ref={sectionButtonRef}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={handleToggleSectionMenu}
        title="Sisip Bagian Lagu ([Intro], [Chorus], dll)"
        className={`px-2.5 py-1 flex items-center gap-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
          showSectionMenu 
            ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs' 
            : 'bg-bg-primary text-text-primary hover:bg-bg-hover'
        }`}
      >
        <ListPlus size={13} className={showSectionMenu ? 'text-accent-contrast' : 'text-text-muted'} />
        <span>+ Bagian Lagu</span>
        <ChevronDown size={11} className={showSectionMenu ? 'text-accent-contrast' : 'text-text-muted'} />
      </button>

      {/* Portalized Section Dropdown - Rendered directly to document.body so it NEVER clips or hides behind canvas */}
      {showSectionMenu && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          className="fixed w-44 bg-bg-secondary rounded-xl shadow-2xl p-1.5 ring-1 ring-border-default/40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-[70vh] overflow-y-auto [scrollbar-width:none] z-[999] select-none"
          style={{
            ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
            ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
            left: `${menuPosition.left}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border-default/20 mb-1">
            Bagian Lagu
          </div>
          {SONG_SECTIONS.map((sec) => (
            <button
              key={sec.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                insertSection(sec.tag);
                setShowSectionMenu(false);
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-bg-hover hover:text-accent-primary rounded-lg transition-colors cursor-pointer font-medium active:scale-98"
            >
              {sec.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Audio Memo */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenAudioModal}
        title="Rekam Voice Memo / Lampirkan Demo Audio"
        className="px-2.5 py-1 flex items-center gap-1 rounded-lg bg-bg-primary text-text-primary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
      >
        <Mic size={13} className="text-accent-primary" />
        <span>Audio Demo</span>
      </button>

      <div className="w-px h-4 bg-border-default/30 mx-0.5 shrink-0" />

      {/* Text Formats (Bold, Italic, Highlight) */}
      <button
        type="button"
        title="Tebal (Bold)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors shrink-0 ${
          editor.isActive('bold') ? 'bg-accent-primary text-accent-contrast font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        }`}
      >
        <Bold size={13} />
      </button>

      <button
        type="button"
        title="Miring (Italic)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors shrink-0 ${
          editor.isActive('italic') ? 'bg-accent-primary text-accent-contrast' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        }`}
      >
        <Italic size={13} />
      </button>

      <button
        type="button"
        title="Highlight"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors shrink-0 ${
          editor.isActive('highlight') ? 'bg-amber-500/20 text-amber-500 font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        }`}
      >
        <Highlighter size={13} />
      </button>
    </div>
  );
};
