# Module 5: Smart Diff Detector

## Objective
Implement visual regression detection by comparing screenshots between test runs, automatically highlighting visual changes, and flagging unexpected UI modifications that could indicate regressions or bugs.

## Dependencies
- Phase 0 completed
- Module 2 completed (test results and screenshots available)
- Module 3 completed (AI analysis capabilities)
- Image comparison library (pixelmatch, resemblejs, or similar)

## Features to Implement

### 1. Baseline Management System

**Concept:**
- Each test suite can have a "baseline" test run
- New test runs are compared against the baseline
- Users can update/change baseline as needed

**Component:** `components/diff/BaselineManager.tsx`

**Features:**
- View current baseline for each test suite
- Set any test run as the new baseline
- Clear baseline (stops comparisons)
- Baseline metadata display (date set, version, notes)

**UI:**
```
Current Baseline: Test Run #142
Set on: March 10, 2024
Version: v2.1.0
Notes: Stable release before feature X

[Update Baseline] [Clear Baseline] [View Baseline Results]
```

**Database Schema Addition:**
```sql
-- Add to test_suites table
ALTER TABLE test_suites ADD COLUMN baseline_run_id UUID REFERENCES test_runs(id);
ALTER TABLE test_suites ADD COLUMN baseline_set_at TIMESTAMP;
ALTER TABLE test_suites ADD COLUMN baseline_notes TEXT;
```

### 2. Screenshot Comparison Engine

**API Endpoint:** `/app/api/diff/compare/route.ts`

**Functionality:**
- Accept two screenshot URLs (baseline vs current)
- Download both images
- Normalize dimensions if different
- Perform pixel-by-pixel comparison
- Generate diff image highlighting changes
- Calculate difference metrics
- Return comparison result

**Implementation:**
```typescript
// lib/diff/screenshotComparator.ts
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface ComparisonResult {
  pixelsDifferent: number;
  percentageDifferent: number;
  diffImageBuffer: Buffer;
  baselineUrl: string;
  currentUrl: string;
  dimensions: { width: number; height: number };
  threshold: number;
  isSignificant: boolean; // based on threshold
}

export async function compareScreenshots(
  baselineUrl: string,
  currentUrl: string,
  options: {
    threshold?: number; // 0.1 = 10% difference to flag
    includeAntialiasing?: boolean;
  } = {}
): Promise<ComparisonResult> {
  // Fetch both images
  const baseline = await fetchImage(baselineUrl);
  const current = await fetchImage(currentUrl);
  
  // Normalize dimensions
  const { img1, img2 } = normalizeImages(baseline, current);
  
  // Create diff image buffer
  const { width, height } = img1;
  const diff = new PNG({ width, height });
  
  // Perform pixel comparison
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    {
      threshold: 0.1, // sensitivity (0.0 - 1.0)
      includeAA: options.includeAntialiasing || false
    }
  );
  
  const totalPixels = width * height;
  const percentageDiff = (numDiffPixels / totalPixels) * 100;
  
  // Upload diff image to storage
  const diffBuffer = PNG.sync.write(diff);
  const diffUrl = await uploadDiffImage(diffBuffer, baselineUrl, currentUrl);
  
  return {
    pixelsDifferent: numDiffPixels,
    percentageDifferent: percentageDiff,
    diffImageBuffer: diffBuffer,
    diffImageUrl: diffUrl,
    baselineUrl,
    currentUrl,
    dimensions: { width, height },
    threshold: options.threshold || 0.1,
    isSignificant: percentageDiff > (options.threshold || 0.1)
  };
}

async function fetchImage(url: string): Promise<PNG> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return PNG.sync.read(Buffer.from(buffer));
}

function normalizeImages(
  img1: PNG,
  img2: PNG
): { img1: PNG; img2: PNG } {
  // If dimensions differ, resize to match
  if (img1.width !== img2.width || img1.height !== img2.height) {
    // Use larger dimensions
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);
    
    // Resize both images to match
    // Implementation depends on image processing library
  }
  
  return { img1, img2 };
}
```

### 3. Automated Comparison Workflow

**Trigger:** After test run completes

**Process:**
1. Check if test suite has a baseline
2. If yes, compare all screenshots from new run against baseline
3. For each screenshot pair (same test, same viewport, same step):
   - Run comparison
   - Store diff results
   - Calculate metrics
