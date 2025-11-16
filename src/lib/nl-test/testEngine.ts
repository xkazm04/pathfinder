import { generateCompletion, parseAIJsonResponse } from '../llm/ai-client';
import type {
  ExamplePrompt,
  ExampleCategory
} from './examplePrompts';
import type {
  TestTemplate,
  TemplatePlaceholder
} from './testTemplates';
import type {
  IntentAnalysis,
  ParsedStep
} from './intentAnalyzer';

// Re-export types for convenience
export type {
  ExamplePrompt,
  ExampleCategory,
  TestTemplate,
  TemplatePlaceholder,
  IntentAnalysis,
  ParsedStep
};

// ============================================================================
// PROMPT DATA
// ============================================================================

export const EXAMPLE_PROMPTS: ExampleCategory[] = [
  {
    category: 'Navigation',
    description: 'Test navigation menus, links, and page routing',
    baseDifficulty: 3,
    examples: [
      'Test the main navigation menu on desktop',
      'Verify all footer links work correctly',
      'Check that the hamburger menu opens on mobile',
      'Test breadcrumb navigation on product pages',
      'Verify back button functionality',
    ],
  },
  {
    category: 'Forms',
    description: 'Test form submissions, validations, and user input',
    baseDifficulty: 4,
    examples: [
      'Test the contact form with valid data',
      'Test form validation with empty fields',
      'Verify error messages appear for invalid email',
      'Test multi-step registration form',
      'Verify form submission success message',
    ],
  },
  {
    category: 'E-commerce',
    description: 'Test shopping cart, checkout, and product interactions',
    baseDifficulty: 6,
    examples: [
      'Test adding a product to cart',
      'Test the checkout flow on mobile',
      'Verify product search returns correct results',
      'Test removing items from cart',
      'Verify coupon code application',
    ],
  },
  {
    category: 'User Authentication',
    description: 'Test login, logout, signup, and password flows',
    baseDifficulty: 5,
    examples: [
      'Test login with valid credentials',
      'Test login with invalid password',
      'Verify forgot password flow',
      'Test user registration with valid data',
      'Verify logout functionality',
    ],
  },
  {
    category: 'Visual Checks',
    description: 'Test visual elements, layouts, and responsive design',
    baseDifficulty: 2,
    examples: [
      'Check if all images load on the homepage',
      'Verify the hero section displays correctly',
      'Test responsive layout on different screen sizes',
      'Check footer appears on every page',
      'Verify logo displays correctly in header',
    ],
  },
  {
    category: 'Search & Filtering',
    description: 'Test search functionality and filter options',
    baseDifficulty: 5,
    examples: [
      'Test product search with valid query',
      'Verify search results update as you type',
      'Test filtering products by price range',
      'Verify sorting products by relevance',
      'Test empty search results message',
    ],
  },
  {
    category: 'Modal & Popups',
    description: 'Test modals, dialogs, tooltips, and popup interactions',
    baseDifficulty: 4,
    examples: [
      'Test opening and closing modal dialog',
      'Verify cookie consent banner appears',
      'Test tooltip displays on hover',
      'Verify modal closes on background click',
      'Test newsletter signup popup',
    ],
  },
  {
    category: 'Accessibility',
    description: 'Test keyboard navigation, ARIA labels, and screen reader support',
    baseDifficulty: 7,
    examples: [
      'Test keyboard navigation through form fields',
      'Verify skip to content link works',
      'Check ARIA labels on interactive elements',
      'Test focus indicators are visible',
      'Verify alt text on all images',
    ],
  },
];

