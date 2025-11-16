import { NextRequest, NextResponse } from 'next/server';
import { executeTest } from '@/lib/playwright/runner';
import { createTestRun, saveTestResult, updateTestRunStatus } from '@/lib/supabase/testRuns';
import { getTestSuite, getLatestTestCode } from '@/lib/supabase/testSuites';
import { uploadScreenshot, ScreenshotMetadata } from '@/lib/storage/screenshots';
import { ViewportConfig } from '@/lib/types';

export const maxDuration = 300; // 5 minutes max execution time

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suiteId, viewports, screenshotOnEveryStep = false } = body;

    if (!suiteId || !viewports || viewports.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: suiteId and viewports' },
        { status: 400 }
      );
    }

    // Fetch test suite and test code
    const suite = await getTestSuite(suiteId);
    if (!suite) {
      return NextResponse.json({ error: 'Test suite not found' }, { status: 404 });
    }

    const testCode = await getLatestTestCode(suiteId);
    if (!testCode) {
      return NextResponse.json({ error: 'No test code found for this suite' }, { status: 404 });
    }

    // Create test run
    const testRunId = await createTestRun(suiteId, { viewports });

    const results = [];

    // Execute tests for each viewport
    for (const viewport of viewports) {
      try {
        const result = await executeTest({
          testCode: testCode.code,
          viewport,
          testRunId,
          testSuiteName: suite.name,
          targetUrl: suite.target_url,
          screenshotOnEveryStep,
        });

        // Upload screenshots
        const screenshotUrls: string[] = [];
        for (const screenshot of result.screenshots) {
          try {
            const metadata: ScreenshotMetadata = {
              testRunId,
              testName: result.testName,
              stepName: screenshot.stepName,
              viewport: result.viewport,
              timestamp: screenshot.timestamp,
            };
            const url = await uploadScreenshot(screenshot.buffer, metadata);
            screenshotUrls.push(url);
          } catch (error) {
            console.error('Failed to upload screenshot:', error);
          }
        }

        // Save test result
        await saveTestResult(testRunId, {
          viewport: result.viewport,
          viewportSize: result.viewportSize,
          testName: result.testName,
          status: result.status,
          durationMs: result.durationMs,
          screenshots: screenshotUrls,
          errors: result.errors,
          consoleLogs: result.consoleLogs,
        });

        results.push({
          viewport: result.viewport,
          status: result.status,
          durationMs: result.durationMs,
          consoleLogs: result.consoleLogs || [],
          errors: result.errors || [],
          screenshots: screenshotUrls,
        });
      } catch (error: any) {
        console.error(`Test execution failed for viewport ${viewport}:`, error);
        results.push({
          viewport: getViewportName(viewport),
          status: 'fail',
          error: error.message,
          consoleLogs: [],
          errors: [{ message: error.message, stack: error.stack }],
          screenshots: [],
        });
      }
    }

    // Update test run status
    const allPassed = results.every(r => r.status === 'pass');
    await updateTestRunStatus(testRunId, allPassed ? 'completed' : 'failed');

    return NextResponse.json({
      success: true,
      testRunId,
      results,
    });
  } catch (error: any) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Test execution failed' },
      { status: 500 }
    );
  }
}

function getViewportName(viewport: ViewportConfig): string {
  if (viewport.mobile) return 'mobile';
  if (viewport.tablet) return 'tablet';
  if (viewport.desktop) return 'desktop';
  return 'unknown';
}
