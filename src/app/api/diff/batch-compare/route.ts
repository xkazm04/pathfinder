import { NextRequest, NextResponse } from 'next/server';
import { runRegressionAnalysis } from '@/lib/diff/comparisonOrchestrator';

export const maxDuration = 300; // 5 minutes for batch operations (Vercel hobby plan limit)

/**
 * POST /api/diff/batch-compare
 * Run automated regression analysis for an entire test run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testRunId } = body;

    if (!testRunId) {
      return NextResponse.json(
        { error: 'Missing required parameter: testRunId' },
        { status: 400 }
      );
    }

    // Run automated regression analysis
    const report = await runRegressionAnalysis(testRunId);

    if (!report.success) {
      return NextResponse.json(
        {
          success: false,
          message: report.message || 'Regression analysis failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        totalComparisons: report.totalComparisons,
        regressionsFound: report.regressionsFound,
        significantRegressions: report.significantRegressions,
        averageDifference: report.averageDifference,
        message: report.message,
      },
      details: report.details.map(d => ({
        testName: d.testName,
        viewport: d.viewport,
        stepName: d.stepName,
        regressionId: d.regressionId,
        comparison: {
          pixelsDifferent: d.comparison.pixelsDifferent,
          percentageDifferent: d.comparison.percentageDifferent,
          isSignificant: d.comparison.isSignificant,
          diffImageUrl: d.comparison.diffImageUrl,
        },
      })),
    });
  } catch (error: any) {
    console.error('Batch comparison error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch comparison failed' },
      { status: 500 }
    );
  }
}
