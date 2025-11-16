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
    const result = await runTestScenarios(page, options, screenshots, consoleLogs);

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
 * Execute a single flow step with retry logic
 */
async function executeFlowStep(
  page: Page,
  step: any,
  screenshots: Array<{ buffer: Buffer; stepName: string; timestamp: number }>,
  screenshotOnEveryStep: boolean,
  consoleLogs: ConsoleLog[]
): Promise<void> {
  const { type, config } = step;

  switch (type) {
    case 'navigate':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Navigating to ${config.url}`,
        timestamp: new Date().toISOString(),
      });
      await page.goto(config.url || '', { waitUntil: 'networkidle', timeout: 30000 });
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Page loaded successfully`,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'click':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Clicking element: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const clickLocator = page.locator(config.selector || '');
      // Wait for element to be visible and scroll into view
      await clickLocator.waitFor({ state: 'visible', timeout: 10000 });
      await clickLocator.scrollIntoViewIfNeeded();
      // Try normal click first, then force click if intercepted
      try {
        await clickLocator.click({ timeout: 5000 });
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Click successful`,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        // If click was intercepted, use force
        if (error.message.includes('intercept')) {
          consoleLogs.push({
            type: 'warn',
            message: `[Playwright] Element intercepted, using force click`,
            timestamp: new Date().toISOString(),
          });
          await clickLocator.click({ force: true });
        } else {
          throw error;
        }
      }
      break;

    case 'fill':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Filling field: ${config.selector} with "${config.value}"`,
        timestamp: new Date().toISOString(),
      });
      const fillLocator = page.locator(config.selector || '');
      await fillLocator.waitFor({ state: 'visible', timeout: 10000 });
      await fillLocator.scrollIntoViewIfNeeded();
      await fillLocator.fill(config.value || '');
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Field filled successfully`,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'select':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Selecting option: ${config.value} from ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const selectLocator = page.locator(config.selector || '');
      await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
      await selectLocator.scrollIntoViewIfNeeded();
      await selectLocator.selectOption(config.value || '');
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Option selected successfully`,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'hover':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Hovering over element: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const hoverLocator = page.locator(config.selector || '');
      await hoverLocator.waitFor({ state: 'visible', timeout: 10000 });
      await hoverLocator.scrollIntoViewIfNeeded();
      await hoverLocator.hover();
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Hover successful`,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'verify':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Verifying element: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const verifyLocator = page.locator(config.selector || '');
      await verifyLocator.waitFor({ state: 'visible', timeout: 10000 });
      if (config.expectedResult) {
        const text = await verifyLocator.textContent();
        if (!text?.includes(config.expectedResult)) {
          throw new Error(`Expected text "${config.expectedResult}" not found in element "${config.selector}"`);
        }
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Verification passed: found "${config.expectedResult}"`,
          timestamp: new Date().toISOString(),
        });
      } else {
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Element is visible`,
          timestamp: new Date().toISOString(),
        });
      }
      break;

    case 'wait':
      if (config.selector) {
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Waiting for element: ${config.selector}`,
          timestamp: new Date().toISOString(),
        });
        await page.locator(config.selector || '').waitFor({ state: 'visible', timeout: config.timeout || 30000 });
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Element appeared`,
          timestamp: new Date().toISOString(),
        });
      } else {
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Waiting ${config.timeout || 3000}ms`,
          timestamp: new Date().toISOString(),
        });
        await page.waitForTimeout(config.timeout || 3000);
      }
      break;

    case 'screenshot':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Taking screenshot: ${config.description || 'manual-screenshot'}`,
        timestamp: new Date().toISOString(),
      });
      const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
      screenshots.push({
        buffer: screenshot,
        stepName: config.description || 'manual-screenshot',
        timestamp: Date.now(),
      });
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Screenshot captured`,
        timestamp: new Date().toISOString(),
      });
      break;

    default:
      console.warn(`Unknown step type: ${type}`);
  }

  // Capture screenshot after step if enabled
  if (screenshotOnEveryStep) {
    const stepScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    screenshots.push({
      buffer: stepScreenshot,
      stepName: `${type}-${config.description || 'step'}`,
      timestamp: Date.now(),
    });
  }
}

/**
 * Run test scenarios extracted from test code
 */
async function runTestScenarios(
  page: Page,
  options: TestExecutionOptions,
  screenshots: Array<{ buffer: Buffer; stepName: string; timestamp: number }>,
  consoleLogs: ConsoleLog[]
): Promise<{ passed: boolean; errors: ErrorObject[] }> {
  const errors: ErrorObject[] = [];

  try {
    // Parse flow steps from test code (expecting JSON)
    let flowSteps: any[] = [];
    try {
      const parsedCode = JSON.parse(options.testCode);
      flowSteps = parsedCode.steps || parsedCode || [];
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Parsed ${flowSteps.length} test steps`,
        timestamp: new Date().toISOString(),
      });
    } catch (parseError) {
      // If parsing fails, it might be Playwright code string
      // For now, just navigate to the target URL
      console.warn('Could not parse test code as JSON, using basic navigation');
      flowSteps = [];
    }

    // Navigate to target URL first
    consoleLogs.push({
      type: 'info',
      message: `[Playwright] Navigating to target URL: ${options.targetUrl}`,
      timestamp: new Date().toISOString(),
    });
    await page.goto(options.targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    consoleLogs.push({
      type: 'info',
      message: `[Playwright] Page loaded successfully`,
      timestamp: new Date().toISOString(),
    });

    // Capture initial screenshot
    consoleLogs.push({
      type: 'info',
      message: `[Playwright] Capturing initial screenshot`,
      timestamp: new Date().toISOString(),
    });
    const initialScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    screenshots.push({
      buffer: initialScreenshot,
      stepName: 'initial-load',
      timestamp: Date.now(),
    });

    // Execute each flow step
    for (let i = 0; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Executing step ${i + 1}/${flowSteps.length}: ${step.type}`,
        timestamp: new Date().toISOString(),
      });
      try {
        await executeFlowStep(page, step, screenshots, options.screenshotOnEveryStep, consoleLogs);
      } catch (stepError: any) {
        consoleLogs.push({
          type: 'error',
          message: `[Playwright] Step ${i + 1} failed: ${stepError.message}`,
          timestamp: new Date().toISOString(),
        });
        errors.push({
          message: `Step ${i + 1} failed: ${stepError.message}`,
          stack: stepError.stack,
        });

        // Capture error screenshot
        try {
          const errorScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
          screenshots.push({
            buffer: errorScreenshot,
            stepName: `step-${i + 1}-error`,
            timestamp: Date.now(),
          });
        } catch (screenshotError) {
          console.error('Failed to capture error screenshot:', screenshotError);
        }

        // Continue with next step (or break if you want to stop on first error)
        // break; // Uncomment to stop on first error
      }
    }

    // Capture final screenshot
    consoleLogs.push({
      type: 'info',
      message: `[Playwright] Capturing final screenshot`,
      timestamp: new Date().toISOString(),
    });
    const finalScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    screenshots.push({
      buffer: finalScreenshot,
      stepName: 'final-state',
      timestamp: Date.now(),
    });

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
