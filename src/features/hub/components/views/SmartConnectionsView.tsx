import React, { useMemo, useState, useCallback } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Search, 
  Filter, 
  Link as LinkIcon, 
  Compass, 
  Smile, 
  Layers, 
  CheckCircle2, 
  Info,
  X
} from 'lucide-react';
import { EnrichedNoteItem } from '../../types';
import { SmartConnectionPair, SmartConnectionType } from '../../types/smartConnection';
import { SmartConnectionEngine } from '../../services/smartConnectionEngine';
import { SmartConnectionCard } from './smartConnection/SmartConnectionCard';
import { useNavigation } from '../../../../context/NavigationContext';
import { db } from '../../../../lib/db';

interface SmartConnectionsViewProps {
  notes: EnrichedNoteItem[];
  onOpenNote: (id: string) => void;
  vaultState?: any;
}

export const SmartConnectionsView: React.FC<SmartConnectionsViewProps> = ({
  notes,
  onOpenNote,
  vaultState,
}) => {
  const { navigateView, setView } = useNavigation();

  // Filter States
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | SmartConnectionType>('all');
  const [hideAlreadyLinked, setHideAlreadyLinked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // In-memory overrides for AI explanations and newly linked pairs
  const [localExplanations, setLocalExplanations] = useState<Record<string, string>>({});
  const [locallyLinkedPairs, setLocallyLinkedPairs] = useState<Set<string>>(new Set());

  // Compute all potential connection pairs
  const allPairs = useMemo(() => {
    // refreshKey dependency allows manual re-scan
    const pairs = SmartConnectionEngine.computeConnections(notes);

    // Apply any in-memory state overrides
    return pairs.map(p => {
      let isLinked = p.alreadyLinked || locallyLinkedPairs.has(p.id);
      let explanation = localExplanations[p.id] || p.aiExplanation;
      return {
        ...p,
        alreadyLinked: isLinked,
        aiExplanation: explanation,
      };
    });
  }, [notes, refreshKey, localExplanations, locallyLinkedPairs]);

  // Filtered pairs based on user criteria
  const filteredPairs = useMemo(() => {
    return allPairs.filter(pair => {
      // 1. Type Filter
      if (activeTypeFilter !== 'all' && pair.connectionType !== activeTypeFilter) {
        return false;
      }

      // 2. Hide already linked filter
      if (hideAlreadyLinked && pair.alreadyLinked) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleA = pair.sourceNote.title.toLowerCase();
        const titleB = pair.targetNote.title.toLowerCase();
        const concepts = pair.sharedConcepts.join(' ').toLowerCase();
        const keywords = pair.sharedKeywords.join(' ').toLowerCase();
        const tags = pair.sharedTags.join(' ').toLowerCase();
        const summaryA = (pair.sourceNote.summary || '').toLowerCase();
        const summaryB = (pair.targetNote.summary || '').toLowerCase();

        const matches =
          titleA.includes(query) ||
          titleB.includes(query) ||
          concepts.includes(query) ||
          keywords.includes(query) ||
          tags.includes(query) ||
          summaryA.includes(query) ||
          summaryB.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [allPairs, activeTypeFilter, hideAlreadyLinked, searchQuery]);

  // Statistics
  const unlinkedCount = useMemo(() => {
    return allPairs.filter(p => !p.alreadyLinked).length;
  }, [allPairs]);

  const indexedNotesCount = useMemo(() => {
    return notes.filter(n => (n.concepts && n.concepts.length > 0) || (n.summary && n.summary.length > 0)).length;
  }, [notes]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 400);
  }, []);

  // Backlink injection handler
  const handleLinkNotes = useCallback(
    async (sourceId: string, targetTitle: string, targetId: string): Promise<boolean> => {
      try {
        const sourceNote = notes.find(n => n.id === sourceId);
        if (!sourceNote) return false;

        const currentContent = sourceNote.node.content || '';
        const linkSnippet = `\n\n---\n**Koneksi Ide:** [[${targetTitle}]]\n`;
        const updatedContent = currentContent + linkSnippet;

        // 1. Update via vaultState if available
        if (vaultState?.updateNoteContent) {
          vaultState.updateNoteContent(sourceId, updatedContent);
        } else if (vaultState?.updateNode) {
          vaultState.updateNode(sourceId, { content: updatedContent });
        }

        // 2. Persist to Dexie IndexedDB
        try {
          await db.nodes.update(sourceId, {
            content: updatedContent,
            updatedAt: Date.now(),
          });
        } catch (dbErr) {
          console.warn('[SmartConnectionsView] DB update warning:', dbErr);
        }

        // 3. Mark pair as linked locally
        const pairId = SmartConnectionEngine.getPairId(sourceId, targetId);
        setLocallyLinkedPairs(prev => new Set(prev).add(pairId));

        return true;
      } catch (err) {
        console.error('[SmartConnectionsView] Failed to link notes:', err);
        return false;
      }
    },
    [notes, vaultState]
  );

  // Discuss in Chat RAG handler
  const handleDiscussInChat = useCallback(
    (pair: SmartConnectionPair) => {
      const conceptsStr = pair.sharedConcepts.length > 0 
        ? `Konsep yang beririsan: ${pair.sharedConcepts.join(', ')}.` 
        : '';
      const initialSynthesisStr = pair.aiExplanation 
        ? `Sintesis awal: "${pair.aiExplanation}".` 
        : '';

      const prompt = `Tolong bahas dan eksplorasi korelasi mendalam antara dua catatan ini:
1. "${pair.sourceNote.title}"
2. "${pair.targetNote.title}"

${conceptsStr}
${initialSynthesisStr}

Bagaimana kedua gagasan ini dapat dikombinasikan untuk melahirkan sudut pandang, argumen, atau wawasan baru?`;

      // Prefill into sessionStorage
      try {
        sessionStorage.setItem('noesis_pending_chat_prompt', prompt);
      } catch {}

      // Dispatch custom event in case ChatView is already mounted
      window.dispatchEvent(
        new CustomEvent('noesis-set-chat-input', {
          detail: { prompt },
        })
      );

      // Navigate to Chat
      if (navigateView) {
        navigateView('chat');
      } else if (setView) {
        setView('chat');
      }
    },
    [navigateView, setView]
  );

  // AI Explanation updated
  const handleExplanationUpdated = useCallback((pairId: string, explanation: string) => {
    setLocalExplanations(prev => ({
      ...prev,
      [pairId]: explanation,
    }));
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-bg-primary text-text-primary">
      {/* Top Header Bar (Identical height & style to Table Matrix & other Hub views) */}
      <div className="relative z-30 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 border-b border-border-default bg-bg-primary flex flex-row items-center justify-between gap-2.5 shrink-0 min-h-[42px]">
        {/* Title, Info Total, & Scan Button - All In One Line */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <h1 className="text-sm sm:text-base font-semibold text-text-heading">
            Smart Connections
          </h1>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg-surface text-text-muted">
            {allPairs.length} Ditemukan
          </span>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1 rounded-md bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Pindai ulang seluruh vault"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-accent-primary' : ''} />
            <span>{isRefreshing ? 'Memindai...' : 'Scan Ulang'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Bar: Filter Lenses & Search Row */}
      <div className="px-3 sm:px-4 lg:px-5 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-bg-primary border-b border-border-default/40">
        {/* Perspective Lenses (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                activeTypeFilter === 'all'
                  ? 'bg-accent-primary text-accent-contrast'
                  : 'bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter('conceptual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTypeFilter === 'conceptual'
                  ? 'bg-accent-primary text-accent-contrast'
                  : 'bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              <Compass size={13} />
              <span>Konsep</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter('emotional')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTypeFilter === 'emotional'
                  ? 'bg-accent-primary text-accent-contrast'
                  : 'bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              <Smile size={13} />
              <span>Resonansi Emosi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter('cross_disciplinary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTypeFilter === 'cross_disciplinary'
                  ? 'bg-accent-primary text-accent-contrast'
                  : 'bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              <Layers size={13} />
              <span>Lintas Disiplin</span>
            </button>
          </div>

          {/* Search & Hide-Linked Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-52 focus-within:sm:w-64 transition-all duration-200">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari konsep, judul, tag..."
                className="w-full pl-7 pr-7 py-1 text-xs bg-bg-surface border border-transparent rounded-md text-text-primary placeholder:text-text-muted hover:border-accent-primary/40 focus:outline-none focus:border-accent-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                  title="Hapus pencarian"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setHideAlreadyLinked(!hideAlreadyLinked)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                hideAlreadyLinked
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
              title="Sembunyikan catatan yang sudah memiliki tautan wiki [[...]]"
            >
              <LinkIcon size={12} />
              <span className="hidden sm:inline">Peluang Baru Saja</span>
              {unlinkedCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 custom-scrollbar">
        {/* Informational Tip Bar (If some notes are not indexed yet) */}
        {indexedNotesCount < notes.length && (
          <div className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg bg-bg-surface/60 text-[11px]">
            <div className="flex items-center gap-2 text-text-secondary">
              <Info size={13} className="text-accent-primary shrink-0" />
              <span>
                <strong>{indexedNotesCount} dari {notes.length}</strong> catatan telah diindeks konsep. Sinkronkan sisanya lewat tombol RAG di sidebar kanan catatan.
              </span>
            </div>
          </div>
        )}

        {/* Empty States */}
        {allPairs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted rounded-2xl select-none my-6">
            <div className="w-14 h-14 rounded-2xl bg-bg-surface flex items-center justify-center mb-3 text-accent-primary">
              <Sparkles size={28} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Belum Ada Koneksi yang Terdeteksi
            </h3>
            <p className="text-xs text-text-muted max-w-sm leading-relaxed mb-4">
              Tulis lebih banyak catatan atau klik tombol RAG di panel samping kanan catatan untuk mengindeks konsep, ringkasan, dan emosi secara otomatis.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 rounded-lg bg-accent-primary text-accent-contrast text-xs font-medium cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            >
              Scan Ulang Vault
            </button>
          </div>
        ) : filteredPairs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted rounded-2xl select-none my-6">
            <Filter size={24} className="mb-2 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Tidak Ada Hasil dengan Filter Saat Ini
            </h3>
            <p className="text-xs text-text-muted max-w-xs mb-3">
              Coba ubah kata kunci pencarian atau matikan filter "Peluang Baru Saja".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTypeFilter('all');
                setHideAlreadyLinked(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-text-primary text-xs font-medium cursor-pointer transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          /* Cards Grid List */
          <div className="flex flex-col gap-4 pb-12">
            {filteredPairs.map(pair => (
              <SmartConnectionCard
                key={pair.id}
                pair={pair}
                onOpenNote={onOpenNote}
                onLinkNotes={handleLinkNotes}
                onDiscussInChat={handleDiscussInChat}
                onExplanationUpdated={handleExplanationUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
