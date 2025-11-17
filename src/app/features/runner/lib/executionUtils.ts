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
  currentScenario?: string;
}

export interface TestResult {
  status: string;
  viewport: string;
  durationMs: number;
  consoleLogs?: Array<{ type: string; message: string; timestamp?: string }>;
  errors?: Array<{ message: string; stack?: string }>;
  screenshots?: string[];
}

export interface ScenarioExecutionResult {
  id?: string;
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
  setScenarioResults?: (results: ScenarioExecutionResult[]) => void;
  setCurrentScenario?: (scenario: string | null) => void;
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
 * Execute a test suite with Server-Sent Events (SSE) for real-time progress
 */
export async function executeTestSuite(
  selectedSuite: TestSuite,
  enabledViewports: ViewportConfig[],
  callbacks: ExecutionCallbacks
): Promise<void> {
  const {
    setExecutionState,
    setTestRunId,
    setConsoleLogs,
    setScreenshots,
    setProgress,
    setScenarioResults,
    setCurrentScenario
  } = callbacks;

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
    // Convert viewport configs to API format
    const viewportConfigs = convertViewportsToAPIFormat(enabledViewports);

    // Call scenario execution API with SSE
    const response = await fetch('/api/playwright/execute-scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suiteId: selectedSuite.id,
        viewports: viewportConfigs,
        screenshotOnEveryStep: false,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to start test execution');
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let allResults: ScenarioExecutionResult[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          continue; // Skip event type line
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            handleSSEEvent(data, callbacks, allResults);
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }

    // Final state update
    if (setScenarioResults && allResults.length > 0) {
      setScenarioResults(allResults);
    }

  } catch (error: unknown) {
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
 * Handle individual SSE events
 */
function handleSSEEvent(
  event: any,
  callbacks: ExecutionCallbacks,
  allResults: ScenarioExecutionResult[]
): void {
  const {
    setExecutionState,
    setTestRunId,
    setConsoleLogs,
    setScreenshots,
    setProgress,
    setCurrentScenario,
  } = callbacks;

  // Progress event
  if (event.testRunId && event.total !== undefined) {
    if (!allResults.length) {
      setTestRunId?.(event.testRunId);
    }

    setProgress({
      current: event.current || 0,
      total: event.total || 0,
      percentage: event.percentage || 0,
      passed: event.passed || 0,
      failed: event.failed || 0,
      skipped: event.skipped || 0,
      elapsedTime: event.elapsedTime || 0,
      currentScenario: event.currentScenario,
    });

    if (event.currentScenario && setCurrentScenario) {
      setCurrentScenario(event.currentScenario);
    }
  }

  // Log event
  if (event.type && event.message) {
    setConsoleLogs(prev => [
      ...prev,
      {
        type: event.type as 'info' | 'warn' | 'error' | 'log',
        message: event.message,
        timestamp: event.timestamp || new Date().toISOString(),
      },
    ]);
  }

  // Scenario start event
  if (event.scenarioName && event.viewport && event.index !== undefined) {
    if (setCurrentScenario) {
      setCurrentScenario(`${event.scenarioName} (${event.viewport})`);
    }
  }

  // Scenario complete event
  if (event.scenarioName && event.status && event.durationMs !== undefined) {
    if (setCurrentScenario) {
      setCurrentScenario(null);
    }
  }

  // Complete event
  if (event.success !== undefined && event.results) {
    const results = event.results as ScenarioExecutionResult[];
    allResults.push(...results);

    // Collect all screenshots
    const allScreenshots: string[] = [];
    results.forEach((r: ScenarioExecutionResult) => {
      if (r.screenshots && r.screenshots.length > 0) {
        allScreenshots.push(...r.screenshots);
      }
    });
    setScreenshots(allScreenshots);

    // Determine final state
    const failed = event.summary?.failed || 0;
    setExecutionState(failed > 0 ? 'failed' : 'completed');

    // Add completion log
    setConsoleLogs(prev => [
      ...prev,
      {
        type: failed > 0 ? 'error' : 'info',
        message: `Test execution completed. ${event.summary?.passed || 0} passed, ${failed} failed.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  // Error event
  if (event.error) {
    setExecutionState('failed');
    setConsoleLogs(prev => [
      ...prev,
      {
        type: 'error',
        message: event.error,
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
  setCurrentScenario?: (scenario: string | null) => void;
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
    callbacks.setCurrentScenario?.(null);
  };
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}
