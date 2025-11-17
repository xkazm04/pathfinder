'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { supabase } from '@/lib/supabase';
import { TestSuiteSelector } from './components/TestSuiteSelector';
import { ViewportConfigurator } from './components/ViewportConfigurator';
import { LiveLogsPanel } from './components/LiveLogsPanel';
import { RunHistoryPanel } from './components/RunHistoryPanel';
import { DemoBanner } from './components/DemoBanner';
import { QueuePanel } from './components/QueuePanel';
import { RunnerMonitor } from './components/RunnerMonitor';
import { ScenarioTestReport } from './sub_RunnerReport/ScenarioTestReport';
import { TestSuite, ConsoleLog, TestScenario } from '@/lib/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { useRunQueue } from '@/hooks/useRunQueue';
import { VIEWPORTS } from '@/lib/config';
import { useNavigation } from '@/lib/stores/appStore';
import { getTestScenarios } from '@/lib/supabase/suiteAssets';
import {
  isFirstVisit,
  markAsVisited,
  generateDemoTestSuite,
  runDemoExecution,
  DEMO_RUN_ID,
} from './lib/demoRunner';
import {
  executeTestSuite,
  createResetExecutionHandler,
  type ViewportConfig,
  type ExecutionProgress,
  type ScenarioExecutionResult,
} from './lib/executionUtils';

type ExecutionState = 'idle' | 'running' | 'completed' | 'failed';

