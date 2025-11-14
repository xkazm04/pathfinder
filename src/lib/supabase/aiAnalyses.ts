import { supabase } from '../supabase';

export type AnalysisCategory = 'visual' | 'functional' | 'responsive' | 'accessibility' | 'content';
export type Severity = 'critical' | 'warning' | 'info';

export interface Finding {
  category: AnalysisCategory;
  severity: Severity;
  issue: string;
  location: string;
  recommendation: string;
  affectedElements: string[];
  confidenceScore: number; // 0.0 to 1.0
  screenshotUrl?: string;
  wcagCriterion?: string; // For accessibility issues
  level?: 'A' | 'AA' | 'AAA';
}

export interface AIAnalysis {
  id: string;
  result_id: string;
  analysis_type: 'comprehensive' | 'accessibility' | 'responsive';
  findings: Finding[];
  severity: Severity;
  suggestions?: string;
  confidence_score: number;
  created_at: string;
}

/**
 * Save AI analysis for a test result
 */
export async function saveAIAnalysis(
  resultId: string,
  findings: Finding[],
  analysisType: 'comprehensive' | 'accessibility' | 'responsive' = 'comprehensive'
): Promise<string> {
  const overallSeverity = calculateOverallSeverity(findings);
  const avgConfidence = calculateAverageConfidence(findings);
  const suggestions = generateSuggestions(findings);

  const { data, error } = await supabase
    .from('ai_analyses')
    .insert({
      result_id: resultId,
      analysis_type: analysisType,
      findings,
      severity: overallSeverity,
      suggestions,
      confidence_score: avgConfidence,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save AI analysis: ${error.message}`);
  }

  return data.id;
}

/**
 * Get AI analyses for a test result
 */
export async function getAIAnalyses(resultId: string): Promise<AIAnalysis[]> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('result_id', resultId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch AI analyses: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all analyses for a test run
 */
export async function getAnalysesForTestRun(testRunId: string): Promise<AIAnalysis[]> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select(`
      *,
      test_results!inner(run_id)
    `)
    .eq('test_results.run_id', testRunId);

  if (error) {
    throw new Error(`Failed to fetch analyses for test run: ${error.message}`);
  }

  return data || [];
}

/**
 * Get analysis statistics for a test run
 */
export async function getAnalysisStats(testRunId: string): Promise<{
  totalIssues: number;
  critical: number;
  warning: number;
  info: number;
  byCategory: Record<AnalysisCategory, number>;
  qualityScore: number;
}> {
  const analyses = await getAnalysesForTestRun(testRunId);
  const allFindings = analyses.flatMap(a => a.findings || []);

  const stats = {
    totalIssues: allFindings.length,
    critical: allFindings.filter(f => f.severity === 'critical').length,
    warning: allFindings.filter(f => f.severity === 'warning').length,
    info: allFindings.filter(f => f.severity === 'info').length,
    byCategory: {
      visual: allFindings.filter(f => f.category === 'visual').length,
      functional: allFindings.filter(f => f.category === 'functional').length,
      responsive: allFindings.filter(f => f.category === 'responsive').length,
      accessibility: allFindings.filter(f => f.category === 'accessibility').length,
      content: allFindings.filter(f => f.category === 'content').length,
    },
    qualityScore: calculateQualityScore(allFindings),
  };

  return stats;
}

/**
 * Calculate overall severity from findings
 */
function calculateOverallSeverity(findings: Finding[]): Severity {
  if (findings.some(f => f.severity === 'critical')) {
    return 'critical';
  }
  if (findings.some(f => f.severity === 'warning')) {
    return 'warning';
  }
  return 'info';
}

/**
 * Calculate average confidence score
 */
function calculateAverageConfidence(findings: Finding[]): number {
  if (findings.length === 0) return 1.0;
  const sum = findings.reduce((acc, f) => acc + f.confidenceScore, 0);
  return sum / findings.length;
}

/**
 * Generate suggestions from findings
 */
function generateSuggestions(findings: Finding[]): string {
  const critical = findings.filter(f => f.severity === 'critical');
  if (critical.length > 0) {
    return `Focus on ${critical.length} critical issue${critical.length > 1 ? 's' : ''} first: ${critical.map(f => f.issue).join(', ')}`;
  }

  const highConfidence = findings.filter(f => f.confidenceScore >= 0.8);
  if (highConfidence.length > 0) {
    return `Address ${highConfidence.length} high-confidence issue${highConfidence.length > 1 ? 's' : ''} to improve quality`;
  }

  return 'Review all findings and prioritize based on user impact';
}

/**
 * Calculate quality score (0-100)
 */
function calculateQualityScore(findings: Finding[]): number {
  if (findings.length === 0) return 100;

  // Deduct points based on severity
  const criticalPenalty = findings.filter(f => f.severity === 'critical').length * 15;
  const warningPenalty = findings.filter(f => f.severity === 'warning').length * 5;
  const infoPenalty = findings.filter(f => f.severity === 'info').length * 1;

  const totalPenalty = criticalPenalty + warningPenalty + infoPenalty;
  const score = Math.max(0, 100 - totalPenalty);

  return Math.round(score);
}

/**
 * Delete AI analyses for a test result
 */
export async function deleteAIAnalyses(resultId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_analyses')
    .delete()
    .eq('result_id', resultId);

  if (error) {
    throw new Error(`Failed to delete AI analyses: ${error.message}`);
  }
}

/**
 * Get trend data for analyses over time
 */
export async function getAnalysisTrends(
  suiteId: string,
  limit: number = 10
): Promise<Array<{
  date: string;
  totalIssues: number;
  critical: number;
  warning: number;
  info: number;
  qualityScore: number;
}>> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select(`
      *,
      test_results!inner(
        run_id,
        test_runs!inner(
          suite_id,
          created_at
        )
      )
    `)
    .eq('test_results.test_runs.suite_id', suiteId)
    .order('test_results.test_runs.created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch analysis trends: ${error.message}`);
  }

  // Group by date and aggregate
  const trends: any = {};
  data?.forEach((analysis: any) => {
    const date = new Date(analysis.test_results.test_runs.created_at).toISOString().split('T')[0];
    if (!trends[date]) {
      trends[date] = {
        date,
        totalIssues: 0,
        critical: 0,
        warning: 0,
        info: 0,
        findings: [],
      };
    }

    const findings = analysis.findings || [];
    trends[date].totalIssues += findings.length;
    trends[date].critical += findings.filter((f: Finding) => f.severity === 'critical').length;
    trends[date].warning += findings.filter((f: Finding) => f.severity === 'warning').length;
    trends[date].info += findings.filter((f: Finding) => f.severity === 'info').length;
    trends[date].findings.push(...findings);
  });

  return Object.values(trends).map((t: any) => ({
    ...t,
    qualityScore: calculateQualityScore(t.findings),
  }));
}
