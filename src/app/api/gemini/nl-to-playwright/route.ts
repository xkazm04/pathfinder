import { NextRequest, NextResponse } from 'next/server';
import {
  convertNLToPlaywrightWithRetry,
  type NLTestRequest,
} from '@/lib/gemini/nlToPlaywright';
import { supabase } from '@/lib/supabase';

export const maxDuration = 300; // 5 minutes

/**
 * POST /api/gemini/nl-to-playwright
 * Convert natural language description to Playwright test code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      targetUrl,
      viewport = 'Desktop HD (1920x1080)',
      additionalContext,
      suiteId,
    } = body;

    // Validate required fields
    if (!description || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: description and targetUrl' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Description is too short. Please provide more details.' },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: 'Description is too long. Please keep it under 5000 characters.' },
        { status: 400 }
      );
    }

    // Prepare request
    const nlRequest: NLTestRequest = {
      description,
      targetUrl,
      viewport,
      additionalContext,
    };

    // Generate test code with retry
    const result = await convertNLToPlaywrightWithRetry(nlRequest);

    // Save example for learning (async, don't wait)
    saveNLExample({
      nlDescription: description,
      generatedCode: result.code,
      targetUrl,
      viewport,
      suiteId,
      testType: 'functional', // Could be determined by analysis
      metadata: {
        testName: result.testName,
        steps: result.steps,
        confidence: result.confidence,
      },
    }).catch(err => {
      console.error('Failed to save NL example:', err);
    });

    return NextResponse.json({
      success: true,
      code: result.code,
      testName: result.testName,
      steps: result.steps,
      confidence: result.confidence,
      message: result.confidence < 50
        ? 'Generated with low confidence. Please review and edit as needed.'
        : result.confidence < 75
        ? 'Generated successfully. Please review before executing.'
        : 'Generated with high confidence.',
    });
  } catch (error: any) {
    console.error('NL to Playwright conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test code' },
      { status: 500 }
    );
  }
}

/**
 * Save NL example to database for learning
 */
async function saveNLExample(data: {
  nlDescription: string;
  generatedCode: string;
  targetUrl: string;
  viewport: string;
  suiteId?: string;
  testType?: string;
  metadata?: any;
}): Promise<void> {
  try {
    await supabase.from('nl_test_examples').insert({
      nl_description: data.nlDescription,
      generated_code: data.generatedCode,
      target_url: data.targetUrl,
      viewport: data.viewport,
      suite_id: data.suiteId || null,
      test_type: data.testType || 'functional',
      metadata: data.metadata || null,
    });
  } catch (error) {
    console.error('Failed to save NL example:', error);
    // Don't throw - this is optional
  }
}
