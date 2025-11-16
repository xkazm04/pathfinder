import { supabase } from '../supabase';

export interface DashboardStats {
  totalTests: number;
  passRate: number;
  totalIssues: number;
  coverage: number;
  recentTestRuns: number;
  avgQualityScore: number;
}

export interface TestRunSummary {
  id: string;
  name: string;
  created_at: string;
  status: 'running' | 'completed' | 'failed';
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  duration_ms: number;
  quality_score?: number;
  issue_count?: number;
}

export interface QualityTrendPoint {
  date: string;
  quality_score: number;
  test_run_id: string;
  pass_rate: number;
}

export interface IssuesByCategory {
  category: string;
  count: number;
  critical: number;
  warning: number;
  info: number;
}

/**
 * Get dashboard statistics using server-side aggregation
 * @param daysBack Number of days to look back from offset
 * @param offset Number of days to offset the period (for trend calculation)
 */
export async function getDashboardStats(daysBack: number = 30, offset: number = 0): Promise<DashboardStats> {
  try {
    // Call the database function for server-side aggregation
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', {
        days_back: daysBack,
        offset_days: offset
      })
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error('No data returned from get_dashboard_stats');
    }

    // Type assertion for RPC response
    const statsData = data as {
      total_tests: number;
      pass_rate: number;
      total_issues: number;
      coverage: number;
      recent_test_runs: number;
      avg_quality_score: number;
    };

    return {
      totalTests: Number(statsData.total_tests) || 0,
      passRate: Number(statsData.pass_rate) || 0,
      totalIssues: Number(statsData.total_issues) || 0,
      coverage: Number(statsData.coverage) || 0,
      recentTestRuns: Number(statsData.recent_test_runs) || 0,
      avgQualityScore: Number(statsData.avg_quality_score) || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalTests: 0,
      passRate: 0,
      totalIssues: 0,
      coverage: 0,
      recentTestRuns: 0,
      avgQualityScore: 0,
    };
  }
}

/**
 * Get recent test runs with pagination using server-side aggregation
 */
