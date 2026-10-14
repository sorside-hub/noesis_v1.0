import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  Wand2, 
  Music, 
  Eye, 
  Split, 
  Cpu,
  Info,
  CornerDownLeft
} from 'lucide-react';
import { StudioSongRecord, LyricBrainstormSuggestion, StudioLyricBrainstormRecord } from '../types/studioDatabase';
import { useLyricBrainstorm, TONE_OPTIONS, MODE_OPTIONS } from '../hooks/useLyricBrainstorm';

export interface SavedLyricSelection {
  from: number;
  to: number;
  text: string;
}

interface LyricBrainstormCompanionProps {
  song: StudioSongRecord;
  activeVersionId?: string | null;
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  initialSelection?: SavedLyricSelection | null;
}

export const LyricBrainstormCompanion: React.FC<LyricBrainstormCompanionProps> = ({
  song,
  activeVersionId,
  editor,
  isOpen,
  onClose,
  className = '',
  initialSelection = null,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const {
    history,
    currentSuggestions,
    setCurrentSuggestions,
    activeTone,
    setActiveTone,
    activeMode,
    setActiveMode,
    keyword,
    setKeyword,
    isLoading,
    error,
    modelUsed,
    generateBrainstorm,
    deleteBrainstorm,
  } = useLyricBrainstorm({
    songId: song.id,
    versionId: activeVersionId,
    songTitle: song.title,
    genre: song.genre,
    premise: song.premise,
  });

  // Saved selection captured upon opening or manual grab
  const [savedSelection, setSavedSelection] = useState<SavedLyricSelection | null>(initialSelection || null);
  // Live selection if user selects text while companion is already open
  const [liveSelection, setLiveSelection] = useState<SavedLyricSelection | null>(null);

  // Sync initialSelection when it changes
  useEffect(() => {
    if (initialSelection) {
      setSavedSelection(initialSelection);
      setKeyword(initialSelection.text);
    }
  }, [initialSelection]);

  // When companion opens or editor is mounted, check if text was selected, capture it, and clear DOM selection immediately
  useEffect(() => {
    if (!editor || !isOpen) return;

    // 1. If text was already highlighted when opening, capture it and collapse editor selection
    const { from, to, empty } = editor.state.selection;
    if (!empty && from !== to) {
      const text = editor.state.doc.textBetween(from, to, ' ').trim();
      if (text) {
        const selObj = { from, to, text };
        setSavedSelection(selObj);
        setKeyword(text);
        
        // Collapse selection and blur editor to remove native phone/browser popup (copy, translate, share)
        editor.commands.setTextSelection(to);
        editor.view.dom.blur();
        if (typeof window !== 'undefined' && window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
      }
    }

    // 2. Track subsequent selections if user highlights something while companion is open
    const checkLiveSelection = () => {
      if (editor.isDestroyed) return;
      const { from: curFrom, to: curTo, empty: isCurEmpty } = editor.state.selection;
      if (!isCurEmpty && curFrom !== curTo) {
        const text = editor.state.doc.textBetween(curFrom, curTo, ' ').trim();
        if (text) {
          setLiveSelection({ from: curFrom, to: curTo, text });
        }
      } else {
        setLiveSelection(null);
      }
    };

    editor.on('selectionUpdate', checkLiveSelection);
    return () => {
      editor.off('selectionUpdate', checkLiveSelection);
    };
  }, [editor, isOpen]);

  // Handle adopting live selection, applying it as target & keyword, and clearing OS selection popup
  const handleAdoptLiveSelection = () => {
    if (!liveSelection || !editor || editor.isDestroyed) return;
    setSavedSelection(liveSelection);
    setKeyword(liveSelection.text);

    // Collapse selection & dismiss mobile callout menu
    editor.commands.setTextSelection(liveSelection.to);
    editor.view.dom.blur();
    if (typeof window !== 'undefined' && window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    setLiveSelection(null);
  };

  // Insert suggestion directly at cursor in editor
  const handleInsertAtCursor = (text: string, id: string) => {
    if (!editor || editor.isDestroyed) return;
    
    // Insert with clean line breaks
    editor.chain().focus().insertContent(`\n${text}\n`).run();
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 2000);
  };

  // Replace active selection or saved selection in editor with suggestion
  const handleReplaceSelection = (text: string, id: string) => {
    if (!editor || editor.isDestroyed) return;
    
    const target = savedSelection || liveSelection;
    if (target) {
      editor.chain().focus().deleteRange({ from: target.from, to: target.to }).insertContent(text).run();
      const newTo = target.from + text.length;
      setSavedSelection({ from: target.from, to: newTo, text });
      if (liveSelection) setLiveSelection(null);
    } else {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
      } else {
        editor.chain().focus().insertContent(`\n${text}\n`).run();
      }
    }
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 2000);
  };

  // Copy to clipboard with checkmark feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeToneObj = TONE_OPTIONS.find((t) => t.id === activeTone) || TONE_OPTIONS[0];

  if (!isOpen) return null;

  return (
    <div 
      className={`bg-bg-secondary flex flex-col h-full border-l border-border-default/40 shadow-xl select-none text-text-primary z-30 transition-all ${className}`}
    >
      {/* 
        ============================================================
        1. HEADER
        ============================================================
      */}
      <div className="px-4 py-3 bg-bg-secondary border-b border-border-default/30 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0 border border-accent-primary/20">
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-heading truncate flex items-center gap-1.5">
              <span>Brainstorm Lirik AI</span>
            </h3>
            <p className="text-[10px] text-text-muted truncate">
              Pendamping kreatif & rima tanpa klise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Tutup Panel Brainstorm"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 
        ============================================================
        2. TABS: EKSPLORASI BARU VS BANK IDE (RIWAYAT)
        ============================================================
      */}
      <div className="px-4 pt-2.5 pb-2 bg-bg-secondary flex items-center gap-2 border-b border-border-default/20 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'generate'
              ? 'bg-accent-primary text-accent-contrast shadow-2xs'
              : 'bg-bg-primary/60 text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Wand2 size={13} />
          <span>Eksplorasi Ide</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-accent-primary text-accent-contrast shadow-2xs'
              : 'bg-bg-primary/60 text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Clock size={13} />
          <span>Riwayat ({history.length})</span>
        </button>
      </div>

      {/* 
        ============================================================
        3. BODY CONTENT (SCROLLABLE)
        ============================================================
      */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {activeTab === 'generate' ? (
          <>
            {/* Tone / Karakter Bahasa Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>1. Karakter & Gaya Lirik</span>
                <span className="text-[10px] font-normal lowercase text-text-muted">
                  Anti-klise indah
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {TONE_OPTIONS.map((tone) => {
                  const isSelected = activeTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setActiveTone(tone.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-left transition-all border text-xs cursor-pointer flex flex-col gap-0.5 ${
                        isSelected
                          ? `${tone.badgeColor} border-current shadow-2xs font-semibold`
                          : 'bg-bg-primary/50 border-border-default/30 text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span>{tone.emoji}</span>
                        <span className="truncate">{tone.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tone Help Description */}
              <div className="px-2.5 py-1.5 rounded-lg bg-bg-primary/40 border border-border-default/20 text-[10.5px] text-text-muted leading-relaxed">
                <span className="font-medium text-text-secondary">{activeToneObj.emoji} {activeToneObj.label}: </span>
                {activeToneObj.desc}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                2. Tipe Eksplorasi
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {MODE_OPTIONS.map((mode) => {
                  const isSelected = activeMode === mode.id;
                  const Icon = mode.id === 'metaphor' ? Sparkles 
                    : mode.id === 'rhyme' ? Music 
                    : mode.id === 'variations' ? Split 
                    : Eye;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveMode(mode.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent-primary/10 border-accent-primary text-accent-primary font-semibold shadow-2xs'
                          : 'bg-bg-primary/50 border-border-default/30 text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <Icon size={13} className={isSelected ? 'text-accent-primary' : 'text-text-muted'} />
                        <span className="truncate">{mode.label}</span>
                      </div>
                      <p className="text-[10px] text-text-muted truncate mt-0.5">
                        {mode.shortDesc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Target Banner (Preserved even after DOM selection is cleared!) */}
            {savedSelection && (
              <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex items-center gap-1.5 text-accent-primary">
                  <Sparkles size={13} className="shrink-0" />
                  <span className="font-bold text-[10.5px] uppercase tracking-wider shrink-0">Target:</span>
                  <span className="truncate italic font-medium">"{savedSelection.text}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSavedSelection(null)}
                  className="p-1 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Hapus target seleksi"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Live Selection Banner if user highlights something while companion is open */}
            {liveSelection && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                <div className="min-w-0 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CornerDownLeft size={13} className="shrink-0" />
                  <span className="truncate font-medium">"{liveSelection.text}"</span>
                </div>
                <button
                  type="button"
                  onClick={handleAdoptLiveSelection}
                  className="px-2.5 py-1 text-[10.5px] rounded-lg bg-emerald-600 text-white font-semibold shrink-0 cursor-pointer hover:opacity-90 flex items-center gap-1 shadow-2xs"
                  title="Gunakan teks ini & bersihkan menu seleksi HP"
                >
                  <Check size={11} />
                  <span>Ambil & Bersihkan</span>
                </button>
              </div>
            )}

            {/* Keyword / Line Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                3. Kata Kunci / Baris Lirik
              </label>

              <div className="relative">
                <textarea
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={
                    activeMode === 'metaphor' 
                      ? 'Misal: "kehilangan arah di kota", "janji palsu", atau blok lirik...' 
                      : activeMode === 'rhyme' 
                      ? 'Misal: "berantakan", "aspal", "bicara", "gelap"...' 
                      : activeMode === 'imagery' 
                      ? 'Misal: "kamar kos jam 2 pagi", "hujan di terminal bus"...' 
                      : 'Ketik satu baris lirik yang ingin divariasikan...'
                  }
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-bg-primary rounded-xl border border-border-default/40 focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 resize-none text-text-primary placeholder:text-text-muted leading-relaxed"
                />
              </div>

              <button
                type="button"
                disabled={isLoading || !keyword.trim()}
                onClick={() => generateBrainstorm()}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isLoading || !keyword.trim()
                    ? 'bg-bg-primary text-text-muted cursor-not-allowed border border-border-default/20'
                    : 'bg-accent-primary text-accent-contrast hover:opacity-95 shadow-xs active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-accent-contrast" />
                    <span>Meracik Ide dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-accent-contrast" />
                    <span>Eksplorasi Ide Lirik</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {error}
                </div>
              )}
            </div>

            {/* Generated Suggestions Cards */}
            {currentSuggestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border-default/20">
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span className="font-semibold uppercase tracking-wider">
                    Hasil Saran ({currentSuggestions.length})
                  </span>
                  {modelUsed && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-accent-primary/80">
                      <Cpu size={10} />
                      <span>{modelUsed}</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {currentSuggestions.map((item, idx) => {
                    const isCopied = copiedId === item.id;
                    const isInserted = insertedId === item.id;

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl bg-bg-primary/90 border border-border-default/40 hover:border-accent-primary/30 transition-all space-y-2 shadow-2xs group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs sm:text-[13px] font-semibold text-text-primary leading-snug">
                            "{item.text}"
                          </p>
                          {item.tag && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-bg-secondary text-text-muted border border-border-default/30 text-[10px] font-medium tracking-wide">
                              {item.tag}
                            </span>
                          )}
                        </div>

                        {item.nuance && (
                          <p className="text-[11px] text-text-muted leading-relaxed italic">
                            💡 {item.nuance}
                          </p>
                        )}

                        {/* Action Buttons: Insert, Replace, Copy */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border-default/20">
                          {(savedSelection || liveSelection) && (
                            <button
                              type="button"
                              onClick={() => handleReplaceSelection(item.text, item.id)}
                              className="px-2 py-1 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-[10.5px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-accent-primary/20"
                              title={`Ganti "${(savedSelection || liveSelection)?.text}" di lirik`}
                            >
                              <RefreshCw size={11} />
                              <span>Ganti Target</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleInsertAtCursor(item.text, item.id)}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                              isInserted
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary'
                            }`}
                            title="Sisipkan baris ini ke kursor lembar lirik"
                          >
                            {isInserted ? <Check size={11} /> : <Plus size={11} />}
                            <span>{isInserted ? 'Tersisip!' : 'Sisip'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(item.text, item.id)}
                            className="p-1 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                            title="Salin ke Clipboard"
                          >
                            {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 
            ============================================================
            TAB 2: RIWAYAT / BANK IDE
            ============================================================
          */
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="py-12 text-center text-text-muted space-y-2">
                <Clock size={28} className="mx-auto opacity-40" />
                <p className="text-xs">Belum ada riwayat brainstorm untuk lagu ini.</p>
                <p className="text-[11px] opacity-75">
                  Ide yang kamu hasilkan akan otomatis tersimpan di sini.
                </p>
              </div>
            ) : (
              history.map((record) => {
                const isExpanded = expandedHistoryId === record.id;
                const toneDef = TONE_OPTIONS.find((t) => t.id === record.toneStyle);

                return (
                  <div
                    key={record.id}
                    className="rounded-xl bg-bg-primary/60 border border-border-default/40 overflow-hidden transition-all shadow-2xs"
                  >
                    {/* Header Item */}
                    <div
                      onClick={() => setExpandedHistoryId(isExpanded ? null : record.id)}
                      className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-bg-hover/50 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary truncate">
                          <span>{toneDef?.emoji || '⚡'}</span>
                          <span className="truncate">"{record.keyword}"</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-text-muted">
                          <span className="capitalize">{record.mode}</span>
                          <span>•</span>
                          <span>{record.suggestions.length} saran</span>
                          <span>•</span>
                          <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBrainstorm(record.id);
                          }}
                          className="p-1 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Hapus riwayat ini"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="text-text-muted">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Suggestions List */}
                    {isExpanded && (
                      <div className="p-2.5 pt-0 border-t border-border-default/20 space-y-2 bg-bg-secondary/40">
                        {record.suggestions.map((item, idx) => {
                          const isCopied = copiedId === `${record.id}_${item.id || idx}`;
                          const isInserted = insertedId === `${record.id}_${item.id || idx}`;

                          return (
                            <div
                              key={item.id || idx}
                              className="p-2 rounded-lg bg-bg-primary border border-border-default/30 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-text-primary">
                                  "{item.text}"
                                </p>
                                {item.tag && (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded bg-bg-secondary text-[9.5px] text-text-muted">
                                    {item.tag}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border-default/10">
                                {(savedSelection || liveSelection) && (
                                  <button
                                    type="button"
                                    onClick={() => handleReplaceSelection(item.text, `${record.id}_${item.id || idx}`)}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                                    title={`Ganti "${(savedSelection || liveSelection)?.text}" di lirik`}
                                  >
                                    <RefreshCw size={10} />
                                    <span>Ganti Target</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleInsertAtCursor(item.text, `${record.id}_${item.id || idx}`)}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  {isInserted ? <Check size={10} /> : <Plus size={10} />}
                                  <span>{isInserted ? 'Tersisip!' : 'Sisip'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.text, `${record.id}_${item.id || idx}`)}
                                  className="p-1 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                                >
                                  {isCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 
        ============================================================
        4. FOOTER NOTE
        ============================================================
      */}
      <div className="px-4 py-2 bg-bg-secondary border-t border-border-default/20 flex items-center justify-between text-[10px] text-text-muted shrink-0">
        <span className="flex items-center gap-1">
          <Info size={11} />
          <span>Tersimpan offline & cloud sync</span>
        </span>
        <span className="font-mono text-accent-primary/75">
          Gemini 3.6 Flash
        </span>
      </div>
    </div>
  );
};
