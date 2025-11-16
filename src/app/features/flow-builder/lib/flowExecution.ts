import { TestFlow, FlowStep } from './flowTypes';
import { flowToPlaywrightCode } from './flowSerializer';

interface ConsoleLog {
  type: 'info' | 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

interface ExecutionResult {
  success: boolean;
  errors?: string[];
  logs?: ConsoleLog[];
  duration?: number;
}

/**
 * Execute a flow test using the Playwright execution API
 */
export async function executeFlowTest(
  flow: TestFlow,
  onLog: (log: ConsoleLog) => void
): Promise<ExecutionResult> {
  const addLog = (type: ConsoleLog['type'], message: string) => {
    onLog({
      type,
      message,
      timestamp: new Date().toISOString(),
    });
  };

  addLog('info', `Starting test: ${flow.name}`);
  addLog('info', `Target URL: ${flow.targetUrl}`);
  addLog('info', `Steps to execute: ${flow.steps.length}`);

  try {
    // Prepare flow steps for execution
    addLog('info', 'Preparing flow steps for execution');

    // Execute via API
    addLog('log', 'Executing test...');

    const response = await fetch('/api/playwright/execute-adhoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flowSteps: flow.steps,
        targetUrl: flow.targetUrl,
        testName: flow.name,
        viewport: {
          width: 1920,
          height: 1080,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Test execution failed');
    }

    const result = await response.json();

    // Process results
    if (result.status === 'pass') {
      addLog('info', 'Test passed successfully!');
      return {
        success: true,
        logs: result.consoleLogs || [],
      };
    } else {
      addLog('error', 'Test failed');
      const errors: string[] = [];

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error: { message: string }) => {
          addLog('error', error.message);
          errors.push(error.message);
        });
      }

      return {
        success: false,
        errors,
        logs: result.consoleLogs || [],
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Test execution failed';
    addLog('error', errorMessage);

    return {
      success: false,
      errors: [errorMessage],
    };
  }
}

/**
 * Convert flow steps to a format suitable for database storage
 */
export function convertFlowStepsForDB(steps: FlowStep[]): any[] {
  return steps.map((step) => ({
    type: step.type,
    order: step.order,
    description: step.config.description,
    selector: step.config.selector,
    value: step.config.value,
    url: step.config.url,
    assertion: step.config.assertion,
    timeout: step.config.timeout,
    expectedResult: step.config.expectedResult,
  }));
}

/**
 * Convert database steps to flow steps
 */
export function convertDBStepsToFlow(dbSteps: any[]): FlowStep[] {
  return dbSteps.map((step, index) => ({
    id: `step-${Date.now()}-${index}`,
    type: step.type,
    order: step.order || index,
    config: {
      description: step.description || '',
      selector: step.selector,
      value: step.value,
      url: step.url,
      assertion: step.assertion,
      timeout: step.timeout,
      expectedResult: step.expectedResult,
    },
  }));
}
