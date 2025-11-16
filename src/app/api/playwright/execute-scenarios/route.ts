import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser, Page } from 'playwright';
import { createTestRun, updateTestRunStatus } from '@/lib/supabase/testRuns';
import { getTestSuite } from '@/lib/supabase/testSuites';
import { getTestScenarios } from '@/lib/supabase/suiteAssets';
import { saveScenarioResult } from '@/lib/supabase/scenarioResults';
import { uploadScreenshot, ScreenshotMetadata } from '@/lib/storage/screenshots';
import type { ConsoleLog, ErrorObject } from '@/lib/types';

export const maxDuration = 300; // 5 minutes max execution time

interface ViewportConfig {
  mobile?: { width: number; height: number };
  tablet?: { width: number; height: number };
  desktop?: { width: number; height: number };
}

interface ScenarioExecutionResult {
  scenarioId: string;
  scenarioName: string;
  viewport: string;
  viewportSize: string;
  status: 'pass' | 'fail' | 'skipped';
  durationMs: number;
  startedAt: string;
  completedAt: string;
  screenshots: string[];
  consoleLogs: ConsoleLog[];
  errors: ErrorObject[];
  stepResults: any[];
}

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

    // Fetch test suite and scenarios
    const suite = await getTestSuite(suiteId);
    if (!suite) {
      return NextResponse.json({ error: 'Test suite not found' }, { status: 404 });
    }

    const scenarios = await getTestScenarios(suiteId);
    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json({ error: 'No test scenarios found for this suite' }, { status: 404 });
    }

    // Create test run
    const testRunId = await createTestRun(suiteId, { viewports, scenarioCount: scenarios.length });

    const results: ScenarioExecutionResult[] = [];

    // Execute scenarios for each viewport
    for (const viewport of viewports) {
      for (const scenario of scenarios) {
        try {
          const result = await executeScenario({
            scenario,
            viewport,
            testRunId,
            suiteName: suite.name,
            targetUrl: suite.target_url,
            screenshotOnEveryStep,
          });

          results.push(result);

          // Save scenario result to database
          await saveScenarioResult({
            run_id: testRunId,
            scenario_id: scenario.id!,
            viewport: result.viewport,
            viewport_size: result.viewportSize,
            status: result.status,
            duration_ms: result.durationMs,
            started_at: result.startedAt,
            completed_at: result.completedAt,
            screenshots: result.screenshots,
            console_logs: result.consoleLogs,
            errors: result.errors,
            step_results: result.stepResults,
          });
        } catch (error: any) {
          console.error(`Scenario execution failed for ${scenario.name}:`, error);
          results.push({
            scenarioId: scenario.id!,
            scenarioName: scenario.name,
            viewport: getViewportName(viewport),
            viewportSize: getViewportSize(viewport),
            status: 'fail',
            durationMs: 0,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            screenshots: [],
            consoleLogs: [],
            errors: [{ message: error.message, stack: error.stack }],
            stepResults: [],
          });
        }
      }
    }

    // Update test run status
    const allPassed = results.every(r => r.status === 'pass');
    await updateTestRunStatus(testRunId, allPassed ? 'completed' : 'failed');

    return NextResponse.json({
      success: true,
      testRunId,
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        skipped: results.filter(r => r.status === 'skipped').length,
      },
    });
  } catch (error: any) {
    console.error('Scenario execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Scenario execution failed' },
      { status: 500 }
    );
  }
}

