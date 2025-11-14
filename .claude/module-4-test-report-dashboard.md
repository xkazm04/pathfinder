# Module 4: Test Report Dashboard

## Objective
Create a comprehensive dashboard for viewing, analyzing, and comparing test results. Provide intuitive visualization of test runs, pass/fail metrics, screenshot comparisons, and AI-detected issues with historical trend analysis.

## Dependencies
- Phase 0 completed
- Module 2 completed (test results available)
- Module 3 completed (AI analyses available)

## Features to Implement

### 1. Main Dashboard Overview

**Layout Sections:**
1. **Hero Stats:** Key metrics at a glance
2. **Recent Test Runs:** List of latest executions
3. **Quality Trends:** Charts showing quality over time
4. **Top Issues:** Most frequent or critical problems
5. **Quick Actions:** Start new test, view reports, etc.

**Hero Stats Cards:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Tests │  Pass Rate  │   Issues    │  Coverage   │
│    156      │    87.2%    │     23      │   5 devices │
│   +12 new   │  ↑ 2.1%     │  ↓ 5 fixed  │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Component:** `components/dashboard/HeroStats.tsx`

### 2. Test Runs List

**Component:** `components/dashboard/TestRunsList.tsx`

**Features:**
- Table or card view of test runs
- Columns: Suite Name, Date/Time, Duration, Status, Pass Rate, Actions
- Sort by any column
- Filter by status, date range, test suite
- Pagination (20 per page)
- Quick actions: View Report, Re-run, Delete

**Status Indicators:**
- ✅ Completed (all passed)
- ⚠️  Completed with failures
- ⏳ Running
- ❌ Failed (execution error)
- 🚫 Cancelled

**Data Structure:**
```typescript
interface TestRunListItem {
  id: string;
  suiteName: string;
  targetUrl: string;
  startedAt: Date;
  completedAt?: Date;
  duration: number; // milliseconds
  status: 'completed' | 'failed' | 'running' | 'cancelled';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  viewportCount: number;
  issueCount: number;
}
```

### 3. Detailed Test Report Page


**Page Structure:**
```
┌─────────────────────────────────────────────────────┐
│ Header: Test Run Info & Actions                     │
├─────────────────────────────────────────────────────┤
│ Summary Section                                     │
│ ├─ Overall Stats                                    │
│ ├─ Pass/Fail Breakdown                              │
│ └─ Quality Score                                    │
├─────────────────────────────────────────────────────┤
│ Viewport Results Grid                               │
│ [Mobile] [Tablet] [Desktop HD] [Desktop 2K]         │
├─────────────────────────────────────────────────────┤
│ Test Results Detail (expandable)                    │
│ ├─ Test 1: Homepage Load                            │
│ ├─ Test 2: Navigation                               │
│ └─ Test 3: Form Submission                          │
├─────────────────────────────────────────────────────┤
│ AI Analysis Section                                 │
│ ├─ Issues by Severity                               │
│ ├─ Issues by Category                               │
│ └─ Detailed Findings                                │
├─────────────────────────────────────────────────────┤
│ Screenshot Gallery                                  │
└─────────────────────────────────────────────────────┘
```

### 4. Summary Section

**Component:** `components/reports/TestRunSummary.tsx`

**Display:**
- Test run metadata (suite name, URL, date, duration)
- Overall quality score (0-100, calculated from pass rate + issue severity)
- Pass/fail chart (donut or pie chart)
- Viewport completion status
- Export report button (PDF, JSON, CSV)

**Quality Score Calculation:**
```typescript
function calculateQualityScore(
  passRate: number,
  criticalIssues: number,
  warningIssues: number
): number {
  // Base score from pass rate (0-70 points)
  let score = passRate * 0.7;
  
  // Deduct for critical issues (up to -20 points)
  score -= Math.min(criticalIssues * 5, 20);
  
  // Deduct for warnings (up to -10 points)
  score -= Math.min(warningIssues * 1, 10);
  
  return Math.max(0, Math.min(100, score * 100));
}
```

### 5. Viewport Results Grid

**Component:** `components/reports/ViewportGrid.tsx`