export const TEST_TEMPLATES: TestTemplate[] = [
  {
    id: 'basic-page-load',
    name: 'Basic Page Load Test',
    description: 'Navigate to URL and verify page loads correctly',
    category: 'Basic',
    difficulty: 2,
    estimatedTime: 45,
    template: `Test that {{url}} loads successfully:
1. Go to the page
2. Verify the page title contains "{{expected_title}}"
3. Check that the main content is visible`,
    placeholders: [
      {
        key: 'url',
        label: 'Target URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'expected_title',
        label: 'Expected Title',
        type: 'text',
        required: true,
        placeholder: 'Home Page',
      },
    ],
  },
  {
    id: 'form-submission',
    name: 'Form Submission Test',
    description: 'Test form with multiple fields',
    category: 'Forms',
    difficulty: 4,
    estimatedTime: 90,
    template: `Test the {{form_name}} form:
1. Navigate to {{url}}
2. Fill in {{field_1}} with {{value_1}}
3. Fill in {{field_2}} with {{value_2}}
4. Click the submit button
5. Verify success message appears`,
    placeholders: [
      {
        key: 'form_name',
        label: 'Form Name',
        type: 'text',
        required: true,
        placeholder: 'contact',
      },
      {
        key: 'url',
        label: 'Form URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/contact',
      },
      {
        key: 'field_1',
        label: 'First Field',
        type: 'text',
        required: true,
        placeholder: 'Name',
      },
      {
        key: 'value_1',
        label: 'First Value',
        type: 'text',
        required: true,
        placeholder: 'John Doe',
      },
      {
        key: 'field_2',
        label: 'Second Field',
        type: 'text',
        required: true,
        placeholder: 'Email',
      },
      {
        key: 'value_2',
        label: 'Second Value',
        type: 'text',
        required: true,
        placeholder: 'john@example.com',
      },
    ],
  },
  {
    id: 'login-flow',
    name: 'Login Flow Test',
    description: 'Standard login test',
    category: 'Authentication',
    difficulty: 5,
    estimatedTime: 75,
    template: `Test user login:
1. Go to {{login_url}}
2. Enter username: {{username}}
3. Enter password: {{password}}
4. Click login button
5. Verify user is redirected to {{dashboard_url}}
6. Check that username is displayed in header`,
    placeholders: [
      {
        key: 'login_url',
        label: 'Login URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/login',
      },
      {
        key: 'username',
        label: 'Test Username',
        type: 'text',
        required: true,
        placeholder: 'testuser@example.com',
      },
      {
        key: 'password',
        label: 'Test Password',
        type: 'text',
        required: true,
        placeholder: 'password123',
      },
      {
        key: 'dashboard_url',
        label: 'Dashboard URL',
        type: 'url',
        required: false,
        defaultValue: '/dashboard',
        placeholder: '/dashboard',
      },
    ],
  },
  {
    id: 'responsive-layout',
    name: 'Responsive Layout Test',
    description: 'Test across multiple viewports',
    category: 'Visual',
    difficulty: 3,
    estimatedTime: 60,
    template: `Test responsive design:
1. Navigate to {{url}}
2. Verify layout at mobile size (375px)
3. Verify layout at tablet size (768px)
4. Verify layout at desktop size (1920px)
5. Check that navigation adapts appropriately`,
    placeholders: [
      {
        key: 'url',
        label: 'Target URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
    ],
  },
  {
    id: 'add-to-cart',
    name: 'Add to Cart Test',
    description: 'Test adding product to shopping cart',
    category: 'E-commerce',
    difficulty: 6,
    estimatedTime: 120,
    template: `Test adding product to cart:
1. Navigate to {{product_url}}
2. Verify product {{product_name}} is displayed
3. Click "Add to Cart" button
4. Verify cart count increases
5. Open cart and verify product is listed
6. Check product price matches {{expected_price}}`,
    placeholders: [
      {
        key: 'product_url',
        label: 'Product URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/products/item',
      },
      {
        key: 'product_name',
        label: 'Product Name',
        type: 'text',
        required: true,
        placeholder: 'Blue T-Shirt',
      },
      {
        key: 'expected_price',
        label: 'Expected Price',
        type: 'text',
        required: false,
        placeholder: '$29.99',
      },
    ],
  },
  {
    id: 'search-functionality',
    name: 'Search Functionality Test',
    description: 'Test search with query and results',
    category: 'Search',
    difficulty: 5,
    estimatedTime: 90,
    template: `Test search functionality:
1. Navigate to {{url}}
2. Enter "{{search_query}}" in the search field
3. Click search or press Enter
4. Verify search results page loads
5. Check that results contain "{{search_query}}"
6. Verify at least {{min_results}} results are shown`,
    placeholders: [
      {
        key: 'url',
        label: 'Homepage URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'search_query',
        label: 'Search Query',
        type: 'text',
        required: true,
        placeholder: 'laptop',
      },
      {
        key: 'min_results',
        label: 'Minimum Results',
        type: 'number',
        required: false,
        defaultValue: '1',
        placeholder: '1',
      },
    ],
  },
  {
    id: 'navigation-menu',
    name: 'Navigation Menu Test',
    description: 'Test main navigation menu links',
    category: 'Navigation',
    difficulty: 3,
    estimatedTime: 60,
    template: `Test navigation menu:
1. Navigate to {{url}}
2. Verify main menu is visible
3. Click on "{{menu_item}}" link
4. Verify navigation to {{expected_url}}
5. Check that page title contains "{{expected_title}}"
6. Verify back navigation works`,
    placeholders: [
      {
        key: 'url',
        label: 'Homepage URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'menu_item',
        label: 'Menu Item',
        type: 'text',
        required: true,
        placeholder: 'About Us',
      },
      {
        key: 'expected_url',
        label: 'Expected URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com/about',
      },
      {
        key: 'expected_title',
        label: 'Expected Title',
        type: 'text',
        required: false,
        placeholder: 'About',
      },
    ],
  },
  {
    id: 'modal-interaction',
    name: 'Modal Interaction Test',
    description: 'Test opening and closing modals',
    category: 'Interaction',
    difficulty: 4,
    estimatedTime: 75,
    template: `Test modal interaction:
1. Navigate to {{url}}
2. Click on "{{trigger_element}}" to open modal
3. Verify modal appears with title "{{modal_title}}"
4. Check that modal content is visible
5. Click close button or background
6. Verify modal closes`,
    placeholders: [
      {
        key: 'url',
        label: 'Page URL',
        type: 'url',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        key: 'trigger_element',
        label: 'Trigger Element',
        type: 'text',
        required: true,
        placeholder: 'Sign Up',
      },
      {
        key: 'modal_title',
        label: 'Modal Title',
        type: 'text',
        required: false,
        placeholder: 'Create Account',
      },
    ],
  },
];

// ============================================================================
// INTENT ANALYSIS PROMPT
// ============================================================================

const INTENT_ANALYSIS_PROMPT = `Analyze this test description and provide structured analysis.

Test Description:
{description}

Target URL: {targetUrl}

Analyze and return JSON with:
1. isValid: Is this a testable scenario? (boolean)
2. confidence: How clear is the description? (0-100)
3. testType: What type of test? (functional/visual/accessibility/performance/mixed)
4. steps: Array of parsed steps with:
   - order: Step number
   - action: What action to perform (navigate, click, type, verify, etc.)
   - target: UI element to interact with
   - value: Value to enter (for form inputs)
   - assertion: What to verify
   - isAmbiguous: Is this step unclear?
   - clarification: What needs clarification?
5. requiredSelectors: List of UI elements that need selectors
6. warnings: Any issues or ambiguities
7. suggestions: How to improve the description
8. missingInfo: What information is missing?

Return ONLY valid JSON, no markdown or explanation.`;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate test code from natural language description
 */
export async function generateTest(
  description: string,
  targetUrl: string,
  viewport?: string
): Promise<{ code: string; testName: string }> {
  if (!description || !targetUrl) {
    throw new Error('Description and target URL are required');
  }

  // This would call the actual API - for now returning structure
  const response = await fetch('/api/gemini/nl-to-playwright', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description,
      targetUrl,
      viewport,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate test code');
  }

  return {
    code: data.code,
    testName: data.testName,
  };
}

/**
 * Parse user intent from natural language description
 */
export async function parseIntent(
  description: string,
  targetUrl?: string
): Promise<IntentAnalysis> {
  // Quick validation
  if (!description || description.trim().length < 10) {
    return {
      isValid: false,
      confidence: 0,
      testType: 'functional',
      steps: [],
      requiredSelectors: [],
      warnings: ['Description is too short'],
      suggestions: ['Provide more details about what to test'],
      missingInfo: ['Test description'],
    };
  }

  // In browser environment, use API route
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/gemini/analyze-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, targetUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze intent');
    }

    return data.analysis;
  }

  // Server-side analysis using AI client
  const prompt = INTENT_ANALYSIS_PROMPT
    .replace('{description}', description)
    .replace('{targetUrl}', targetUrl || 'Not provided');

  try {
    const { text: responseText, provider } = await generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    console.log(`[testEngine parseIntent] Used AI provider: ${provider}`);

    // Try to extract JSON from response
    try {
      const analysis = parseAIJsonResponse<any>(responseText);
      return normalizeAnalysis(analysis);
    } catch (parseError) {
      console.warn('[testEngine] Failed to parse AI response, using basic analysis');
      return performBasicAnalysis(description, targetUrl);
    }
  } catch (error: any) {
    console.error('[testEngine] Intent analysis error:', error);
    return performBasicAnalysis(description, targetUrl);
  }
}

