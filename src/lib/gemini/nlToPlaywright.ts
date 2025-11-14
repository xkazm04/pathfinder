import { GoogleGenerativeAI } from '@google/generative-ai';

export interface NLTestRequest {
  description: string;
  targetUrl: string;
  viewport: string;
  additionalContext?: string;
}

export interface NLTestResponse {
  code: string;
  testName: string;
  steps: string[];
  confidence: number;
}

export const NL_MODEL_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40,
};

const NL_TO_PLAYWRIGHT_PROMPT = `You are an expert Playwright test automation engineer. Convert natural language test descriptions into executable Playwright test code.

User Description:
{userInput}

Target URL: {targetUrl}
Viewport: {viewport}
{additionalContext}

Guidelines:
1. Generate TypeScript code using Playwright's test framework
2. Include proper imports and test structure
3. Use best practices for selectors (prefer data-testid, role, text)
4. Add appropriate wait strategies (waitForSelector, waitForLoadState)
5. Include meaningful assertions (expect statements)
6. Add comments explaining each step
7. Handle common edge cases (loading states, timeouts)
8. Use page object patterns where appropriate
9. Include screenshot capture at key steps for visual verification
10. Make the test maintainable and readable
11. Use async/await properly
12. Add proper error handling

Output format:
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('descriptive test name', async ({ page }) => {
  // Your generated test code here
});
\`\`\`

Return ONLY the code block, no additional explanation.`;

/**
 * Convert natural language description to Playwright test code
 */
export async function convertNLToPlaywright(
  request: NLTestRequest
): Promise<NLTestResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: NL_MODEL_CONFIG.model });

  // Build prompt
  const additionalContextStr = request.additionalContext
    ? `\nAdditional Context:\n${request.additionalContext}`
    : '';

  const prompt = NL_TO_PLAYWRIGHT_PROMPT
    .replace('{userInput}', request.description)
    .replace('{targetUrl}', request.targetUrl)
    .replace('{viewport}', request.viewport)
    .replace('{additionalContext}', additionalContextStr);

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: NL_MODEL_CONFIG.temperature,
        maxOutputTokens: NL_MODEL_CONFIG.maxOutputTokens,
        topP: NL_MODEL_CONFIG.topP,
        topK: NL_MODEL_CONFIG.topK,
      },
    });

    const generatedText = result.response.text();

    // Extract code from markdown code block
    const codeMatch = generatedText.match(/```typescript\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1].trim() : generatedText.trim();

    // Extract test name from code
    const testNameMatch = code.match(/test\(['"](.+?)['"]/);
    const testName = testNameMatch ? testNameMatch[1] : 'Generated Test';

    // Extract steps from comments
    const steps = extractStepsFromCode(code);

    // Calculate confidence based on code quality
    const confidence = calculateConfidence(code, request);

    return {
      code,
      testName,
      steps,
      confidence,
    };
  } catch (error: any) {
    console.error('NL to Playwright conversion error:', error);
    throw new Error(`Failed to generate test code: ${error.message}`);
  }
}

/**
 * Extract steps from code comments
 */
function extractStepsFromCode(code: string): string[] {
  const steps: string[] = [];
  const commentLines = code.match(/\/\/\s*(.+)/g) || [];

  for (const comment of commentLines) {
    const stepText = comment.replace(/\/\/\s*/, '').trim();
    if (stepText && !stepText.toLowerCase().includes('import') && stepText.length > 5) {
      steps.push(stepText);
    }
  }

  return steps;
}

/**
 * Calculate confidence score for generated code
 */
function calculateConfidence(code: string, request: NLTestRequest): number {
  let score = 50; // Base score

  // Check for imports
  if (code.includes("import { test, expect }")) score += 10;

  // Check for proper test structure
  if (code.includes("test(") && code.includes("async ({ page })")) score += 10;

  // Check for page.goto
  if (code.includes("await page.goto")) score += 5;

  // Check for assertions
  const expectCount = (code.match(/expect\(/g) || []).length;
  score += Math.min(expectCount * 5, 15);

  // Check for selectors
  if (code.includes("page.click") || code.includes("page.fill")) score += 5;

  // Check for wait strategies
  if (code.includes("waitFor") || code.includes("waitForLoadState")) score += 5;

  // Penalize if too short
  if (code.length < 200) score -= 20;

  // Penalize if no URL match
  if (!code.includes(request.targetUrl)) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate test code with retry logic
 */
export async function convertNLToPlaywrightWithRetry(
  request: NLTestRequest,
  maxRetries: number = 2
): Promise<NLTestResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await convertNLToPlaywright(request);

      // If confidence is too low and we have retries left, try again
      if (result.confidence < 40 && attempt < maxRetries) {
        console.log(`Low confidence (${result.confidence}), retrying...`);
        continue;
      }

      return result;
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to generate test code after retries');
}

/**
 * Get similar examples from database to enhance generation
 */
export async function getSimilarExamples(
  description: string,
  limit: number = 3
): Promise<any[]> {
  // This would query the nl_test_examples table
  // For now, return empty array
  return [];
}