export async function getRecentTestRuns(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    status?: 'running' | 'completed' | 'failed';
    minQualityScore?: number;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{ runs: TestRunSummary[]; total: number }> {
  try {
    // Call the database function for server-side aggregation
    const { data, error } = await supabase
      .rpc('get_recent_test_runs', {
        page_num: page,
        page_size: pageSize,
        status_filter: filters?.status || null,
        min_quality_score: filters?.minQualityScore || null,
        date_from: filters?.dateFrom || null,
        date_to: filters?.dateTo || null
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { runs: [], total: 0 };
    }

    // Transform database results to TypeScript interface
    const runs: TestRunSummary[] = data.map((row: any) => ({
      id: row.id,
      name: row.suite_name,
      created_at: row.created_at,
      status: row.status,
      total_tests: Number(row.total_tests),
      passed_tests: Number(row.passed_tests),
      failed_tests: Number(row.failed_tests),
      duration_ms: Number(row.duration_ms),
      quality_score: row.quality_score !== 0 ? Number(row.quality_score) : undefined,
      issue_count: Number(row.issue_count),
    }));

    // Extract total count from first row (all rows have the same total_count)
    const total = data.length > 0 ? Number(data[0].total_count) : 0;

    return {
      runs,
      total,
    };
  } catch (error) {
    console.error('Error fetching recent test runs:', error);
    return { runs: [], total: 0 };
  }
}

/**
 * Get quality trend data over time using server-side aggregation
 */
export async function getQualityTrends(daysBack: number = 30): Promise<QualityTrendPoint[]> {
  try {
    // Call the database function for server-side aggregation
    const { data, error } = await supabase
      .rpc('get_quality_trends', {
        days_back: daysBack
      });

    if (error) throw error;

    if (!data) {
      return [];
    }

    // Transform database results to TypeScript interface
    const trends: QualityTrendPoint[] = data.map((row: any) => ({
      date: row.date,
      test_run_id: row.test_run_id,
      quality_score: Number(row.quality_score),
      pass_rate: Number(row.pass_rate),
    }));

    return trends;
  } catch (error) {
    console.error('Error fetching quality trends:', error);
    return [];
  }
}

/**
 * Get issues grouped by category using server-side aggregation
 */
export async function getIssuesByCategory(daysBack: number = 30): Promise<IssuesByCategory[]> {
  try {
    // Call the database function for server-side aggregation
    const { data, error } = await supabase
      .rpc('get_issues_by_category', {
        days_back: daysBack
      });

    if (error) throw error;

    if (!data) {
      return [];
    }

    // Transform database results to TypeScript interface
    const issues: IssuesByCategory[] = data.map((row: any) => ({
      category: row.category,
      count: Number(row.count),
      critical: Number(row.critical),
      warning: Number(row.warning),
      info: Number(row.info),
    }));

    return issues;
  } catch (error) {
    console.error('Error fetching issues by category:', error);
    return [];
  }
}

/**
 * Get comparison data between two test runs
 */
export async function compareTestRuns(
  currentRunId: string,
  previousRunId: string
): Promise<{
  current: TestRunSummary;
  previous: TestRunSummary;
  improvements: number;
  regressions: number;
  newIssues: number;
  resolvedIssues: number;
}> {
  try {
    // Fetch both test runs
    const { data: runs } = await supabase
      .from('test_runs')
      .select('*')
      .in('id', [currentRunId, previousRunId]);

    const currentRun = runs?.find(r => r.id === currentRunId);
    const previousRun = runs?.find(r => r.id === previousRunId);

    if (!currentRun || !previousRun) {
      throw new Error('Test runs not found');
    }

    // Get results for both runs
    const { data: currentResults } = await supabase
      .from('test_results')
      .select('id, test_name, status')
      .eq('test_run_id', currentRunId);

    const { data: previousResults } = await supabase
      .from('test_results')
      .select('id, test_name, status')
      .eq('test_run_id', previousRunId);

    // Get analyses for both runs
    const { data: currentAnalyses } = await supabase
      .from('ai_analyses')
      .select('quality_score, findings')
      .in('test_result_id', currentResults?.map(r => r.id) || []);

    const { data: previousAnalyses } = await supabase
      .from('ai_analyses')
      .select('quality_score, findings')
      .in('test_result_id', previousResults?.map(r => r.id) || []);

    // Calculate metrics
    const currentIssues = (currentAnalyses || []).flatMap(a => (a.findings || []) as any[]);
    const previousIssues = (previousAnalyses || []).flatMap(a => (a.findings || []) as any[]);

    const currentIssueKeys = new Set(currentIssues.map(i => `${i.category}:${i.issue}`));
    const previousIssueKeys = new Set(previousIssues.map(i => `${i.category}:${i.issue}`));

    const newIssues = [...currentIssueKeys].filter(k => !previousIssueKeys.has(k)).length;
    const resolvedIssues = [...previousIssueKeys].filter(k => !currentIssueKeys.has(k)).length;

    const currentPassed = currentResults?.filter(r => r.status === 'pass').length || 0;
    const previousPassed = previousResults?.filter(r => r.status === 'pass').length || 0;

    const improvements = Math.max(0, currentPassed - previousPassed);
    const regressions = Math.max(0, previousPassed - currentPassed);

    const currentSummary: TestRunSummary = {
      id: currentRun.id,
      name: currentRun.suite_name || `Test Run #${currentRun.id.slice(0, 8)}`,
      created_at: currentRun.created_at,
      status: currentRun.status,
      total_tests: currentResults?.length || 0,
      passed_tests: currentPassed,
      failed_tests: (currentResults?.length || 0) - currentPassed,
      duration_ms: currentRun.duration_ms || 0,
      quality_score: currentAnalyses?.[0]?.quality_score,
      issue_count: currentIssues.length,
    };

    const previousSummary: TestRunSummary = {
      id: previousRun.id,
      name: previousRun.suite_name || `Test Run #${previousRun.id.slice(0, 8)}`,
      created_at: previousRun.created_at,
      status: previousRun.status,
      total_tests: previousResults?.length || 0,
      passed_tests: previousPassed,
      failed_tests: (previousResults?.length || 0) - previousPassed,
      duration_ms: previousRun.duration_ms || 0,
      quality_score: previousAnalyses?.[0]?.quality_score,
      issue_count: previousIssues.length,
    };

    return {
      current: currentSummary,
      previous: previousSummary,
      improvements,
      regressions,
      newIssues,
      resolvedIssues,
    };
  } catch (error) {
    console.error('Error comparing test runs:', error);
    throw error;
  }
}
