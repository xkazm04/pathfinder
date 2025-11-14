# Module 2: Multi-Viewport Test Runner

## Objective
Build a robust test execution engine that runs Playwright tests across multiple viewport configurations, captures screenshots at key steps, monitors execution in real-time, and stores comprehensive results in Supabase.

## Dependencies
- Phase 0 completed
- Module 1 completed (test code must be available)
- Playwright fully configured
- Supabase storage set up for screenshots

## Features to Implement

### 1. Test Runner Interface

**UI Layout:**
- Left sidebar: Test suite selector and configuration panel
- Center: Real-time execution monitor
- Right sidebar: Live logs and metrics
- Bottom: Progress bar for overall execution

**Components Structure:**
```
Runner
├── TestSuiteSelector
├── ViewportConfigurator
├── ExecutionMonitor (center stage)
├── LiveLogsPanel
└── ExecutionControls (Start, Stop, Pause)
```

### 2. Test Suite Selector

**Component:** `components/runner/TestSuiteSelector.tsx`

**Functionality:**
- Dropdown or list of available test suites from Supabase
- Display suite name, target URL, last run date
- Show test count per suite
- Quick preview of test scenarios
- "Select All" / "Select Individual Tests" options
- Search/filter test suites

**Data Loading:**
```typescript
// Fetch test suites with test code
const { data: suites } = await supabase
  .from('test_suites')
  .select(`
    *,
    test_code(code, version)
  `)
  .order('updated_at', { ascending: false });
```

### 3. Viewport Configuration Panel

**Component:** `components/runner/ViewportConfigurator.tsx`

**Features:**
- Checkboxes for each viewport preset:
  - ☐ Mobile Small (375x667)
  - ☐ Mobile Large (390x844)
  - ☐ Tablet (768x1024)
  - ☐ Desktop HD (1920x1080)
  - ☐ Desktop 2K (2560x1440)
- "Select All" / "Deselect All" quick actions
- Custom viewport option (manual width x height input)
- Save viewport configuration presets

**State:**
```typescript
interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  enabled: boolean;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}
```

### 4. Test Execution Engine

**API Endpoint:** `/app/api/playwright/execute/route.ts`

**Execution Flow:**
1. Accept test suite ID and viewport configurations
2. Create test_run record in Supabase
3. Retrieve test code from database
4. For each viewport configuration:
   - Launch Playwright browser context with viewport settings
   - Execute test code
   - Capture screenshots at each step
   - Monitor console logs and network activity
   - Record timing metrics
   - Capture any errors or failures
   - Store screenshots in Supabase Storage
   - Create test_results record
5. Update test_run status to completed
6. Return comprehensive results

**Playwright Runner Implementation:**
```typescript
// lib/playwright/runner.ts
import { chromium, Browser, BrowserContext, Page } from 'playwright';

interface TestExecutionOptions {
  testCode: string;
  viewport: ViewportConfig;
  testRunId: string;
  screenshotOnEveryStep: boolean;
}

export async function executeTest(
  options: TestExecutionOptions
): Promise<TestResult> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      viewport: { width: options.viewport.width, height: options.viewport.height },
      deviceScaleFactor: options.viewport.deviceScaleFactor || 1,
      isMobile: options.viewport.isMobile || false,
      hasTouch: options.viewport.hasTouch || false,
    });

    // Setup screenshot capture
    const screenshots: Screenshot[] = [];
    
    // Setup console log capture
    const consoleLogs: ConsoleLog[] = [];
    
    // Setup network monitoring
    const networkLogs: NetworkLog[] = [];
    
    const page = await context.newPage();
    
    // Attach event listeners
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    
    page.on('response', response => {
      networkLogs.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        timestamp: Date.now()
      });
    });

    // Execute test code with instrumentation
    const startTime = Date.now();
    const result = await runTestCode(page, options.testCode, screenshots);
    const duration = Date.now() - startTime;

    // Upload screenshots to Supabase Storage
    const screenshotUrls = await uploadScreenshots(
      screenshots,
      options.testRunId,
      options.viewport.id
    );

    return {
      viewport: options.viewport.name,
      viewportSize: `${options.viewport.width}x${options.viewport.height}`,
      status: result.passed ? 'pass' : 'fail',
      durationMs: duration,
      screenshots: screenshotUrls,
      errors: result.errors,
      consoleLogs,
      networkLogs
    };
    
  } finally {
    await browser.close();
  }
}

async function runTestCode(
  page: Page,
  testCode: string,
  screenshots: Screenshot[]
): Promise<{ passed: boolean; errors: any[] }> {
  // Parse and execute test code
  // Intercept screenshot commands
  // Capture errors
  // Return result
}
```

### 5. Real-Time Execution Monitor

**Component:** `components/runner/ExecutionMonitor.tsx`

