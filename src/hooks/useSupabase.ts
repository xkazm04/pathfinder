'use client';

import { useState } from 'react';
import {
  testSuiteOperations,
  testRunOperations,
  testResultOperations,
  aiAnalysisOperations,
  testCodeOperations,
} from '@/lib/supabase';
import type {
  TestSuite,
  TestRun,
  TestResult,
  AIAnalysis,
  TestCode,
} from '@/lib/types';

export function useSupabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generic operation wrapper
  const executeOperation = async <T,>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Test Suites
  const getTestSuites = () => executeOperation(() => testSuiteOperations.getAll());

  const getTestSuite = (id: string) =>
    executeOperation(() => testSuiteOperations.getById(id));

  const createTestSuite = (
    suite: Omit<TestSuite, 'id' | 'created_at' | 'updated_at'>
  ) => executeOperation(() => testSuiteOperations.create(suite));

  const updateTestSuite = (id: string, updates: Partial<TestSuite>) =>
    executeOperation(() => testSuiteOperations.update(id, updates));

  const deleteTestSuite = (id: string) =>
    executeOperation(() => testSuiteOperations.delete(id));

  // Test Runs
  const getTestRuns = (suiteId?: string) =>
    executeOperation(() => testRunOperations.getAll(suiteId));

  const getTestRun = (id: string) =>
    executeOperation(() => testRunOperations.getById(id));

  const createTestRun = (run: Omit<TestRun, 'id' | 'created_at'>) =>
    executeOperation(() => testRunOperations.create(run));

  const updateTestRunStatus = (
    id: string,
    status: TestRun['status'],
    additionalData?: Partial<TestRun>
  ) => executeOperation(() => testRunOperations.updateStatus(id, status, additionalData));

  // Test Results
  const getTestResults = (runId: string) =>
    executeOperation(() => testResultOperations.getByRunId(runId));

  const createTestResult = (result: Omit<TestResult, 'id' | 'created_at'>) =>
    executeOperation(() => testResultOperations.create(result));

  // AI Analyses
  const getAIAnalyses = (resultId: string) =>
    executeOperation(() => aiAnalysisOperations.getByResultId(resultId));

  const createAIAnalysis = (analysis: Omit<AIAnalysis, 'id' | 'created_at'>) =>
    executeOperation(() => aiAnalysisOperations.create(analysis));

  // Test Code
  const getTestCode = (suiteId: string) =>
    executeOperation(() => testCodeOperations.getBySuiteId(suiteId));

  const createTestCode = (code: Omit<TestCode, 'id' | 'created_at'>) =>
    executeOperation(() => testCodeOperations.create(code));

  return {
    isLoading,
    error,
    // Test Suites
    getTestSuites,
    getTestSuite,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    // Test Runs
    getTestRuns,
    getTestRun,
    createTestRun,
    updateTestRunStatus,
    // Test Results
    getTestResults,
    createTestResult,
    // AI Analyses
    getAIAnalyses,
    createAIAnalysis,
    // Test Code
    getTestCode,
    createTestCode,
  };
}
