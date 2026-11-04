import { useEffect, useRef } from 'react';
import { useVault } from './useVault';
import { useNavigation } from '../context/NavigationContext';
import { FileNode } from '../types/vault';
import { NavigationHistoryEntry, safeReplaceState } from '../context/navigation/historyUtils';

export type ShortcutActionType =
  | 'new-note'
  | 'quick-capture'
  | 'voice-transcript'
  | 'voice-memo';

export const SHORTCUT_DEFINITIONS: {
  id: ShortcutActionType;
  title: string;
  shortTitle: string;
  description: string;
  path: string;
  queryParam: string;
  iconName: string;
}[] = [
  {
    id: 'new-note',
    title: 'Catatan Baru',
    shortTitle: 'Catatan',
    description: 'Buka lembar catatan baru di Vault',
    path: '/quick/note',
    queryParam: '/?action=new-note',
    iconName: 'Plus',
  },
  {
    id: 'quick-capture',
    title: 'Tulis Cepat',
    shortTitle: 'Tulis',
    description: 'Tulis kilat dan simpan otomatis ke folder 00-Inbox',
    path: '/quick/capture',
    queryParam: '/?action=quick-capture',
    iconName: 'Zap',
  },
  {
    id: 'voice-transcript',
    title: 'AI Voice Transcript',
    shortTitle: 'Transkrip',
    description: 'Transkripsi rekaman suara ke teks dengan AI',
    path: '/quick/transcript',
    queryParam: '/?action=voice-transcript',
    iconName: 'AudioLines',
  },
  {
    id: 'voice-memo',
    title: 'Voice Memo',
    shortTitle: 'Memo Suara',
    description: 'Rekam dan simpan audio memo dengan waveform instan',
    path: '/quick/memo',
    queryParam: '/?action=voice-memo',
    iconName: 'Mic',
  },
];

export function parseShortcutActionFromUrl(): ShortcutActionType | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const actionParam = urlParams.get('action')?.toLowerCase();

  if (actionParam === 'new-note' || actionParam === 'note') return 'new-note';
  if (actionParam === 'quick-capture' || actionParam === 'capture') return 'quick-capture';
  if (actionParam === 'voice-transcript' || actionParam === 'transcript') return 'voice-transcript';
  if (actionParam === 'voice-memo' || actionParam === 'memo') return 'voice-memo';

  // Check pathnames
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.includes('/quick/note') || pathname.includes('/quick-note')) return 'new-note';
  if (pathname.includes('/quick/capture') || pathname.includes('/quick-capture')) return 'quick-capture';
  if (pathname.includes('/quick/transcript') || pathname.includes('/quick-transcript')) return 'voice-transcript';
  if (pathname.includes('/quick/memo') || pathname.includes('/quick-memo')) return 'voice-memo';

  return null;
}

interface UseHomeScreenShortcutsProps {
  vaultState: ReturnType<typeof useVault>;
}

export function useHomeScreenShortcuts({ vaultState }: UseHomeScreenShortcutsProps) {
  const { navigateView, navigateToNote, openModal } = useNavigation();
  const executedActionRef = useRef<string | null>(null);

  // Set document title if accessed via dedicated launcher URL for crisp Add-to-Home-Screen labeling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const action = parseShortcutActionFromUrl();
    if (!action) return;

    const shortcutDef = SHORTCUT_DEFINITIONS.find((s) => s.id === action);
    if (shortcutDef) {
      document.title = `${shortcutDef.title} — Noesis`;
    }
  }, []);

  // Execute shortcut action once Vault is ready
  useEffect(() => {
    if (!vaultState.vault) return;

    const action = parseShortcutActionFromUrl();
    if (!action) return;

    // Prevent duplicate triggers in same session
    if (executedActionRef.current === action) return;
    executedActionRef.current = action;

    const executeAction = async () => {
      let createdNoteId: string | null = null;
      try {
        switch (action) {
          case 'new-note': {
            navigateView('vault');
            createdNoteId = vaultState.createNote(null, 'Untitled');
            if (createdNoteId) {
              navigateToNote(createdNoteId);
            }
            break;
          }

          case 'quick-capture': {
            navigateView('vault');
            const allNodes = Object.values(vaultState.vault!.nodes) as FileNode[];
            let inboxFolder = allNodes.find(
              (n) =>
                n.type === 'folder' &&
                n.parentId === null &&
                (n.name.toLowerCase() === '00-inbox' ||
                  n.name.toLowerCase() === '00 - inbox' ||
                  n.name.toLowerCase() === 'inbox')
            );

            let inboxFolderId: string | null = inboxFolder ? inboxFolder.id : null;
            if (!inboxFolderId) {
              inboxFolderId = vaultState.createFolder(null, '00-Inbox');
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            const timeStr = now
              .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              .replace(':', '.');
            const captureName = `Capture ${dateStr} ${timeStr}`;

            createdNoteId = vaultState.createNote(inboxFolderId, captureName, { status: 'Inbox' });
            if (createdNoteId) {
              navigateToNote(createdNoteId);
            }
            break;
          }

          case 'voice-transcript': {
            navigateView('vault');
            openModal('voice-note');
            break;
          }

          case 'voice-memo': {
            navigateView('vault');
            openModal('voice-memo');
            break;
          }
        }
      } catch (err) {
        console.error('[HomeScreenShortcuts] Failed to execute shortcut action:', err);
      } finally {
        // Clean URL query parameters to root '/' without destroying navigation history state
        try {
          if (typeof window !== 'undefined' && (window.location.search || window.location.pathname !== '/')) {
            const currentState = (window.history.state as NavigationHistoryEntry | null) || null;
            const activeTabId = createdNoteId || currentState?.activeTabId || null;
            const targetModal = action === 'voice-transcript' ? 'voice-note' : action === 'voice-memo' ? 'voice-memo' : null;

            const cleanEntry: NavigationHistoryEntry = {
              view: 'vault',
              activeTabId,
              isMobileSidebarOpen: false,
              isMobileRightSidebarOpen: false,
              activeModal: targetModal,
              mediaCategory: null,
              seq: currentState?.seq || 1,
            };
            safeReplaceState(cleanEntry);
            if (window.history && typeof window.history.replaceState === 'function') {
              window.history.replaceState(cleanEntry, document.title, '/');
            }
          }
        } catch {
          // ignore popstate restrictions
        }
      }
    };

    // Small delay ensures sub-components and modals have mounted
    const timer = setTimeout(executeAction, 100);
    return () => clearTimeout(timer);
  }, [vaultState.vault, navigateView, navigateToNote, openModal, vaultState]);
}
