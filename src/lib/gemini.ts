import { GoogleGenerativeAI } from '@google/generative-ai';
import { TestScenario, CodebaseAnalysis, ScreenshotMetadata } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rate limiting: Gemini free tier allows 15 requests per minute
// To be safe, we'll add a 4-second delay between requests
const RATE_LIMIT_DELAY = 4000; // 4 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 15000; // 15 seconds base delay for retries

let lastRequestTime = 0;

/**
 * Wait for rate limit delay if needed
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check if it's a rate limit error (429)
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      if (retries > 0) {
        // Extract retry time from error message if available
        const retryMatch = error.message.match(/retry in ([\d.]+)s/);
        const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 0;
        const delay = retrySeconds > 0
          ? retrySeconds * 1000 + 1000 // Add 1 second buffer
          : RETRY_DELAY_BASE * (MAX_RETRIES - retries + 1); // Exponential backoff

        console.log(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1);
      }
    }
    throw error;
  }
}

/**
 * Analyze a web page using Gemini with screenshots and code analysis
 */
export async function analyzePageForTests(
  screenshots: ScreenshotMetadata[],
  codeAnalysis: CodebaseAnalysis | null,
  url: string
): Promise<TestScenario[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = buildAnalysisPrompt(url, screenshots, codeAnalysis);
  const imageParts = screenshots.map((screenshot) => ({
    inlineData: {
      data: screenshot.base64 || '',
      mimeType: 'image/png',
    },
  }));

  try {
    // Apply rate limiting and retry logic
    return await retryWithBackoff(async () => {
      await waitForRateLimit();

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonText);
        return Array.isArray(parsed) ? parsed : parsed.scenarios || [];
      }

      throw new Error('Failed to parse Gemini response');
    });
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error(`AI analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Build the analysis prompt for Gemini
 */
function buildAnalysisPrompt(
  url: string,
  screenshots: ScreenshotMetadata[],
  codeAnalysis: CodebaseAnalysis | null
): string {
  const viewportInfo = screenshots
    .map((s) => `${s.viewportName} (${s.width}x${s.height})`)
    .join(', ');

  const codeInfo = codeAnalysis
    ? `
Code analysis reveals:
- Framework: ${codeAnalysis.framework}
- ${codeAnalysis.forms.length} forms detected
- ${codeAnalysis.navigation.links.length} navigation links
- ${codeAnalysis.pages.length} pages identified
`
    : 'No code analysis available.';

  return `You are an expert QA engineer analyzing a web application for comprehensive test coverage.

Context:
- Target URL: ${url}
- Available screenshots: ${screenshots.length} viewports (${viewportInfo})
${codeInfo}

Your task:
1. Analyze the provided screenshots to identify all interactive elements (buttons, links, forms, inputs)
2. Determine critical user flows (navigation, form submission, authentication, search, etc.)
3. Identify potential edge cases (validation, empty states, error scenarios)
4. Consider responsive behavior differences across viewports
5. Spot accessibility concerns where visible

Generate comprehensive Playwright test scenarios that cover:
- Happy path user flows (critical priority)
- Form validation and error cases (high priority)
- Responsive behavior verification (medium priority)
- Visual regression checkpoints (medium priority)
- Accessibility checks where applicable (low priority)

Output Format:
Return a JSON array of test scenarios with this structure:
{
  "scenarios": [
    {
      "id": "unique-id",
      "name": "Test name (clear, descriptive)",
      "description": "What this test validates",
      "priority": "critical|high|medium|low",
      "category": "functional|visual|responsive|accessibility",
      "steps": [
        {
          "action": "navigate|click|fill|assert|screenshot|wait|hover|select",
          "selector": "CSS selector or data-testid",
          "value": "value for fill/select actions",
          "description": "What this step does"
        }
      ],
      "expectedOutcomes": ["What should happen after test completes"],
      "viewports": ["mobile_small", "desktop", etc.]
    }
  ]
}

Important:
- Use data-testid selectors when possible, otherwise use stable CSS selectors
- Include wait steps before assertions
- Add screenshot checkpoints for visual validation
- Cover both success and failure scenarios
- Be specific in descriptions

Generate at least 5-10 meaningful test scenarios based on what you see in the screenshots.`;
}

/**
 * Simple analysis without screenshots (fallback)
 */
export async function analyzeUrlStructure(url: string): Promise<TestScenario[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `Generate basic Playwright test scenarios for a website at: ${url}

Create 3-5 fundamental tests covering:
- Page load and basic navigation
- Common UI interactions
- Responsive behavior

Return as JSON array matching the TestScenario structure.`;

  try {
    return await retryWithBackoff(async () => {
      await waitForRateLimit();

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonText);
        return Array.isArray(parsed) ? parsed : parsed.scenarios || [];
      }

      return [];
    });
  } catch (error) {
    console.error('Gemini URL analysis error:', error);
    return [];
  }
}
