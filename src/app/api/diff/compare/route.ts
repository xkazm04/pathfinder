import { NextRequest, NextResponse } from 'next/server';
import { compareScreenshots } from '@/lib/diff/screenshotComparator';
import { saveVisualRegression, getIgnoreRegions, getThreshold } from '@/lib/supabase/visualRegressions';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/diff/compare
 * Compare two screenshots
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      baselineUrl,
      currentUrl,
      testRunId,
      baselineRunId,
      testName,
      viewport,
      stepName,
      suiteId,
      thresholdOverride,
    } = body;

    // Validate required fields
    if (!baselineUrl || !currentUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: baselineUrl and currentUrl' },
        { status: 400 }
      );
    }

    if (!testRunId || !testName || !viewport) {
      return NextResponse.json(
        { error: 'Missing required fields: testRunId, testName, viewport' },
        { status: 400 }
      );
    }

    // Get ignore regions if suiteId provided
    let ignoreRegions = undefined;
    if (suiteId) {
      try {
        ignoreRegions = await getIgnoreRegions(suiteId, testName, viewport);
      } catch (error) {
        console.error('Failed to fetch ignore regions:', error);
        // Continue without ignore regions
      }
    }

    // Get threshold
    let threshold = thresholdOverride;
    if (!threshold && suiteId) {
      try {
        threshold = await getThreshold(suiteId, viewport);
      } catch (error) {
        console.error('Failed to fetch threshold:', error);
        threshold = 0.1; // Default 10%
      }
    }

    // Perform comparison
    const comparison = await compareScreenshots(baselineUrl, currentUrl, {
      threshold: threshold || 0.1,
      includeAntialiasing: false,
      ignoreRegions: ignoreRegions && ignoreRegions.length > 0 ? ignoreRegions : undefined,
    });

    // Save regression if testRunId provided
    let regressionId: string | undefined;
    if (testRunId) {
      try {
        regressionId = await saveVisualRegression(
          testRunId,
          baselineRunId || null,
          testName,
          viewport,
          comparison,
          stepName
        );
      } catch (error: any) {
        console.error('Failed to save regression:', error);
        return NextResponse.json(
          { error: `Comparison succeeded but failed to save: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      comparison: {
        pixelsDifferent: comparison.pixelsDifferent,
        percentageDifferent: comparison.percentageDifferent,
        diffImageUrl: comparison.diffImageUrl,
        baselineUrl: comparison.baselineUrl,
        currentUrl: comparison.currentUrl,
        dimensions: comparison.dimensions,
        threshold: comparison.threshold,
        isSignificant: comparison.isSignificant,
      },
      regressionId,
    });
  } catch (error: any) {
    console.error('Screenshot comparison error:', error);
    return NextResponse.json(
      { error: error.message || 'Screenshot comparison failed' },
      { status: 500 }
    );
  }
}
