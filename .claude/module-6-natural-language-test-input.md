# Module 6: Natural Language Test Input

## Objective
Enable users to describe tests in plain English and have Gemini automatically convert them into executable Playwright test code, making test creation accessible to non-technical team members and speeding up test authoring.

## Dependencies
- Phase 0 completed
- Module 1 completed (test code generation infrastructure)
- Gemini API configured

## Features to Implement

### 1. Natural Language Input Interface

**Location:** `/app/designer/nl-test/page.tsx` or integrated into Module 1 designer

**Component:** `components/nl-test/NaturalLanguageInput.tsx`

**UI Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Describe Your Test in Plain English                 │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ Test the checkout flow on mobile:                │ │
│ │ 1. Go to the homepage                            │ │
│ │ 2. Click "Shop Now"                              │ │
│ │ 3. Add "Blue T-Shirt" to cart                    │ │
│ │ 4. Proceed to checkout                           │ │
│ │ 5. Fill in shipping information                  │ │
│ │ 6. Complete the purchase                         │ │
│ │                                                  │ │
│ │                                                  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Target URL: [https://example.com              ]     │
│ Viewport:   [Mobile ▼]                              │
│                                                      │
│             [Generate Test Code]                     │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Large textarea for natural language input
- Target URL field
- Viewport selector
- Example prompts/templates
- Character count (optional)
- "Generate Test" primary action button

### 2. Example Prompts Library

**Component:** `components/nl-test/ExamplePrompts.tsx`

**Examples to Display:**
```typescript
const EXAMPLE_PROMPTS = [
  {
    category: "Navigation",
    examples: [
      "Test the main navigation menu on desktop",
      "Verify all footer links work correctly",
      "Check that the hamburger menu opens on mobile"
    ]
  },
  {
    category: "Forms",
    examples: [
      "Test the contact form with valid data",
      "Test form validation with empty fields",
      "Verify error messages appear for invalid email"
    ]
  },
  {
    category: "E-commerce",
    examples: [
      "Test adding a product to cart",
      "Test the checkout flow on mobile",
      "Verify product search returns correct results"
    ]
  },
  {
    category: "User Authentication",
    examples: [
      "Test login with valid credentials",
      "Test login with invalid password",
      "Verify forgot password flow"
    ]
  },
  {
    category: "Visual Checks",
    examples: [
      "Check if all images load on the homepage",
      "Verify the hero section displays correctly",
      "Test responsive layout on different screen sizes"
    ]
  }
];
```

**UI:**
- Collapsible categories
- Click example to populate input field
- "Try this example" button

### 3. Gemini NL-to-Code Conversion

**API Endpoint:** `/app/api/gemini/nl-to-playwright/route.ts`

**Core Functionality:**
- Accept natural language test description
- Parse and understand user intent
- Generate structured Playwright test code
- Include assertions and error handling
- Return executable TypeScript code

**Conversion Prompt:**
```typescript
const NL_TO_PLAYWRIGHT_PROMPT = `
You are an expert Playwright test automation engineer. Convert natural language test descriptions into executable Playwright test code.

User Description:
{userInput}

Target URL: {targetUrl}
Viewport: {viewport}

Guidelines:
1. Generate TypeScript code using Playwright's test framework
2. Include proper imports and test structure
3. Use best practices for selectors (prefer data-testid, role, text)
4. Add appropriate wait strategies (waitForSelector, waitForLoadState)
5. Include meaningful assertions (expect statements)
6. Add comments explaining each step
7. Handle common edge cases (loading states, timeouts)
8. Use page object patterns where appropriate
9. Include screenshot capture at key steps
10. Make the test maintainable and readable

Output format:
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('descriptive test name', async ({ page }) => {
  // Your generated test code here
});
\`\`\`

Return ONLY the code block, no additional explanation.
`;
```

**Implementation:**
```typescript
// lib/gemini/nlToPlaywright.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface NLTestRequest {
  description: string;
  targetUrl: string;
  viewport: string;
  additionalContext?: string;
}

