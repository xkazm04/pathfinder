import { NextResponse } from 'next/server';
import { chromium, Page } from 'playwright';

export const maxDuration = 120;

interface ExecuteAdhocRequest {
  flowSteps?: any[];
  testCode?: string; // Deprecated, kept for backward compatibility
  targetUrl: string;
  testName: string;
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Execute a single flow step with retry logic
 */
async function executeFlowStep(page: Page, step: any): Promise<void> {
  const { type, config } = step;

  switch (type) {
    case 'navigate':
      await page.goto(config.url || '', { waitUntil: 'networkidle', timeout: 30000 });
      break;

    case 'click':
      const clickLocator = page.locator(config.selector || '');
      // Wait for element to be visible and scroll into view
      await clickLocator.waitFor({ state: 'visible', timeout: 10000 });
      await clickLocator.scrollIntoViewIfNeeded();
      // Try normal click first, then force click if intercepted
      try {
        await clickLocator.click({ timeout: 5000 });
      } catch (error: any) {
        // If click was intercepted, use force
        if (error.message.includes('intercept')) {
          await clickLocator.click({ force: true });
        } else {
          throw error;
        }
      }
      break;

    case 'fill':
      const fillLocator = page.locator(config.selector || '');
      await fillLocator.waitFor({ state: 'visible', timeout: 10000 });
      await fillLocator.scrollIntoViewIfNeeded();
      await fillLocator.fill(config.value || '');
      break;

    case 'select':
      const selectLocator = page.locator(config.selector || '');
      await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
      await selectLocator.scrollIntoViewIfNeeded();
      await selectLocator.selectOption(config.value || '');
      break;

    case 'hover':
      const hoverLocator = page.locator(config.selector || '');
      await hoverLocator.waitFor({ state: 'visible', timeout: 10000 });
      await hoverLocator.scrollIntoViewIfNeeded();
      await hoverLocator.hover();
      break;

    case 'verify':
      const verifyLocator = page.locator(config.selector || '');
      await verifyLocator.waitFor({ state: 'visible', timeout: 10000 });
      if (config.expectedResult) {
        const text = await verifyLocator.textContent();
        if (!text?.includes(config.expectedResult)) {
          throw new Error(`Expected text "${config.expectedResult}" not found in element "${config.selector}"`);
        }
      }
      break;

    case 'wait':
      if (config.selector) {
        await page.locator(config.selector || '').waitFor({ state: 'visible', timeout: config.timeout || 30000 });
      } else {
        await page.waitForTimeout(config.timeout || 3000);
      }
      break;

    case 'screenshot':
      // Just a placeholder, screenshots are captured after each step in the main flow
      break;

    default:
      console.warn(`Unknown step type: ${type}`);
  }
}

/**
 * Execute ad-hoc Playwright test code for validation
 * POST /api/playwright/execute-adhoc
 */
export async function POST(request: Request) {
  let browser;

  try {
    const body: ExecuteAdhocRequest = await request.json();
    const { flowSteps, targetUrl, testName, viewport } = body;

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'targetUrl is required' },
        { status: 400 }
      );
    }

    if (!flowSteps || flowSteps.length === 0) {
      return NextResponse.json(
        { error: 'flowSteps are required' },
        { status: 400 }
      );
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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
      // Navigate to target URL first
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Execute each flow step
      for (let i = 0; i < flowSteps.length; i++) {
        const step = flowSteps[i];
        try {
          await executeFlowStep(page, step);
        } catch (stepError: unknown) {
          const errorMessage = stepError instanceof Error ? stepError.message : 'Step execution failed';
          errors.push({
            message: `Step ${i + 1} (${step.type}) failed: ${errorMessage}`,
            stack: stepError instanceof Error ? stepError.stack : undefined,
          });
          status = 'fail';
          // Continue with next step or break
          break; // Stop on first error
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