**Layout:**
- Card for each tested viewport
- Pass/fail status for that viewport
- Screenshot thumbnail
- Click to view detailed results
- "Compare" checkbox for side-by-side comparison

**Card Design:**
```
┌─────────────────────┐
│  Mobile (375x667)   │
│                     │
│  [Screenshot]       │
│                     │
│  ✅ 4/5 Tests Pass  │
│  ⚠️  1 Issue Found   │
│                     │
│  [View Details]     │
└─────────────────────┘
```

### 6. Side-by-Side Viewport Comparison

**Component:** `components/reports/ViewportComparison.tsx`

**Features:**
- Select 2-4 viewports to compare
- Synchronized scrolling (optional)
- Highlight differences with overlays
- Toggle between different test steps
- Show responsive issues detected by AI

**Layout:**
```
┌──────────────┬──────────────┬──────────────┐
│ Mobile Small │    Tablet    │  Desktop HD  │
├──────────────┼──────────────┼──────────────┤
│              │              │              │
│  Screenshot  │  Screenshot  │  Screenshot  │
│              │              │              │
├──────────────┼──────────────┼──────────────┤
│ Issues: 2    │ Issues: 0    │ Issues: 1    │
└──────────────┴──────────────┴──────────────┘
```

**Interaction:**
- Slider to align same step across viewports
- Difference highlighting (red overlay on mismatches)
- Click issue marker to see details

### 7. Test Results Detail

**Component:** `components/reports/TestResultsAccordion.tsx`

**Accordion/Expandable List:**
- Each test as an expandable item
- Show test name, status, duration
- Expand to see:
  - Test steps executed
  - Screenshots for each step
  - Console logs
  - Network activity
  - Errors (if any)
  - AI findings for this test

**Example:**
```
▼ Test: User Login Flow (2.3s) ✅
  Step 1: Navigate to login page
    📸 Screenshot | 🗒️ Logs
  Step 2: Fill username
    📸 Screenshot | 🗒️ Logs
  Step 3: Fill password
    📸 Screenshot | 🗒️ Logs
  Step 4: Click submit
    📸 Screenshot | 🗒️ Logs | ⚠️ 1 issue
  Step 5: Assert logged in
    📸 Screenshot | 🗒️ Logs
```

### 8. AI Analysis Section

**Component:** `components/reports/AIAnalysisSection.tsx`

**Tabs:**
1. **Overview:** Summary of all findings
2. **By Severity:** Critical, Warning, Info
3. **By Category:** Visual, Functional, Responsive, Accessibility, Content
4. **By Viewport:** Issues specific to each viewport

**Overview Display:**
- Total issues count
- Severity distribution (pie chart)
- Category distribution (bar chart)
- Top 5 most critical issues (prioritized list)

**Issue Cards:**
```
┌──────────────────────────────────────────┐
│ 🔴 CRITICAL                              │
│ Header Navigation Overlaps Content       │
│                                          │
│ Location: Top of page                    │
│ Viewport: Mobile Small (375x667)         │
│ Confidence: 92%                          │
│                                          │
│ Recommendation:                          │
│ Reduce z-index of navigation or add     │
│ padding to main content.                 │
│                                          │
│ [View Screenshot] [Mark Resolved]        │
└──────────────────────────────────────────┘
```

### 9. Screenshot Gallery

**Component:** `components/reports/ScreenshotGallery.tsx`

**Features:**
- Grid view of all screenshots from test run
- Filter by viewport, test name, step
- Lightbox view for full-size
- Download individual or bulk
- Annotations showing AI-detected issues
- Compare mode (overlay two screenshots)

**Gallery Layout:**
```
┌─────────┬─────────┬─────────┬─────────┐
│ [img]   │ [img]   │ [img]   │ [img]   │
│ Step 1  │ Step 2  │ Step 3  │ Step 4  │
│ Mobile  │ Mobile  │ Mobile  │ Mobile  │
├─────────┼─────────┼─────────┼─────────┤
│ [img]   │ [img]   │ [img]   │ [img]   │
│ Step 1  │ Step 2  │ Step 3  │ Step 4  │
│ Tablet  │ Tablet  │ Tablet  │ Tablet  │
└─────────┴─────────┴─────────┴─────────┘
```

### 10. Quality Trends Chart