**Display Features:**
- Current test being executed (name + description)
- Current viewport being tested
- Live screenshot preview (updates as tests run)
- Progress indicator (X of Y tests completed)
- Status badges (running, passed, failed, queued)
- Elapsed time counter
- ETA for completion

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│  Test: Homepage Navigation              │
│  Viewport: Desktop HD (1920x1080)       │
│  Status: Running...                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │   [Live Screenshot Preview]     │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Progress: 3 / 15 tests (20%)          │
│  Elapsed: 00:02:34  ETA: 00:10:21     │
└─────────────────────────────────────────┘
```

**State Management:**
- Use WebSocket or Server-Sent Events for real-time updates
- Or poll API endpoint every 2 seconds for status
- Update UI immediately on status changes

### 6. Live Logs Panel

**Component:** `components/runner/LiveLogsPanel.tsx`

**Tabs:**
- **Console Logs:** Browser console output
- **Network Activity:** HTTP requests/responses
- **Errors:** Test failures and exceptions
- **Playwright Logs:** Test execution details

**Features:**
- Auto-scroll to latest logs
- Filter by log level (error, warning, info, log)
- Search/filter logs by text
- Copy logs to clipboard
- Export logs as JSON or TXT
- Color-coded log levels

**Console Log Display:**
```typescript
interface ConsoleLog {
  type: 'error' | 'warning' | 'info' | 'log' | 'debug';
  text: string;
  timestamp: number;
  viewport?: string;
}

// Render example:
[12:34:56] [ERROR] [Desktop] TypeError: Cannot read property...
[12:34:57] [INFO] [Mobile] Navigation to homepage completed
```

### 7. Execution Controls

**Component:** `components/runner/ExecutionControls.tsx`

**Actions:**
- **Start/Run Tests:** Primary CTA button
  - Validate that suite and viewports are selected
  - Disable during execution
  - Show confirmation if tests are already running
  
- **Stop Execution:** Emergency stop button
  - Gracefully terminate running tests
  - Save partial results
  - Update status to 'cancelled'
  
- **Pause/Resume:** (Optional advanced feature)
  - Pause after current test completes
  - Resume from last checkpoint

**Settings Toggle:**
- ☐ Screenshot on every step (default: key steps only)
- ☐ Verbose logging
- ☐ Continue on failure (or stop at first failure)
- ☐ Parallel execution (run multiple viewports simultaneously)

### 8. Progress Tracking & Metrics

**Component:** `components/runner/ProgressMetrics.tsx`

**Real-Time Metrics:**
- Tests passed: 12 / 15 (80%)
- Tests failed: 2 / 15 (13%)
- Tests skipped: 1 / 15 (7%)
- Total viewports: 5
- Average test duration: 4.2s
- Total execution time: 00:03:42

**Visual Elements:**
- Progress bar with color coding (green for passed, red for failed)
- Circular progress indicator
- Viewport completion matrix:
  ```
  Mobile Small:  ████████░░  80%
  Mobile Large:  ██████████ 100%
  Tablet:        ███░░░░░░░  30%
  Desktop HD:    ░░░░░░░░░░   0% (queued)
  Desktop 2K:    ░░░░░░░░░░   0% (queued)
  ```

### 9. Screenshot Capture & Storage

**Function:** `lib/playwright/screenshotHandler.ts`

**Capture Strategy:**
```typescript
export async function captureScreenshot(
  page: Page,
  stepName: string,
  metadata: ScreenshotMetadata
): Promise<Buffer> {
  const screenshot = await page.screenshot({
    fullPage: true,
    type: 'png',
    animations: 'disabled' // for consistency
  });
  
  return screenshot;
}

