import { TestScenario, CodebaseAnalysis, ScreenshotMetadata } from '../types';
import { generateCompletionWithImages, parseAIJsonResponse } from './ai-client';

/**
 * Analyze a web page using AI with screenshots and code analysis
 * Uses Gemini as primary with Groq fallback for rate limit handling
 */
export async function analyzePageForTests(
  screenshots: ScreenshotMetadata[],
  codeAnalysis: CodebaseAnalysis | null,
  url: string
): Promise<TestScenario[]> {
  const prompt = buildAnalysisPrompt(url, screenshots, codeAnalysis);
  const imageParts = screenshots.map((screenshot) => ({
    data: screenshot.base64 || '',
    mimeType: 'image/png',
  }));

  try {
    const { text, provider } = await generateCompletionWithImages(prompt, imageParts);
    console.log(`[analyzePageForTests] Using provider: ${provider}`);

    // Parse JSON response
    const parsed = parseAIJsonResponse<unknown>(text);
    const scenarios = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).scenarios || [];

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
      console.warn('[analyzePageForTests] No scenarios found in AI response');
      return [];
    }

    // Validate and filter scenarios to ensure all required fields are present
    const validScenarios = scenarios.filter((scenario: unknown) => {
      const s = scenario as Partial<TestScenario>;
      const isValid =
        s.id &&
        s.name &&
        s.description &&
        s.priority &&
        s.category &&
        Array.isArray(s.steps) && s.steps.length > 0 &&
        Array.isArray(s.expectedOutcomes) &&
        Array.isArray(s.viewports);

      if (!isValid) {
        console.warn('[analyzePageForTests] Skipping invalid scenario:', {
          id: s.id,
          name: s.name,
          missingFields: {
            steps: !Array.isArray(s.steps) || s.steps.length === 0,
            expectedOutcomes: !Array.isArray(s.expectedOutcomes),
            viewports: !Array.isArray(s.viewports),
          }
        });
      }

      return isValid;
    });

    console.log(`[analyzePageForTests] Generated ${scenarios.length} scenarios, ${validScenarios.length} valid`);
    return validScenarios as TestScenario[];
  } catch (error) {
    console.error('[analyzePageForTests] Failed:', error);
    throw new Error(`AI analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Build the analysis prompt for AI
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
Analyze the screenshots and generate 3-5 COMPLETE Playwright test scenarios covering:
- Critical user flows (navigation, forms, key interactions)
- Important edge cases (validation, errors)
- Visual checkpoints

Output Format:
Return ONLY valid JSON (no markdown, no explanations, no code blocks) with this exact structure:
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
          "value": "value for fill/select actions OR null",
          "description": "What this step does"
        }
      ],
      "expectedOutcomes": ["What should happen after test completes"],
      "viewports": ["mobile_small", "desktop"]
    }
  ]
}

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no text before/after
2. ALL scenarios MUST be complete with ALL required fields
3. Every scenario needs: id, name, description, priority, category, steps (array), expectedOutcomes (array), viewports (array)
4. Every step needs: action, selector, value (or null), description
5. If you can't complete a scenario, OMIT it - partial scenarios cause errors
6. Use stable CSS selectors or data-testid
7. No trailing commas

Generate 3-5 complete scenarios. Quality over quantity.`;
}

/**
 * Simple analysis without screenshots (fallback)
 * Uses Gemini as primary with Groq fallback for rate limit handling
 */
export async function analyzeUrlStructure(url: string): Promise<TestScenario[]> {
  const prompt = `Generate basic Playwright test scenarios for a website at: ${url}

Create 3-5 fundamental tests covering:
- Page load and basic navigation
- Common UI interactions
- Responsive behavior

Return as JSON array matching the TestScenario structure.`;

  try {
    const { text } = await generateCompletionWithImages(prompt, []);

    try {
      const parsed = parseAIJsonResponse<unknown>(text);
      const scenarios = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).scenarios || [];
      return scenarios as TestScenario[];
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}
