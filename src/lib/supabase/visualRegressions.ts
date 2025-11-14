import { supabase } from '../supabase';
import type { ComparisonResult, IgnoreRegion } from '../diff/screenshotComparator';

export interface VisualRegression {
  id: string;
  test_run_id: string;
  baseline_run_id: string | null;
  test_name: string;
  viewport: string;
  step_name: string | null;
  baseline_screenshot_url: string | null;
  current_screenshot_url: string | null;
  diff_screenshot_url: string | null;
  pixels_different: number;
  percentage_different: number;
  dimensions_width: number;
  dimensions_height: number;
  threshold: number;
  is_significant: boolean;
  status: 'pending' | 'approved' | 'bug_reported' | 'investigating' | 'false_positive';
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  ai_analysis: any;
  created_at: string;
  updated_at: string;
}

export interface BaselineInfo {
  baseline_run_id: string | null;
  baseline_set_at: string | null;
  baseline_notes: string | null;
}

/**
 * Set baseline for a test suite
 */
export async function setBaseline(
  suiteId: string,
  runId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('test_suites')
    .update({
      baseline_run_id: runId,
      baseline_set_at: new Date().toISOString(),
      baseline_notes: notes || null,
    })
    .eq('id', suiteId);

  if (error) throw error;
}

/**
 * Get baseline for a test suite
 */
export async function getBaseline(suiteId: string): Promise<BaselineInfo | null> {
  const { data, error } = await supabase
    .from('test_suites')
    .select('baseline_run_id, baseline_set_at, baseline_notes')
    .eq('id', suiteId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Clear baseline for a test suite
 */
export async function clearBaseline(suiteId: string): Promise<void> {
  const { error } = await supabase
    .from('test_suites')
    .update({
      baseline_run_id: null,
      baseline_set_at: null,
      baseline_notes: null,
    })
    .eq('id', suiteId);

  if (error) throw error;
}

/**
 * Save comparison result as visual regression
 */
export async function saveVisualRegression(
  testRunId: string,
  baselineRunId: string | null,
  testName: string,
  viewport: string,
  comparison: ComparisonResult,
  stepName?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('visual_regressions')
    .insert({
      test_run_id: testRunId,
      baseline_run_id: baselineRunId,
      test_name: testName,
      viewport: viewport,
      step_name: stepName || null,
      baseline_screenshot_url: comparison.baselineUrl,
      current_screenshot_url: comparison.currentUrl,
      diff_screenshot_url: comparison.diffImageUrl || null,
      pixels_different: comparison.pixelsDifferent,
      percentage_different: comparison.percentageDifferent,
      dimensions_width: comparison.dimensions.width,
      dimensions_height: comparison.dimensions.height,
      threshold: comparison.threshold,
      is_significant: comparison.isSignificant,
      status: comparison.isSignificant ? 'pending' : 'approved',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Get visual regressions for a test run
 */
export async function getRegressions(
  testRunId: string,
  filters?: {
    status?: string;
    isSignificant?: boolean;
  }
): Promise<VisualRegression[]> {
  let query = supabase
    .from('visual_regressions')
    .select('*')
    .eq('test_run_id', testRunId)
    .order('percentage_different', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.isSignificant !== undefined) {
    query = query.eq('is_significant', filters.isSignificant);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get regression statistics for a test run
 */
export async function getRegressionStats(testRunId: string): Promise<{
  total: number;
  significant: number;
  pending: number;
  approved: number;
  bugReported: number;
  averageDifference: number;
}> {
  const { data, error } = await supabase
    .from('visual_regressions')
    .select('is_significant, status, percentage_different')
    .eq('test_run_id', testRunId);

  if (error) throw error;

  const total = data?.length || 0;
  const significant = data?.filter(r => r.is_significant).length || 0;
  const pending = data?.filter(r => r.status === 'pending').length || 0;
  const approved = data?.filter(r => r.status === 'approved').length || 0;
  const bugReported = data?.filter(r => r.status === 'bug_reported').length || 0;

  const avgDiff = total > 0
    ? data.reduce((sum, r) => sum + r.percentage_different, 0) / total
    : 0;

  return {
    total,
    significant,
    pending,
    approved,
    bugReported,
    averageDifference: Number(avgDiff.toFixed(2)),
  };
}

/**
 * Update regression status
 */
export async function updateRegressionStatus(
  regressionId: string,
  status: 'approved' | 'bug_reported' | 'investigating' | 'false_positive',
  notes?: string,
  reviewedBy?: string
): Promise<void> {
  const { error } = await supabase
    .from('visual_regressions')
    .update({
      status,
      notes: notes || null,
      reviewed_by: reviewedBy || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', regressionId);

  if (error) throw error;
}

/**
 * Get ignore regions for a test
 */
export async function getIgnoreRegions(
  suiteId: string,
  testName?: string,
  viewport?: string
): Promise<IgnoreRegion[]> {
  let query = supabase
    .from('ignore_regions')
    .select('x, y, width, height, reason')
    .eq('suite_id', suiteId);

  if (testName) {
    query = query.eq('test_name', testName);
  }

  if (viewport) {
    query = query.eq('viewport', viewport);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Save ignore region
 */
export async function saveIgnoreRegion(
  suiteId: string,
  region: IgnoreRegion,
  testName?: string,
  viewport?: string
): Promise<void> {
  const { error } = await supabase
    .from('ignore_regions')
    .insert({
      suite_id: suiteId,
      test_name: testName || null,
      viewport: viewport || null,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      reason: region.reason,
    });

  if (error) throw error;
}

/**
 * Get threshold for suite and viewport
 */
export async function getThreshold(
  suiteId: string,
  viewport?: string
): Promise<number> {
  if (!viewport) {
    // Return default threshold
    return 0.1; // 10%
  }

  const { data, error } = await supabase
    .from('diff_thresholds')
    .select('threshold')
    .eq('suite_id', suiteId)
    .eq('viewport', viewport)
    .single();

  if (error || !data) {
    return 0.1; // Default 10%
  }

  return data.threshold;
}

/**
 * Set threshold for suite and viewport
 */
export async function setThreshold(
  suiteId: string,
  viewport: string,
  threshold: number
): Promise<void> {
  const { error } = await supabase
    .from('diff_thresholds')
    .upsert({
      suite_id: suiteId,
      viewport: viewport,
      threshold: threshold,
    });

  if (error) throw error;
}

/**
 * Get regression history for trends
 */
export async function getRegressionTrends(
  suiteId: string,
  daysBack: number = 30
): Promise<Array<{
  date: string;
  testRunId: string;
  totalRegressions: number;
  significantRegressions: number;
  averageDifference: number;
}>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Get test runs for this suite
  const { data: runs, error: runsError } = await supabase
    .from('test_runs')
    .select('id, created_at')
    .eq('suite_id', suiteId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (runsError) throw runsError;

  const trends = [];

  for (const run of runs || []) {
    const { data: regressions } = await supabase
      .from('visual_regressions')
      .select('is_significant, percentage_different')
      .eq('test_run_id', run.id);

    const total = regressions?.length || 0;
    const significant = regressions?.filter(r => r.is_significant).length || 0;
    const avgDiff = total > 0
      ? regressions!.reduce((sum, r) => sum + r.percentage_different, 0) / total
      : 0;

    trends.push({
      date: new Date(run.created_at).toISOString().split('T')[0],
      testRunId: run.id,
      totalRegressions: total,
      significantRegressions: significant,
      averageDifference: Number(avgDiff.toFixed(2)),
    });
  }

  return trends;
}
