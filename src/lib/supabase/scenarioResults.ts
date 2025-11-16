import { supabase } from '../supabase';

export interface ScenarioResult {
  id?: string;
  run_id: string;
  scenario_id: string;
  viewport: string;
  viewport_size: string;
  status: 'pass' | 'fail' | 'skipped';
  duration_ms: number;
  started_at: string;
  completed_at: string;
  screenshots: string[];
  console_logs: any[];
  errors: any[];
  step_results: any[];
}

export interface AIScreenshotAnalysis {
  id?: string;
  scenario_result_id: string;
  screenshot_url: string;
  analysis_type: 'visual' | 'ui' | 'accessibility';
  findings: any;
  issues: any[];
  suggestions: string;
  confidence_score: number;
  model_used: string;
}

/**
 * Save scenario result to database
 */
export async function saveScenarioResult(result: ScenarioResult): Promise<string> {
  const { data, error } = await supabase
    .from('scenario_results')
    .insert([{
      run_id: result.run_id,
      scenario_id: result.scenario_id,
      viewport: result.viewport,
      viewport_size: result.viewport_size,
      status: result.status,
      duration_ms: result.duration_ms,
      started_at: result.started_at,
      completed_at: result.completed_at,
      screenshots: result.screenshots,
      console_logs: result.console_logs,
      errors: result.errors,
      step_results: result.step_results,
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to save scenario result:', error);
    throw new Error(`Failed to save scenario result: ${error.message}`);
  }

  return data.id;
}

/**
 * Get scenario results for a test run
 */
export async function getScenarioResults(runId: string): Promise<ScenarioResult[]> {
  const { data, error } = await supabase
    .from('scenario_results')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch scenario results:', error);
    return [];
  }

  return data || [];
}

/**
 * Get scenario results for a specific scenario
 */
export async function getScenarioResultsByScenarioId(scenarioId: string): Promise<ScenarioResult[]> {
  const { data, error } = await supabase
    .from('scenario_results')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch scenario results:', error);
    return [];
  }

  return data || [];
}

/**
 * Save AI screenshot analysis
 */
export async function saveAIScreenshotAnalysis(analysis: AIScreenshotAnalysis): Promise<string> {
  const { data, error } = await supabase
    .from('ai_screenshot_analysis')
    .insert([{
      scenario_result_id: analysis.scenario_result_id,
      screenshot_url: analysis.screenshot_url,
      analysis_type: analysis.analysis_type,
      findings: analysis.findings,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
      confidence_score: analysis.confidence_score,
      model_used: analysis.model_used,
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to save AI analysis:', error);
    throw new Error(`Failed to save AI analysis: ${error.message}`);
  }

  return data.id;
}

/**
 * Get AI analyses for a scenario result
 */
export async function getAIAnalyses(scenarioResultId: string): Promise<AIScreenshotAnalysis[]> {
  const { data, error } = await supabase
    .from('ai_screenshot_analysis')
    .select('*')
    .eq('scenario_result_id', scenarioResultId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch AI analyses:', error);
    return [];
  }

  return data || [];
}

/**
 * Update scenario result status
 */
export async function updateScenarioResultStatus(
  resultId: string,
  status: 'pass' | 'fail' | 'skipped',
  completedAt?: string
): Promise<void> {
  const updateData: any = { status };
  if (completedAt) {
    updateData.completed_at = completedAt;
  }

  const { error } = await supabase
    .from('scenario_results')
    .update(updateData)
    .eq('id', resultId);

  if (error) {
    console.error('Failed to update scenario result:', error);
    throw new Error(`Failed to update scenario result: ${error.message}`);
  }
}
