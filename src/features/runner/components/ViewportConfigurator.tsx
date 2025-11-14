'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { VIEWPORTS } from '@/lib/config';
import { Monitor, Tablet, Smartphone, CheckSquare, Square } from 'lucide-react';

interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  enabled: boolean;
}

interface ViewportConfiguratorProps {
  selectedViewports: ViewportConfig[];
  onViewportsChange: (viewports: ViewportConfig[]) => void;
}

export function ViewportConfigurator({ selectedViewports, onViewportsChange }: ViewportConfiguratorProps) {
  const { currentTheme } = useTheme();

  const toggleViewport = (id: string) => {
    const updated = selectedViewports.map(v =>
      v.id === id ? { ...v, enabled: !v.enabled } : v
    );
    onViewportsChange(updated);
  };

  const selectAll = () => {
    const updated = selectedViewports.map(v => ({ ...v, enabled: true }));
    onViewportsChange(updated);
  };

  const deselectAll = () => {
    const updated = selectedViewports.map(v => ({ ...v, enabled: false }));
    onViewportsChange(updated);
  };

  const getIcon = (name: string) => {
    if (name.includes('Desktop')) return Monitor;
    if (name.includes('iPad') || name.includes('Tablet')) return Tablet;
    return Smartphone;
  };

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Viewport Configuration"
        subtitle={`${selectedViewports.filter(v => v.enabled).length} selected`}
        action={
          <div className="flex gap-2">
            <ThemedButton variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </ThemedButton>
            <ThemedButton variant="ghost" size="sm" onClick={deselectAll}>
              Deselect All
            </ThemedButton>
          </div>
        }
      />
      <ThemedCardContent>
        <div className="mt-4 space-y-2">
          {selectedViewports.map((viewport, index) => {
            const Icon = getIcon(viewport.name);
            return (
              <motion.button
                key={viewport.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => toggleViewport(viewport.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: viewport.enabled ? `${currentTheme.colors.primary}10` : currentTheme.colors.surface,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: viewport.enabled ? currentTheme.colors.primary : currentTheme.colors.border,
                }}
              >
                <div className="flex items-center gap-3">
                  {viewport.enabled ? (
                    <CheckSquare className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
                  ) : (
                    <Square className="w-5 h-5" style={{ color: currentTheme.colors.text.tertiary }} />
                  )}
                  <Icon className="w-4 h-4" style={{ color: currentTheme.colors.text.secondary }} />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                      {viewport.name}
                    </p>
                    <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                      {viewport.width} × {viewport.height}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
