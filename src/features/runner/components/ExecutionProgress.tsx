'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ExecutionProgress as ProgressData } from '../lib/testExecution';
import { formatDuration } from '../lib/testExecution';
import { Activity, CheckCircle2, XCircle, Minus } from 'lucide-react';

interface ExecutionProgressProps {
  progress: ProgressData;
}

/**
 * UI Improvement 1: Live test execution progress visualization
 * - Animated progress bar with gradient
 * - Real-time statistics (passed/failed/skipped)
 * - Elapsed time counter
 * - Visual status indicators
 */
export function ExecutionProgress({ progress }: ExecutionProgressProps) {
  const { currentTheme } = useTheme();

  const getProgressColor = () => {
    if (progress.failed > 0) {
      return '#ef4444';
    }
    return currentTheme.colors.primary;
  };

  return (
    <ThemedCard variant="glow">
      <ThemedCardHeader
        title="Test Execution"
        subtitle={`${progress.current} of ${progress.total} tests completed`}
        icon={<Activity className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="mt-4 space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: currentTheme.colors.text.secondary }}>
                Progress
              </span>
              <span className="text-lg font-bold" style={{ color: currentTheme.colors.text.primary }}>
                {progress.percentage}%
              </span>
            </div>
            <div
              className="relative h-4 rounded-full overflow-hidden"
              style={{ backgroundColor: currentTheme.colors.surface }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${getProgressColor()}, ${currentTheme.colors.accent})`,
                  boxShadow: `0 0 12px ${getProgressColor()}60`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total */}
            <motion.div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: currentTheme.colors.text.primary }}>
                {progress.total}
              </div>
              <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Total
              </div>
            </motion.div>

            {/* Passed */}
            <motion.div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: `#22c55e10`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#22c55e30',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <div className="flex items-center justify-center mb-1">
                <CheckCircle2 className="w-4 h-4 mr-2" style={{ color: '#22c55e' }} />
                <span className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                  {progress.passed}
                </span>
              </div>
              <div className="text-xs" style={{ color: '#22c55e' }}>
                Passed
              </div>
            </motion.div>

            {/* Failed */}
            <motion.div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: `#ef444410`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#ef444430',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center justify-center mb-1">
                <XCircle className="w-4 h-4 mr-2" style={{ color: '#ef4444' }} />
                <span className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                  {progress.failed}
                </span>
              </div>
              <div className="text-xs" style={{ color: '#ef4444' }}>
                Failed
              </div>
            </motion.div>

            {/* Skipped */}
            <motion.div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: `${currentTheme.colors.text.tertiary}10`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `${currentTheme.colors.text.tertiary}30`,
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <div className="flex items-center justify-center mb-1">
                <Minus className="w-4 h-4 mr-2" style={{ color: currentTheme.colors.text.tertiary }} />
                <span className="text-2xl font-bold" style={{ color: currentTheme.colors.text.tertiary }}>
                  {progress.skipped}
                </span>
              </div>
              <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Skipped
              </div>
            </motion.div>
          </div>

          {/* Elapsed Time */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                Elapsed Time
              </div>
              <motion.div
                className="text-2xl font-mono font-bold"
                style={{ color: currentTheme.colors.accent }}
                key={progress.elapsedTime}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {formatDuration(progress.elapsedTime)}
              </motion.div>
            </div>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