interface ScreenshotMetadata {
  testRunId: string;
  testName: string;
  stepName: string;
  viewport: string;
  timestamp: number;
}
```

**Storage in Supabase:**
```typescript
// lib/storage/screenshots.ts
export async function uploadScreenshot(
  screenshot: Buffer,
  metadata: ScreenshotMetadata
): Promise<string> {
  const fileName = `${metadata.testRunId}/${metadata.viewport}/${metadata.stepName}-${metadata.timestamp}.png`;
  
  const { data, error } = await supabase.storage
    .from('test-screenshots')
    .upload(fileName, screenshot, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Return public URL
  const { data: urlData } = supabase.storage
    .from('test-screenshots')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}
```

### 10. Error Handling & Recovery

**Error Types:**
- Browser launch failures
- Network timeouts
- Selector not found errors
- Assertion failures
- JavaScript errors on page
- Storage upload failures

**Recovery Strategies:**
```typescript
interface ErrorHandler {
  retry: boolean;
  maxRetries: number;
  fallback: () => Promise<void>;
  notify: boolean;
}

// Retry logic for flaky tests
async function executeWithRetry(
  testFn: () => Promise<void>,
  options: ErrorHandler
): Promise<void> {
  let attempts = 0;
  
  while (attempts < options.maxRetries) {
    try {
      await testFn();
      return;
    } catch (error) {
      attempts++;
      if (attempts >= options.maxRetries) {
        await options.fallback();
        throw error;
      }
      // Wait before retry (exponential backoff)
      await sleep(Math.pow(2, attempts) * 1000);
    }
  }
}
```

### 11. Parallel Execution (Advanced)

**Feature:** Run tests for multiple viewports simultaneously

**Implementation:**
```typescript
// lib/playwright/parallelRunner.ts
export async function executeTestsParallel(
  testSuiteId: string,
  viewports: ViewportConfig[],
  concurrency: number = 3
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Create promise pool
  const pool = new PromisePool(
    viewports,
    async (viewport) => {
      const result = await executeTest({
        testCode,
        viewport,
        testRunId,
        screenshotOnEveryStep: false
      });
      results.push(result);
    },
    concurrency
  );
  
  await pool.execute();
  return results;
}
```

**Considerations:**
- Resource limitations (browser instances)
- Result ordering and aggregation
- Error handling in parallel context

### 12. Test Run History

**Component:** `components/runner/TestRunHistory.tsx`

**Display:**
- List of recent test runs
- Sort by date (newest first)
- Filter by status (all, passed, failed, cancelled)
- Quick actions: View Report, Re-run, Delete

**Data:**
```typescript
interface TestRunSummary {
  id: string;
  suiteId: string;
  suiteName: string;
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  viewportsTested: number;
}
```

## Database Operations

**Create Test Run:**
```typescript
export async function createTestRun(
  suiteId: string,
  config: { viewports: ViewportConfig[] }
): Promise<string> {
  const { data, error } = await supabase
    .from('test_runs')
    .insert({
      suite_id: suiteId,
      status: 'running',
      started_at: new Date().toISOString(),
      config: config
    })
    .select()
    .single();
  
  return data.id;
}
```

**Save Test Result:**
```typescript
export async function saveTestResult(
  runId: string,
  result: TestResult
): Promise<void> {
  await supabase
    .from('test_results')
    .insert({
      run_id: runId,
      viewport: result.viewport,
      viewport_size: result.viewportSize,
      test_name: result.testName,
      status: result.status,
      duration_ms: result.durationMs,
      screenshots: result.screenshots,
      errors: result.errors,
      console_logs: result.consoleLogs
    });
}
```

**Update Test Run Status:**
```typescript
export async function completeTestRun(
  runId: string,
  status: 'completed' | 'failed' | 'cancelled'
): Promise<void> {
  await supabase
    .from('test_runs')
    .update({
      status,
      completed_at: new Date().toISOString()
    })
    .eq('id', runId);
}
```

## Real-Time Updates

**WebSocket Implementation (Alternative):**
```typescript
// lib/websocket/testRunner.ts
export function subscribeToTestRun(
  testRunId: string,
  onUpdate: (update: TestRunUpdate) => void
): () => void {
  const channel = supabase
    .channel(`test-run:${testRunId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'test_results',
        filter: `run_id=eq.${testRunId}`
      },
      (payload) => {
        onUpdate({
          type: 'result_added',
          data: payload.new
        });
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
```

## Acceptance Criteria
- [ ] User can select test suite and viewport configurations
- [ ] Tests execute successfully across all selected viewports
- [ ] Real-time execution status is displayed
- [ ] Screenshots are captured and stored properly
- [ ] Console logs and network activity are recorded
- [ ] Test results are saved to Supabase with all metadata
- [ ] Execution can be stopped gracefully
- [ ] Error handling prevents crashes and provides useful feedback
- [ ] Test run history is accessible and filterable
- [ ] Performance is acceptable (tests don't hang indefinitely)

## Performance Considerations
- Limit concurrent browser instances to prevent resource exhaustion
- Implement screenshot compression before upload
- Use streaming for large log outputs
- Clean up old screenshots periodically (retention policy)
- Optimize Playwright configuration for speed

## Security Considerations
- Validate all user inputs before execution
- Sanitize test code before running (prevent code injection)
- Restrict browser capabilities (no file system access)
- Rate limit test executions per user
- Secure screenshot storage with proper access controls

## Testing Notes for Claude Code
- Test with various viewport combinations
- Verify screenshot capture at different page heights
- Test error scenarios (timeouts, failures, crashes)
- Validate parallel execution doesn't cause conflicts
- Ensure real-time updates work correctly

## Documentation Requirements
- Document test execution API endpoints
- Provide examples of test result structure
- Explain viewport configuration options
- Include troubleshooting guide for common failures
