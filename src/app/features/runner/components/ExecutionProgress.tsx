'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ExecutionProgress as ProgressData } from '../lib/testExecution';
import { formatDuration } from '../lib/testExecution';
import { Activity, CheckCircle2, XCircle, Minus, LucideIcon } from 'lucide-react';

interface ExecutionProgressProps {
  progress: ProgressData;
  testName?: string;
  currentScenario?: string;
}

// Helper component for stat cards
function StatCard({
  value,
  label,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  delay = 0
}: {
  value: number;
  label: string;
  icon?: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="p-4 rounded-lg text-center"
      style={{
        backgroundColor: bgColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: borderColor,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {Icon ? (
        <div className="flex items-center justify-center mb-1">
          <Icon className="w-4 h-4 mr-2" style={{ color }} />
          <span className="text-2xl font-bold" style={{ color }}>
            {value}
          </span>
        </div>
      ) : (
        <div className="text-2xl font-bold mb-1" style={{ color }}>
          {value}
        </div>
      )}
      <div className="text-xs" style={{ color }}>
        {label}
      </div>
    </motion.div>
  );
}

/**
 * UI Improvement 1: Live test execution progress visualization
 * - Animated progress bar with gradient
 * - Real-time statistics (passed/failed/skipped)
 * - Elapsed time counter
 * - Visual status indicators
 */
export function ExecutionProgress({ progress, testName, currentScenario }: ExecutionProgressProps) {
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
        {/* Test Suite Display */}
        {testName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: `${currentTheme.colors.primary}15`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: `${currentTheme.colors.primary}40`,
            }}
          >
            <div className="text-xs font-medium mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
              Test Suite:
            </div>
            <div className="text-base font-semibold" style={{ color: currentTheme.colors.text.primary }}>
              {testName}
            </div>
          </motion.div>
        )}

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
              <div className="relative">
                <Activity className="w-4 h-4 animate-pulse" style={{ color: currentTheme.colors.accent }} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5" style={{ color: currentTheme.colors.text.tertiary }}>
                  Currently Running:
                </div>
                <div className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                  {currentScenario}
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
            <StatCard
              value={progress.total}
              label="Total"
              color={currentTheme.colors.text.primary}
              bgColor={currentTheme.colors.surface}
              borderColor={currentTheme.colors.border}
              delay={0}
            />
            <StatCard
              value={progress.passed}
              label="Passed"
              icon={CheckCircle2}
              color="#22c55e"
              bgColor="#22c55e10"
              borderColor="#22c55e30"
              delay={0.05}
            />
            <StatCard
              value={progress.failed}
              label="Failed"
              icon={XCircle}
              color="#ef4444"
              bgColor="#ef444410"
              borderColor="#ef444430"
              delay={0.1}
            />
            <StatCard
              value={progress.skipped}
              label="Skipped"
              icon={Minus}
              color={currentTheme.colors.text.tertiary}
              bgColor={`${currentTheme.colors.text.tertiary}10`}
              borderColor={`${currentTheme.colors.text.tertiary}30`}
              delay={0.15}
            />
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