4. Generate regression report
5. Flag significant changes for review

**Component:** `lib/diff/comparisonOrchestrator.ts`

```typescript
export async function runRegressionAnalysis(
  testRunId: string
): Promise<RegressionReport> {
  // Get test run details
  const testRun = await getTestRun(testRunId);
  const baseline = await getBaselineRun(testRun.suite_id);
  
  if (!baseline) {
    return { message: 'No baseline set for this suite' };
  }
  
  // Get all screenshots from both runs
  const currentResults = await getTestResults(testRunId);
  const baselineResults = await getTestResults(baseline.id);
  
  // Match screenshots by test name, viewport, and step
  const pairs = matchScreenshots(currentResults, baselineResults);
  
  // Compare each pair
  const comparisons: ComparisonResult[] = [];
  for (const pair of pairs) {
    const comparison = await compareScreenshots(
      pair.baseline.url,
      pair.current.url
    );
    comparisons.push(comparison);
    
    // Save to database
    await saveComparison(testRunId, comparison);
  }
  
  // Generate report
  const regressions = comparisons.filter(c => c.isSignificant);
  
  return {
    totalComparisons: comparisons.length,
    regressionsFound: regressions.length,
    averageDifference: calculateAverage(comparisons.map(c => c.percentageDifferent)),
    details: comparisons
  };
}

function matchScreenshots(
  current: TestResult[],
  baseline: TestResult[]
): ScreenshotPair[] {
  const pairs: ScreenshotPair[] = [];
  
  for (const currResult of current) {
    const baseResult = baseline.find(
      b => b.test_name === currResult.test_name &&
           b.viewport === currResult.viewport
    );
    
    if (baseResult && currResult.screenshots && baseResult.screenshots) {
      // Match screenshots by step name
      for (const currScreenshot of currResult.screenshots) {
        const baseScreenshot = baseResult.screenshots.find(
          s => s.stepName === currScreenshot.stepName
        );
        
        if (baseScreenshot) {
          pairs.push({
            baseline: baseScreenshot,
            current: currScreenshot,
            testName: currResult.test_name,
            viewport: currResult.viewport,
            stepName: currScreenshot.stepName
          });
        }
      }
    }
  }
  
  return pairs;
}
```

### 4. Visual Diff Viewer

**Component:** `components/diff/DiffViewer.tsx`

**View Modes:**
1. **Side-by-Side:** Baseline | Current
2. **Overlay:** Slider to transition between images
3. **Diff Highlight:** Show only changed pixels
4. **Blend:** Overlay with opacity control
5. **Split:** Vertical split with draggable divider

**UI Example:**
```
┌──────────────────────────────────────────────────────┐
│ View Mode: [Side-by-Side ▼] | [⊕] [⊖] [↻]          │
├─────────────────────┬────────────────────────────────┤
│    Baseline         │        Current                 │
│  (March 10, 2024)   │     (March 15, 2024)          │
├─────────────────────┼────────────────────────────────┤
│                     │                                │
│   [Screenshot]      │      [Screenshot]              │
│                     │                                │
├─────────────────────┴────────────────────────────────┤
│ Difference: 3.2% (1,234 pixels)                      │
│ Status: ⚠️ Significant Change                        │
│ [Accept Change] [Report Bug] [Update Baseline]       │
└──────────────────────────────────────────────────────┘
```

**Interactive Features:**
- Zoom in/out on both images simultaneously
- Pan/drag to navigate large screenshots
- Hover to see exact pixel difference at cursor
- Click to mark regions of interest
- Annotations/comments on differences

### 5. Diff Heatmap

**Component:** `components/diff/DiffHeatmap.tsx`

**Visual Representation:**
- Overlay on current screenshot
- Color intensity indicates magnitude of change
- Red = significant change, Yellow = minor change, Green = no change