**Component:** `components/dashboard/QualityTrendsChart.tsx`

**Chart Type:** Line or area chart

**Data Points:**
- X-axis: Date/time of test runs
- Y-axis: Quality score (0-100)
- Multiple lines for different test suites (optional)

**Features:**
- Hover to see exact values
- Click data point to jump to that test run report
- Zoom/pan controls for long history
- Toggle between different metrics (pass rate, issue count, quality score)

**Additional Charts:**
- Issue count over time (stacked bar: critical, warning, info)
- Test duration trends
- Pass/fail rate trends

**Implementation:**
```typescript
// Use recharts or chart.js
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TrendData {
  date: string;
  qualityScore: number;
  passRate: number;
  issueCount: number;
}
```

### 11. Top Issues Widget

**Component:** `components/dashboard/TopIssuesWidget.tsx`

**Display:**
- Most frequently occurring issues across all test runs
- Most critical issues from recent runs
- Clickable to see all occurrences

**Example:**
```
Most Common Issues:
1. Color contrast insufficient (12 occurrences)
2. Button too small on mobile (8 occurrences)
3. Image not loading (5 occurrences)

Most Critical Recent Issues:
1. Submit button not accessible (Mobile, Yesterday)
2. Page crash on form submission (All viewports, 2 days ago)
```

### 12. Historical Comparison

**Component:** `components/reports/HistoricalComparison.tsx`

**Feature:**
- Compare current test run with previous runs
- Show regressions (new failures or issues)
- Show improvements (fixed issues)
- Delta indicators (↑ worse, ↓ better, → same)

**UI:**
```
Comparison: Current vs 7 days ago

Pass Rate:      87.2% → 89.5%  ↑ +2.3%  🟢
Issue Count:    23 → 18        ↓ -5      🟢
Quality Score:  71 → 68        ↓ -3      🔴

New Issues (5):
- [Issue description]
- [Issue description]

Fixed Issues (10):
- [Issue description]
- [Issue description]
```

### 13. Export & Reporting

**Component:** `components/reports/ReportExporter.tsx`

**Export Formats:**

**1. PDF Report:**
- Executive summary page
- Screenshots grid
- Issue details with recommendations
- Charts and visualizations
- Use library: jsPDF or Puppeteer for PDF generation

**2. JSON Export:**
```json
{
  "testRun": {
    "id": "...",
    "suite": "...",
    "date": "...",
    "results": [...],
    "analyses": [...]
  }
}
```

**3. CSV Export:**
- Flat format for spreadsheet analysis
- Columns: Test Name, Viewport, Status, Duration, Issues, etc.

**4. Markdown Report:**
```markdown
# Test Report: Homepage Suite
Date: 2024-03-15
Quality Score: 87/100

## Summary
- Total Tests: 15
- Passed: 13 (86.7%)
- Failed: 2 (13.3%)

## Issues Found
### Critical (2)
- [Issue 1]
- [Issue 2]
...
```

**Implementation:**
```typescript
// lib/export/reportGenerator.ts

export async function generatePDFReport(
  testRunId: string
): Promise<Buffer> {
  // Fetch all data
  // Generate HTML template
  // Convert to PDF with Puppeteer
  // Return buffer
}

export function generateMarkdownReport(
  testRun: TestRun,
  results: TestResult[],
  analyses: AIAnalysis[]
): string {
  // Build markdown string
  // Include sections: summary, results, issues, recommendations
  // Return markdown
}
```

### 14. Filtering & Search

**Component:** `components/reports/ReportFilters.tsx`

**Filter Options:**
- Date range picker
- Test suite selector (multi-select)
- Status filter (all, passed, failed, running)
- Viewport filter
- Issue severity filter
- Search by test name or URL

**State Management:**
```typescript
interface FilterState {
  dateRange: { start: Date; end: Date };
  suites: string[];
  statuses: string[];
  viewports: string[];
  severities: string[];
  searchQuery: string;
}

// Apply filters to query
function applyFilters(filters: FilterState): QueryBuilder {
  let query = supabase.from('test_runs').select('*');
  
  if (filters.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end);
  }
  
  if (filters.suites.length > 0) {
    query = query.in('suite_id', filters.suites);
  }
  
  // ... apply other filters
  
  return query;
}
```

