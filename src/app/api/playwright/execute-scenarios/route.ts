import { NextRequest } from 'next/server';
import { chromium, Browser, Page } from 'playwright';
import { createTestRun, updateTestRunStatus } from '@/lib/supabase/testRuns';
import { getTestSuite } from '@/lib/supabase/testSuites';
import { getTestScenarios } from '@/lib/supabase/suiteAssets';
import { saveScenarioResult } from '@/lib/supabase/scenarioResults';
import { uploadScreenshot, ScreenshotMetadata } from '@/lib/storage/screenshots';
import { analyzeScreenshots } from '@/lib/gemini/visualInspector';
import { saveAIAnalysis } from '@/lib/supabase/aiAnalyses';
import type { ConsoleLog, ErrorObject } from '@/lib/types';

export const maxDuration = 300; // 5 minutes max execution time
export const runtime = 'nodejs'; // Required for streaming

interface ViewportConfig {
  mobile?: { width: number; height: number };
  tablet?: { width: number; height: number };
  desktop?: { width: number; height: number };
}

interface ScenarioExecutionResult {
  id?: string; // Database ID - populated after saving to database
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
  const encoder = new TextEncoder();
  const body = await request.json();
  const { suiteId, viewports, screenshotOnEveryStep = false } = body;

  if (!suiteId || !viewports || viewports.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing required parameters: suiteId and viewports' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Fetch test suite and scenarios
        const suite = await getTestSuite(suiteId);
        if (!suite) {
          sendEvent('error', { error: 'Test suite not found' });
          controller.close();
          return;
        }

        const scenarios = await getTestScenarios(suiteId);
        if (!scenarios || scenarios.length === 0) {
          sendEvent('error', { error: 'No test scenarios found for this suite' });
          controller.close();
          return;
        }

        // Create test run
        const testRunId = await createTestRun(suiteId, { viewports });

        const results: ScenarioExecutionResult[] = [];
        const totalScenarios = scenarios.length * viewports.length;
        const startTime = Date.now();
        let completedScenarios = 0;

        // Send initial progress event
        sendEvent('progress', {
          testRunId,
          total: totalScenarios,
          current: 0,
          percentage: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          elapsedTime: 0,
        });

        // Execute scenarios for each viewport
        for (let viewportIndex = 0; viewportIndex < viewports.length; viewportIndex++) {
          const viewport = viewports[viewportIndex];
          for (let scenarioIndex = 0; scenarioIndex < scenarios.length; scenarioIndex++) {
            const scenario = scenarios[scenarioIndex];

            try {
              // Send scenario start event
              sendEvent('scenario-start', {
                scenarioName: scenario.name,
                viewport: getViewportName(viewport),
                index: completedScenarios,
                total: totalScenarios,
              });

              sendEvent('log', {
                type: 'info',
                message: `[${completedScenarios + 1}/${totalScenarios}] Starting: ${scenario.name} (${getViewportName(viewport)})`,
                timestamp: new Date().toISOString(),
              });

              const result = await executeScenario({
                scenario,
                viewport,
                testRunId,
                suiteName: suite.name,
                targetUrl: suite.target_url,
                screenshotOnEveryStep,
              });

              results.push(result);
              completedScenarios++;

              // Save scenario result to database
              let scenarioResultId: string | null = null;
              try {
                scenarioResultId = await saveScenarioResult({
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

                // Populate the result object with database ID for UI display
                result.id = scenarioResultId;

                console.log(`[execute-scenarios] Scenario result saved with ID: ${scenarioResultId} for scenario: ${scenario.name}`);
              } catch (saveError: any) {
                console.error(`[execute-scenarios] Failed to save scenario result for ${scenario.name}:`, saveError.message);
                // Continue execution even if save fails
              }

              // Run AI visual analysis on screenshots - only if scenario result was saved
              if (scenarioResultId && result.screenshots && result.screenshots.length > 0) {
                try {
                  console.log(`Running AI analysis for scenario: ${scenario.name} (${result.viewport})`);

                  // Analyze each screenshot separately (since we use scenario_results system)
                  for (const screenshotUrl of result.screenshots) {
                    try {
                      const findings = await analyzeScreenshots(
                        [screenshotUrl],
                        {
                          testName: scenario.name,
                          viewport: result.viewport,
                          targetUrl: suite.target_url,
                          testStatus: result.status,
                        },
                        'comprehensive'
                      );

                      // Save analysis for this screenshot using the NEW scenario_results system
                      if (findings && findings.length > 0) {
                        const { saveAIScreenshotAnalysis } = await import('@/lib/supabase/scenarioResults');

                        const analysisRecord = {
                          scenario_result_id: scenarioResultId,
                          screenshot_url: screenshotUrl,
                          analysis_type: 'visual' as const,
                          findings,
                          issues: findings.map(f => ({
                            type: f.category,
                            severity: f.severity,
                            description: f.issue,
                            location: f.location,
                          })),
                          suggestions: findings.map(f => f.recommendation).join(' '),
                          confidence_score: findings.reduce((acc, f) => acc + f.confidenceScore, 0) / findings.length,
                          model_used: 'gemini-1.5-flash',
                        };

                        console.log(`[execute-scenarios] Saving AI analysis for scenario_result_id: ${scenarioResultId}`);
                        console.log(`[execute-scenarios] Analysis record:`, {
                          scenario_result_id: analysisRecord.scenario_result_id,
                          screenshot_url: analysisRecord.screenshot_url,
                          findings_count: findings.length,
                          issues_count: analysisRecord.issues.length,
                        });

                        await saveAIScreenshotAnalysis(analysisRecord);

                        console.log(`[execute-scenarios] AI analysis saved: ${findings.length} findings for screenshot`);
                      }
                    } catch (screenshotAnalysisError: any) {
                      console.error(`Failed to analyze screenshot ${screenshotUrl}:`, screenshotAnalysisError.message);
                      // Continue with next screenshot
                    }
                  }

                  console.log(`AI analysis completed for ${scenario.name}`);
                } catch (aiError: any) {
                  console.error(`AI analysis failed for ${scenario.name}:`, aiError.message);
                  // Don't fail the test if AI analysis fails - log and continue
                }
              }

              // Calculate progress
              const passed = results.filter((r) => r.status === 'pass').length;
              const failed = results.filter((r) => r.status === 'fail').length;
              const progressPercentage = Math.round((completedScenarios / totalScenarios) * 100);

              // Send scenario completion event
              sendEvent('scenario-complete', {
                scenarioName: scenario.name,
                viewport: result.viewport,
                status: result.status,
                durationMs: result.durationMs,
              });

              // Send completion log
              sendEvent('log', {
                type: result.status === 'fail' ? 'error' : 'info',
                message: `[${completedScenarios}/${totalScenarios}] ${result.status.toUpperCase()}: ${scenario.name} (${result.durationMs}ms)`,
                timestamp: new Date().toISOString(),
              });

              // Send step logs
              result.consoleLogs.forEach((log) => {
                sendEvent('log', log);
              });

              // Send progress update
              sendEvent('progress', {
                testRunId,
                total: totalScenarios,
                current: completedScenarios,
                percentage: progressPercentage,
                passed,
                failed,
                skipped: 0,
                elapsedTime: Date.now() - startTime,
                currentScenario: scenario.name,
              });
            } catch (error: any) {
              console.error(`Scenario execution failed for ${scenario.name}:`, error);
              completedScenarios++;

              const failedResult: ScenarioExecutionResult = {
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
              };

              results.push(failedResult);

              // Save failed scenario result to database
              try {
                const failedResultId = await saveScenarioResult({
                  run_id: testRunId,
                  scenario_id: scenario.id!,
                  viewport: failedResult.viewport,
                  viewport_size: failedResult.viewportSize,
                  status: failedResult.status,
                  duration_ms: failedResult.durationMs,
                  started_at: failedResult.startedAt,
                  completed_at: failedResult.completedAt,
                  screenshots: failedResult.screenshots,
                  console_logs: failedResult.consoleLogs,
                  errors: failedResult.errors,
                  step_results: failedResult.stepResults,
                });

                // Populate the failed result object with database ID
                failedResult.id = failedResultId;

                console.log(`[execute-scenarios] Failed scenario result saved with ID: ${failedResultId} for scenario: ${scenario.name}`);
              } catch (saveError: any) {
                console.error(`[execute-scenarios] Failed to save failed scenario result for ${scenario.name}:`, saveError.message);
                // Continue execution even if save fails
              }

              // Send error log
              sendEvent('log', {
                type: 'error',
                message: `[${completedScenarios}/${totalScenarios}] ERROR: ${scenario.name} - ${error.message}`,
                timestamp: new Date().toISOString(),
              });

              // Send progress update
              const passed = results.filter((r) => r.status === 'pass').length;
              const failed = results.filter((r) => r.status === 'fail').length;
              sendEvent('progress', {
                testRunId,
                total: totalScenarios,
                current: completedScenarios,
                percentage: Math.round((completedScenarios / totalScenarios) * 100),
                passed,
                failed,
                skipped: 0,
                elapsedTime: Date.now() - startTime,
              });
            }
          }
        }

        // Update test run status
        const allPassed = results.every((r) => r.status === 'pass');
        await updateTestRunStatus(testRunId, allPassed ? 'completed' : 'failed');

        // Send completion event
        sendEvent('complete', {
          success: true,
          testRunId,
          results,
          summary: {
            total: results.length,
            passed: results.filter((r) => r.status === 'pass').length,
            failed: results.filter((r) => r.status === 'fail').length,
            skipped: results.filter((r) => r.status === 'skipped').length,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('Scenario execution error:', error);
        sendEvent('error', { error: error.message || 'Scenario execution failed' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
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
        const stepType = step.type || step.action;

        consoleLogs.push({
          type: 'info',
          message: `[Playwright] Executing step ${i + 1}/${steps.length}: ${stepType}`,
          timestamp: new Date().toISOString(),
        });

        await executeStep(page, step, consoleLogs);

        stepResults.push({
          stepIndex: i,
          stepType: stepType,
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
        const stepType = step.type || step.action;

        consoleLogs.push({
          type: 'error',
          message: `[Playwright] Step ${i + 1} failed: ${stepError.message}`,
          timestamp: new Date().toISOString(),
        });

        stepResults.push({
          stepIndex: i,
          stepType: stepType,
          status: 'fail',
          duration_ms: Date.now() - stepStartTime,
          message: stepError.message,
          error: stepError.stack,
        });

        errors.push({
          message: `Step ${i + 1} (${stepType}) failed: ${stepError.message}`,
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
  // Support both flow-builder format (type/config) and designer format (action/selector/value)
  const stepType = step.type || step.action;
  const config = step.config || {
    selector: step.selector,
    value: step.value,
    url: step.url,
    timeout: step.timeout ? parseInt(step.timeout) : undefined,
    expectedResult: step.expectedResult,
  };

  switch (stepType) {
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
    case 'assert':
      consoleLogs.push({
        type: 'info',
        message: `[Playwright] Verifying element: ${config.selector}`,
        timestamp: new Date().toISOString(),
      });
      const verifyLocator = page.locator(config.selector || '');
      await verifyLocator.waitFor({ state: 'visible', timeout: 10000 });
      if (config.expectedResult || config.value) {
        const expectedValue = config.expectedResult || config.value;
        const text = await verifyLocator.textContent();
        if (expectedValue && !text?.includes(expectedValue)) {
          throw new Error(`Expected text "${expectedValue}" not found`);
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
      console.warn(`Unknown step type: ${stepType}`);
      consoleLogs.push({
        type: 'warn',
        message: `[Playwright] Unknown step type: ${stepType}. Skipping this step.`,
        timestamp: new Date().toISOString(),
      });
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