/**
 * Build test template with provided values
 */
export function buildTemplate(
  template: TestTemplate,
  values: Record<string, string>
): string {
  let filled = template.template;

  for (const placeholder of template.placeholders) {
    const value = values[placeholder.key] || placeholder.defaultValue || '';
    const regex = new RegExp(`{{${placeholder.key}}}`, 'g');
    filled = filled.replace(regex, value);
  }

  return filled;
}

// ============================================================================
// HELPER FUNCTIONS (Examples)
// ============================================================================

/**
 * Get all examples as flat list
 */
export function getAllExamples(): ExamplePrompt[] {
  return EXAMPLE_PROMPTS.flatMap(category =>
    category.examples.map(example => ({
      text: example,
      category: category.category,
    }))
  );
}

/**
 * Get random examples
 */
export function getRandomExamples(count: number = 5): ExamplePrompt[] {
  const allExamples = getAllExamples();
  const shuffled = [...allExamples].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Search examples by keyword
 */
export function searchExamples(query: string): ExamplePrompt[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return getAllExamples().filter(example =>
    example.text.toLowerCase().includes(lowerQuery) ||
    example.category.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// HELPER FUNCTIONS (Templates)
// ============================================================================

/**
 * Get template by ID
 */
export function getTemplateById(id: string): TestTemplate | undefined {
  return TEST_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TestTemplate[] {
  return TEST_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(TEST_TEMPLATES.map(t => t.category))];
}

// ============================================================================
// PRIVATE HELPER FUNCTIONS (Intent Analysis)
// ============================================================================

/**
 * Perform basic rule-based analysis as fallback
 */
function performBasicAnalysis(
  description: string,
  targetUrl?: string
): IntentAnalysis {
  const lowerDesc = description.toLowerCase();

  // Detect test type
  let testType: IntentAnalysis['testType'] = 'functional';
  if (lowerDesc.includes('visual') || lowerDesc.includes('screenshot') || lowerDesc.includes('appearance')) {
    testType = 'visual';
  } else if (lowerDesc.includes('accessibility') || lowerDesc.includes('a11y') || lowerDesc.includes('screen reader')) {
    testType = 'accessibility';
  } else if (lowerDesc.includes('performance') || lowerDesc.includes('load time') || lowerDesc.includes('speed')) {
    testType = 'performance';
  }

  // Extract steps
  const stepPatterns = [
    /(\d+)[.)\s]+(.+)/g,
    /[-*]\s+(.+)/g,
  ];

  const steps: ParsedStep[] = [];
  let stepOrder = 1;

  for (const pattern of stepPatterns) {
    const matches = [...description.matchAll(pattern)];
    if (matches.length > 0) {
      for (const match of matches) {
        const stepText = match[2] || match[1];
        if (stepText && stepText.trim().length > 3) {
          steps.push({
            order: stepOrder++,
            action: extractAction(stepText),
            target: extractTarget(stepText),
            isAmbiguous: isAmbiguous(stepText),
            clarification: isAmbiguous(stepText) ? 'Please specify the exact element' : undefined,
          });
        }
      }
      break;
    }
  }

  if (steps.length === 0) {
    steps.push({
      order: 1,
      action: extractAction(description),
      target: extractTarget(description),
      isAmbiguous: true,
      clarification: 'Break down into specific steps',
    });
  }

  const requiredSelectors = extractSelectors(description);

  const warnings: string[] = [];
  if (!targetUrl) warnings.push('No target URL provided');
  if (steps.length === 0) warnings.push('No clear test steps identified');
  if (steps.some(s => s.isAmbiguous)) warnings.push('Some steps are ambiguous and may need clarification');

  const suggestions: string[] = [];
  if (steps.length === 1 && description.length > 50) {
    suggestions.push('Consider breaking down into numbered steps');
  }
  if (!requiredSelectors.length) {
    suggestions.push('Specify the UI elements to interact with');
  }

  const missingInfo: string[] = [];
  if (!targetUrl) missingInfo.push('Target URL');
  if (steps.length === 0) missingInfo.push('Test steps');

  const confidence = calculateBasicConfidence(description, steps, warnings);

  return {
    isValid: warnings.length < 3 && steps.length > 0,
    confidence,
    testType,
    steps,
    requiredSelectors,
    warnings,
    suggestions,
    missingInfo,
  };
}

function extractAction(text: string): string {
  const lowerText = text.toLowerCase();
  const actionKeywords = [
    'navigate', 'go to', 'visit', 'open',
    'click', 'press', 'tap',
    'type', 'enter', 'fill', 'input',
    'select', 'choose',
    'verify', 'check', 'assert', 'confirm',
    'wait', 'hover',
    'scroll',
  ];

  for (const keyword of actionKeywords) {
    if (lowerText.includes(keyword)) {
      return keyword;
    }
  }

  return 'perform action';
}

function extractTarget(text: string): string | undefined {
  const quotedMatch = text.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];

  const elementMatch = text.match(/(button|link|field|input|form|menu|nav|header|footer|element)\s+["']?([^"'\s]+)["']?/i);
  if (elementMatch) return elementMatch[2];

  return undefined;
}

function isAmbiguous(text: string): boolean {
  const ambiguousIndicators = [
    'it', 'that', 'the thing', 'something',
    'stuff', 'whatever', 'etc',
  ];

  const lowerText = text.toLowerCase();
  return ambiguousIndicators.some(indicator => lowerText.includes(indicator)) ||
         text.length < 15 ||
         !extractTarget(text);
}

function extractSelectors(text: string): string[] {
  const selectors: string[] = [];

  const quotedMatches = text.matchAll(/["']([^"']+)["']/g);
  for (const match of quotedMatches) {
    selectors.push(match[1]);
  }

  const elementMatches = text.matchAll(/(button|link|input|form|menu|nav|header|footer)[:\s]+([a-zA-Z0-9\s-]+)/gi);
  for (const match of elementMatches) {
    selectors.push(match[2].trim());
  }

  return [...new Set(selectors)];
}

function calculateBasicConfidence(
  description: string,
  steps: ParsedStep[],
  warnings: string[]
): number {
  let confidence = 50;

  if (steps.length > 0) confidence += 20;
  if (steps.length > 1) confidence += 10;
  if (steps.some(s => s.target)) confidence += 10;
  if (description.length > 50) confidence += 5;

  confidence -= warnings.length * 10;
  confidence -= steps.filter(s => s.isAmbiguous).length * 5;

  return Math.max(0, Math.min(100, confidence));
}

function normalizeAnalysis(analysis: any): IntentAnalysis {
  return {
    isValid: Boolean(analysis.isValid),
    confidence: Math.max(0, Math.min(100, Number(analysis.confidence) || 0)),
    testType: analysis.testType || 'functional',
    steps: Array.isArray(analysis.steps) ? analysis.steps : [],
    requiredSelectors: Array.isArray(analysis.requiredSelectors) ? analysis.requiredSelectors : [],
    warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
    suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
    missingInfo: Array.isArray(analysis.missingInfo) ? analysis.missingInfo : [],
  };
}
