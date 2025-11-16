import { TestSuite, ConsoleLog } from '@/lib/types';

export interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  enabled: boolean;
}

export interface ExecutionProgress {
  current: number;
  total: number;
  percentage: number;
  passed: number;
  failed: number;
  skipped: number;
  elapsedTime: number;
}

export interface TestResult {
  status: string;
  viewport: string;
  durationMs: number;
  consoleLogs?: Array<{ type: string; message: string; timestamp?: string }>;
  errors?: Array<{ message: string; stack?: string }>;
  screenshots?: string[];
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  viewport: string;
  viewportSize: string;
  status: 'pass' | 'fail' | 'skipped';
  durationMs: number;
  startedAt: string;
  completedAt: string;
  screenshots: string[];
  consoleLogs: any[];
  errors: any[];
  stepResults: any[];
}

export interface ExecutionCallbacks {
  setExecutionState: (state: 'idle' | 'running' | 'completed' | 'failed') => void;
  setTestRunId: (id: string | null) => void;
  setConsoleLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>;
  setScreenshots: React.Dispatch<React.SetStateAction<string[]>>;
  setProgress: React.Dispatch<React.SetStateAction<ExecutionProgress>>;
  setScenarioResults?: (results: ScenarioResult[]) => void;
}

/**
 * Convert viewport configurations to API format
 */
export function convertViewportsToAPIFormat(viewports: ViewportConfig[]) {
  return viewports.map(v => ({
    mobile: v.name.includes('iPhone') || v.name.includes('Mobile') ? { width: v.width, height: v.height } : undefined,
    tablet: v.name.includes('iPad') || v.name.includes('Tablet') ? { width: v.width, height: v.height } : undefined,
    desktop: v.name.includes('Desktop') ? { width: v.width, height: v.height } : undefined,
  }));
}

/**
 * Execute a test suite with the given viewports
 */
export async function executeTestSuite(
  selectedSuite: TestSuite,
  enabledViewports: ViewportConfig[],
  callbacks: ExecutionCallbacks
): Promise<void> {
  const { setExecutionState, setTestRunId, setConsoleLogs, setScreenshots, setProgress, setScenarioResults } = callbacks;

  if (enabledViewports.length === 0) {
    alert('Please select at least one viewport');
    return;
  }

  setExecutionState('running');
  setConsoleLogs([
    {
      type: 'info',
      message: `Starting test execution for suite: ${selectedSuite.name}`,
      timestamp: new Date().toISOString(),
    },
    {
      type: 'info',
      message: `Target URL: ${selectedSuite.target_url}`,
      timestamp: new Date().toISOString(),
    },
    {
      type: 'info',
      message: `Viewports: ${enabledViewports.map(v => v.name).join(', ')}`,
      timestamp: new Date().toISOString(),
    },
  ]);
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
    const viewportConfigs = convertViewportsToAPIFormat(enabledViewports);

    // Call scenario execution API
    const response = await fetch('/api/playwright/execute-scenarios', {
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

    const passed = result.summary.passed;
    const failed = result.summary.failed;

    // Store scenario results for the report
    if (setScenarioResults && result.results) {
      setScenarioResults(result.results);
    }

    // Collect all screenshots from all scenario results
    const allScreenshots: string[] = [];
    result.results.forEach((r: ScenarioResult) => {
      if (r.screenshots && r.screenshots.length > 0) {
        allScreenshots.push(...r.screenshots);
      }
    });
    setScreenshots(allScreenshots);

    // Log each scenario result with detailed information
    result.results.forEach((r: ScenarioResult, index: number) => {
      // Add scenario result summary
      setConsoleLogs(prev => [
        ...prev,
        {
          type: r.status === 'fail' ? 'error' : 'info',
          message: `[${r.scenarioName}] ${r.viewport}: ${r.status.toUpperCase()} (${r.durationMs}ms)`,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Add step results summary
      if (r.stepResults && r.stepResults.length > 0) {
        const failedSteps = r.stepResults.filter(sr => sr.status === 'fail');
        if (failedSteps.length > 0) {
          setConsoleLogs(prev => [
            ...prev,
            {
              type: 'warn',
              message: `  [${r.scenarioName}] ${failedSteps.length} step(s) failed`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }

      // Add console logs from Playwright
      if (r.consoleLogs && r.consoleLogs.length > 0) {
        // Only add first 5 logs to avoid cluttering
        r.consoleLogs.slice(0, 5).forEach((log) => {
          const logType = log.type as 'info' | 'log' | 'warn' | 'error' | undefined;
          setConsoleLogs(prev => [
            ...prev,
            {
              type: logType || 'log',
              message: `  [${r.scenarioName}] ${log.message}`,
              timestamp: log.timestamp || new Date().toISOString(),
            },
          ]);
        });
      }

      // Add errors from Playwright
      if (r.errors && r.errors.length > 0) {
        r.errors.forEach((error) => {
          setConsoleLogs(prev => [
            ...prev,
            {
              type: 'error',
              message: `  [${r.scenarioName}] ERROR: ${error.message}`,
              timestamp: new Date().toISOString(),
            },
          ]);
        });
      }
    });

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
        type: failed > 0 ? 'error' : 'info',
        message: `Test execution completed. ${passed} passed, ${failed} failed.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (error: unknown) {
    // Execution error - silently handle
    const errorMessage = error instanceof Error ? error.message : 'Test execution failed';
    setExecutionState('failed');
    setConsoleLogs(prev => [
      ...prev,
      {
        type: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
  }
}

/**
 * Reset execution state to initial values
 */
export function createResetExecutionHandler(callbacks: {
  setExecutionState: (state: 'idle' | 'running' | 'completed' | 'failed') => void;
  setTestRunId: (id: string | null) => void;
  setConsoleLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>;
  setScreenshots: React.Dispatch<React.SetStateAction<string[]>>;
  setProgress: React.Dispatch<React.SetStateAction<ExecutionProgress>>;
}) {
  return () => {
    callbacks.setExecutionState('idle');
    callbacks.setTestRunId(null);
    callbacks.setConsoleLogs([]);
    callbacks.setScreenshots([]);
    callbacks.setProgress({
      current: 0,
      total: 0,
      percentage: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      elapsedTime: 0,
    });
  };
}