### 15. Real-Time Updates

**Feature:** Auto-refresh when new test runs complete

**Implementation:**
```typescript
// Subscribe to test_runs table changes
useEffect(() => {
  const subscription = supabase
    .channel('test_runs_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'test_runs',
        filter: 'status=eq.completed'
      },
      (payload) => {
        // Refresh dashboard data
        refreshData();
        // Show notification
        toast.success('New test run completed!');
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
}, []);
```

### 16. Responsive Design for Reports

**Mobile Optimizations:**
- Stack viewport cards vertically on mobile
- Collapsible sections for better navigation
- Touch-friendly controls
- Simplified charts for small screens
- Swipe gestures for screenshot gallery

### 17. Performance Optimizations

**Strategies:**
- Lazy load screenshots (IntersectionObserver)
- Paginate large result sets
- Virtual scrolling for long lists
- Cache dashboard data (SWR or React Query)
- Optimize image sizes (thumbnails vs full-size)
- Pre-generate PDF reports asynchronously

## Database Queries

**Dashboard Stats:**
```typescript
export async function getDashboardStats(): Promise<DashboardStats> {
  // Total tests count
  const { count: totalTests } = await supabase
    .from('test_results')
    .select('*', { count: 'exact', head: true });
  
  // Pass rate calculation
  const { data: results } = await supabase
    .from('test_results')
    .select('status');
  
  const passRate = results
    ? (results.filter(r => r.status === 'pass').length / results.length) * 100
    : 0;
  
  // Issue count
  const { count: issueCount } = await supabase
    .from('ai_analyses')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical');
  
  return { totalTests, passRate, issueCount };
}
```

**Recent Test Runs:**
```typescript
export async function getRecentTestRuns(
  limit: number = 20,
  offset: number = 0
): Promise<TestRunListItem[]> {
  const { data } = await supabase
    .from('test_runs')
    .select(`
      *,
      test_suites(name, target_url),
      test_results(count, status)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Transform and return
  return transformTestRuns(data);
}
```

**Test Run Detail:**
```typescript
export async function getTestRunDetail(
  testRunId: string
): Promise<TestRunDetail> {
  const { data } = await supabase
    .from('test_runs')
    .select(`
      *,
      test_suites(*),
      test_results(
        *,
        ai_analyses(*)
      )
    `)
    .eq('id', testRunId)
    .single();
  
  return data;
}
```

## UI/UX Considerations

**Loading States:**
- Skeleton loaders for async content
- Progress indicators for long operations
- Optimistic updates where appropriate

**Empty States:**
- Friendly messages when no test runs exist
- Call-to-action to create first test
- Helpful tips or onboarding

**Error States:**
- Clear error messages
- Retry buttons
- Contact support link

**Animations:**
- Smooth transitions between views
- Animated charts and counters
- Page transitions with Framer Motion

## Acceptance Criteria
- [ ] Dashboard displays accurate summary statistics
- [ ] Test runs list is sortable, filterable, and paginated
- [ ] Detailed report page shows all relevant information
- [ ] Viewport comparison works correctly
- [ ] AI analysis is clearly presented with actionable insights
- [ ] Screenshot gallery is functional and performant
- [ ] Quality trends chart displays historical data
- [ ] Export functionality works for all formats (PDF, JSON, CSV, Markdown)
- [ ] Real-time updates work when tests complete
- [ ] Mobile responsive design works properly
- [ ] Loading and error states are handled gracefully

## Performance Targets
- Dashboard loads in < 2 seconds
- Report page loads in < 3 seconds
- Screenshot gallery renders smoothly (60fps)
- Charts render without lag
- Filtering/sorting is instant (< 100ms)

## Testing Notes for Claude Code
- Test with large datasets (100+ test runs)
- Verify charts render correctly with edge cases (no data, single data point)
- Test all export formats with real data
- Validate responsive design on multiple devices
- Check real-time updates with concurrent test runs

## Documentation Requirements
- User guide for dashboard navigation
- Explanation of quality score calculation
- Guide to interpreting AI analysis results
- Export format documentation
- Troubleshooting common issues