**Implementation:**
```typescript
function generateHeatmap(diffImage: PNG): HeatmapData {
  const { width, height, data } = diffImage;
  const heatmap: number[][] = [];
  
  // Divide image into grid (e.g., 20x20 cells)
  const cellWidth = Math.ceil(width / 20);
  const cellHeight = Math.ceil(height / 20);
  
  for (let y = 0; y < height; y += cellHeight) {
    const row: number[] = [];
    for (let x = 0; x < width; x += cellWidth) {
      // Calculate average difference in this cell
      let cellDiff = 0;
      let pixelCount = 0;
      
      for (let cy = y; cy < y + cellHeight && cy < height; cy++) {
        for (let cx = x; cx < x + cellWidth && cx < width; cx++) {
          const idx = (cy * width + cx) * 4;
          const diff = data[idx]; // Red channel contains diff
          cellDiff += diff;
          pixelCount++;
        }
      }
      
      row.push(cellDiff / pixelCount / 255); // Normalize to 0-1
    }
    heatmap.push(row);
  }
  
  return { grid: heatmap, cellWidth, cellHeight };
}
```

### 6. Regression Dashboard

**Component:** `components/diff/RegressionDashboard.tsx`

**Display:**
- Overview of all detected regressions
- Sort by severity (% difference)
- Filter by viewport, test name
- Quick actions: Approve, Report Bug, Investigate

**Card Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔴 REGRESSION DETECTED                          │
│ Test: Homepage Hero Section                     │
│ Viewport: Desktop HD                            │
│ Step: Initial Load                              │
│                                                 │
│ [Baseline] [Current] [Diff]                     │
│                                                 │
│ Difference: 12.4% (significant)                 │
│ Areas affected: Header, Button                  │
│                                                 │
│ [View Details] [Accept] [Report Bug]            │
└─────────────────────────────────────────────────┘
```

### 7. AI-Powered Diff Analysis

**Integration with Module 3:**
- Use Gemini to analyze diff images
- Determine if changes are intentional or bugs
- Categorize changes (layout, color, content, etc.)
- Provide context and recommendations

**Prompt:**
```typescript
const DIFF_ANALYSIS_PROMPT = `
You are analyzing visual differences between two versions of a webpage.

Context:
- Test: {testName}
- Viewport: {viewport}
- Baseline: {baselineDate}
- Current: {currentDate}
- Difference: {percentageDiff}%

Three images provided:
1. Baseline (original)
2. Current (new version)
3. Diff (highlighted changes in red)

Analyze the changes and determine:
1. Are these likely intentional design updates or bugs?
2. What specific elements changed? (e.g., button color, text size, layout shift)
3. What is the severity of these changes?
4. Could these changes impact user experience or functionality?

Return JSON:
{
  "isIntentional": true/false,
  "confidence": 0.0-1.0,
  "changesDetected": [
    {
      "element": "button",
      "changeType": "color|size|position|content",
      "description": "...",
      "severity": "critical|moderate|minor"
    }
  ],
  "recommendation": "approve|investigate|report_bug",
  "reasoning": "..."
}
`;
```

### 8. Approval Workflow

**Feature:** Mark regressions as "approved" if changes are intentional

**Component:** `components/diff/RegressionActions.tsx`

**Actions:**
1. **Accept Change:**
   - Marks regression as intentional
   - Optionally updates baseline to current
   - Adds note/comment

2. **Report Bug:**
   - Creates issue in tracking system (or internal)
   - Attaches diff images
   - Links to test run

3. **Investigate:**
   - Flags for manual review
   - Assign to team member (if auth implemented)

**Database Schema:**
```sql
-- Visual Regressions table
CREATE TABLE visual_regressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_run_id UUID REFERENCES test_runs(id),
    test_name VARCHAR(255),
    viewport VARCHAR(50),
    step_name VARCHAR(255),
    baseline_screenshot_url TEXT,
    current_screenshot_url TEXT,
    diff_screenshot_url TEXT,
    pixels_different INTEGER,
    percentage_different DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, bug_reported, investigating
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regressions_run_id ON visual_regressions(test_run_id);
CREATE INDEX idx_regressions_status ON visual_regressions(status);
```

### 9. Threshold Configuration

**Component:** `components/diff/ThresholdSettings.tsx`

**Settings:**
- Global threshold: % difference to flag as regression
- Per-suite threshold overrides
- Per-viewport thresholds (mobile might have stricter)
- Ignore regions (exclude dynamic content like ads, timestamps)

**UI:**
```
Regression Detection Thresholds

Global Threshold: [===|=====] 5%
  Changes above 5% will be flagged as regressions

Viewport-Specific:
  Mobile:  [====|====] 3%  (more strict)
  Tablet:  [===|=====] 5%
  Desktop: [==|======] 8%  (more lenient)

