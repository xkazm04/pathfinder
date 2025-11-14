import { supabase } from '../supabase';
import { TestRun, TestResult, ViewportConfig } from '../types';

/**
 * Create a new test run
 */
export async function createTestRun(
  suiteId: string,
  config: { viewports: ViewportConfig[] }
): Promise<string> {
  const { data, error } = await supabase
    .from('test_runs')
    .insert({
      suite_id: suiteId,
      status: 'running',
      started_at: new Date().toISOString(),
      config: config,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test run: ${error.message}`);
  }

  return data.id;
}

/**
 * Update test run status
 */
export async function updateTestRunStatus(
  runId: string,
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
): Promise<void> {
  const updates: any = {
    status,
  };

  if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('test_runs')
    .update(updates)
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to update test run status: ${error.message}`);
  }
}

/**
 * Get a test run by ID with its results
 */
export async function getTestRun(runId: string): Promise<TestRun | null> {
  const { data, error } = await supabase
    .from('test_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch test run: ${error.message}`);
  }

  return data;
}

/**
 * Get test runs for a specific suite
 */
export async function getTestRunsForSuite(suiteId: string): Promise<TestRun[]> {
  const { data, error } = await supabase
    .from('test_runs')
    .select('*')
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch test runs: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all test runs with suite information
 */
export async function getAllTestRuns(limit: number = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('test_runs')
    .select(`
      *,
      test_suites (
        name,
        target_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch test runs: ${error.message}`);
  }

  return data || [];
}

/**
 * Save a test result
 */
export async function saveTestResult(
  runId: string,
  result: {
    viewport: string;
    viewportSize: string;
    testName: string;
    status: 'pass' | 'fail' | 'skipped';
    durationMs: number;
    screenshots?: string[];
    errors?: any[];
    consoleLogs?: any[];
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('test_results')
    .insert({
      run_id: runId,
      viewport: result.viewport,
      viewport_size: result.viewportSize,
      test_name: result.testName,
      status: result.status,
      duration_ms: result.durationMs,
      screenshots: result.screenshots || [],
      errors: result.errors || [],
      console_logs: result.consoleLogs || [],
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save test result: ${error.message}`);
  }

  return data.id;
}

/**
 * Get test results for a run
 */
export async function getTestResults(runId: string): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch test results: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a test run and all its results
 */
export async function deleteTestRun(runId: string): Promise<void> {
  const { error } = await supabase
    .from('test_runs')
    .delete()
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to delete test run: ${error.message}`);
  }
}

/**
 * Get test run statistics
 */
export async function getTestRunStats(runId: string): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}> {
  const results = await getTestResults(runId);

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    duration: results.reduce((sum, r) => sum + (r.duration_ms || 0), 0),
  };

  return stats;
}
