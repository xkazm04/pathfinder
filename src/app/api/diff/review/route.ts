import { NextRequest, NextResponse } from 'next/server';
import { updateRegressionStatus } from '@/lib/supabase/visualRegressions';

/**
 * PUT /api/diff/review
 * Update regression status (approve, report as bug, mark as investigating, or false positive)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { regressionId, status, notes, reviewedBy } = body;

    if (!regressionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: regressionId and status' },
        { status: 400 }
      );
    }

    const validStatuses = ['approved', 'bug_reported', 'investigating', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    await updateRegressionStatus(regressionId, status, notes, reviewedBy);

    return NextResponse.json({
      success: true,
      message: 'Regression status updated successfully',
    });
  } catch (error: any) {
    console.error('Update regression status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update regression status' },
      { status: 500 }
    );
  }
}
