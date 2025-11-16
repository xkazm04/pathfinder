'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { TestSuiteSelector } from './components/TestSuiteSelector';
import { ViewportConfigurator } from './components/ViewportConfigurator';
import { LiveLogsPanel } from './components/LiveLogsPanel';
import { RunHistoryPanel } from './components/RunHistoryPanel';
import { DemoBanner } from './components/DemoBanner';
import { QueuePanel } from './components/QueuePanel';
import { RunnerMonitor } from './components/RunnerMonitor';
import { TestSuite, ConsoleLog, TestScenario } from '@/lib/types';
import { useRunQueue } from '@/hooks/useRunQueue';
import { QueueBadge } from '@/components/ui/QueueBadge';
import { VIEWPORTS } from '@/lib/config';
import { useNavigation } from '@/lib/stores/appStore';
import { motion } from 'framer-motion';
import { getTestScenarios } from '@/lib/supabase/suiteAssets';
import type { ScenarioResult } from '@/lib/supabase/scenarioResults';
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
} from './lib/executionUtils';

type ExecutionState = 'idle' | 'running' | 'completed' | 'failed';

export function RealRunner() {
  const { currentTheme } = useTheme();
  const { navigateTo, setReportId } = useNavigation();
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
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);

  // Queue management
  const { stats: queueStats, addJob } = useRunQueue({ suiteId: selectedSuite?.id });

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
    });
  };

  const resetExecution = () => {
    createResetExecutionHandler({
      setExecutionState,
      setTestRunId,
      setConsoleLogs,
      setScreenshots,
      setProgress,
    })();

    // Reset timer-related state and scenario results
    setExecutionStartTime(null);
    setCurrentScenarioName(null);
    setScenarioResults([]);
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

  const canStart = selectedSuite && viewports.some(v => v.enabled) && executionState === 'idle';

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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Test Runner
            </h1>
            <p className="text-lg" style={{ color: currentTheme.colors.text.tertiary }}>
              Execute Playwright tests across multiple viewports
            </p>
          </div>
          <QueueBadge stats={queueStats} />
        </div>
      </motion.div>

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
            scenarioResults={scenarioResults}
            currentScenario={currentScenarioName || undefined}
            testRunId={testRunId || undefined}
            canStart={canStart}
            onStartExecution={startExecution}
            onAddToQueue={addToQueue}
            onResetExecution={resetExecution}
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

      {/* Bottom Panel - Live Logs */}
      <LiveLogsPanel logs={consoleLogs} />
    </div>
  );
}
