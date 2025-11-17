import { create } from 'zustand';
import type { ConsoleLog } from '@/lib/types';
import type { ScenarioExecutionResult } from '@/app/features/runner/lib/executionUtils';

interface ExecutionProgress {
  current: number;
  total: number;
  percentage: number;
  passed: number;
  failed: number;
  skipped: number;
  elapsedTime: number;
}

interface TestExecutionState {
  // Execution state
  executionState: 'idle' | 'running' | 'completed' | 'failed';
  testRunId: string | null;
  currentScenario: string | null;

  // Progress
  progress: ExecutionProgress;

  // Results
  scenarioResults: ScenarioExecutionResult[];
  screenshots: string[];
  logs: ConsoleLog[];

  // Actions
  startExecution: (testRunId: string) => void;
  updateProgress: (progress: Partial<ExecutionProgress>) => void;
  setCurrentScenario: (scenarioName: string) => void;
  addLog: (log: ConsoleLog) => void;
  addLogs: (logs: ConsoleLog[]) => void;
  addScenarioExecutionResult: (result: ScenarioExecutionResult) => void;
  addScreenshot: (url: string) => void;
  completeExecution: (status: 'completed' | 'failed', results: ScenarioExecutionResult[]) => void;
  abortExecution: () => void;
  resetExecution: () => void;
}

const initialProgress: ExecutionProgress = {
  current: 0,
  total: 0,
  percentage: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  elapsedTime: 0,
};

export const useTestExecution = create<TestExecutionState>((set) => ({
  // Initial state
  executionState: 'idle',
  testRunId: null,
  currentScenario: null,
  progress: initialProgress,
  scenarioResults: [],
  screenshots: [],
  logs: [],

  // Actions
  startExecution: (testRunId: string) =>
    set({
      executionState: 'running',
      testRunId,
      currentScenario: null,
      progress: initialProgress,
      scenarioResults: [],
      screenshots: [],
      logs: [],
    }),

  updateProgress: (progressUpdate: Partial<ExecutionProgress>) =>
    set((state) => ({
      progress: {
        ...state.progress,
        ...progressUpdate,
      },
    })),

  setCurrentScenario: (scenarioName: string) =>
    set({ currentScenario: scenarioName }),

  addLog: (log: ConsoleLog) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  addLogs: (logs: ConsoleLog[]) =>
    set((state) => ({
      logs: [...state.logs, ...logs],
    })),

  addScenarioExecutionResult: (result: ScenarioExecutionResult) =>
    set((state) => {
      const newResults = [...state.scenarioResults, result];
      const passed = newResults.filter((r) => r.status === 'pass').length;
      const failed = newResults.filter((r) => r.status === 'fail').length;
      const skipped = newResults.filter((r) => r.status === 'skipped').length;

      return {
        scenarioResults: newResults,
        progress: {
          ...state.progress,
          current: newResults.length,
          percentage: Math.round((newResults.length / state.progress.total) * 100),
          passed,
          failed,
          skipped,
        },
      };
    }),

  addScreenshot: (url: string) =>
    set((state) => ({
      screenshots: [...state.screenshots, url],
    })),

  completeExecution: (status: 'completed' | 'failed', results: ScenarioExecutionResult[]) =>
    set((state) => ({
      executionState: status,
      scenarioResults: results,
      progress: {
        ...state.progress,
        current: results.length,
        percentage: 100,
      },
    })),

  abortExecution: () =>
    set((state) => ({
      executionState: 'failed',
      logs: [
        ...state.logs,
        {
          type: 'warn',
          message: 'Test execution aborted by user',
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  resetExecution: () =>
    set({
      executionState: 'idle',
      testRunId: null,
      currentScenario: null,
      progress: initialProgress,
      scenarioResults: [],
      screenshots: [],
      logs: [],
    }),
}));
