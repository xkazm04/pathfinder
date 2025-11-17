import { NextRequest, NextResponse } from 'next/server';
import { updateTestRunStatus } from '@/lib/supabase/testRuns';

export async function POST(request: NextRequest) {
  try {
    const { runId } = await request.json();

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    // Update test run status to cancelled
    await updateTestRunStatus(runId, 'cancelled');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to cancel test run:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel test run' },
      { status: 500 }
    );
  }
}
