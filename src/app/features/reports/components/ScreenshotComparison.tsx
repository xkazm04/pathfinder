'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Image, SplitSquareHorizontal, Check, X } from 'lucide-react';

interface ScreenshotComparisonProps {
  testName: string;
  viewport: string;
  hasVisualDiff?: boolean;
}

/**
 * UI Improvement 1: Interactive visual regression comparison
 * - Side-by-side view of baseline vs current screenshots
 * - Diff highlighting overlay
 * - Toggle between comparison modes
 * - Visual indicators for changes detected
 */
export function ScreenshotComparison({ testName, viewport, hasVisualDiff = false }: ScreenshotComparisonProps) {
  const { currentTheme } = useTheme();
  const [viewMode, setViewMode] = useState<'side-by-side' | 'diff' | 'overlay'>('side-by-side');

  // Mock screenshot placeholders
  const baselineColor = currentTheme.colors.surface;
  const currentColor = hasVisualDiff ? '#ef444420' : '#22c55e20';
  const diffColor = hasVisualDiff ? '#ef4444' : currentTheme.colors.border;

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title={`${testName} - ${viewport}`}
        subtitle="Visual comparison"
        icon={<Image className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('side-by-side')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: viewMode === 'side-by-side' ? currentTheme.colors.primary : currentTheme.colors.surface,
                color: viewMode === 'side-by-side' ? '#ffffff' : currentTheme.colors.text.secondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              Side-by-side
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: viewMode === 'diff' ? currentTheme.colors.primary : currentTheme.colors.surface,
                color: viewMode === 'diff' ? '#ffffff' : currentTheme.colors.text.secondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              Diff
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                backgroundColor: viewMode === 'overlay' ? currentTheme.colors.primary : currentTheme.colors.surface,
                color: viewMode === 'overlay' ? '#ffffff' : currentTheme.colors.text.secondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              Overlay
            </button>
          </div>
        }
      />
      <ThemedCardContent>
        <div className="mt-4">
          {/* Status Banner */}
          {hasVisualDiff && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: '#ef444410',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#ef444430',
              }}
            >
              <X className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                  Visual differences detected
                </p>
                <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                  The current screenshot differs from the baseline by 3.2%
                </p>
              </div>
            </motion.div>
          )}

          {!hasVisualDiff && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: '#22c55e10',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#22c55e30',
              }}
            >
              <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                  No visual differences
                </p>
                <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                  Current screenshot matches the baseline
                </p>
              </div>
            </motion.div>
          )}

          {/* Screenshot Comparison View */}
          <div className="rounded-lg overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
            }}
          >
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-2 gap-0">
                {/* Baseline */}
                <div>
                  <div className="p-2 text-center text-xs font-medium"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text.secondary,
                      borderBottomWidth: '1px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: currentTheme.colors.border,
                    }}
                  >
                    Baseline
                  </div>
                  <div className="aspect-video flex items-center justify-center"
                    style={{ backgroundColor: baselineColor }}
                  >
                    <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                      Screenshot placeholder
                    </span>
                  </div>
                </div>

                {/* Current */}
                <div style={{ borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: currentTheme.colors.border }}>
                  <div className="p-2 text-center text-xs font-medium"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text.secondary,
                      borderBottomWidth: '1px',
                      borderBottomStyle: 'solid',
                      borderBottomColor: currentTheme.colors.border,
                    }}
                  >
                    Current
                  </div>
                  <div className="aspect-video flex items-center justify-center"
                    style={{ backgroundColor: currentColor }}
                  >
                    <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                      Screenshot placeholder
                    </span>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'diff' && (
              <div>
                <div className="p-2 text-center text-xs font-medium"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: currentTheme.colors.border,
                  }}
                >
                  Difference Highlight
                </div>
                <div className="aspect-video flex items-center justify-center relative"
                  style={{ backgroundColor: baselineColor }}
                >
                  <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                    Diff overlay placeholder
                  </span>
                  {hasVisualDiff && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      className="absolute inset-0"
                      style={{
                        background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${diffColor}30 10px, ${diffColor}30 20px)`,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {viewMode === 'overlay' && (
              <div>
                <div className="p-2 text-center text-xs font-medium"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: currentTheme.colors.border,
                  }}
                >
                  Overlay Comparison
                </div>
                <div className="aspect-video flex items-center justify-center relative"
                  style={{ backgroundColor: baselineColor }}
                >
                  <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                    Overlay view placeholder
                  </span>
                  <motion.div
                    className="absolute inset-0"
                    style={{ backgroundColor: currentColor }}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
