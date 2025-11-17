import { TestExecutionStep } from './mockData';

export interface ExecutionProgress {
  current: number;
  total: number;
  percentage: number;
  passed: number;
  failed: number;
  skipped: number;
  elapsedTime: number;
}

/**
 * Simulates test execution by updating steps over time
 */
export async function simulateTestExecution(
  steps: TestExecutionStep[],
  onProgress: (updatedSteps: TestExecutionStep[], progress: ExecutionProgress) => void,
  onComplete: (finalSteps: TestExecutionStep[], success: boolean) => void
): Promise<void> {
  const startTime = Date.now();
  let currentStepIndex = 0;
  const updatedSteps = [...steps];

  const countStepsByStatus = (status: TestExecutionStep['status']) =>
    updatedSteps.filter(s => s.status === status).length;

  const updateProgress = (): ExecutionProgress => {
    const passed = countStepsByStatus('passed');
    const failed = countStepsByStatus('failed');
    const skipped = countStepsByStatus('skipped');
    const completed = passed + failed + skipped;

    return {
      current: completed,
      total: steps.length,
      percentage: Math.round((completed / steps.length) * 100),
      passed,
      failed,
      skipped,
      elapsedTime: Date.now() - startTime,
    };
  };

  // Execute steps sequentially with random timing
  for (let i = 0; i < updatedSteps.length; i++) {
    currentStepIndex = i;

    // Mark as running
    updatedSteps[i] = { ...updatedSteps[i], status: 'running' };
    onProgress([...updatedSteps], updateProgress());

    // Simulate execution time (300ms - 1500ms)
    const executionTime = 300 + Math.random() * 1200;
    await new Promise(resolve => setTimeout(resolve, executionTime));

    // Random result (90% pass, 8% fail, 2% skip)
    const rand = Math.random();
    if (rand > 0.92) {
      updatedSteps[i] = {
        ...updatedSteps[i],
        status: 'skipped',
        duration: executionTime,
      };
    } else if (rand > 0.90) {
      updatedSteps[i] = {
        ...updatedSteps[i],
        status: 'failed',
        duration: executionTime,
        error: 'Element not found: Expected button to be visible',
      };
    } else {
      updatedSteps[i] = {
        ...updatedSteps[i],
        status: 'passed',
        duration: executionTime,
      };
    }

    onProgress([...updatedSteps], updateProgress());
  }

  // All tests completed
  const finalProgress = updateProgress();
  const success = finalProgress.failed === 0;
  onComplete([...updatedSteps], success);
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.floor(ms)}ms`;
  }
  if (ms < 60000) {
    return `${Math.floor(ms / 1000)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
