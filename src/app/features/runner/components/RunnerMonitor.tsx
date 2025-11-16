'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ExecutionProgress } from './ExecutionProgress';
import { ScenarioTestReport } from './ScenarioTestReport';
import { Play, CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { ExecutionProgress as ProgressData } from '../lib/executionUtils';
import type { TestScenario } from '@/lib/types';
import type { ScenarioResult } from '@/lib/supabase/scenarioResults';

type ExecutionState = 'idle' | 'running' | 'completed' | 'failed';

interface RunnerMonitorProps {
  executionState: ExecutionState;
  progress: ProgressData;
  screenshots: string[];
  selectedSuiteName?: string;
  scenarios: TestScenario[];
  scenarioResults?: ScenarioResult[];
  currentScenario?: string;
  testRunId?: string;
  canStart: boolean;
  onStartExecution: () => void;
  onAddToQueue: () => void;
  onResetExecution: () => void;
}

export function RunnerMonitor({
  executionState,
  progress,
  screenshots,
  selectedSuiteName,
  scenarios,
  scenarioResults,
  currentScenario,
  testRunId,
  canStart,
  onStartExecution,
  onAddToQueue,
  onResetExecution,
}: RunnerMonitorProps) {
  const { currentTheme } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return currentTheme.colors.text.tertiary;
      default:
        return currentTheme.colors.text.tertiary;
    }
  };

  return (
    <div className="space-y-6">
      {/* Idle State */}
      {executionState === 'idle' && (
        <div className="h-full space-y-6">
          {/* Scenario List */}
          {scenarios.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                <h3 className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                  Test Scenarios ({scenarios.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scenarios.map((scenario, index) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 rounded"
                    style={{
                      backgroundColor: `${currentTheme.colors.primary}08`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `${currentTheme.colors.border}50`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: currentTheme.colors.text.primary }}>
                        {scenario.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: currentTheme.colors.text.tertiary }}>
                        {scenario.steps.length} step{scenario.steps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div
                      className="px-2 py-0.5 rounded text-xs font-medium ml-2"
                      style={{
                        backgroundColor: `${getPriorityColor(scenario.priority)}15`,
                        color: getPriorityColor(scenario.priority),
                      }}
                    >
                      {scenario.priority}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

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

      {/* Running, Completed, or Failed States */}
      {(executionState === 'running' || executionState === 'completed' || executionState === 'failed') && (
        <>
          <ExecutionProgress
            progress={progress}
            testName={selectedSuiteName}
            currentScenario={executionState === 'running' ? currentScenario : undefined}
          />

          {/* Completed State */}
          {executionState === 'completed' && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-6 rounded-lg mb-4"
                style={{
                  backgroundColor: '#22c55e10',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#22c55e30',
                }}
              >
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#22c55e' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  Tests Completed Successfully!
                </h3>
                <p style={{ color: currentTheme.colors.text.secondary }}>
                  {progress.passed} test{progress.passed !== 1 ? 's' : ''} passed
                </p>
                <ThemedButton
                  variant="secondary"
                  size="md"
                  onClick={onResetExecution}
                  className="mt-4"
                  data-testid="run-again-btn"
                >
                  Run Again
                </ThemedButton>
              </motion.div>

              {/* Comprehensive Test Report */}
              {scenarioResults && scenarioResults.length > 0 && (
                <ScenarioTestReport scenarioResults={scenarioResults} testRunId={testRunId} />
              )}
            </>
          )}

          {/* Failed State */}
          {executionState === 'failed' && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-6 rounded-lg mb-4"
                style={{
                  backgroundColor: '#ef444410',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#ef444430',
                }}
              >
                <XCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#ef4444' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  Some Tests Failed
                </h3>
                <p style={{ color: currentTheme.colors.text.secondary }}>
                  {progress.failed} test{progress.failed !== 1 ? 's' : ''} failed, {progress.passed} passed
                </p>
                <ThemedButton
                  variant="secondary"
                  size="md"
                  onClick={onResetExecution}
                  className="mt-4"
                  data-testid="run-again-failed-btn"
                >
                  Run Again
                </ThemedButton>
              </motion.div>

              {/* Comprehensive Test Report */}
              {scenarioResults && scenarioResults.length > 0 && (
                <ScenarioTestReport scenarioResults={scenarioResults} testRunId={testRunId} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
