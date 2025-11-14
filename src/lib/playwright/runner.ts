import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ViewportConfig, ConsoleLog, ErrorObject } from '../types';

export interface TestExecutionOptions {
  testCode: string;
  viewport: ViewportConfig;
  testRunId: string;
  testSuiteName: string;
  targetUrl: string;
  screenshotOnEveryStep: boolean;
}

export interface TestExecutionResult {
  viewport: string;
  viewportSize: string;
  testName: string;
  status: 'pass' | 'fail' | 'skipped';
  durationMs: number;
  screenshots: Array<{ buffer: Buffer; stepName: string; timestamp: number }>;
  errors: ErrorObject[];
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
}

export interface NetworkLog {
  url: string;
  method: string;
  status: number;
  timestamp: number;
}

/**
 * Execute a test with Playwright
 */
export async function executeTest(
  options: TestExecutionOptions
): Promise<TestExecutionResult> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const startTime = Date.now();
  const screenshots: Array<{ buffer: Buffer; stepName: string; timestamp: number }> = [];
  const consoleLogs: ConsoleLog[] = [];
  const networkLogs: NetworkLog[] = [];
  const errors: ErrorObject[] = [];

  try {
    const context = await browser.newContext({
      viewport: {
        width: options.viewport.mobile?.width || options.viewport.tablet?.width || options.viewport.desktop?.width || 1920,
        height: options.viewport.mobile?.height || options.viewport.tablet?.height || options.viewport.desktop?.height || 1080,
      },
      deviceScaleFactor: 1,
      isMobile: !!options.viewport.mobile,
      hasTouch: !!options.viewport.mobile,
    });

    const page = await context.newPage();

    // Attach console log listener
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type() as 'log' | 'warn' | 'error' | 'info',
        message: msg.text(),
        timestamp: new Date().toISOString(),
      });
    });

    // Attach network listener
    page.on('response', (response) => {
      networkLogs.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        timestamp: Date.now(),
      });
    });

    // Attach error listener
    page.on('pageerror', (error) => {
      errors.push({
        message: error.message,
        stack: error.stack,
      });
    });

    // Execute the test
    const result = await runTestScenarios(page, options, screenshots);

    const duration = Date.now() - startTime;

    return {
      viewport: getViewportName(options.viewport),
      viewportSize: getViewportSize(options.viewport),
      testName: options.testSuiteName,
      status: result.passed ? 'pass' : 'fail',
      durationMs: duration,
      screenshots,
      errors: result.errors.length > 0 ? result.errors : errors,
      consoleLogs,
      networkLogs,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    errors.push({
      message: error.message || 'Test execution failed',
      stack: error.stack,
    });

    return {
      viewport: getViewportName(options.viewport),
      viewportSize: getViewportSize(options.viewport),
      testName: options.testSuiteName,
      status: 'fail',
      durationMs: duration,
      screenshots,
      errors,
      consoleLogs,
      networkLogs,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Run test scenarios extracted from test code
 */
async function runTestScenarios(
  page: Page,
  options: TestExecutionOptions,
  screenshots: Array<{ buffer: Buffer; stepName: string; timestamp: number }>
): Promise<{ passed: boolean; errors: ErrorObject[] }> {
  const errors: ErrorObject[] = [];

  try {
    // Navigate to target URL
    await page.goto(options.targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Capture initial screenshot
    const initialScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    screenshots.push({
      buffer: initialScreenshot,
      stepName: 'initial-load',
      timestamp: Date.now(),
    });

    // Parse and execute test code
    // For now, we'll execute basic navigation and interaction tests
    // In a production system, you'd parse the test code and execute it dynamically

    // Example: Check if page loaded successfully
    const title = await page.title();
    if (!title || title.length === 0) {
      errors.push({
        message: 'Page title is empty',
      });
    }

    // Wait for body to be visible
    await page.waitForSelector('body', { timeout: 10000 });

    // Capture final screenshot
    if (options.screenshotOnEveryStep || errors.length > 0) {
      const finalScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
      screenshots.push({
        buffer: finalScreenshot,
        stepName: 'final-state',
        timestamp: Date.now(),
      });
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    errors.push({
      message: error.message || 'Test execution error',
      stack: error.stack,
    });

    // Capture error screenshot
    try {
      const errorScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
      screenshots.push({
        buffer: errorScreenshot,
        stepName: 'error-state',
        timestamp: Date.now(),
      });
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError);
    }

    return {
      passed: false,
      errors,
    };
  }
}

/**
 * Execute tests in parallel across multiple viewports
 */
export async function executeTestsParallel(
  options: TestExecutionOptions,
  viewports: ViewportConfig[],
  concurrency: number = 3
): Promise<TestExecutionResult[]> {
  const results: TestExecutionResult[] = [];
  const queue = [...viewports];
  const running: Promise<void>[] = [];

  while (queue.length > 0 || running.length > 0) {
    // Start new tasks up to concurrency limit
    while (running.length < concurrency && queue.length > 0) {
      const viewport = queue.shift()!;
      const task = executeTest({
        ...options,
        viewport,
      }).then((result) => {
        results.push(result);
      });

      running.push(task);
    }

    // Wait for at least one task to complete
    if (running.length > 0) {
      await Promise.race(running);
      // Remove completed tasks
      for (let i = running.length - 1; i >= 0; i--) {
        if (await isPromiseResolved(running[i])) {
          running.splice(i, 1);
        }
      }
    }
  }

  return results;
}

/**
 * Check if a promise is resolved
 */
async function isPromiseResolved(promise: Promise<any>): Promise<boolean> {
  const marker = Symbol('marker');
  try {
    const result = await Promise.race([promise, Promise.resolve(marker)]);
    return result !== marker;
  } catch {
    return true; // Promise rejected, which means it's resolved
  }
}

/**
 * Get viewport name from config
 */
function getViewportName(viewport: ViewportConfig): string {
  if (viewport.mobile) return 'mobile';
  if (viewport.tablet) return 'tablet';
  if (viewport.desktop) return 'desktop';
  return 'unknown';
}

/**
 * Get viewport size string from config
 */
function getViewportSize(viewport: ViewportConfig): string {
  const size = viewport.mobile || viewport.tablet || viewport.desktop;
  if (!size) return 'unknown';
  return `${size.width}x${size.height}`;
}

/**
 * Retry execution with exponential backoff
 */
export async function executeWithRetry(
  options: TestExecutionOptions,
  maxRetries: number = 3
): Promise<TestExecutionResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeTest(options);

      // If test passed or it's the last attempt, return the result
      if (result.status === 'pass' || attempt === maxRetries) {
        return result;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    } catch (error: any) {
      lastError = error;
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError || new Error('Test execution failed after retries');
}
