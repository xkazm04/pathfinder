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
 * Get dashboard statistics
 * @param daysBack Number of days to look back from offset
 * @param offset Number of days to offset the period (for trend calculation)
 */
export async function getDashboardStats(daysBack: number = 30, offset: number = 0): Promise<DashboardStats> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack - offset);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);

    // Get test runs in the period
    const { data: testRuns, error: runsError } = await supabase
      .from('test_runs')
      .select('id, status, created_at')
      .gte('created_at', cutoffDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (runsError) throw runsError;

    const recentTestRuns = testRuns?.length || 0;
    const completedRuns = testRuns?.filter(r => r.status === 'completed') || [];

    // Get test results for completed runs
    const runIds = completedRuns.map(r => r.id);

    let totalTests = 0;
    let passedTests = 0;
    let qualityScores: number[] = [];

    if (runIds.length > 0) {
      const { data: results, error: resultsError } = await supabase
        .from('test_results')
        .select('status, test_run_id')
        .in('test_run_id', runIds);

      if (resultsError) throw resultsError;

      totalTests = results?.length || 0;
      passedTests = results?.filter(r => r.status === 'pass').length || 0;

      // Get AI analyses for quality scores
      const { data: analyses, error: analysesError } = await supabase
        .from('ai_analyses')
        .select('quality_score, test_result_id')
        .in('test_result_id', results?.map(r => r.test_run_id) || []);

      if (!analysesError && analyses) {
        qualityScores = analyses
          .map(a => a.quality_score)
          .filter((score): score is number => score !== null && score !== undefined);
      }
    }

    // Get total issues
    const { data: analyses, error: analysesError } = await supabase
      .from('ai_analyses')
      .select('findings')
      .gte('created_at', cutoffDate.toISOString())
      .lte('created_at', endDate.toISOString());

    let totalIssues = 0;
    if (!analysesError && analyses) {
      totalIssues = analyses.reduce((sum, a) => {
        const findings = a.findings as any[];
        return sum + (findings?.length || 0);
      }, 0);
    }

    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const avgQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;

    // Calculate coverage (mock for now, would be based on test suite coverage)
    const coverage = 85; // Placeholder

    return {
      totalTests,
      passRate: Math.round(passRate * 10) / 10,
      totalIssues,
      coverage,
      recentTestRuns,
      avgQualityScore: Math.round(avgQualityScore * 10) / 10,
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
 * Get recent test runs with pagination
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
    let query = supabase
      .from('test_runs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: testRuns, error, count } = await query;

    if (error) throw error;

    // Enrich with test results data
    const enrichedRuns: TestRunSummary[] = [];

    for (const run of testRuns || []) {
      const { data: results } = await supabase
        .from('test_results')
        .select('id, status')
        .eq('test_run_id', run.id);

      const totalTests = results?.length || 0;
      const passedTests = results?.filter(r => r.status === 'pass').length || 0;
      const failedTests = results?.filter(r => r.status === 'fail').length || 0;

      // Get quality score and issue count from AI analyses
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('quality_score, findings')
        .in('test_result_id', results?.map(r => r.id) || [])
        .order('created_at', { ascending: false })
        .limit(1);

      const latestAnalysis = analyses?.[0];
      const qualityScore = latestAnalysis?.quality_score || undefined;
      const findings = (latestAnalysis?.findings || []) as any[];
      const issueCount = findings.length;

      // Apply quality score filter
      if (filters?.minQualityScore && qualityScore && qualityScore < filters.minQualityScore) {
        continue;
      }

      enrichedRuns.push({
        id: run.id,
        name: run.suite_name || `Test Run #${run.id.slice(0, 8)}`,
        created_at: run.created_at,
        status: run.status,
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: failedTests,
        duration_ms: run.duration_ms || 0,
        quality_score: qualityScore,
        issue_count: issueCount,
      });
    }

    return {
      runs: enrichedRuns,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching recent test runs:', error);
    return { runs: [], total: 0 };
  }
}

/**
 * Get quality trend data over time
 */
export async function getQualityTrends(daysBack: number = 30): Promise<QualityTrendPoint[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get test runs
    const { data: testRuns, error: runsError } = await supabase
      .from('test_runs')
      .select('id, created_at, status')
      .eq('status', 'completed')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true });

    if (runsError) throw runsError;

    const trends: QualityTrendPoint[] = [];

    for (const run of testRuns || []) {
      // Get test results
      const { data: results } = await supabase
        .from('test_results')
        .select('id, status')
        .eq('test_run_id', run.id);

      const totalTests = results?.length || 0;
      const passedTests = results?.filter(r => r.status === 'pass').length || 0;
      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

      // Get quality score from AI analyses
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('quality_score')
        .in('test_result_id', results?.map(r => r.id) || [])
        .order('created_at', { ascending: false })
        .limit(1);

      const qualityScore = analyses?.[0]?.quality_score || 0;

      trends.push({
        date: new Date(run.created_at).toISOString().split('T')[0],
        quality_score: qualityScore,
        test_run_id: run.id,
        pass_rate: passRate,
      });
    }

    return trends;
  } catch (error) {
    console.error('Error fetching quality trends:', error);
    return [];
  }
}

/**
 * Get issues grouped by category
 */
export async function getIssuesByCategory(daysBack: number = 30): Promise<IssuesByCategory[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: analyses, error } = await supabase
      .from('ai_analyses')
      .select('findings')
      .gte('created_at', cutoffDate.toISOString());

    if (error) throw error;

    const categoryMap = new Map<string, IssuesByCategory>();

    for (const analysis of analyses || []) {
      const findings = (analysis.findings || []) as any[];

      for (const finding of findings) {
        const category = finding.category || 'unknown';
        const existing = categoryMap.get(category) || {
          category,
          count: 0,
          critical: 0,
          warning: 0,
          info: 0,
        };

        existing.count++;

        if (finding.severity === 'critical') existing.critical++;
        else if (finding.severity === 'warning') existing.warning++;
        else if (finding.severity === 'info') existing.info++;

        categoryMap.set(category, existing);
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
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