export async function convertNLToPlaywright(
  request: NLTestRequest
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = NL_TO_PLAYWRIGHT_PROMPT
    .replace('{userInput}', request.description)
    .replace('{targetUrl}', request.targetUrl)
    .replace('{viewport}', request.viewport);

  const result = await model.generateContent(prompt);
  const generatedCode = result.response.text();

  // Extract code from markdown code block
  const codeMatch = generatedCode.match(/```typescript\n([\s\S]*?)\n```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }

  return generatedCode.trim();
}
```

### 4. Intent Recognition & Validation

**Feature:** Analyze user input to ensure it's testable

**Component:** `lib/nl-test/intentAnalyzer.ts`

**Validation Checks:**
```typescript
interface IntentAnalysis {
  isValid: boolean;
  confidence: number;
  testType: 'functional' | 'visual' | 'accessibility' | 'performance';
  steps: string[];
  requiredSelectors: string[];
  warnings: string[];
  suggestions: string[];
}

export async function analyzeIntent(
  description: string
): Promise<IntentAnalysis> {
  // Use Gemini to analyze the description
  const prompt = `
  Analyze this test description and determine:
  1. Is it a valid, testable scenario?
  2. What type of test is it (functional, visual, etc.)?
  3. What are the individual steps?
  4. What UI elements need to be identified?
  5. Any ambiguities or missing information?
  
  Description: ${description}
  
  Return JSON with analysis.
  `;
  
  // Call Gemini and parse response
  // Return structured analysis
}
```

**UI Feedback:**
- Show warnings if description is unclear
- Suggest improvements before generation
- Display confidence score

### 5. Interactive Refinement

**Component:** `components/nl-test/TestRefinement.tsx`

**Workflow:**
1. User enters initial description
2. System analyzes and shows parsed steps
3. User can edit/refine steps
4. User approves and generates code

**UI:**
```
┌──────────────────────────────────────────┐
│ Parsed Test Steps:                       │
├──────────────────────────────────────────┤
│ 1. Navigate to homepage                  │
│    [Edit] [Remove]                       │
├──────────────────────────────────────────┤
│ 2. Click "Shop Now" button               │
│    [Edit] [Remove]                       │
├──────────────────────────────────────────┤
│ 3. Add product to cart                   │
│    ⚠️ Ambiguous: Which product?          │
│    [Edit] [Remove]                       │
├──────────────────────────────────────────┤
│ [+ Add Step]                             │
│                                          │
│ [Generate Code] [Back to Description]    │
└──────────────────────────────────────────┘
```

**Features:**
- Edit individual steps
- Reorder steps (drag-and-drop)
- Add missing steps
- Remove unnecessary steps
- Clarify ambiguous instructions

### 6. Code Preview & Editing

**Component:** `components/nl-test/GeneratedCodePreview.tsx`

**Features:**
- Syntax-highlighted code display
- Side-by-side: NL description | Generated code
- Edit generated code inline
- Validate syntax before saving
- Run test immediately or save for later

**Layout:**
```
┌─────────────────────┬────────────────────────┐
│ Your Description    │  Generated Code        │
├─────────────────────┼────────────────────────┤
│ Test the checkout   │ import { test, ...     │
│ flow on mobile:     │                        │
│                     │ test('Checkout flow    │
│ 1. Go to homepage   │   async ({ page }) => {│
│                     │   await page.goto(...) │
│ 2. Click Shop Now   │                        │
│                     │   await page.click(...) │
│ 3. Add product      │                        │
│                     │   // ...               │
│ ...                 │                        │
└─────────────────────┴────────────────────────┘
```

### 7. Smart Selector Suggestions

**Feature:** Help users identify UI elements by suggesting selectors

**Component:** `components/nl-test/SelectorHelper.tsx`

**Process:**
1. User mentions element like "Login button"
2. System fetches page and finds potential matches
3. Shows suggestions: `button:has-text("Login")`, `[data-testid="login-btn"]`, etc.
4. User selects best selector or provides custom one

**Implementation:**
```typescript
// lib/nl-test/selectorFinder.ts
export async function findSelectors(
  url: string,
  elementDescription: string
): Promise<string[]> {
  // Launch Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Try multiple selector strategies
  const strategies = [
    `button:has-text("${elementDescription}")`,
    `a:has-text("${elementDescription}")`,
    `[aria-label*="${elementDescription}"]`,
    `[placeholder*="${elementDescription}"]`,
    `text=${elementDescription}`
  ];
  
  const validSelectors = [];
  for (const selector of strategies) {
    try {
      const element = await page.$(selector);
      if (element) {
        validSelectors.push(selector);
      }
    } catch {
      // Invalid selector, skip
    }
  }
  
  await browser.close();
  return validSelectors;
}
```

### 8. Multi-Language Support

**Feature:** Accept test descriptions in multiple languages

**Supported Languages:**
- English (primary)
- Spanish
- French
- German
- Japanese (optional for hackathon)

**Implementation:**
- Gemini inherently supports multiple languages
- Detect language in input
- Generate code with English comments by default
- Option to keep comments in original language

### 9. Test Templates

**Component:** `components/nl-test/TestTemplates.tsx`

**Pre-built Templates:**
```typescript
const TEMPLATES = [
  {
    name: "Basic Page Load Test",
    description: "Navigate to URL and verify page loads correctly",
    template: `Test that {url} loads successfully:
1. Go to the page
2. Verify the page title contains "{expected_title}"
3. Check that the main content is visible`
  },
  {
    name: "Form Submission Test",
    description: "Test form with multiple fields",
    template: `Test the {form_name} form:
1. Navigate to {url}
2. Fill in {field_1} with {value_1}
3. Fill in {field_2} with {value_2}
4. Click the submit button
5. Verify success message appears`
  },
  {
    name: "Login Flow Test",
    description: "Standard login test",
    template: `Test user login:
1. Go to {login_url}
2. Enter username: {username}
3. Enter password: {password}
4. Click login button
5. Verify user is redirected to dashboard
6. Check that username is displayed in header`
  },
  {
    name: "Responsive Layout Test",
    description: "Test across multiple viewports",
    template: `Test responsive design:
1. Navigate to {url}
2. Verify layout at mobile size (375px)
3. Verify layout at tablet size (768px)
4. Verify layout at desktop size (1920px)
5. Check that navigation adapts appropriately`
  }
];
```

**UI:**
- Browse templates by category
- Fill in placeholders with specific values
- Generate from template

### 10. Conversational Refinement (Advanced)

**Feature:** Chat-like interface to refine tests

**Component:** `components/nl-test/ConversationalBuilder.tsx`

**Interaction Flow:**
```
User: "Test the login form"

AI: "I'll create a login test. What's the URL of the login page?"

User: "https://example.com/login"

AI: "Great! Should this test use specific credentials or test data?"

User: "Use test@example.com and password123"

AI: "Perfect. After login, what should the test verify?"

User: "Check that it redirects to /dashboard"

AI: "Got it! Here's your test:
[Generated code preview]
Would you like to add any other checks?"
```

**Implementation:**
- Multi-turn conversation with Gemini
- Context retention across messages
- Incrementally build test specification

### 11. Voice Input (Optional)

**Feature:** Speak test descriptions

**Implementation:**
- Use Web Speech API
- Convert speech to text
- Feed into NL processor

**UI:**
```
[🎤 Start Recording]
"Test the checkout flow..."
[Stop Recording]

Transcribed: "Test the checkout flow on mobile. Go to homepage, click Shop Now, add blue t-shirt to cart..."

[Generate Test Code]
```

### 12. Learning from Examples

**Feature:** Improve generation by learning from user edits

**Process:**
1. User generates test from NL description
2. User edits generated code
3. System stores: NL input → Final code
4. Future similar requests use learned patterns

**Database Schema:**
```sql
CREATE TABLE nl_test_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nl_description TEXT NOT NULL,
    generated_code TEXT NOT NULL,
    final_code TEXT, -- After user edits
    user_satisfaction INTEGER, -- 1-5 rating
    target_url TEXT,
    viewport VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Prompt Enhancement:**
```typescript
const enhancedPrompt = `
${NL_TO_PLAYWRIGHT_PROMPT}

Here are some examples of similar tests:
${learnedExamples.map(ex => `
Input: ${ex.nl_description}
Output: ${ex.final_code}
`).join('\n')}

Use these as reference for the current request.
`;
```

### 13. Validation & Dry Run

**Feature:** Validate generated code before saving

**Component:** `components/nl-test/CodeValidator.tsx`

**Checks:**
- TypeScript syntax errors
- Playwright API usage correctness
- Selector validity (optional: actually test against page)
- Missing imports

**Implementation:**
```typescript
// lib/nl-test/validator.ts
import * as ts from 'typescript';

export function validateTypeScript(code: string): ValidationResult {
  const result = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  });
  
  return {
    isValid: result.diagnostics.length === 0,
    errors: result.diagnostics.map(d => ({
      line: d.start,
      message: d.messageText.toString()
    }))
  };
}

export async function dryRunTest(code: string): Promise<DryRunResult> {
  // Execute in sandboxed environment
  // Return success/failure without side effects
}
```

### 14. Cost Estimation

**Component:** `components/nl-test/CostEstimator.tsx`

**Display:**
- Estimated execution time
- Number of API calls (Gemini)
- Approximate token usage
- Recommended optimizations

### 15. Batch NL Input

**Feature:** Generate multiple tests from batch descriptions

**UI:**
```
Batch Test Generation

[+] Test 1: Login flow
[+] Test 2: Checkout process
[+] Test 3: Search functionality
[+] Test 4: Navigation menu

[Generate All Tests]
```

**Process:**
- Process each description independently
- Or use single Gemini call with all descriptions
- Generate test suite with multiple tests

## API Integration

**Gemini Configuration:**
```typescript
// lib/gemini/nlProcessor.ts
export const NL_MODEL_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7, // Balance creativity and consistency
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40
};
```

**Rate Limiting:**
```typescript
// Handle Gemini API rate limits
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  minTime: 200, // Min time between requests
  maxConcurrent: 5 // Max concurrent requests
});

export const generateTest = limiter.wrap(convertNLToPlaywright);
```

## Database Operations

**Save Generated Test:**
```typescript
export async function saveNLTest(data: {
  nlDescription: string;
  generatedCode: string;
  targetUrl: string;
  viewport: string;
  suiteId?: string;
}): Promise<string> {
  // Create test suite if needed
  const suiteId = data.suiteId || await createTestSuite({
    name: `NL Test: ${data.nlDescription.substring(0, 50)}`,
    target_url: data.targetUrl
  });
  
  // Save test code
  await saveTestCode(suiteId, data.generatedCode);
  
  // Save NL example for learning
  await supabase.from('nl_test_examples').insert({
    nl_description: data.nlDescription,
    generated_code: data.generatedCode,
    target_url: data.targetUrl,
    viewport: data.viewport
  });
  
  return suiteId;
}
```

## Acceptance Criteria
- [ ] User can input natural language test descriptions
- [ ] Gemini successfully converts descriptions to Playwright code
- [ ] Generated code is syntactically valid and executable
- [ ] User can edit generated code before saving
- [ ] Example prompts help users get started
- [ ] Intent analysis catches unclear descriptions
- [ ] Test templates speed up common scenarios
- [ ] Code validation prevents invalid tests from being saved
- [ ] Multi-step refinement allows clarification
- [ ] Generated tests integrate with existing test suites

## Error Handling
- Invalid/unclear NL descriptions
- Gemini API failures
- Code generation failures
- Syntax errors in generated code
- Missing required information (URL, selectors)

## Performance Considerations
- Cache common NL → code conversions
- Debounce generation requests during editing
- Optimize Gemini prompts for speed
- Limit concurrent generation requests

## Testing Notes for Claude Code
- Test with variety of NL descriptions (simple to complex)
- Verify generated code executes correctly
- Test edge cases (ambiguous descriptions, missing info)
- Validate error handling for API failures
- Test refinement and editing workflows

## Documentation Requirements
- Guide on writing effective NL test descriptions
- Examples of good vs bad descriptions
- Explanation of generated code patterns
- Tips for refining ambiguous descriptions
- API usage and rate limits
