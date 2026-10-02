import React, { useEffect } from 'react';
import { Send } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';

interface ChatInputAreaProps {
  input: string;
  setInput: (val: string) => void;
  isProcessing: boolean;
  onSend: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input,
  setInput,
  isProcessing,
  onSend,
  textareaRef,
  placeholder
}) => {
  const { isKeyboardOpen } = useVirtualKeyboard();

  // Auto-resize textarea height as content grows or resets
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (input) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
      }
    }
  }, [input, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Optional desktop shortcut: Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
      return;
    }
  };

  const isSendActive = !isProcessing;

  return (
    <>
      {/* Subtle Soft Dark Gradient Overlay for mobile chat bottom */}
      <div
        className={twMerge(
          "fixed lg:hidden bottom-0 inset-x-0 bg-gradient-to-t from-bg-primary/80 via-bg-primary/50 to-transparent pointer-events-none z-20",
          isKeyboardOpen ? "h-10 opacity-40" : "h-28 opacity-100"
        )}
      />

      {/* Instantly Snappy Input Container (No CSS transition delay) */}
      <div
        className={twMerge(
          "fixed lg:relative lg:bottom-0 inset-x-0 z-30 pointer-events-none px-3 sm:px-4 pb-0.5 lg:pb-6 pt-0 bg-transparent",
          isKeyboardOpen ? "bottom-2" : "bottom-9.5 sm:bottom-10"
        )}
      >
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="flex items-end gap-2 bg-bg-quaternary/90 backdrop-blur-xl border border-border-default/40 hover:border-border-default/60 focus-within:border-accent-primary/60 focus-within:ring-1 focus-within:ring-accent-primary/40 rounded-2xl p-2 px-3.5 shadow-2xl">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted resize-none max-h-32 py-1.5 font-sans leading-relaxed shadow-none"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!isSendActive}
              className={twMerge(
                "p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 shadow-xs",
                isSendActive
                  ? "bg-accent-primary text-accent-contrast font-semibold hover:opacity-90 active:scale-95"
                  : "bg-bg-hover text-text-muted opacity-40 cursor-not-allowed shadow-none"
              )}
              title="Kirim Pesan (atau tekan Ctrl+Enter)"
            >
              <Send size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
