'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeVariant } from '@/lib/theme';
import { Check, Palette } from 'lucide-react';
import { useState } from 'react';

export function ThemeSwitcher() {
  const { themeId, setTheme, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
          borderColor: currentTheme.colors.border,
          borderWidth: '1px',
          borderStyle: 'solid',
          color: currentTheme.colors.text.primary,
        }}
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm">Theme: {currentTheme.name}</span>
      </motion.button>

      {/* Theme Selector Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-full mt-2 right-0 z-50 w-96 rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.surface}ee, ${currentTheme.colors.surface}dd)`,
                borderColor: currentTheme.colors.border,
                borderWidth: '2px',
                borderStyle: 'solid',
                backdropFilter: 'blur(10px)',
                boxShadow: `0 20px 40px ${currentTheme.colors.shadow}`,
              }}
            >
              <div className="p-4">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  Choose Your Visual Identity
                </h3>

                <div className="space-y-3">
                  {Object.values(themes).map((theme) => (
                    <ThemeOption
                      key={theme.id}
                      theme={theme}
                      isSelected={themeId === theme.id}
                      onSelect={() => {
                        setTheme(theme.id);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ThemeOptionProps {
  theme: typeof themes[ThemeVariant];
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeOption({ theme, isSelected, onSelect }: ThemeOptionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="w-full text-left p-4 rounded-lg transition-all"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}30)`
          : `${theme.colors.surface}80`,
        borderColor: isSelected ? theme.colors.borderHover : theme.colors.border,
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: isSelected ? theme.colors.glow : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className="text-base font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              {theme.name}
            </h4>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className="w-4 h-4" style={{ color: theme.colors.accent }} />
              </motion.div>
            )}
          </div>
          <p className="text-xs" style={{ color: theme.colors.text.tertiary }}>
            {theme.description}
          </p>
        </div>

        {/* Color preview */}
        <div className="flex-shrink-0 flex gap-1">
          <div
            className="w-6 h-6 rounded"
            style={{ background: theme.colors.primary }}
          />
          <div
            className="w-6 h-6 rounded"
            style={{ background: theme.colors.secondary }}
          />
          <div
            className="w-6 h-6 rounded"
            style={{ background: theme.colors.accent }}
          />
        </div>
      </div>

      {/* Preview decoration based on theme */}
      <div className="mt-3 h-1 rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.gradient.from}, ${theme.colors.gradient.via || theme.colors.gradient.to}, ${theme.colors.gradient.to})`,
        }}
      />
    </motion.button>
  );
}
