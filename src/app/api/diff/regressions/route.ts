import { NextRequest, NextResponse } from 'next/server';
import {
  getRegressions,
  getRegressionStats,
  getRegressionTrends,
} from '@/lib/supabase/visualRegressions';

/**
 * GET /api/diff/regressions?testRunId=xxx&status=pending&isSignificant=true
 * Get visual regressions for a test run with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testRunId = searchParams.get('testRunId');
    const suiteId = searchParams.get('suiteId');
    const status = searchParams.get('status');
    const isSignificant = searchParams.get('isSignificant');
    const getTrends = searchParams.get('trends') === 'true';
    const getStats = searchParams.get('stats') === 'true';
    const daysBack = parseInt(searchParams.get('daysBack') || '30');

    // If requesting trends
    if (getTrends && suiteId) {
      const trends = await getRegressionTrends(suiteId, daysBack);
      return NextResponse.json({
        success: true,
        trends,
      });
    }

    // If requesting stats
    if (getStats && testRunId) {
      const stats = await getRegressionStats(testRunId);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Default: get regressions list
    if (!testRunId) {
      return NextResponse.json(
        { error: 'Missing required parameter: testRunId' },
        { status: 400 }
      );
    }

    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (isSignificant !== null) {
      filters.isSignificant = isSignificant === 'true';
    }

    const regressions = await getRegressions(testRunId, filters);

    return NextResponse.json({
      success: true,
      count: regressions.length,
      regressions: regressions.map(r => ({
        id: r.id,
        testName: r.test_name,
        viewport: r.viewport,
        stepName: r.step_name,
        baselineScreenshotUrl: r.baseline_screenshot_url,
        currentScreenshotUrl: r.current_screenshot_url,
        diffScreenshotUrl: r.diff_screenshot_url,
        pixelsDifferent: r.pixels_different,
        percentageDifferent: r.percentage_different,
        dimensions: {
          width: r.dimensions_width,
          height: r.dimensions_height,
        },
        threshold: r.threshold,
        isSignificant: r.is_significant,
        status: r.status,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        notes: r.notes,
        aiAnalysis: r.ai_analysis,
        createdAt: r.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Get regressions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch regressions' },
      { status: 500 }
    );
  }
}
