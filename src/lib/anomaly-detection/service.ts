import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rate limiting
const RATE_LIMIT_DELAY = 4000;
let lastRequestTime = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

export interface TestRunAnomaly {
  runId: string;
  isAnomalous: boolean;
  anomalyType?: 'flaky_test' | 'environment_issue' | 'regression' | 'unusual_failure_pattern';
  confidence: number;
  explanation: string;
  affectedTests?: string[];
  suggestedAction?: string;
}

export interface TestRunLogData {
  runId: string;
  status: string;
  createdAt: string;
  durationMs?: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errors?: any[];
  consoleLogs?: any[];
  testNames?: string[];
}

/**
 * Extract key entities and metrics from test run logs
 */
export function extractTestRunFeatures(logData: TestRunLogData): string {
  const passRate = logData.totalTests > 0
    ? (logData.passedTests / logData.totalTests * 100).toFixed(2)
    : '0';

  const errorMessages = logData.errors?.map(e => e.message || e.toString()).join('; ') || 'None';
  const consoleErrors = logData.consoleLogs?.filter(l => l.type === 'error').map(l => l.message).join('; ') || 'None';

  return `Run ${logData.runId.slice(0, 8)}: Status=${logData.status}, PassRate=${passRate}%, Duration=${logData.durationMs}ms, Failed=${logData.failedTests}, Errors="${errorMessages}", ConsoleErrors="${consoleErrors}"`;
}

/**
 * Compute embedding for a test run using Gemini
 */
export async function computeTestRunEmbedding(features: string): Promise<number[]> {
  try {
    await waitForRateLimit();

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(features);

    return result.embedding.values;
  } catch (error) {
    console.error('Error computing embedding:', error);
    // Return zero vector on error
    return new Array(768).fill(0);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate statistics for baseline distribution
 */
function calculateBaselineStats(embeddings: number[][]): { mean: number[]; std: number[] } {
  if (embeddings.length === 0) {
    return { mean: [], std: [] };
  }

  const dim = embeddings[0].length;
  const mean = new Array(dim).fill(0);
  const std = new Array(dim).fill(0);

  // Calculate mean
  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      mean[i] += embedding[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    mean[i] /= embeddings.length;
  }

  // Calculate standard deviation
  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      std[i] += Math.pow(embedding[i] - mean[i], 2);
    }
  }
  for (let i = 0; i < dim; i++) {
    std[i] = Math.sqrt(std[i] / embeddings.length);
  }

  return { mean, std };
}

/**
 * Detect if a test run is anomalous compared to baseline
 */
export async function detectAnomalies(
  currentRun: TestRunLogData,
  historicalRuns: TestRunLogData[],
  threshold: number = 0.7
): Promise<TestRunAnomaly> {
  try {
    // Extract features
    const currentFeatures = extractTestRunFeatures(currentRun);
    const currentEmbedding = await computeTestRunEmbedding(currentFeatures);

    // Get baseline embeddings (only from successful historical runs)
    const baselineRuns = historicalRuns.filter(r => r.status === 'completed' && r.passedTests >= r.totalTests * 0.8);

    if (baselineRuns.length < 3) {
      // Not enough data for baseline
      return {
        runId: currentRun.runId,
        isAnomalous: false,
        confidence: 0,
        explanation: 'Insufficient historical data for anomaly detection',
      };
    }

    // Compute baseline embeddings
    const baselineEmbeddings = await Promise.all(
      baselineRuns.map(run => computeTestRunEmbedding(extractTestRunFeatures(run)))
    );

    // Calculate similarities to baseline
    const similarities = baselineEmbeddings.map(baseline =>
      cosineSimilarity(currentEmbedding, baseline)
    );

    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const maxSimilarity = Math.max(...similarities);

    // Detect anomaly based on similarity threshold
    const isAnomalous = avgSimilarity < threshold;

    if (!isAnomalous) {
      return {
        runId: currentRun.runId,
        isAnomalous: false,
        confidence: 1 - avgSimilarity,
        explanation: 'Test run matches expected baseline patterns',
      };
    }

    // Use LLM to analyze the anomaly
    const analysis = await analyzeAnomalyWithLLM(currentRun, baselineRuns);

    return {
      runId: currentRun.runId,
      isAnomalous: true,
      confidence: 1 - avgSimilarity,
      ...analysis,
    };
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return {
      runId: currentRun.runId,
      isAnomalous: false,
      confidence: 0,
      explanation: `Error during anomaly detection: ${(error as Error).message}`,
    };
  }
}

