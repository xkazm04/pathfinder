'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestSuiteCard } from './components/TestSuiteCard';
import { ExecutionProgress } from './components/ExecutionProgress';
import { TestStepsList } from './components/TestStepsList';
import { mockTestSuites, TestExecutionStep, generateMockSteps } from './lib/mockData';
import { simulateTestExecution, ExecutionProgress as ProgressData } from './lib/testExecution';
import { PlayCircle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

type ExecutionState = 'idle' | 'running' | 'completed';

export function Runner() {
  const { currentTheme } = useTheme();
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [steps, setSteps] = useState<TestExecutionStep[]>([]);
  const [progress, setProgress] = useState<ProgressData>({
    current: 0,
    total: 0,
    percentage: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    elapsedTime: 0,
  });
  const [executionSuccess, setExecutionSuccess] = useState<boolean>(false);

  const handleRunTests = async (suiteId: string) => {
    const suite = mockTestSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setSelectedSuiteId(suiteId);
    setExecutionState('running');

    // Generate test steps
    const testSteps = generateMockSteps(suite.testCount);
    setSteps(testSteps);
    setProgress({
      current: 0,
      total: testSteps.length,
      percentage: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      elapsedTime: 0,
    });

    // Start execution simulation
    await simulateTestExecution(
      testSteps,
      (updatedSteps, updatedProgress) => {
        setSteps(updatedSteps);
        setProgress(updatedProgress);
      },
      (finalSteps, success) => {
        setSteps(finalSteps);
        setExecutionSuccess(success);
        setExecutionState('completed');
      }
    );
  };

  const handleReset = () => {
    setExecutionState('idle');
    setSelectedSuiteId(null);
    setSteps([]);
    setProgress({
      current: 0,
      total: 0,
      percentage: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      elapsedTime: 0,
    });
  };

  const selectedSuite = mockTestSuites.find(s => s.id === selectedSuiteId);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
          Test Runner
        </h1>
        <p className="text-lg" style={{ color: currentTheme.colors.text.tertiary }}>
          Execute and monitor your Playwright tests
        </p>
      </motion.div>

      {/* Idle State - Test Suite Selection */}
      {executionState === 'idle' && (
        <div className="space-y-6">
          <ThemedCard variant="glow">
            <ThemedCardHeader
              title="Available Test Suites"
              subtitle={`${mockTestSuites.length} suite${mockTestSuites.length !== 1 ? 's' : ''} ready to run`}
              icon={<PlayCircle className="w-5 h-5" />}
            />
            <ThemedCardContent>
              <div className="mt-4 grid gap-4">
                {mockTestSuites.map((suite) => (
                  <TestSuiteCard
                    key={suite.id}
                    suite={suite}
                    onRun={handleRunTests}
                  />
                ))}
              </div>
            </ThemedCardContent>
          </ThemedCard>
        </div>
      )}

      {/* Running State */}
      {executionState === 'running' && selectedSuite && (
        <div className="space-y-6">
          {/* Suite Info */}
          <ThemedCard variant="bordered">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.colors.text.primary }}>
                    {selectedSuite.name}
                  </h2>
                  <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                    {selectedSuite.target_url}
                  </p>
                </div>
                <div
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: `${currentTheme.colors.accent}15`,
                    color: currentTheme.colors.accent,
                  }}
                >
                  Running...
                </div>
              </div>
            </div>
          </ThemedCard>

          {/* UI Improvement 1: Execution Progress */}
          <ExecutionProgress progress={progress} />

          {/* UI Improvement 2: Test Steps List */}
          <TestStepsList steps={steps} />
        </div>
      )}

      {/* Completed State */}
      {executionState === 'completed' && selectedSuite && (
        <div className="space-y-6">
          {/* Success/Failure Card */}
          <ThemedCard variant="glow">
            <div className="p-8 text-center space-y-6">
              {executionSuccess ? (
                <>
                  <CheckCircle2 className="w-20 h-20 mx-auto" style={{ color: '#22c55e' }} />
                  <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                      All Tests Passed!
                    </h2>
                    <p className="text-lg" style={{ color: currentTheme.colors.text.secondary }}>
                      Test suite &quot;{selectedSuite.name}&quot; completed successfully
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 mx-auto" style={{ color: '#ef4444' }} />
                  <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                      Tests Failed
                    </h2>
                    <p className="text-lg" style={{ color: currentTheme.colors.text.secondary }}>
                      {progress.failed} test{progress.failed !== 1 ? 's' : ''} failed in &quot;{selectedSuite.name}&quot;
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-center gap-4">
                <ThemedButton variant="secondary" size="lg" onClick={handleReset} leftIcon={<RotateCcw className="w-5 h-5" />}>
                  Run Another Suite
                </ThemedButton>
                <ThemedButton
                  variant={executionSuccess ? 'primary' : 'ghost'}
                  size="lg"
                  onClick={() => handleRunTests(selectedSuite.id)}
                  leftIcon={<PlayCircle className="w-5 h-5" />}
                >
                  Run Again
                </ThemedButton>
              </div>
            </div>
          </ThemedCard>

          {/* Final Results */}
          <ExecutionProgress progress={progress} />
          <TestStepsList steps={steps} />
        </div>
      )}
    </div>
  );
}
