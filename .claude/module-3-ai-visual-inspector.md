# Module 3: AI Visual Inspector

## Objective
Leverage Gemini's multimodal capabilities to analyze test screenshots and detect visual, functional, accessibility, and cross-viewport issues automatically. Provide actionable insights with confidence scores and severity classifications.

## Dependencies
- Phase 0 completed
- Module 2 completed (test results and screenshots must be available)
- Gemini API configured with vision capabilities

## Features to Implement

### 1. Visual Analysis Engine

**API Endpoint:** `/app/api/gemini/analyze-visual/route.ts`

**Functionality:**
- Accept test result ID and screenshot URLs
- Load screenshots from Supabase Storage
- Send to Gemini with structured analysis prompt
- Parse and structure AI findings
- Assign severity levels and confidence scores
- Store analysis in ai_analyses table
- Return structured findings

**Input Structure:**
```typescript
interface VisualAnalysisRequest {
  testResultId: string;
  screenshots: Array<{
    url: string;
    stepName: string;
    viewport: string;
    timestamp: number;
  }>;
  context: {
    testName: string;
    targetUrl: string;
    viewport: string;
    testStatus: 'pass' | 'fail';
  };
}
```

### 2. Gemini Analysis Prompts

**Comprehensive Analysis Prompt:**
```typescript
const VISUAL_ANALYSIS_PROMPT = `
You are an expert QA engineer and UX designer analyzing web application screenshots for quality issues.

Context:
- Test: {testName}
- Viewport: {viewport} ({dimensions})
- URL: {targetUrl}
- Test Status: {testStatus}

Analyze the provided screenshots and identify issues in these categories:

1. VISUAL/LAYOUT ISSUES:
   - Overlapping elements or text cutoff
   - Broken responsive layouts (horizontal scroll, overflow)
   - Inconsistent spacing or alignment
   - Missing, broken, or improperly sized images
   - Color contrast failures (WCAG standards)
   - Font rendering problems (text too small, unreadable)
   - CSS loading failures (unstyled content)

2. FUNCTIONAL ISSUES:
   - Interactive elements too small (especially for touch targets on mobile)
   - Buttons or CTAs not visible or poorly positioned
   - Form fields without labels or unclear purpose
   - Loading states blocking interaction indefinitely
   - Z-index problems (modals behind content, dropdowns cut off)
   - Hover states not working as expected
   - Navigation elements not accessible

3. RESPONSIVE/CROSS-VIEWPORT ISSUES:
   - Elements disappearing or hidden on certain viewport sizes
   - Navigation breaking on mobile (hamburger menu issues)
   - Content reflow problems (text wrapping incorrectly)
   - Fixed-width elements causing horizontal scroll
   - Images not scaling properly
   - Touch vs hover state conflicts

4. ACCESSIBILITY ISSUES:
   - Insufficient color contrast (text vs background)
   - Missing alt text indicators on images
   - Form inputs without visible labels
   - Interactive elements without focus indicators
   - Text too small (below 16px on mobile)

5. CONTENT ISSUES:
   - Placeholder or "Lorem ipsum" text visible
   - Broken or missing content
   - Truncated text without proper ellipsis
   - Empty states not handled gracefully
   - Error messages not user-friendly

For each issue found, provide:
{
  "category": "visual|functional|responsive|accessibility|content",
  "severity": "critical|warning|info",
  "issue": "Clear description of the problem",
  "location": "Where in the screenshot (e.g., 'header navigation', 'main content area')",
  "recommendation": "How to fix this issue",
  "affectedElements": ["selector1", "selector2"],
  "confidenceScore": 0.0-1.0
}

Return ONLY valid JSON with an array of issues found. If no issues, return empty array.
Be specific and actionable. Focus on real problems that impact user experience.
`;
```

**Comparison Analysis Prompt (for cross-viewport):**
```typescript
const VIEWPORT_COMPARISON_PROMPT = `
You are analyzing the same web page across different viewport sizes.

Viewports being compared:
{viewportList}

