'use client';

import { Bot, Play, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { ThemedButton } from '@/components/ui/ThemedButton';

export function Header() {
  const { currentTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md"
      style={{
        borderBottom: `1px solid ${currentTheme.colors.border}`,
        background: `${currentTheme.colors.surface}cc`,
      }}
    >
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              background: `${currentTheme.colors.primary}20`,
              borderColor: `${currentTheme.colors.primary}40`,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <Bot className="h-6 w-6" style={{ color: currentTheme.colors.accent }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
            Pathfinder
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