Ignore Regions:
  ☑ Advertisements
  ☑ Timestamps
  ☑ User avatars
  ☐ Analytics badges
```

### 10. Ignore Regions Feature

**Functionality:**
- Define rectangular regions to exclude from comparison
- Useful for dynamic content (ads, dates, user-specific data)

**Implementation:**
```typescript
interface IgnoreRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  reason: string;
}

function applyIgnoreRegions(
  img: PNG,
  regions: IgnoreRegion[]
): PNG {
  const modified = new PNG({ width: img.width, height: img.height });
  modified.data = Buffer.from(img.data);
  
  // Mask out ignore regions (set to transparent or neutral color)
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        const idx = (y * img.width + x) * 4;
        // Set to neutral gray
        modified.data[idx] = 128;
        modified.data[idx + 1] = 128;
        modified.data[idx + 2] = 128;
        modified.data[idx + 3] = 255;
      }
    }
  }
  
  return modified;
}
```

**UI for defining regions:**
- Click and drag on screenshot to draw region
- Save regions per test/viewport
- Visual indicators showing masked areas

### 11. Historical Diff Trends

**Component:** `components/diff/DiffTrends.tsx`

**Visualization:**
- Chart showing average difference % over time
- Spikes indicate major visual changes
- Color-coded by approval status

**Use Case:**
- Identify when significant UI changes occurred
- Correlate with release dates or feature deployments

### 12. Batch Comparison

**Feature:** Compare entire test runs in batch

**API Endpoint:** `/app/api/diff/batch-compare/route.ts`

**Process:**
- Queue all screenshot comparisons
- Process in parallel (with concurrency limit)
- Update progress in real-time
- Generate summary report when complete

### 13. Email/Notification Alerts

**Feature:** Notify team when regressions detected

**Triggers:**
- X regressions found in a test run
- Critical regressions (above threshold)
- New baseline set

**Integration:**
- Supabase Edge Functions for sending emails
- Webhook to Slack/Discord
- In-app notifications

### 14. False Positive Handling

**Component:** `components/diff/FalsePositiveManager.tsx`

**Features:**
- Mark diff as false positive
- Learn from user feedback
- Adjust thresholds automatically
- Exclude similar patterns in future

## Database Operations

**Save Comparison Result:**
```typescript
export async function saveComparison(
  testRunId: string,
  comparison: ComparisonResult
): Promise<void> {
  await supabase.from('visual_regressions').insert({
    test_run_id: testRunId,
    baseline_screenshot_url: comparison.baselineUrl,
    current_screenshot_url: comparison.currentUrl,
    diff_screenshot_url: comparison.diffImageUrl,
    pixels_different: comparison.pixelsDifferent,
    percentage_different: comparison.percentageDifferent,
    status: comparison.isSignificant ? 'pending' : 'approved'
  });
}
```

**Get Regressions for Test Run:**
```typescript
export async function getRegressions(
  testRunId: string
): Promise<VisualRegression[]> {
  const { data } = await supabase
    .from('visual_regressions')
    .select('*')
    .eq('test_run_id', testRunId)
    .order('percentage_different', { ascending: false });
  
  return data;
}
```

## Acceptance Criteria
- [ ] Baseline can be set for any test suite
- [ ] Screenshot comparison accurately detects visual differences
- [ ] Diff images are generated and stored
- [ ] Regressions are flagged based on threshold
- [ ] Diff viewer provides multiple view modes
- [ ] AI analysis provides context on changes
- [ ] Approval workflow allows accepting/reporting changes
- [ ] Threshold configuration is flexible and persistent
- [ ] Ignore regions can be defined and applied
- [ ] Historical trends show visual stability over time

## Performance Considerations
- Optimize image processing (use WebAssembly if needed)
- Process comparisons in background jobs
- Cache diff images
- Limit concurrent comparisons to prevent memory issues
- Use image CDN for fast delivery

## Testing Notes for Claude Code
- Test with identical screenshots (should show 0% diff)
- Test with completely different screenshots
- Test with minor changes (anti-aliasing, slight color shifts)
- Verify ignore regions work correctly
- Test threshold configurations

## Documentation Requirements
- Explain how pixel comparison works
- Guide for setting appropriate thresholds
- Best practices for baseline management
- Troubleshooting false positives
- Integration with CI/CD pipelines
