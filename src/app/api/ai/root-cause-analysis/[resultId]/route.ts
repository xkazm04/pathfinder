import { NextRequest, NextResponse } from 'next/server';
import { getRootCauseAnalysis } from '@/lib/supabase/rootCauseAnalysis';

/**
 * API Route: Get cached root cause analysis for a test result
 * GET /api/ai/root-cause-analysis/[resultId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const { resultId } = await params;

    if (!resultId) {
      return NextResponse.json(
        { error: 'Result ID is required' },
        { status: 400 }
      );
    }

    const analysis = await getRootCauseAnalysis(resultId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis found for this result' },
        { status: 404 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error getting root cause analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get root cause analysis' },
      { status: 500 }
    );
  }
}
