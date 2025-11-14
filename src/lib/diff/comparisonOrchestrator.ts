import { compareScreenshots, type ComparisonResult } from './screenshotComparator';
import { getTestResults } from '../supabase/testRuns';
import { getBaseline, saveVisualRegression, getThreshold, getIgnoreRegions } from '../supabase/visualRegressions';
import { supabase } from '../supabase';

export interface RegressionReport {
  success: boolean;
  message?: string;
  totalComparisons: number;
  regressionsFound: number;
  significantRegressions: number;
  averageDifference: number;
  details: ComparisonDetail[];
}

export interface ComparisonDetail {
  testName: string;
  viewport: string;
  stepName?: string;
  comparison: ComparisonResult;
  regressionId: string;
}

interface ScreenshotPair {
  baseline: {
    url: string;
    stepName?: string;
  };
  current: {
    url: string;
    stepName?: string;
  };
  testName: string;
  viewport: string;
  stepName?: string;
}

/**
 * Run automated regression analysis for a test run
 */
export async function runRegressionAnalysis(
  testRunId: string
): Promise<RegressionReport> {
  try {
    // Get test run details
    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .select('id, suite_id')
      .eq('id', testRunId)
      .single();

    if (runError || !testRun) {
      return {
        success: false,
        message: 'Test run not found',
        totalComparisons: 0,
        regressionsFound: 0,
        significantRegressions: 0,
        averageDifference: 0,
        details: [],
      };
    }

    // Get baseline for this suite
    const baseline = await getBaseline(testRun.suite_id);

    if (!baseline || !baseline.baseline_run_id) {
      return {
        success: false,
        message: 'No baseline set for this suite',
        totalComparisons: 0,
        regressionsFound: 0,
        significantRegressions: 0,
        averageDifference: 0,
        details: [],
      };
    }

    // Get test results from both runs
    const currentResults = await getTestResults(testRunId);
    const baselineResults = await getTestResults(baseline.baseline_run_id);

    // Match screenshots between baseline and current
    const pairs = matchScreenshots(currentResults, baselineResults);

    if (pairs.length === 0) {
      return {
        success: true,
        message: 'No matching screenshots found to compare',
        totalComparisons: 0,
        regressionsFound: 0,
        significantRegressions: 0,
        averageDifference: 0,
        details: [],
      };
    }

    // Get ignore regions for this suite
    const ignoreRegions = await getIgnoreRegions(testRun.suite_id);

    // Compare each pair
    const comparisons: ComparisonDetail[] = [];
    let totalDiff = 0;

    for (const pair of pairs) {
      try {
        // Get threshold for this viewport
        const threshold = await getThreshold(testRun.suite_id, pair.viewport);

        // Perform comparison
        const comparison = await compareScreenshots(
          pair.baseline.url,
          pair.current.url,
          {
            threshold,
            includeAntialiasing: false,
            ignoreRegions: ignoreRegions.length > 0 ? ignoreRegions : undefined,
          }
        );

        // Save comparison result
        const regressionId = await saveVisualRegression(
          testRunId,
          baseline.baseline_run_id,
          pair.testName,
          pair.viewport,
          comparison,
          pair.stepName
        );

        comparisons.push({
          testName: pair.testName,
          viewport: pair.viewport,
          stepName: pair.stepName,
          comparison,
          regressionId,
        });

        totalDiff += comparison.percentageDifferent;
      } catch (error: any) {
        console.error(`Failed to compare ${pair.testName} (${pair.viewport}):`, error);
        // Continue with other comparisons
      }
    }

    const total = comparisons.length;
    const significant = comparisons.filter(c => c.comparison.isSignificant).length;
    const avgDiff = total > 0 ? totalDiff / total : 0;

    return {
      success: true,
      totalComparisons: total,
      regressionsFound: total,
      significantRegressions: significant,
      averageDifference: Number(avgDiff.toFixed(2)),
      details: comparisons,
    };
  } catch (error: any) {
    console.error('Regression analysis error:', error);
    return {
      success: false,
      message: `Analysis failed: ${error.message}`,
      totalComparisons: 0,
      regressionsFound: 0,
      significantRegressions: 0,
      averageDifference: 0,
      details: [],
    };
  }
}

/**
 * Match screenshots between baseline and current test runs
 */
function matchScreenshots(
  current: any[],
  baseline: any[]
): ScreenshotPair[] {
  const pairs: ScreenshotPair[] = [];

  for (const currResult of current) {
    // Find matching baseline result (same test name and viewport)
    const baseResult = baseline.find(
      b => b.test_name === currResult.test_name &&
           b.viewport === currResult.viewport
    );

    if (!baseResult) continue;

    // Get screenshots from both results
    const currScreenshots = currResult.screenshots || [];
    const baseScreenshots = baseResult.screenshots || [];

    if (currScreenshots.length === 0 || baseScreenshots.length === 0) {
      continue;
    }

    // If screenshots are arrays of objects with stepName
    if (typeof currScreenshots[0] === 'object' && currScreenshots[0].stepName) {
      // Match by step name
      for (const currScreenshot of currScreenshots) {
        const baseScreenshot = baseScreenshots.find(
          (s: any) => s.stepName === currScreenshot.stepName
        );

        if (baseScreenshot) {
          pairs.push({
            baseline: {
              url: baseScreenshot.url || baseScreenshot,
              stepName: baseScreenshot.stepName,
            },
            current: {
              url: currScreenshot.url || currScreenshot,
              stepName: currScreenshot.stepName,
            },
            testName: currResult.test_name,
            viewport: currResult.viewport,
            stepName: currScreenshot.stepName,
          });
        }
      }
    } else {
      // Screenshots are just URLs - compare the first one
      const baseUrl = typeof baseScreenshots[0] === 'string'
        ? baseScreenshots[0]
        : baseScreenshots[0].url;
      const currUrl = typeof currScreenshots[0] === 'string'
        ? currScreenshots[0]
        : currScreenshots[0].url;

      if (baseUrl && currUrl) {
        pairs.push({
          baseline: { url: baseUrl },
          current: { url: currUrl },
          testName: currResult.test_name,
          viewport: currResult.viewport,
        });
      }
    }
  }

  return pairs;
}

/**
 * Quick check if baseline exists for a suite
 */
export async function hasBaseline(suiteId: string): Promise<boolean> {
  const baseline = await getBaseline(suiteId);
  return !!(baseline && baseline.baseline_run_id);
}

/**
 * Get comparison progress (for real-time updates)
 */
export function createProgressTracker() {
  let total = 0;
  let completed = 0;
  let callbacks: Array<(progress: { completed: number; total: number; percentage: number }) => void> = [];

  return {
    setTotal(count: number) {
      total = count;
    },
    increment() {
      completed++;
      this.notify();
    },
    notify() {
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      callbacks.forEach(cb => cb({ completed, total, percentage }));
    },
    onProgress(callback: (progress: { completed: number; total: number; percentage: number }) => void) {
      callbacks.push(callback);
    },
    getProgress() {
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      return { completed, total, percentage };
    },
  };
}
