# Module 1: Visual Test Designer

## Objective
Build an intelligent test designer that analyzes URLs, captures screenshots across viewports, uses Gemini to understand the page structure, and generates Playwright test scenarios automatically.

## Dependencies
- Phase 0 must be completed
- Gemini API credentials configured
- Playwright installed and configured

## Features to Implement

### 1. Test Suite Creation Interface

**Location:** `/app/designer/page.tsx`

**UI Components:**
- Test suite name input field
- Target URL input with validation (must be valid HTTP/HTTPS)
- Description textarea
- "Analyze & Generate Tests" primary CTA button
- Loading states during analysis

**Form Validation:**
- URL must be valid and accessible
- Test suite name required (3-100 characters)
- Show error messages inline

### 2. Screenshot Capture Engine

**API Endpoint:** `/app/api/screenshots/capture/route.ts`

**Functionality:**
- Accept URL and viewport configurations
- Launch Playwright browser in headless mode
- Navigate to target URL with timeout handling
- Wait for page load (networkidle or load event)
- Capture full-page screenshots for each viewport
- Store screenshots in Supabase Storage
- Return array of screenshot URLs with metadata

**Viewport Configurations:**
```typescript
const VIEWPORTS = {
  mobile_small: { width: 375, height: 667, name: 'iPhone SE' },
  mobile_large: { width: 390, height: 844, name: 'iPhone 12' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1920, height: 1080, name: 'Desktop HD' },
  desktop_large: { width: 2560, height: 1440, name: 'Desktop 2K' }
};
```

**Error Handling:**
- Network timeouts (30s max)
- Invalid URLs
- Pages requiring authentication
- CORS issues
- Screenshot capture failures

### 3. Codebase Access & Analysis

**API Endpoint:** `/app/api/codebase/analyze/route.ts`

**Functionality:**
- Accept URL or GitHub repository link
- If URL: attempt to fetch HTML source
- If GitHub: clone/fetch repository content
- Extract relevant frontend files (HTML, JSX, TSX, Vue, etc.)
- Parse component structure and identify:
  - Interactive elements (buttons, forms, links)
  - Navigation structure
  - Form inputs and validation patterns
  - Modal/popup triggers
  - Dynamic content areas

**Output Structure:**
```typescript
interface CodebaseAnalysis {
  framework: string; // React, Vue, vanilla, etc.
  pages: Array<{
    path: string;
    components: string[];
    interactions: string[];
  }>;
  forms: Array<{
    id: string;
    fields: Array<{ name: string; type: string; required: boolean }>;
    submitAction: string;
  }>;
  navigation: {
    links: Array<{ text: string; href: string }>;
    dynamicRoutes: string[];
  };
}
```

### 4. Gemini Multi-Modal Analysis

**API Endpoint:** `/app/api/gemini/analyze-page/route.ts`

**Input:**
- Screenshot URLs for all viewports
- Codebase analysis data
- Target URL

**Gemini Prompt Structure:**
```
You are an expert QA engineer analyzing a web application. 

Context:
- Target URL: {url}
- Framework: {framework}
- Available screenshots: {viewport_count} viewports

Screenshots show the page at different sizes (mobile, tablet, desktop).
Code analysis reveals: {codebase_summary}

Your task:
1. Identify all interactive elements visible in screenshots
2. Determine critical user flows (e.g., navigation, form submission, authentication)
3. Spot potential edge cases (validation, empty states, error scenarios)
4. Consider cross-viewport functionality differences

Generate comprehensive Playwright test scenarios covering:
- Happy path user flows
- Form validation edge cases
- Responsive behavior verification
- Visual regression checkpoints
- Accessibility checks (where applicable)

Format output as structured JSON with test scenarios.
```

**Expected Output Schema:**
```typescript
interface TestScenario {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'functional' | 'visual' | 'responsive' | 'accessibility';
  steps: Array<{
    action: string; // 'navigate', 'click', 'fill', 'assert', 'screenshot'
    selector?: string;
    value?: string;
    description: string;
  }>;
  expectedOutcomes: string[];
  viewports: string[]; // which viewports this test applies to
}
```

### 5. Playwright Code Generator

**Function:** `lib/playwright/generateTestCode.ts`

**Functionality:**
- Take Gemini's test scenarios JSON
- Transform into executable Playwright TypeScript code
- Include proper imports and setup
- Add comments for clarity
- Implement page object patterns for maintainability
- Include visual regression checkpoints