/**
 * Use LLM to analyze detected anomaly and provide insights
 */
async function analyzeAnomalyWithLLM(
  currentRun: TestRunLogData,
  baselineRuns: TestRunLogData[]
): Promise<Partial<TestRunAnomaly>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const baselineStats = {
    avgPassRate: baselineRuns.reduce((sum, r) => sum + (r.passedTests / r.totalTests * 100), 0) / baselineRuns.length,
    avgDuration: baselineRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) / baselineRuns.length,
    commonErrors: baselineRuns.flatMap(r => r.errors || []).slice(0, 5),
  };

  const currentStats = {
    passRate: currentRun.totalTests > 0 ? (currentRun.passedTests / currentRun.totalTests * 100) : 0,
    duration: currentRun.durationMs || 0,
    errors: currentRun.errors || [],
    failedTests: currentRun.failedTests,
  };

  const prompt = `You are a QA automation expert analyzing test run anomalies.

Current Test Run:
- Pass Rate: ${currentStats.passRate.toFixed(2)}%
- Duration: ${currentStats.duration}ms
- Failed Tests: ${currentStats.failedTests}
- Errors: ${JSON.stringify(currentStats.errors.slice(0, 3))}

Baseline (Historical Average):
- Avg Pass Rate: ${baselineStats.avgPassRate.toFixed(2)}%
- Avg Duration: ${baselineStats.avgDuration.toFixed(0)}ms
- Common Errors: ${JSON.stringify(baselineStats.commonErrors)}

Analyze this test run and determine:
1. Anomaly Type: Choose one of: "flaky_test", "environment_issue", "regression", "unusual_failure_pattern"
2. Brief Explanation: 1-2 sentences explaining what's abnormal
3. Affected Tests: List test names if specific tests are problematic (or empty array)
4. Suggested Action: One specific action to investigate or fix the issue

Return ONLY valid JSON with this structure:
{
  "anomalyType": "flaky_test|environment_issue|regression|unusual_failure_pattern",
  "explanation": "Brief explanation",
  "affectedTests": ["test1", "test2"],
  "suggestedAction": "Specific action to take"
}`;

  try {
    await waitForRateLimit();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      return {
        anomalyType: parsed.anomalyType,
        explanation: parsed.explanation,
        affectedTests: parsed.affectedTests || [],
        suggestedAction: parsed.suggestedAction,
      };
    }

    throw new Error('Failed to parse LLM response');
  } catch (error) {
    console.error('Error analyzing anomaly with LLM:', error);
    return {
      anomalyType: 'unusual_failure_pattern',
      explanation: 'Test run shows unusual patterns compared to baseline',
      affectedTests: [],
      suggestedAction: 'Review test logs and recent code changes',
    };
  }
}

/**
 * Fetch historical test run data for baseline comparison
 */
export async function fetchHistoricalTestRuns(
  suiteId?: string,
  lookbackDays: number = 30,
  limit: number = 20
): Promise<TestRunLogData[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

    let query = supabase
      .from('test_runs')
      .select('id, status, created_at, duration_ms, suite_id')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (suiteId) {
      query = query.eq('suite_id', suiteId);
    }

    const { data: runs, error } = await query;

    if (error) throw error;

    const enrichedRuns: TestRunLogData[] = [];

    for (const run of runs || []) {
      // Get test results
      const { data: results } = await supabase
        .from('test_results')
        .select('id, status, errors, console_logs, test_name')
        .eq('run_id', run.id);

      const totalTests = results?.length || 0;
      const passedTests = results?.filter(r => r.status === 'pass').length || 0;
      const failedTests = results?.filter(r => r.status === 'fail').length || 0;

      const allErrors = results?.flatMap(r => r.errors || []) || [];
      const allLogs = results?.flatMap(r => r.console_logs || []) || [];
      const testNames = results?.map(r => r.test_name).filter(Boolean) as string[] || [];

      enrichedRuns.push({
        runId: run.id,
        status: run.status,
        createdAt: run.created_at,
        durationMs: run.duration_ms,
        totalTests,
        passedTests,
        failedTests,
        errors: allErrors,
        consoleLogs: allLogs,
        testNames,
      });
    }

    return enrichedRuns;
  } catch (error) {
    console.error('Error fetching historical test runs:', error);
    return [];
  }
}