export function RealRunner() {
  const { currentTheme } = useTheme();
  const { navigateTo, setReportId } = useNavigation();
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [viewports, setViewports] = useState<ViewportConfig[]>([
    { id: 'mobile_large', name: VIEWPORTS.mobile_large.name, width: VIEWPORTS.mobile_large.width, height: VIEWPORTS.mobile_large.height, enabled: false },
    { id: 'tablet', name: VIEWPORTS.tablet.name, width: VIEWPORTS.tablet.width, height: VIEWPORTS.tablet.height, enabled: false },
    { id: 'desktop', name: VIEWPORTS.desktop.name, width: VIEWPORTS.desktop.width, height: VIEWPORTS.desktop.height, enabled: true },
  ]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [progress, setProgress] = useState<ExecutionProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    elapsedTime: 0,
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [currentScenarioName, setCurrentScenarioName] = useState<string | null>(null);
  const [scenarioResults, setScenarioResults] = useState<ScenarioExecutionResult[]>([]);

  // Queue management
  const { stats: queueStats, addJob } = useRunQueue({ suiteId: selectedSuite?.id });

  // Real-time test run progress subscription
  useEffect(() => {
    if (!testRunId || executionState !== 'running') {
      return;
    }

    const channel = supabase
      .channel(`test-run-${testRunId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'test_runs',
          filter: `id=eq.${testRunId}`,
        },
        (payload: any) => {
          const updated = payload.new;

          // Update progress
          setProgress({
            current: updated.current_scenario_index + 1 || 0,
            total: updated.total_scenarios || 0,
            percentage: updated.progress_percentage || 0,
            passed: updated.progress_data?.passed || 0,
            failed: updated.progress_data?.failed || 0,
            skipped: updated.progress_data?.skipped || 0,
            elapsedTime: updated.progress_data?.elapsedTime || 0,
          });

          // Update current scenario name
          if (updated.current_scenario) {
            setCurrentScenarioName(updated.current_scenario);
          }

          // Update logs
          if (updated.logs && Array.isArray(updated.logs)) {
            setConsoleLogs(updated.logs);
          }

          // Check if execution is complete
          if (updated.status === 'completed' || updated.status === 'failed') {
            setExecutionState(updated.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [testRunId, executionState]);

  // Live elapsed timer - updates every second during execution
  useEffect(() => {
    if (executionState === 'running' && executionStartTime) {
      const timer = setInterval(() => {
        setProgress((prev) => ({
          ...prev,
          elapsedTime: Date.now() - executionStartTime,
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [executionState, executionStartTime]);

  // Load scenarios when suite is selected
  useEffect(() => {
    if (selectedSuite) {
      loadScenarios();
    } else {
      setScenarios([]);
    }
  }, [selectedSuite]);

  const loadScenarios = async () => {
    if (!selectedSuite) return;
    try {
      const data = await getTestScenarios(selectedSuite.id);
      setScenarios(data);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      setScenarios([]);
    }
  };

  // Auto-start demo on first visit
  useEffect(() => {
    if (isFirstVisit()) {
      // Generate and set demo test suite
      const demoSuite = generateDemoTestSuite();
      setSelectedSuite(demoSuite);
      setIsDemoMode(true);
      setShowDemoBanner(true);

      // Auto-start demo execution after a brief delay
      const timer = setTimeout(() => {
        startDemoExecution();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const startDemoExecution = async () => {
    setExecutionState('running');
    setTestRunId(DEMO_RUN_ID);

    try {
      await runDemoExecution(
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        (logs) => {
          setConsoleLogs(logs);
        }
      );

      setExecutionState('completed');
    } catch (error) {
      // Demo execution error - silently handle
      setExecutionState('failed');
    }
  };

  const handleDismissBanner = () => {
    setShowDemoBanner(false);
    markAsVisited();
  };

  const handleCreateRealSuite = () => {
    setShowDemoBanner(false);
    markAsVisited();
    navigateTo('designer');
  };

  // Execution handlers
  const startExecution = async () => {
    if (!selectedSuite) return;
    const enabledViewports = viewports.filter(v => v.enabled);

    // Initialize execution start time for live timer
    setExecutionStartTime(Date.now());

    await executeTestSuite(selectedSuite, enabledViewports, {
      setExecutionState,
      setTestRunId,
      setConsoleLogs,
      setScreenshots,
      setProgress,
      setScenarioResults,
      setCurrentScenario: setCurrentScenarioName,
    });
  };

  const resetExecution = () => {
    createResetExecutionHandler({
      setExecutionState,
      setTestRunId,
      setConsoleLogs,
      setScreenshots,
      setProgress,
      setCurrentScenario: setCurrentScenarioName,
    })();

    // Reset timer-related state and scenario results
    setExecutionStartTime(null);
    setScenarioResults([]);
  };

  const abortExecution = async () => {
    if (!testRunId) return;

    try {
      // Update test run status to cancelled
      await fetch('/api/test-runs/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: testRunId }),
      });

      setExecutionState('failed');
      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'warn',
          message: 'Test execution aborted by user',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to abort execution:', error);
      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'error',
          message: `Failed to abort: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleRelaunch = (runId: string) => {
    // Reset execution state and start again
    resetExecution();
    // Could load the run config and use it, but for now just reset
    // to allow user to configure and start fresh
  };

  const handleViewDetails = (runId: string) => {
    // Navigate to reports page with this run ID
    setReportId(runId);
    navigateTo('reports');
  };

  const canStart = !!(selectedSuite && viewports.some(v => v.enabled) && executionState === 'idle');

  // Add to queue instead of immediate execution
  const addToQueue = async () => {
    if (!selectedSuite) return;

    const enabledViewports = viewports.filter(v => v.enabled);
    if (enabledViewports.length === 0) {
      alert('Please select at least one viewport');
      return;
    }

    try {
      // Convert viewport configs to API format
      const config = {
        mobile: enabledViewports.find(v => v.name.includes('iPhone') || v.name.includes('Mobile'))
          ? { width: enabledViewports[0].width, height: enabledViewports[0].height }
          : undefined,
        tablet: enabledViewports.find(v => v.name.includes('iPad') || v.name.includes('Tablet'))
          ? { width: enabledViewports[1].width, height: enabledViewports[1].height }
          : undefined,
        desktop: enabledViewports.find(v => v.name.includes('Desktop'))
          ? { width: enabledViewports[2]?.width || 1920, height: enabledViewports[2]?.height || 1080 }
          : undefined,
      };

      await addJob(selectedSuite.id, config, 0);

      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'info',
          message: `Added test to queue: ${selectedSuite.name}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error: unknown) {
      // Failed to add to queue - silently handle
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to queue';
      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'error',
          message: `Failed to add to queue: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <div className="p-8 pb-32">

      {/* Demo Banner */}
      {showDemoBanner && isDemoMode && (
        <DemoBanner onDismiss={handleDismissBanner} onCreateRealSuite={handleCreateRealSuite} />
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Viewport Configuration */}
        <div className="col-span-2">
          <ViewportConfigurator selectedViewports={viewports} onViewportsChange={setViewports} />
        </div>

        {/* Center - Execution Monitor */}
        <div className="col-span-6">
          <RunnerMonitor
            executionState={executionState}
            progress={progress}
            screenshots={screenshots}
            selectedSuiteName={selectedSuite?.name}
            scenarios={scenarios}
            currentScenario={currentScenarioName || undefined}
            canStart={canStart}
            onStartExecution={startExecution}
            onAddToQueue={addToQueue}
            onAbortExecution={abortExecution}
          />
        </div>

        {/* Right Column - Test Suite Selector, Queue Panel & Run History */}
        <div className="col-span-4 space-y-6">
          <TestSuiteSelector selectedSuite={selectedSuite} onSelectSuite={setSelectedSuite} />
          <QueuePanel suiteId={selectedSuite?.id} onViewRun={handleViewDetails} />
          <RunHistoryPanel
            suiteId={selectedSuite?.id}
            onRelaunch={handleRelaunch}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>

      {/* Completion Status Banner */}
      {(executionState === 'completed' || executionState === 'failed') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 rounded-lg text-center"
          style={{
            backgroundColor: executionState === 'completed' ? '#22c55e10' : '#ef444410',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: executionState === 'completed' ? '#22c55e30' : '#ef444430',
          }}
        >
          {executionState === 'completed' ? (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#22c55e' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                Tests Completed Successfully!
              </h3>
              <p style={{ color: currentTheme.colors.text.secondary }}>
                {progress.passed} test{progress.passed !== 1 ? 's' : ''} passed
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#ef4444' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                Some Tests Failed
              </h3>
              <p style={{ color: currentTheme.colors.text.secondary }}>
                {progress.failed} test{progress.failed !== 1 ? 's' : ''} failed, {progress.passed} passed
              </p>
            </>
          )}
          <ThemedButton
            variant="secondary"
            size="md"
            onClick={resetExecution}
            className="mt-4"
            data-testid="run-again-btn"
          >
            Run Again
          </ThemedButton>
        </motion.div>
      )}

      {/* Full-Width Test Results */}
      {scenarioResults && scenarioResults.length > 0 && (executionState === 'completed' || executionState === 'failed') && (
        <div className="mt-6">
          <ScenarioTestReport scenarioResults={scenarioResults} testRunId={testRunId || undefined} />
        </div>
      )}

      {/* Bottom Panel - Live Logs */}
      <LiveLogsPanel logs={consoleLogs} />
    </div>
  );
}