async function executeScenario(options: {
  scenario: any;
  viewport: ViewportConfig;
  testRunId: string;
  suiteName: string;
  targetUrl: string;
  screenshotOnEveryStep: boolean;
}): Promise<ScenarioExecutionResult> {
  const { scenario, viewport, testRunId, suiteName, targetUrl, screenshotOnEveryStep } = options;

  const browser: Browser = await chromium.launch({ headless: true });
  const startTime = Date.now();
  const screenshots: string[] = [];
  const consoleLogs: ConsoleLog[] = [];
  const errors: ErrorObject[] = [];
  const stepResults: any[] = [];

  try {
    const viewportSize = getViewportSize(viewport);
    const [width, height] = viewportSize.split('x').map(Number);

    const context = await browser.newContext({
      viewport: { width, height },
      userAgent: 'Mozilla/5.0 (compatible; PathfinderBot/1.0)',
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

    // Attach error listener
    page.on('pageerror', (error) => {
      errors.push({
        message: error.message,
        stack: error.stack,
      });
    });

    // Navigate to target URL
    consoleLogs.push({
      type: 'info',
      message: `[Playwright] Navigating to ${targetUrl}`,
      timestamp: new Date().toISOString(),
    });
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Capture initial screenshot
    const initialScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    const initialMetadata: ScreenshotMetadata = {
      testRunId,
      testName: `${scenario.name} - Initial`,
      stepName: 'initial-load',
      viewport: getViewportName(viewport),
      timestamp: Date.now(),
    };
    const initialUrl = await uploadScreenshot(initialScreenshot, initialMetadata);
    screenshots.push(initialUrl);

    // Execute scenario steps
    const steps = scenario.steps || [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();

      try {
        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Executing step ${i + 1}/${steps.length}: ${step.type}`,
          timestamp: new Date().toISOString(),
        });

        await executeStep(page, step, consoleLogs);

        stepResults.push({
          stepIndex: i,
          stepType: step.type,
          status: 'pass',
          duration_ms: Date.now() - stepStartTime,
          message: `Step completed successfully`,
        });

        // Screenshot after each step if enabled
        if (screenshotOnEveryStep) {
          const stepScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
          const stepMetadata: ScreenshotMetadata = {
            testRunId,
            testName: `${scenario.name} - Step ${i + 1}`,
            stepName: `step-${i + 1}-${step.type}`,
            viewport: getViewportName(viewport),
            timestamp: Date.now(),
          };
          const stepUrl = await uploadScreenshot(stepScreenshot, stepMetadata);
          screenshots.push(stepUrl);
        }
      } catch (stepError: any) {
        consoleLogs.push({
          type: 'error',
          message: `[Playwright] Step ${i + 1} failed: ${stepError.message}`,
          timestamp: new Date().toISOString(),
        });

        stepResults.push({
          stepIndex: i,
          stepType: step.type,
          status: 'fail',
          duration_ms: Date.now() - stepStartTime,
          message: stepError.message,
          error: stepError.stack,
        });

        errors.push({
          message: `Step ${i + 1} (${step.type}) failed: ${stepError.message}`,
          stack: stepError.stack,
        });

        // Capture error screenshot
        try {
          const errorScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
          const errorMetadata: ScreenshotMetadata = {
            testRunId,
            testName: `${scenario.name} - Error`,
            stepName: `error-step-${i + 1}`,
            viewport: getViewportName(viewport),
            timestamp: Date.now(),
          };
          const errorUrl = await uploadScreenshot(errorScreenshot, errorMetadata);
          screenshots.push(errorUrl);
        } catch (screenshotError) {
          console.error('Failed to capture error screenshot:', screenshotError);
        }

        // Don't break - continue with remaining steps for comprehensive testing
      }
    }

    // Capture final screenshot
    const finalScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    const finalMetadata: ScreenshotMetadata = {
      testRunId,
      testName: `${scenario.name} - Final`,
      stepName: 'final-state',
      viewport: getViewportName(viewport),
      timestamp: Date.now(),
    };
    const finalUrl = await uploadScreenshot(finalScreenshot, finalMetadata);
    screenshots.push(finalUrl);

    const duration = Date.now() - startTime;
    const hasFailed = errors.length > 0 || stepResults.some(sr => sr.status === 'fail');

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      viewport: getViewportName(viewport),
      viewportSize: getViewportSize(viewport),
      status: hasFailed ? 'fail' : 'pass',
      durationMs: duration,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      screenshots,
      consoleLogs,
      errors,
      stepResults,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    errors.push({
      message: error.message || 'Scenario execution failed',
      stack: error.stack,
    });

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      viewport: getViewportName(viewport),
      viewportSize: getViewportSize(viewport),
      status: 'fail',
      durationMs: duration,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      screenshots,
      consoleLogs,
      errors,
      stepResults,
    };
  } finally {
    await browser.close();
  }
}

async function executeStep(page: Page, step: any, consoleLogs: ConsoleLog[]): Promise<void> {
  const { type, config } = step;

  switch (type) {
    case 'navigate':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Navigating to ${config.url}`,
        timestamp: new Date().toISOString(),
      });
      await page.goto(config.url || '', { waitUntil: 'networkidle', timeout: 30000 });
      break;

    case 'click':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Clicking element: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const clickLocator = page.locator(config.selector || '');
      await clickLocator.waitFor({ state: 'visible', timeout: 10000 });
      await clickLocator.scrollIntoViewIfNeeded();
      try {
        await clickLocator.click({ timeout: 5000 });
      } catch (error: any) {
        if (error.message.includes('intercept')) {
          await clickLocator.click({ force: true });
        } else {
          throw error;
        }
      }
      break;

    case 'fill':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Filling field: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const fillLocator = page.locator(config.selector || '');
      await fillLocator.waitFor({ state: 'visible', timeout: 10000 });
      await fillLocator.scrollIntoViewIfNeeded();
      await fillLocator.fill(config.value || '');
      break;

    case 'select':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Selecting option: ${config.value}`,
        timestamp: new Date().toISOString(),
      });
      const selectLocator = page.locator(config.selector || '');
      await selectLocator.waitFor({ state: 'visible', timeout: 10000 });
      await selectLocator.scrollIntoViewIfNeeded();
      await selectLocator.selectOption(config.value || '');
      break;

    case 'hover':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Hovering over: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const hoverLocator = page.locator(config.selector || '');
      await hoverLocator.waitFor({ state: 'visible', timeout: 10000 });
      await hoverLocator.scrollIntoViewIfNeeded();
      await hoverLocator.hover();
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
          throw new Error(`Expected text "${config.expectedResult}" not found`);
        }
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
        message: `[Playwright] Taking screenshot`,
        timestamp: new Date().toISOString(),
      });
      // Screenshot is handled by the main function
      break;

    default:
      console.warn(`Unknown step type: ${type}`);
  }
}

function getViewportName(viewport: ViewportConfig): string {
  if (viewport.mobile) return 'mobile';
  if (viewport.tablet) return 'tablet';
  if (viewport.desktop) return 'desktop';
  return 'unknown';
}

function getViewportSize(viewport: ViewportConfig): string {
  if (viewport.mobile) return `${viewport.mobile.width}x${viewport.mobile.height}`;
  if (viewport.tablet) return `${viewport.tablet.width}x${viewport.tablet.height}`;
  if (viewport.desktop) return `${viewport.desktop.width}x${viewport.desktop.height}`;
  return '1920x1080';
}
