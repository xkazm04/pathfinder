import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithRetry } from '@/lib/gemini/visualInspector';
import { saveAIAnalysis } from '@/lib/supabase/aiAnalyses';
import { getTestResults } from '@/lib/supabase/testRuns';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testResultId, analysisType = 'comprehensive' } = body;

    if (!testResultId) {
      return NextResponse.json(
        { error: 'Missing required parameter: testResultId' },
        { status: 400 }
      );
    }

    // Fetch test result with screenshots
    const results = await getTestResults(testResultId);
    const testResult = results.find(r => r.id === testResultId);

    if (!testResult) {
      return NextResponse.json(
        { error: 'Test result not found' },
        { status: 404 }
      );
    }

    // Check if screenshots are available
    if (!testResult.screenshots || testResult.screenshots.length === 0) {
      return NextResponse.json(
        { error: 'No screenshots available for analysis' },
        { status: 400 }
      );
    }

    // Prepare context
    const context = {
      testName: testResult.test_name || 'Unknown Test',
      viewport: `${testResult.viewport} (${testResult.viewport_size})`,
      targetUrl: 'Test URL', // Would be fetched from test suite
      testStatus: testResult.status,
    };

    // Analyze screenshots
    const findings = await analyzeWithRetry(
      testResult.screenshots,
      context,
      analysisType
    );

    // Save analysis
    const analysisId = await saveAIAnalysis(
      testResultId,
      findings,
      analysisType
    );

    return NextResponse.json({
      success: true,
      analysisId,
      findingsCount: findings.length,
      findings,
    });
  } catch (error: any) {
    console.error('Visual analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Visual analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * Analyze entire test run
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testRunId } = body;

    if (!testRunId) {
      return NextResponse.json(
        { error: 'Missing required parameter: testRunId' },
        { status: 400 }
      );
    }

    // Fetch all test results for this run
    const results = await getTestResults(testRunId);

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No test results found for this run' },
        { status: 404 }
      );
    }

    const analysisResults = [];

    // Analyze each result
    for (const result of results) {
      if (!result.screenshots || result.screenshots.length === 0) {
        console.log(`Skipping result ${result.id} - no screenshots`);
        continue;
      }

      try {
        const context = {
          testName: result.test_name || 'Unknown Test',
          viewport: `${result.viewport} (${result.viewport_size})`,
          targetUrl: 'Test URL',
          testStatus: result.status,
        };

        const findings = await analyzeWithRetry(
          result.screenshots,
          context,
          'comprehensive'
        );

        const analysisId = await saveAIAnalysis(
          result.id,
          findings,
          'comprehensive'
        );

        analysisResults.push({
          resultId: result.id,
          analysisId,
          findingsCount: findings.length,
        });
      } catch (error: any) {
        console.error(`Failed to analyze result ${result.id}:`, error);
        analysisResults.push({
          resultId: result.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      analyzedResults: analysisResults.length,
      results: analysisResults,
    });
  } catch (error: any) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch analysis failed' },
      { status: 500 }
    );
  }
}
