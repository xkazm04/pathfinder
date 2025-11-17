'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ExecutionProgress as ProgressData } from '../lib/testExecution';
import { formatDuration } from '../lib/testExecution';
import { Activity, CheckCircle2, XCircle, Minus, Clock, StopCircle } from 'lucide-react';

interface ExecutionProgressProps {
  progress: ProgressData;
  testName?: string;
  currentScenario?: string;
  onAbort?: () => void;
}

export function ExecutionProgress({ progress, testName, currentScenario, onAbort }: ExecutionProgressProps) {
  const { currentTheme } = useTheme();

  const getProgressColor = () => {
    if (progress.failed > 0) {
      return '#ef4444';
    }
    return currentTheme.colors.primary;
  };

  const isRunning = progress.percentage < 100;

  return (
    <ThemedCard variant="glow">
      <div className="flex items-center justify-between p-6 pb-0">
        <ThemedCardHeader
          title={testName || 'Test Execution'}
          subtitle={`${progress.current} of ${progress.total} tests`}
          icon={<Activity className="w-5 h-5" />}
        />
        {onAbort && isRunning && (
          <ThemedButton
            variant="secondary"
            size="sm"
            onClick={onAbort}
            leftIcon={<StopCircle className="w-4 h-4" />}
            data-testid="abort-test-btn"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
          >
            Abort Test
          </ThemedButton>
        )}
      </div>
      <ThemedCardContent>
        {/* Current Scenario Display */}
        {currentScenario && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: `${currentTheme.colors.accent}15`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: `${currentTheme.colors.accent}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" style={{ color: currentTheme.colors.accent }} />
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                  Currently Running:
                </div>
                <div className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                  {currentScenario}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Bar - Only show during execution */}
        {isRunning && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: currentTheme.colors.text.secondary }}>
                Progress
              </span>
              <span className="text-lg font-bold" style={{ color: currentTheme.colors.text.primary }}>
                {progress.percentage}%
              </span>
            </div>
            <div
              className="relative h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: `${currentTheme.colors.border}40` }}
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
        )}

        {/* Compact Stats Panel */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ backgroundColor: currentTheme.colors.surface }}>
          {/* Passed */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
            <div>
              <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
                {progress.passed}
              </div>
              <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Passed
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10" style={{ backgroundColor: currentTheme.colors.border }} />

          {/* Failed */}
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
            <div>
              <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
                {progress.failed}
              </div>
              <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Failed
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10" style={{ backgroundColor: currentTheme.colors.border }} />

          {/* Skipped */}
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />
            <div>
              <div className="text-lg font-bold" style={{ color: currentTheme.colors.text.secondary }}>
                {progress.skipped}
              </div>
              <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Skipped
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10" style={{ backgroundColor: currentTheme.colors.border }} />

          {/* Elapsed Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
            <div>
              <motion.div
                className="text-lg font-bold font-mono"
                style={{ color: currentTheme.colors.accent }}
                key={progress.elapsedTime}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {formatDuration(progress.elapsedTime)}
              </motion.div>
              <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Elapsed
              </div>
            </div>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
