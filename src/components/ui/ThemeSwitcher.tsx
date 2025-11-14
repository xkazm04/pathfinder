'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeVariant } from '@/lib/theme';

export function ThemeSwitcher() {
  const { themeId, setTheme, currentTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {Object.values(themes).map((theme) => {
        const isSelected = themeId === theme.id;

        return (
          <motion.button
            key={theme.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme.id)}
            className="relative rounded-full transition-all"
            style={{
              width: '32px',
              height: '32px',
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
              boxShadow: isSelected
                ? `0 0 0 2px ${currentTheme.colors.surface}, 0 0 0 4px ${theme.colors.primary}, ${theme.colors.glow}`
                : 'none',
              opacity: isSelected ? 1 : 0.6,
            }}
            title={theme.name}
            aria-label={`Switch to ${theme.name} theme`}
          >
            {isSelected && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-full"
                style={{
                  border: `2px solid ${theme.colors.accent}`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