**Generated Code Template:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('{Suite Name}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{target_url}');
  });

  test('{scenario_name}', async ({ page }) => {
    // {description}
    
    // Step 1: {step_description}
    await page.{action}('{selector}'{, value});
    
    // Visual checkpoint
    await expect(page).toHaveScreenshot('{checkpoint-name}.png');
    
    // Assertions
    await expect(page.locator('{selector}')).toBeVisible();
  });
});
```

**Best Practices:**
- Use data-testid selectors where possible
- Implement wait strategies (waitForSelector, waitForLoadState)
- Add meaningful test descriptions
- Group related tests with describe blocks
- Include cleanup steps in afterEach

### 6. Test Code Editor

**Component:** `components/designer/TestCodeEditor.tsx`

**Features:**
- Syntax-highlighted code editor (use @monaco-editor/react or react-ace)
- Read-only view with "Edit" toggle
- Line numbers
- Dark/light theme matching app theme
- Copy to clipboard button
- Download as .spec.ts button
- Save to database button

**Editing Capabilities:**
- Allow users to modify generated tests
- Validate TypeScript syntax on save
- Show parse errors inline
- Auto-format code on save

### 7. Test Preview Grid

**Component:** `components/designer/ScreenshotPreview.tsx`

**UI Layout:**
- Grid display of all captured screenshots
- Viewport label overlays
- Zoom/lightbox functionality
- Side-by-side comparison mode
- Annotations/notes capability

**Features:**
- Click to view full-size
- Download individual screenshots
- Select screenshots to include in analysis
- Visual indicators for AI-detected interactive elements

### 8. Test Suite Management

**Component:** `components/designer/TestSuiteList.tsx`

**Functionality:**
- List all created test suites from Supabase
- Search and filter capabilities
- Sort by date, name, last run
- Actions: Edit, Duplicate, Delete, Run Tests
- Status indicators (last run status)

**Data Operations:**
- CRUD operations for test_suites table
- Link to test_code table
- Real-time updates with Supabase subscriptions

### 9. AI Suggestions Panel

**Component:** `components/designer/AISuggestions.tsx`

**Display:**
- Sidebar or collapsible panel
- Categorized suggestions:
  - Recommended additional test cases
  - Potential edge cases to cover
  - Accessibility improvements
  - Performance testing opportunities
- Clickable suggestions that add tests to editor

**Data Source:**
- Additional Gemini analysis
- Rules-based suggestions from code patterns

### 10. Workflow Orchestration

**Component:** `components/designer/DesignerWorkflow.tsx`

**Multi-Step Process:**
1. **Step 1: Setup**
   - Enter URL and suite details
   - Validate inputs

2. **Step 2: Analysis** (Animated progress)
   - Capturing screenshots... (with spinner)
   - Analyzing codebase...
   - AI generating tests...
   - Show progress percentage

3. **Step 3: Review & Edit**
   - Display screenshots
   - Show generated test code
   - Allow editing
   - Display AI suggestions

4. **Step 4: Save & Execute**
   - Save to database
   - Option to run tests immediately
   - Or schedule for later

**State Management:**
- Use React Context or Zustand for workflow state
- Persist progress in case of page reload
- Handle back/next navigation

## API Integrations

### Gemini API Setup

**Configuration:**
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzePageForTests(
  screenshots: string[],
  codeAnalysis: CodebaseAnalysis,
  url: string
): Promise<TestScenario[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  // Convert screenshots to base64 if needed
  // Construct prompt
  // Send multi-modal request
  // Parse JSON response
  // Return structured test scenarios
}
```

### Playwright API Setup

**Configuration:**
```typescript
// lib/playwright/setup.ts
import { chromium, Browser } from 'playwright';

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
```

## Database Operations

**Supabase Functions:**

```typescript
// lib/supabase/testSuites.ts

export async function createTestSuite(data: {
  name: string;
  target_url: string;
  description?: string;
}): Promise<string> {
  // Insert into test_suites
  // Return suite ID
}

export async function saveTestCode(
  suiteId: string,
  code: string
): Promise<void> {
  // Insert into test_code
}

export async function getTestSuites(): Promise<TestSuite[]> {
  // Fetch all suites with latest test code
}

export async function deleteTestSuite(suiteId: string): Promise<void> {
  // Cascade delete (handled by DB constraints)
}
```

## Acceptance Criteria
- [ ] User can input URL and create a test suite
- [ ] Screenshots are captured for all viewport sizes
- [ ] Gemini successfully analyzes page and generates test scenarios
- [ ] Playwright test code is generated and editable
- [ ] Tests can be saved to Supabase
- [ ] Test suites are listed and manageable (CRUD operations)
- [ ] Error handling for invalid URLs and API failures
- [ ] Loading states are shown during async operations
- [ ] UI is responsive and follows design system
- [ ] Code editor provides good UX (syntax highlighting, copy, download)

## Error Handling Requirements
- Network timeouts with retry logic
- Invalid URL detection before processing
- Gemini API rate limit handling
- Playwright browser launch failures
- Supabase connection errors
- User-friendly error messages for all failure scenarios

## Performance Considerations
- Implement request debouncing for URL validation
- Cache screenshot results for same URL within session
- Lazy load test suite list (pagination if >50 suites)
- Optimize image sizes for preview grid
- Use Next.js Image component for screenshots

## Testing Notes for Claude Code
- Test with various website types (SPA, MPA, static sites)
- Verify screenshot capture works across all viewports
- Ensure generated Playwright code is syntactically valid
- Test error scenarios (timeout, invalid URL, API failure)
- Verify Supabase operations with real data

## Documentation Requirements
- Add JSDoc comments to all public functions
- Document Gemini prompt structure and expected outputs
- Create README section for test designer usage
- Include example generated test code in docs
