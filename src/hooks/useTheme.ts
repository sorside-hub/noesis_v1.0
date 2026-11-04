import { useState, useEffect } from 'react';
import { db } from '../lib/db';

export type ThemeMode = 'charcoal-navy' | 'editorial-light' | 'minimalist-ivory';
const STORAGE_KEY_THEME = 'noesis_theme_mode';
const THEME_CHANGE_EVENT = 'noesis_theme_changed';

export const normalizeTheme = (val?: string | null): ThemeMode => {
  if (val === 'charcoal-navy' || val === 'dark') {
    return 'charcoal-navy';
  }
  if (val === 'editorial-light' || val === 'light') {
    return 'editorial-light';
  }
  return 'minimalist-ivory';
};

export const applyThemeToDOM = (theme: ThemeMode = 'minimalist-ivory') => {
  const root = document.documentElement;
  
  if (theme === 'charcoal-navy') {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'charcoal-navy');
    root.style.backgroundColor = '#262626';
    root.style.colorScheme = 'dark';
  } else if (theme === 'editorial-light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'editorial-light');
    root.style.backgroundColor = '#FAF8F5';
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'minimalist-ivory');
    root.style.backgroundColor = '#F7F6F3';
    root.style.colorScheme = 'light';
  }

  // Update mobile status bar theme color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const themeBg = theme === 'charcoal-navy' ? '#262626' : theme === 'editorial-light' ? '#FAF8F5' : '#F7F6F3';
    metaTheme.setAttribute('content', themeBg);
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return normalizeTheme(saved);
    } catch {
      return 'minimalist-ivory';
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