Screenshots provided show the same page at different sizes.

Identify RESPONSIVE DESIGN issues:
1. Content that appears on one viewport but missing on another
2. Layout breaking at specific breakpoints
3. Navigation changes that hurt usability
4. Images or media not properly scaling
5. Touch targets adequate on mobile but mouse-only on desktop
6. Text readability differences across devices

For each issue:
{
  "category": "responsive",
  "severity": "critical|warning|info",
  "issue": "Description of responsive problem",
  "affectedViewports": ["mobile", "desktop"],
  "recommendation": "CSS/design fix suggestion",
  "confidenceScore": 0.0-1.0
}

Return ONLY valid JSON array of responsive issues found.
`;
```

### 3. Analysis Categories & Severity

**Severity Levels:**
```typescript
enum Severity {
  CRITICAL = 'critical',  // Breaks functionality or severely impacts UX
  WARNING = 'warning',    // Noticeable issue but not breaking
  INFO = 'info'          // Minor inconsistency or improvement opportunity
}

enum Category {
  VISUAL = 'visual',
  FUNCTIONAL = 'functional',
  RESPONSIVE = 'responsive',
  ACCESSIBILITY = 'accessibility',
  CONTENT = 'content'
}
```

**Severity Guidelines:**
- **Critical:** Broken layouts, inaccessible features, major functionality failures
- **Warning:** Usability problems, inconsistent styling, minor accessibility issues
- **Info:** Suggestions for improvement, best practice recommendations

### 4. Analysis Results Structure

**Output Schema:**
```typescript
interface AIAnalysis {
  id: string;
  resultId: string;
  analysisType: Category;
  findings: Finding[];
  overallScore: number; // 0-100, calculated from findings
  analyzedAt: Date;
}

interface Finding {
  category: Category;
  severity: Severity;
  issue: string;
  location: string;
  recommendation: string;
  affectedElements: string[];
  confidenceScore: number; // 0.0 to 1.0
  screenshotUrl?: string; // reference to specific screenshot
  annotatedImageUrl?: string; // with visual markers
}
```

### 5. Analysis Trigger & Orchestration

**Auto-Analysis Options:**
- Trigger immediately after test execution completes
- Batch analysis for all test results in a run
- Manual trigger from reports page
- Schedule periodic re-analysis

**Component:** `components/inspector/AnalysisOrchestrator.tsx`

**Workflow:**
```typescript
async function analyzeTestRun(testRunId: string): Promise<void> {
  // 1. Fetch all test results for this run
  const results = await getTestResults(testRunId);
  
  // 2. For each result, analyze screenshots
  for (const result of results) {
    const analysis = await analyzeVisual({
      testResultId: result.id,
      screenshots: result.screenshots,
      context: {
        testName: result.testName,
        targetUrl: result.targetUrl,
        viewport: result.viewport,
        testStatus: result.status
      }
    });
    
    // 3. Store analysis
    await saveAnalysis(result.id, analysis);
  }
  
  // 4. Run cross-viewport comparison
  if (results.length > 1) {
    await analyzeViewportDifferences(results);
  }
}
```

### 6. Visual Annotation System

**Feature:** Highlight detected issues on screenshots

**Component:** `components/inspector/AnnotatedScreenshot.tsx`

**Functionality:**
- Take original screenshot
- Overlay visual markers for detected issues
- Color-coded by severity (red: critical, yellow: warning, blue: info)
- Numbered markers corresponding to findings list
- Click marker to jump to finding details

**Implementation:**
```typescript
// lib/imageProcessing/annotate.ts
import sharp from 'sharp';

export async function annotateScreenshot(
  screenshotUrl: string,
  findings: Finding[]
): Promise<Buffer> {
  const image = await fetch(screenshotUrl).then(r => r.buffer());
  
  let annotated = sharp(image);
  
  // Add overlay for each finding
  findings.forEach((finding, index) => {
    // Estimate location based on finding.location description
    // Add colored box or circle
    // Add numbered label
  });
  
  return await annotated.png().toBuffer();
}
```

