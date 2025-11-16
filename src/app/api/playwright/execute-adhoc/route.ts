import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const maxDuration = 120;

interface ExecuteAdhocRequest {
  testCode: string;
  targetUrl: string;
  testName: string;
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Execute ad-hoc Playwright test code for validation
 * POST /api/playwright/execute-adhoc
 */
export async function POST(request: Request) {
  let browser;
  let tempDir: string | null = null;

  try {
    const body: ExecuteAdhocRequest = await request.json();
    const { testCode, targetUrl, testName, viewport } = body;

    if (!testCode || !targetUrl) {
      return NextResponse.json(
        { error: 'testCode and targetUrl are required' },
        { status: 400 }
      );
    }

    // Create temporary directory for test file
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'playwright-adhoc-'));
    const testFilePath = path.join(tempDir, 'test.spec.ts');

    // Write test code to file
    await fs.writeFile(testFilePath, testCode, 'utf-8');

    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: viewport || { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    // Capture console logs
    const consoleLogs: Array<{ type: string; message: string; timestamp: string }> = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        message: msg.text(),
        timestamp: new Date().toISOString(),
      });
    });

    // Capture errors
    const errors: Array<{ message: string; stack?: string }> = [];
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
      });
    });

    const startTime = Date.now();
    let status: 'pass' | 'fail' = 'pass';

    try {
      // Execute the test code dynamically
      // For simplicity, we'll parse and execute each step manually
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Extract and execute steps from test code
      const stepMatches = testCode.matchAll(/await\s+(page\.[^;]+);/g);
      for (const match of stepMatches) {
        const statement = match[1];

        // Skip the goto since we already navigated
        if (statement.includes('page.goto')) {
          continue;
        }

        try {
          // Evaluate the statement
          await eval(`(async () => { await ${statement}; })()`);
        } catch (stepError: unknown) {
          const errorMessage = stepError instanceof Error ? stepError.message : 'Step execution failed';
          errors.push({
            message: `Failed to execute: ${statement} - ${errorMessage}`,
          });
          status = 'fail';
          break;
        }
      }

      // If no errors occurred, test passed
      if (errors.length === 0) {
        status = 'pass';
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Test execution failed';
      status = 'fail';
      errors.push({
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    const durationMs = Date.now() - startTime;

    await browser.close();

    // Clean up temp directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    return NextResponse.json({
      success: true,
      status,
      testName,
      durationMs,
      consoleLogs,
      errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    if (browser) {
      await browser.close();
    }

    // Clean up temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Test execution failed';
    console.error('Ad-hoc execution error:', error);

    return NextResponse.json(
      {
        error: errorMessage,
        status: 'fail',
      },
      { status: 500 }
    );
  }
}
