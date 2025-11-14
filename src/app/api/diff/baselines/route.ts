import { NextRequest, NextResponse } from 'next/server';
import {
  setBaseline,
  getBaseline,
  clearBaseline,
} from '@/lib/supabase/visualRegressions';

/**
 * GET /api/diff/baselines?suiteId=xxx
 * Get baseline information for a test suite
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');

    if (!suiteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: suiteId' },
        { status: 400 }
      );
    }

    const baseline = await getBaseline(suiteId);

    if (!baseline || !baseline.baseline_run_id) {
      return NextResponse.json({
        hasBaseline: false,
        baseline: null,
      });
    }

    return NextResponse.json({
      hasBaseline: true,
      baseline: {
        baselineRunId: baseline.baseline_run_id,
        setAt: baseline.baseline_set_at,
        notes: baseline.baseline_notes,
      },
    });
  } catch (error: any) {
    console.error('Get baseline error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch baseline' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/diff/baselines
 * Set baseline for a test suite
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suiteId, runId, notes } = body;

    if (!suiteId || !runId) {
      return NextResponse.json(
        { error: 'Missing required fields: suiteId and runId' },
        { status: 400 }
      );
    }

    await setBaseline(suiteId, runId, notes);

    return NextResponse.json({
      success: true,
      message: 'Baseline set successfully',
    });
  } catch (error: any) {
    console.error('Set baseline error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set baseline' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/diff/baselines?suiteId=xxx
 * Clear baseline for a test suite
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');

    if (!suiteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: suiteId' },
        { status: 400 }
      );
    }

    await clearBaseline(suiteId);

    return NextResponse.json({
      success: true,
      message: 'Baseline cleared successfully',
    });
  } catch (error: any) {
    console.error('Clear baseline error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear baseline' },
      { status: 500 }
    );
  }
}