**Note:** For hackathon scope, manual positioning or simple heuristics for annotation may suffice.

### 7. Issue Dashboard

**Component:** `components/inspector/IssueDashboard.tsx`

**Display:**
- Summary cards:
  - Total issues found: 23
  - Critical: 3 | Warning: 15 | Info: 5
  - Most common category: Visual (12 issues)
  - Overall quality score: 67/100

**Issue List:**
- Grouped by severity or category
- Sortable and filterable
- Expandable cards showing full details
- Link to corresponding screenshot
- "Mark as resolved" action
- "False positive" flag

**Visual Design:**
```
┌──────────────────────────────────────────┐
│ Critical Issues (3)                      │
├──────────────────────────────────────────┤
│ 🔴 Header overlaps main content          │
│    Location: Top navigation              │
│    Viewport: Mobile Small                │
│    Confidence: 95%                       │
│    [View Screenshot] [Mark Resolved]     │
├──────────────────────────────────────────┤
│ 🔴 Submit button not accessible          │
│    Location: Contact form                │
│    Viewport: Desktop HD                  │
│    Confidence: 88%                       │
│    [View Screenshot] [Mark Resolved]     │
└──────────────────────────────────────────┘
```

### 8. Confidence Score Interpretation

**Display Guidance:**
```typescript
function getConfidenceLabel(score: number): string {
  if (score >= 0.9) return 'Very Confident';
  if (score >= 0.75) return 'Confident';
  if (score >= 0.6) return 'Moderately Confident';
  return 'Low Confidence - Review Needed';
}

function getConfidenceColor(score: number): string {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.75) return 'text-blue-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-gray-600';
}
```

**UI Display:**
- Show confidence percentage
- Visual indicator (progress bar or badge)
- Tooltip explaining confidence score
- Allow filtering by confidence threshold

### 9. Accessibility Checker

**Specialized Analysis:**
```typescript
const ACCESSIBILITY_ANALYSIS_PROMPT = `
You are a WCAG 2.1 accessibility expert analyzing a web application screenshot.

Evaluate for:
1. Color Contrast: Check text vs background meets WCAG AA (4.5:1 normal, 3:1 large text)
2. Text Size: Ensure body text is at least 16px, headings appropriately sized
3. Touch Targets: Interactive elements at least 44x44px on mobile
4. Form Labels: All inputs should have visible labels or placeholders
5. Focus Indicators: Visible focus states on interactive elements
6. Alt Text: Images should have alt text (infer from context if missing)

For each accessibility issue:
{
  "category": "accessibility",
  "wcagCriterion": "1.4.3|2.4.7|etc",
  "level": "A|AA|AAA",
  "severity": "critical|warning|info",
  "issue": "Description",
  "recommendation": "Fix suggestion",
  "confidenceScore": 0.0-1.0
}

Return ONLY valid JSON array.
`;
```

**Component:** `components/inspector/AccessibilityReport.tsx`

**Features:**
- WCAG compliance score
- Criterion-by-criterion breakdown
- Pass/fail indicators
- Links to WCAG documentation
- Prioritized fix list

### 10. Comparison Analysis (Multi-Viewport)

**Component:** `components/inspector/ViewportComparison.tsx`

**Functionality:**
- Side-by-side screenshot comparison
- Highlight differences between viewports
- Identify responsive breakpoint issues
- Synchronized scrolling (optional)

**Analysis Focus:**
- Elements present/absent across viewports
- Layout changes that break usability
- Content reflow issues
- Navigation pattern changes

### 11. Historical Trend Analysis

**Component:** `components/inspector/TrendAnalysis.tsx`

**Features:**
- Chart showing issue count over time
- Issue category distribution trends
- Quality score progression
- Regression detection (new issues in latest run)

**Data Queries:**
```typescript
export async function getIssueTrends(
  suiteId: string,
  timeRange: 'week' | 'month' | 'all'
): Promise<TrendData[]> {
  // Query ai_analyses joined with test_runs
  // Group by date
  // Count issues by severity and category
  // Calculate quality scores
}
```

