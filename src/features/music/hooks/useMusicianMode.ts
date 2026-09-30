import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'musician_mode_enabled';
const EVENT_NAME = 'musician_mode_changed';

export function useMusicianMode() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      const val = localStorage.getItem(STORAGE_KEY) === 'true';
      setIsEnabled(val);
    };

    window.addEventListener(EVENT_NAME, handleStorage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setMusicianMode = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { enabled } }));
    }
  }, []);

  const toggleMusicianMode = useCallback(() => {
    setMusicianMode(!isEnabled);
  }, [isEnabled, setMusicianMode]);

  return {
    isMusicianModeEnabled: isEnabled,
    setMusicianMode,
    toggleMusicianMode,
  };
}
