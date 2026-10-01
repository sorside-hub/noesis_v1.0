import { useCallback } from 'react';
import { ActiveTab } from '../../components/navigation/BottomNavPill';
import { NavigationHistoryEntry, MusicSubView, safePushState, safeHistoryBack } from './historyUtils';

interface UseNavigationActionsProps {
  view: ActiveTab;
  setView: React.Dispatch<React.SetStateAction<ActiveTab>>;
  activeTabId: string | null;
  onSelectTabId: (id: string | null) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileRightSidebarOpen: boolean;
  setIsMobileRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeModal: string | null;
  setActiveModal: React.Dispatch<React.SetStateAction<string | null>>;
  mediaCategory: string | null;
  setMediaCategory: React.Dispatch<React.SetStateAction<string | null>>;
  musicProjectId: string | null;
  setMusicProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  musicSongId: string | null;
  setMusicSongId: React.Dispatch<React.SetStateAction<string | null>>;
  musicSubView: MusicSubView | null;
  setMusicSubView: React.Dispatch<React.SetStateAction<MusicSubView | null>>;
  setIsDesktopSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPopStateNavigatingRef: React.MutableRefObject<boolean>;
  currentSeqRef: React.MutableRefObject<number>;
}

export const useNavigationActions = ({
  view,
  setView,
  activeTabId,
  onSelectTabId,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isMobileRightSidebarOpen,
  setIsMobileRightSidebarOpen,
  activeModal,
  setActiveModal,
  mediaCategory,
  setMediaCategory,
  musicProjectId,
  setMusicProjectId,
  musicSongId,
  setMusicSongId,
  musicSubView,
  setMusicSubView,
  setIsDesktopSidebarOpen,
  isPopStateNavigatingRef,
  currentSeqRef,
}: UseNavigationActionsProps) => {
  // Navigate between top-level views ('vault' <-> 'settings')
  const navigateView = useCallback(
    (newView: ActiveTab) => {
      if (newView === view) {
        if (newView === 'media') {
          setMediaCategory(null);
        }
        if (newView === 'music') {
          setMusicProjectId(null);
          setMusicSongId(null);
          setMusicSubView(null);
        }

        setIsMobileSidebarOpen(false);
        setIsMobileRightSidebarOpen(false);
        setActiveModal(null);
        return;
      }

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: newView,
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: newView === 'media' ? mediaCategory : null,
          musicProjectId: newView === 'music' ? musicProjectId : null,
          musicSongId: newView === 'music' ? musicSongId : null,
          musicSubView: newView === 'music' ? musicSubView : null,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView(newView);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, mediaCategory, musicProjectId, musicSongId, musicSubView, setView, setMediaCategory, setMusicProjectId, setMusicSongId, setMusicSubView, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific media category
  const navigateToMediaCategory = useCallback(
    (category: string | null) => {
      const isSameCategory = category === mediaCategory && view === 'media';
      if (isSameCategory && !isMobileSidebarOpen && !isMobileRightSidebarOpen && !activeModal) {
        return;
      }

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'media',
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: category,
          musicProjectId: null,
          musicSongId: null,
          musicSubView: null,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('media');
      setMediaCategory(category);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [mediaCategory, view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, setView, setMediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific music project (EP or Album Overview)
  const navigateToMusicProject = useCallback(
    (projectId: string | null) => {
      const isSameProject = projectId === musicProjectId && view === 'music' && !musicSongId;
      if (isSameProject && !isMobileSidebarOpen && !isMobileRightSidebarOpen && !activeModal) {
        return;
      }

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'music',
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: null,
          musicProjectId: projectId,
          musicSongId: null,
          musicSubView: null,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('music');
      setMusicProjectId(projectId);
      setMusicSongId(null);
      setMusicSubView(null);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [musicProjectId, musicSongId, view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, setView, setMusicProjectId, setMusicSongId, setMusicSubView, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific music studio song (Default to 'overview')
  const navigateToMusicSong = useCallback(
    (songId: string | null) => {
      const isSameSong = songId === musicSongId && view === 'music' && musicSubView === 'overview';
      if (isSameSong && !isMobileSidebarOpen && !isMobileRightSidebarOpen && !activeModal) {
        return;
      }

      const targetSubView: MusicSubView | null = songId ? 'overview' : null;

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'music',
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: null,
          musicProjectId,
          musicSongId: songId,
          musicSubView: targetSubView,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('music');
      setMusicSongId(songId);
      setMusicSubView(targetSubView);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [musicSongId, musicSubView, musicProjectId, view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, setView, setMusicSongId, setMusicSubView, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific sub-view within a song (e.g. editor, premise, scratchpad)
  const navigateToMusicSubView = useCallback(
    (songId: string, subView: MusicSubView) => {
      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'music',
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: null,
          musicProjectId,
          musicSongId: songId,
          musicSubView: subView,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('music');
      setMusicSongId(songId);
      setMusicSubView(subView);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [activeTabId, musicProjectId, setView, setMusicSongId, setMusicSubView, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific note
  const navigateToNote = useCallback(
    (newNoteId: string | null) => {
      const isSameNote = newNoteId === activeTabId && view === 'vault';

      if (
        !isPopStateNavigatingRef.current &&
        (!isSameNote || isMobileSidebarOpen || isMobileRightSidebarOpen || activeModal)
      ) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'vault',
          activeTabId: newNoteId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: null,
          musicProjectId: null,
          musicSongId: null,
          musicSubView: null,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('vault');
      setMediaCategory(null);
      onSelectTabId(newNoteId);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [activeTabId, view, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, onSelectTabId, setView, setMediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Open Left Mobile Sidebar
  const openMobileSidebar = useCallback(() => {
    if (isMobileSidebarOpen) return;

    if (!isPopStateNavigatingRef.current) {
      currentSeqRef.current += 1;
      const nextEntry: NavigationHistoryEntry = {
        view,
        activeTabId,
        isMobileSidebarOpen: true,
        isMobileRightSidebarOpen: false,
        activeModal: null,
        mediaCategory,
        musicProjectId,
        musicSongId,
        musicSubView,
        seq: currentSeqRef.current,
      };
      safePushState(nextEntry);
    }

    setIsMobileSidebarOpen(true);
    setIsMobileRightSidebarOpen(false);
    setActiveModal(null);
  }, [isMobileSidebarOpen, view, activeTabId, mediaCategory, musicProjectId, musicSongId, musicSubView, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]);

  // Close Left Mobile Sidebar
  const closeMobileSidebar = useCallback(() => {
    if (!isMobileSidebarOpen) return;
    setIsMobileSidebarOpen(false);
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

  // Open Right Mobile Sidebar
  const openMobileRightSidebar = useCallback(() => {
    if (isMobileRightSidebarOpen) return;

    if (!isPopStateNavigatingRef.current) {
      currentSeqRef.current += 1;
      const nextEntry: NavigationHistoryEntry = {
        view,
        activeTabId,
        isMobileSidebarOpen: false,
        isMobileRightSidebarOpen: true,
        activeModal: null,
        mediaCategory,
        musicProjectId,
        musicSongId,
        musicSubView,
        seq: currentSeqRef.current,
      };
      safePushState(nextEntry);
    }

    setIsMobileRightSidebarOpen(true);
    setIsMobileSidebarOpen(false);
    setActiveModal(null);
  }, [isMobileRightSidebarOpen, view, activeTabId, mediaCategory, musicProjectId, musicSongId, musicSubView, setIsMobileRightSidebarOpen, setIsMobileSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]);

  // Close Right Mobile Sidebar
  const closeMobileRightSidebar = useCallback(() => {
    if (!isMobileRightSidebarOpen) return;
    setIsMobileRightSidebarOpen(false);
  }, [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen]);

  // Toggle Desktop Sidebar
  const toggleDesktopSidebar = useCallback(() => {
    setIsDesktopSidebarOpen((prev) => !prev);
  }, [setIsDesktopSidebarOpen]);

  const openDesktopSidebar = useCallback(() => {
    setIsDesktopSidebarOpen(true);
  }, [setIsDesktopSidebarOpen]);

  const closeDesktopSidebar = useCallback(() => {
    setIsDesktopSidebarOpen(false);
  }, [setIsDesktopSidebarOpen]);

  // Open Modal
  const openModal = useCallback(
    (modalId: string) => {
      if (activeModal === modalId) return;

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view,
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: modalId,
          mediaCategory,
          musicProjectId,
          musicSongId,
          musicSubView,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setActiveModal(modalId);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
    },
    [activeModal, view, activeTabId, mediaCategory, musicProjectId, musicSongId, musicSubView, setActiveModal, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, isPopStateNavigatingRef, currentSeqRef]
  );

  // Close Modal
  const closeModal = useCallback(() => {
    if (!activeModal) return;
    setActiveModal(null);
  }, [activeModal, setActiveModal]);

  // Manual Trigger for Back button
  const goBack = useCallback(() => {
    safeHistoryBack();
  }, []);

  return {
    navigateView,
    navigateToMediaCategory,
    navigateToMusicProject,
    navigateToMusicSong,
    navigateToMusicSubView,
    navigateToNote,
    openMobileSidebar,
    closeMobileSidebar,
    openMobileRightSidebar,
    closeMobileRightSidebar,
    toggleDesktopSidebar,
    openDesktopSidebar,
    closeDesktopSidebar,
    openModal,
    closeModal,
    goBack,
  };
};