### 12. Export & Reporting

**Component:** `components/inspector/AnalysisExport.tsx`

**Export Formats:**
- **JSON:** Full structured data
- **CSV:** Issue list for spreadsheet analysis
- **PDF Report:** Executive summary with screenshots
- **Markdown:** For documentation/wikis

**Report Contents:**
- Executive summary (issue counts, quality score)
- Detailed findings list
- Screenshot evidence
- Recommendations prioritized by severity
- Trends and historical context

## Database Operations

**Save Analysis:**
```typescript
export async function saveAnalysis(
  resultId: string,
  analysis: AIAnalysis
): Promise<void> {
  await supabase.from('ai_analyses').insert({
    result_id: resultId,
    analysis_type: 'comprehensive',
    findings: analysis.findings,
    severity: calculateOverallSeverity(analysis.findings),
    suggestions: generateSuggestions(analysis.findings),
    confidence_score: calculateAverageConfidence(analysis.findings)
  });
}
```

**Query Analyses:**
```typescript
export async function getAnalyses(
  testRunId: string
): Promise<AIAnalysis[]> {
  const { data } = await supabase
    .from('ai_analyses')
    .select(`
      *,
      test_results!inner(
        run_id,
        viewport,
        test_name,
        screenshots
      )
    `)
    .eq('test_results.run_id', testRunId);
  
  return data;
}
```

## Gemini API Implementation

**Configuration:**
```typescript
// lib/gemini/visualInspector.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeScreenshots(
  screenshots: string[],
  prompt: string
): Promise<Finding[]> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp'
  });

  // Convert screenshot URLs to base64 or use URLs directly
  const imageParts = await Promise.all(
    screenshots.map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return {
        inlineData: {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: 'image/png'
        }
      };
    })
  );

  const result = await model.generateContent([
    prompt,
    ...imageParts
  ]);

  const responseText = result.response.text();
  
  // Parse JSON response
  const findings = JSON.parse(responseText);
  
  return findings;
}
```

## Error Handling

**Scenarios to Handle:**
- Gemini API failures or rate limits
- Invalid/corrupted screenshots
- JSON parsing errors from AI response
- Network failures during image fetch
- Storage access issues

**Fallback Strategies:**
```typescript
async function analyzeWithRetry(
  request: VisualAnalysisRequest
): Promise<AIAnalysis> {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      return await analyzeVisual(request);
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        // Return partial analysis or flag for manual review
        return {
          id: generateId(),
          resultId: request.testResultId,
          analysisType: 'visual',
          findings: [],
          overallScore: null,
          error: 'Analysis failed after retries',
          analyzedAt: new Date()
        };
      }
      await sleep(2000 * attempts);
    }
  }
}
```

## Acceptance Criteria
- [ ] Visual analysis runs automatically after test execution
- [ ] Gemini successfully identifies common UI issues
- [ ] Findings are categorized and severity-assigned correctly
- [ ] Confidence scores help prioritize review
- [ ] Issues are stored in database with full context
- [ ] Dashboard displays issues in organized, filterable manner
- [ ] Cross-viewport comparison detects responsive issues
- [ ] Accessibility analysis meets WCAG standards
- [ ] Export functionality works for all supported formats
- [ ] Error handling prevents analysis failures from blocking workflow

## Performance Considerations
- Batch screenshot analysis to reduce API calls
- Cache analysis results for same screenshots
- Use thumbnail previews in issue list
- Lazy load annotated screenshots
- Implement pagination for large issue lists
- Rate limit Gemini API calls appropriately

## Testing Notes for Claude Code
- Test with various UI issues (overlaps, contrast, sizing)
- Verify confidence scores are reasonable
- Test false positive detection
- Validate JSON parsing from Gemini responses
- Ensure all severity levels are handled correctly

## Documentation Requirements
- Document finding schema and categories
- Provide examples of each issue type
- Explain confidence score calculation
- Include prompt engineering guidelines
- Create troubleshooting guide for analysis failures
