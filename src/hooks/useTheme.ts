import { useState, useEffect } from 'react';
import { db } from '../lib/db';

export type ThemeMode = 'charcoal-navy' | 'editorial-light';
const STORAGE_KEY_THEME = 'noesis_theme_mode';
const THEME_CHANGE_EVENT = 'noesis_theme_changed';

export const normalizeTheme = (val?: string | null): ThemeMode => {
  if (val === 'editorial-light' || val === 'light') {
    return 'editorial-light';
  }
  return 'charcoal-navy';
};

export const applyThemeToDOM = (theme: ThemeMode = 'charcoal-navy') => {
  const root = document.documentElement;
  const isLight = theme === 'editorial-light';
  if (isLight) {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'editorial-light');
    root.style.backgroundColor = '#FAF8F5';
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'charcoal-navy');
    root.style.backgroundColor = '#262626';
    root.style.colorScheme = 'dark';
  }

  // Update mobile status bar theme color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isLight ? '#FAF8F5' : '#262626');
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return normalizeTheme(saved);
    } catch {
      return 'charcoal-navy';
    }
  });

  useEffect(() => {
    // Initial sync from DB if available
    db.settings.get(STORAGE_KEY_THEME).then((setting) => {
      if (setting && setting.value) {
        const normalized = normalizeTheme(setting.value);
        setThemeState(normalized);
        applyThemeToDOM(normalized);
      } else {
        applyThemeToDOM(theme);
      }
    }).catch(() => {
      applyThemeToDOM(theme);
    });

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
        applyThemeToDOM(customEvent.detail);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
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


