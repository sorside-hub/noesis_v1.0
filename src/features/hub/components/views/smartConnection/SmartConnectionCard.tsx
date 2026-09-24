import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowLeftRight, 
  Link as LinkIcon, 
  MessageSquare, 
  Check, 
  Loader2, 
  ExternalLink, 
  Tag, 
  Compass, 
  Smile, 
  Layers, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { SmartConnectionPair } from '../../../types/smartConnection';
import { SmartConnectionEngine } from '../../../services/smartConnectionEngine';

interface SmartConnectionCardProps {
  pair: SmartConnectionPair;
  onOpenNote: (id: string) => void;
  onLinkNotes: (sourceId: string, targetTitle: string, targetId: string) => Promise<boolean>;
  onDiscussInChat: (pair: SmartConnectionPair) => void;
  onExplanationUpdated: (pairId: string, explanation: string) => void;
}

export const SmartConnectionCard: React.FC<SmartConnectionCardProps> = ({
  pair,
  onOpenNote,
  onLinkNotes,
  onDiscussInChat,
  onExplanationUpdated,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [justLinked, setJustLinked] = useState(false);

  const isLinked = pair.alreadyLinked || justLinked;

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const explanation = await SmartConnectionEngine.requestAiExplanation(pair);
      onExplanationUpdated(pair.id, explanation);
    } catch (err: any) {
      console.error('[SmartConnectionCard] AI generation failed:', err);
      setAiError(err.message || 'Gagal menghasilkan penjelasan AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleLinkClick = async () => {
    if (isLinked || isLinking) return;
    setIsLinking(true);
    try {
      const success = await onLinkNotes(
        pair.sourceNote.id,
        pair.targetNote.title,
        pair.targetNote.id
      );
      if (success) {
        setJustLinked(true);
      }
    } finally {
      setIsLinking(false);
    }
  };

  const getTypeBadge = () => {
    switch (pair.connectionType) {
      case 'conceptual':
        return {
          label: 'Conceptual Twin',
          icon: Compass,
          bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        };
      case 'emotional':
        return {
          label: 'Resonansi Emosi',
          icon: Smile,
          bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        };
      case 'cross_disciplinary':
        return {
          label: 'Lintas Disiplin',
          icon: Layers,
          bgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        };
      default:
        return {
          label: 'Serendipitas',
          icon: Sparkles,
          bgClass: 'bg-accent-primary/10 text-accent-primary',
        };
    }
  };

  const typeBadge = getTypeBadge();
  const TypeIcon = typeBadge.icon;

  return (
    <div className="w-full bg-bg-surface hover:bg-bg-hover/30 transition-all duration-200 rounded-xl p-4 sm:p-5 flex flex-col gap-4 text-xs select-text">
      {/* Top Header: Category, Match Score, & Link Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] ${typeBadge.bgClass}`}
          >
            <TypeIcon size={12} />
            <span>{typeBadge.label}</span>
          </span>

          <span className="text-[11px] font-semibold text-text-secondary px-2 py-0.5 rounded-md bg-bg-primary">
            {pair.score}% Skor Relevansi
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLinked ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-medium">
              <Check size={12} strokeWidth={2.5} />
              <span>Sudah Terhubung</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Peluang Koneksi Baru</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Comparison: Note A <-> Note B */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-stretch">
        {/* Note A Column */}
        <div 
          onClick={() => onOpenNote(pair.sourceNote.id)}
          className="p-3 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-text-primary text-sm group-hover:text-accent-primary transition-colors flex items-center gap-1.5 truncate">
                <FileText size={14} className="text-text-muted shrink-0 group-hover:text-accent-primary" />
                <span className="truncate">{pair.sourceNote.title}</span>
              </span>
              <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>

            {pair.sourceNote.summary && (
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 mb-2 italic">
                "{pair.sourceNote.summary}"
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            {pair.sourceNote.type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-text-muted">
                {pair.sourceNote.type}
              </span>
            )}
            {pair.sourceNote.emotion && pair.sourceNote.emotion !== 'Neutral' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-rose-500 font-medium">
                {pair.sourceNote.emotion}
              </span>
            )}
          </div>
        </div>

        {/* Central Bridge Divider */}
        <div className="flex md:flex-col items-center justify-center py-1 md:py-0 px-2 text-text-muted">
          <div className="p-1.5 rounded-full bg-bg-primary text-accent-primary">
            <ArrowLeftRight size={14} />
          </div>
        </div>

        {/* Note B Column */}
        <div 
          onClick={() => onOpenNote(pair.targetNote.id)}
          className="p-3 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-text-primary text-sm group-hover:text-accent-primary transition-colors flex items-center gap-1.5 truncate">
                <FileText size={14} className="text-text-muted shrink-0 group-hover:text-accent-primary" />
                <span className="truncate">{pair.targetNote.title}</span>
              </span>
              <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>

            {pair.targetNote.summary && (
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 mb-2 italic">
                "{pair.targetNote.summary}"
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            {pair.targetNote.type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-text-muted">
                {pair.targetNote.type}
              </span>
            )}
            {pair.targetNote.emotion && pair.targetNote.emotion !== 'Neutral' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface text-rose-500 font-medium">
                {pair.targetNote.emotion}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Shared Elements Ribbon (Concepts, Keywords, Tags) */}
      {(pair.sharedConcepts.length > 0 || pair.sharedKeywords.length > 0 || pair.sharedTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-text-muted font-medium mr-1">Benang Merah:</span>
          {pair.sharedConcepts.map((concept, idx) => (
            <span
              key={`sc-${idx}`}
              className="px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary text-[10px] font-medium"
            >
              🧠 {concept}
            </span>
          ))}
          {pair.sharedKeywords.slice(0, 3).map((kw, idx) => (
            <span
              key={`sk-${idx}`}
              className="px-2 py-0.5 rounded-md bg-bg-primary text-text-secondary text-[10px]"
            >
              {kw}
            </span>
          ))}
          {pair.sharedTags.map((tag, idx) => (
            <span
              key={`st-${idx}`}
              className="px-2 py-0.5 rounded-md bg-bg-primary text-text-muted text-[10px] flex items-center gap-0.5"
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Synthesis Section (Sense-Maker) */}
      <div className="rounded-lg p-3 bg-bg-primary flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-accent-primary font-medium text-[11px]">
            <Sparkles size={12} />
            <span>Sintesis AI (Benang Merah Ide)</span>
          </div>

          {pair.aiExplanation && (
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              className="text-[10px] text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Perbarui sintesis AI"
            >
              <RefreshCw size={10} className={isGeneratingAi ? 'animate-spin' : ''} />
              <span>Regenerasi</span>
            </button>
          )}
        </div>

        {pair.aiExplanation ? (
          <p className="text-[11px] text-text-primary font-serif leading-relaxed italic">
            "{pair.aiExplanation}"
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 py-1">
            <p className="text-[11px] text-text-muted leading-relaxed">
              Tekan tombol di samping untuk merumuskan wawasan sintesis mengapa kedua catatan ini relevan secara filosofis.
            </p>
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              className="px-3 py-1.5 rounded-lg bg-accent-primary text-accent-contrast font-medium text-[11px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Merumuskan Sintesis...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>✨ Jelaskan dengan AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {aiError && (
          <p className="text-[10px] text-status-error font-medium">
            {aiError}
          </p>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLinkClick}
            disabled={isLinked || isLinking}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              isLinked
                ? 'bg-status-success/10 text-status-success cursor-default'
                : 'bg-bg-hover hover:bg-bg-primary text-text-primary active:scale-95'
            }`}
          >
            {isLinking ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Menautkan...</span>
              </>
            ) : isLinked ? (
              <>
                <Check size={12} strokeWidth={2.5} />
                <span>Tersambung Link Wiki</span>
              </>
            ) : (
              <>
                <LinkIcon size={12} />
                <span>+ Tautkan Link Wiki</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onDiscussInChat(pair)}
            className="px-3 py-1.5 rounded-lg bg-bg-hover hover:bg-bg-primary text-text-primary text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Buka topik hubungan ini di Chat RAG"
          >
            <MessageSquare size={12} className="text-accent-primary" />
            <span>💬 Bahas di Chat RAG</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNote(pair.sourceNote.id)}
            className="text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Buka {pair.sourceNote.title}
          </button>
          <span className="text-text-muted/40">•</span>
          <button
            type="button"
            onClick={() => onOpenNote(pair.targetNote.id)}
            className="text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Buka {pair.targetNote.title}
          </button>
        </div>
      </div>
    </div>
  );
};
