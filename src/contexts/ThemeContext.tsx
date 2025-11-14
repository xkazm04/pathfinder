'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ThemeVariant, Theme, themes } from '@/lib/theme';

interface ThemeContextType {
  currentTheme: Theme;
  themeId: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeVariant>('cyber');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pathfinder-theme') as ThemeVariant;
    if (savedTheme && themes[savedTheme]) {
      setThemeId(savedTheme);
    }
  }, []);

  const setTheme = (theme: ThemeVariant) => {
    setThemeId(theme);
    localStorage.setItem('pathfinder-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme: themes[themeId], themeId, setTheme }}>
      <div data-theme={themeId} className="min-h-screen transition-colors duration-300">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
