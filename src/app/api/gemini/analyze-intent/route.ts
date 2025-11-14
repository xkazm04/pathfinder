import { NextRequest, NextResponse } from 'next/server';
import { analyzeIntent } from '@/lib/nl-test/intentAnalyzer';

export const maxDuration = 60; // 1 minute

/**
 * POST /api/gemini/analyze-intent
 * Analyze natural language test description to validate and parse intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, targetUrl } = body;

    // Validate required fields
    if (!description) {
      return NextResponse.json(
        { error: 'Missing required field: description' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 5) {
      return NextResponse.json(
        {
          error: 'Description is too short',
          analysis: {
            isValid: false,
            confidence: 0,
            testType: 'functional',
            steps: [],
            requiredSelectors: [],
            warnings: ['Description is too short to analyze'],
            suggestions: ['Provide more details about what you want to test'],
            missingInfo: ['Test description'],
          },
        },
        { status: 400 }
      );
    }

    // Analyze intent
    const analysis = await analyzeIntent(description, targetUrl);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Intent analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze intent' },
      { status: 500 }
    );
  }
}
