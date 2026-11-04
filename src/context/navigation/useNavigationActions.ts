import { useCallback } from 'react';
import { ActiveTab } from '../../components/navigation/BottomNavPill';
import { NavigationHistoryEntry, safePushState, safeHistoryBack } from './historyUtils';

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
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView(newView);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, mediaCategory, setView, setMediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
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
        seq: currentSeqRef.current,
      };
      safePushState(nextEntry);
    }

    setIsMobileSidebarOpen(true);
    setIsMobileRightSidebarOpen(false);
    setActiveModal(null);
  }, [isMobileSidebarOpen, view, activeTabId, mediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]);

  // Close Left Mobile Sidebar
  const closeMobileSidebar = useCallback(() => {
    if (!isMobileSidebarOpen) return;
    if (typeof window !== 'undefined' && window.history?.state?.isMobileSidebarOpen) {
      safeHistoryBack();
    } else {
      setIsMobileSidebarOpen(false);
    }
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
        seq: currentSeqRef.current,
      };
      safePushState(nextEntry);
    }

    setIsMobileRightSidebarOpen(true);
    setIsMobileSidebarOpen(false);
    setActiveModal(null);
  }, [isMobileRightSidebarOpen, view, activeTabId, mediaCategory, setIsMobileRightSidebarOpen, setIsMobileSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]);

  // Close Right Mobile Sidebar
  const closeMobileRightSidebar = useCallback(() => {
    if (!isMobileRightSidebarOpen) return;
    if (typeof window !== 'undefined' && window.history?.state?.isMobileRightSidebarOpen) {
      safeHistoryBack();
    } else {
      setIsMobileRightSidebarOpen(false);
    }
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
          isMobileSidebarOpen,
          isMobileRightSidebarOpen: false,
          activeModal: modalId,
          mediaCategory,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setActiveModal(modalId);
    },
    [activeModal, view, activeTabId, isMobileSidebarOpen, mediaCategory, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Close Modal
  const closeModal = useCallback(() => {
    if (!activeModal) return;
    if (typeof window !== 'undefined' && window.history?.state?.activeModal) {
      safeHistoryBack();
    } else {
      setActiveModal(null);
    }
  }, [activeModal, setActiveModal]);

  // Manual Trigger for Back button
  const goBack = useCallback(() => {
    safeHistoryBack();
  }, []);

  return {
    navigateView,
    navigateToMediaCategory,
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
