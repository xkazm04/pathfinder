'use client';

import { useState, useEffect } from 'react';
import { testRunOperations, subscribeToTestRuns } from '@/lib/supabase';
import type { TestRun } from '@/lib/types';

export function useTestRuns(suiteId?: string) {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTestRuns = async () => {
      try {
        setIsLoading(true);
        const runs = await testRunOperations.getAll(suiteId);
        setTestRuns(runs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch test runs'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestRuns();
  }, [suiteId]);

  // Set up real-time subscription if suiteId is provided
  useEffect(() => {
    if (!suiteId) return;

    const subscription = subscribeToTestRuns(suiteId, (newRun) => {
      setTestRuns((prevRuns) => {
        const existingIndex = prevRuns.findIndex((run) => run.id === newRun.id);
        if (existingIndex >= 0) {
          // Update existing run
          const updated = [...prevRuns];
          updated[existingIndex] = newRun;
          return updated;
        } else {
          // Add new run
          return [newRun, ...prevRuns];
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [suiteId]);

  return { testRuns, isLoading, error };
}

export function useTestRun(runId: string) {
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTestRun = async () => {
      try {
        setIsLoading(true);
        const run = await testRunOperations.getById(runId);
        setTestRun(run);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch test run'));
      } finally {
        setIsLoading(false);
      }
    };

    if (runId) {
      fetchTestRun();
    }
  }, [runId]);

  return { testRun, isLoading, error };
}
