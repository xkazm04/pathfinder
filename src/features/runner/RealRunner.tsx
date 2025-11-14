'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestSuiteSelector } from './components/TestSuiteSelector';
import { ViewportConfigurator } from './components/ViewportConfigurator';
import { ExecutionProgress } from './components/ExecutionProgress';
import { LiveLogsPanel } from './components/LiveLogsPanel';
import { TestSuite, ConsoleLog } from '@/lib/types';
import { VIEWPORTS } from '@/lib/config';
import { Play, StopCircle, CheckCircle2, XCircle } from 'lucide-react';

interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  enabled: boolean;
}

type ExecutionState = 'idle' | 'running' | 'completed' | 'failed';

export function RealRunner() {
  const { currentTheme } = useTheme();
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [viewports, setViewports] = useState<ViewportConfig[]>([
    { id: 'mobile_small', name: VIEWPORTS.mobile_small.name, width: VIEWPORTS.mobile_small.width, height: VIEWPORTS.mobile_small.height, enabled: true },
    { id: 'mobile_large', name: VIEWPORTS.mobile_large.name, width: VIEWPORTS.mobile_large.width, height: VIEWPORTS.mobile_large.height, enabled: true },
    { id: 'tablet', name: VIEWPORTS.tablet.name, width: VIEWPORTS.tablet.width, height: VIEWPORTS.tablet.height, enabled: true },
    { id: 'desktop', name: VIEWPORTS.desktop.name, width: VIEWPORTS.desktop.width, height: VIEWPORTS.desktop.height, enabled: false },
    { id: 'desktop_large', name: VIEWPORTS.desktop_large.name, width: VIEWPORTS.desktop_large.width, height: VIEWPORTS.desktop_large.height, enabled: false },
  ]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    elapsedTime: 0,
  });

  const startExecution = async () => {
    if (!selectedSuite) return;

    const enabledViewports = viewports.filter(v => v.enabled);
    if (enabledViewports.length === 0) {
      alert('Please select at least one viewport');
      return;
    }

    setExecutionState('running');
    setConsoleLogs([]);
    setProgress({
      current: 0,
      total: enabledViewports.length,
      percentage: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      elapsedTime: 0,
    });

    try {
      const startTime = Date.now();

      // Convert viewport configs to API format
      const viewportConfigs = enabledViewports.map(v => ({
        mobile: v.name.includes('iPhone') || v.name.includes('Mobile') ? { width: v.width, height: v.height } : undefined,
        tablet: v.name.includes('iPad') || v.name.includes('Tablet') ? { width: v.width, height: v.height } : undefined,
        desktop: v.name.includes('Desktop') ? { width: v.width, height: v.height } : undefined,
      }));

      // Call execution API
      const response = await fetch('/api/playwright/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suiteId: selectedSuite.id,
          viewports: viewportConfigs,
          screenshotOnEveryStep: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Test execution failed');
      }

      const result = await response.json();
      setTestRunId(result.testRunId);

      // Update progress based on results
      const passed = result.results.filter((r: any) => r.status === 'pass').length;
      const failed = result.results.filter((r: any) => r.status === 'fail').length;

      setProgress({
        current: result.results.length,
        total: result.results.length,
        percentage: 100,
        passed,
        failed,
        skipped: 0,
        elapsedTime: Date.now() - startTime,
      });

      setExecutionState(failed > 0 ? 'failed' : 'completed');

      // Add completion log
      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'info',
          message: `Test execution completed. ${passed} passed, ${failed} failed.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      console.error('Execution error:', error);
      setExecutionState('failed');
      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'error',
          message: error.message || 'Test execution failed',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const resetExecution = () => {
    setExecutionState('idle');
    setTestRunId(null);
    setConsoleLogs([]);
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

  const canStart = selectedSuite && viewports.some(v => v.enabled) && executionState === 'idle';

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
          Test Runner
        </h1>
        <p className="text-lg" style={{ color: currentTheme.colors.text.tertiary }}>
          Execute Playwright tests across multiple viewports
        </p>
      </motion.div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-3 space-y-6">
          <TestSuiteSelector selectedSuite={selectedSuite} onSelectSuite={setSelectedSuite} />
          <ViewportConfigurator selectedViewports={viewports} onViewportsChange={setViewports} />
        </div>

        {/* Center - Execution Monitor */}
        <div className="col-span-6 space-y-6">
          {executionState === 'idle' && (
            <div className="h-full flex items-center justify-center">
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
                  {!selectedSuite
                    ? 'Select a test suite to begin'
                    : !viewports.some(v => v.enabled)
                      ? 'Select at least one viewport'
                      : 'Click Start to begin execution'}
                </p>
                <ThemedButton
                  variant="primary"
                  size="lg"
                  onClick={startExecution}
                  disabled={!canStart}
                  leftIcon={<Play className="w-5 h-5" />}
                >
                  Start Execution
                </ThemedButton>
              </div>
            </div>
          )}

          {(executionState === 'running' || executionState === 'completed' || executionState === 'failed') && (
            <>
              <ExecutionProgress progress={progress} />

              {executionState === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-8 rounded-lg"
                  style={{
                    backgroundColor: '#22c55e10',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#22c55e30',
                  }}
                >
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#22c55e' }} />
                  <h3 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                    Tests Completed Successfully!
                  </h3>
                  <p style={{ color: currentTheme.colors.text.secondary }}>
                    {progress.passed} test{progress.passed !== 1 ? 's' : ''} passed
                  </p>
                  <ThemedButton variant="secondary" size="md" onClick={resetExecution} className="mt-4">
                    Run Again
                  </ThemedButton>
                </motion.div>
              )}

              {executionState === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-8 rounded-lg"
                  style={{
                    backgroundColor: '#ef444410',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#ef444430',
                  }}
                >
                  <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ef4444' }} />
                  <h3 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                    Some Tests Failed
                  </h3>
                  <p style={{ color: currentTheme.colors.text.secondary }}>
                    {progress.failed} test{progress.failed !== 1 ? 's' : ''} failed, {progress.passed} passed
                  </p>
                  <ThemedButton variant="secondary" size="md" onClick={resetExecution} className="mt-4">
                    Run Again
                  </ThemedButton>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Logs */}
        <div className="col-span-3">
          <LiveLogsPanel logs={consoleLogs} />
        </div>
      </div>
    </div>
  );
}
