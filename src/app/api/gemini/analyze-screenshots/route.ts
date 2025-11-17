import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithRetry } from '@/lib/gemini/visualInspector';

export const maxDuration = 300; // 5 minutes

/**
 * Analyze screenshots without persisting to database
 * Used for preview/instant analysis in Designer module
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screenshots, analysisType = 'comprehensive', context } = body;

    if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
      return NextResponse.json(
        { error: 'At least one screenshot URL is required' },
        { status: 400 }
      );
    }

    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Prepare context
    const analysisContext = {
      testName: context?.testName || 'Designer Preview',
      viewport: context?.viewport || 'Multiple Viewports',
      targetUrl: context?.targetUrl || 'Unknown',
      testStatus: context?.testStatus || 'preview',
    };

    // Analyze screenshots
    const findings = await analyzeWithRetry(
      screenshots,
      analysisContext,
      analysisType
    );

    return NextResponse.json({
      success: true,
      findingsCount: findings.length,
      findings,
      meta: {
        screenshotCount: screenshots.length,
        analysisType,
      },
    });
  } catch (error: any) {
    console.error('Screenshot analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Screenshot analysis failed' },
      { status: 500 }
    );
  }
}
