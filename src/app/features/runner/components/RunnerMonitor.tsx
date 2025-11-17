'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ExecutionProgress } from './ExecutionProgress';
import { RunnerScenarios } from './RunnerScenarios';
import { Play } from 'lucide-react';
import type { ExecutionProgress as ProgressData } from '../lib/executionUtils';
import type { TestScenario } from '@/lib/types';

type ExecutionState = 'idle' | 'running' | 'completed' | 'failed';

interface RunnerMonitorProps {
  executionState: ExecutionState;
  progress: ProgressData;
  screenshots: string[];
  selectedSuiteName?: string;
  scenarios: TestScenario[];
  currentScenario?: string;
  canStart: boolean;
  onStartExecution: () => void;
  onAddToQueue: () => void;
  onAbortExecution?: () => void;
}

export function RunnerMonitor({
  executionState,
  progress,
  screenshots,
  selectedSuiteName,
  scenarios,
  currentScenario,
  canStart,
  onStartExecution,
  onAddToQueue,
  onAbortExecution,
}: RunnerMonitorProps) {
  const { currentTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Scenario List - Always visible */}
      <RunnerScenarios scenarios={scenarios} selectedSuiteName={selectedSuiteName} />

      {/* Idle State */}
      {executionState === 'idle' && (
        <div className="h-full space-y-6">
          {/* Ready to Run */}
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                style={{
                  backgroundColor: `${currentTheme.colors.primary}10`,
                  borderWidth: '2px',
                  borderStyle: 'dashed',
                  borderColor: currentTheme.colors.primary,
                }}
              >
                <Play className="w-10 h-10" style={{ color: currentTheme.colors.primary }} />
              </div>
              <p className="text-lg font-medium" style={{ color: currentTheme.colors.text.primary }}>
                Ready to Run Tests
              </p>
              <p style={{ color: currentTheme.colors.text.tertiary }}>
                {!selectedSuiteName
                  ? 'Select a test suite to begin'
                  : scenarios.length === 0
                  ? 'No scenarios found for this suite'
                  : 'Click Start to begin execution'}
              </p>
              <div className="flex gap-3">
                <ThemedButton
                  variant="primary"
                  size="lg"
                  onClick={onStartExecution}
                  disabled={!canStart}
                  leftIcon={<Play className="w-5 h-5" />}
                  data-testid="start-execution-btn"
                >
                  Start Now
                </ThemedButton>
                <ThemedButton
                  variant="secondary"
                  size="lg"
                  onClick={onAddToQueue}
                  disabled={!canStart}
                  data-testid="add-to-queue-btn"
                >
                  Add to Queue
                </ThemedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Running State */}
      {executionState === 'running' && (
        <ExecutionProgress
          progress={progress}
          testName={selectedSuiteName}
          currentScenario={currentScenario}
          onAbort={onAbortExecution}
        />
      )}

      {/* Completed and Failed states are now handled in RealRunner */}
    </div>
  );
}
