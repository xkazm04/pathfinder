import { NextRequest, NextResponse } from 'next/server';
import {
  getThreshold,
  setThreshold,
} from '@/lib/supabase/visualRegressions';

/**
 * GET /api/diff/thresholds?suiteId=xxx&viewport=xxx
 * Get threshold for a suite/viewport combination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');
    const viewport = searchParams.get('viewport') || undefined;

    if (!suiteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: suiteId' },
        { status: 400 }
      );
    }

    const threshold = await getThreshold(suiteId, viewport);

    return NextResponse.json({
      success: true,
      threshold,
      isDefault: threshold === 0.1,
    });
  } catch (error: any) {
    console.error('Get threshold error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch threshold' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/diff/thresholds
 * Set custom threshold for a suite/viewport
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suiteId, viewport, threshold } = body;

    if (!suiteId || !viewport || threshold === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: suiteId, viewport, and threshold' },
        { status: 400 }
      );
    }

    // Validate threshold is a number between 0 and 1
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be a number between 0 and 1 (e.g., 0.1 for 10%)' },
        { status: 400 }
      );
    }

    await setThreshold(suiteId, viewport, threshold);

    return NextResponse.json({
      success: true,
      message: 'Threshold set successfully',
      threshold,
    });
  } catch (error: any) {
    console.error('Set threshold error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set threshold' },
      { status: 500 }
    );
  }
}
