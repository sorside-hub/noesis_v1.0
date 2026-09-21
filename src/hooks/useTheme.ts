import { useState, useEffect } from 'react';
import { db } from '../lib/db';

export type ThemeMode = 'charcoal-navy';
const STORAGE_KEY_THEME = 'noesis_theme_mode';
const THEME_CHANGE_EVENT = 'noesis_theme_changed';

export const normalizeTheme = (_val?: string | null): ThemeMode => {
  return 'charcoal-navy';
};

export const applyThemeToDOM = (_theme: ThemeMode = 'charcoal-navy') => {
  const root = document.documentElement;
  root.classList.remove('light');
  root.classList.add('dark');
  root.setAttribute('data-theme', 'charcoal-navy');

  // Update mobile status bar theme color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', '#262626');
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>('charcoal-navy');

  useEffect(() => {
    applyThemeToDOM('charcoal-navy');
    try {
      localStorage.setItem(STORAGE_KEY_THEME, 'charcoal-navy');
    } catch (e) {}
    db.settings.put({ key: STORAGE_KEY_THEME, value: 'charcoal-navy' });
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (e) {}
    db.settings.put({ key: STORAGE_KEY_THEME, value: newTheme });
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newTheme }));
  };

  return { theme, setTheme };
};


