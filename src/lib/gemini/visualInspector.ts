import { GoogleGenerativeAI } from '@google/generative-ai';
import { Finding } from '../supabase/aiAnalyses';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 4000; // 4 seconds between requests

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

/**
 * Comprehensive visual analysis prompt
 */
function getVisualAnalysisPrompt(context: {
  testName: string;
  viewport: string;
  targetUrl: string;
  testStatus: string;
}): string {
  return `You are an expert QA engineer and UX designer analyzing web application screenshots for quality issues.

Context:
- Test: ${context.testName}
- Viewport: ${context.viewport}
- URL: ${context.targetUrl}
- Test Status: ${context.testStatus}

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
   - Navigation elements not accessible

3. RESPONSIVE/CROSS-VIEWPORT ISSUES:
   - Elements disappearing or hidden on certain viewport sizes
   - Navigation breaking on mobile
   - Content reflow problems
   - Fixed-width elements causing horizontal scroll
   - Images not scaling properly

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

Return ONLY valid JSON with an array of issues found. If no issues, return empty array [].
Be specific and actionable. Focus on real problems that impact user experience.

IMPORTANT: Return ONLY the JSON array, no additional text or markdown formatting.`;
}

/**
 * Accessibility-focused analysis prompt
 */
function getAccessibilityAnalysisPrompt(): string {
  return `You are a WCAG 2.1 accessibility expert analyzing a web application screenshot.

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
  "location": "Where in the screenshot",
  "recommendation": "Fix suggestion",
  "affectedElements": ["selector1"],
  "confidenceScore": 0.0-1.0
}

Return ONLY valid JSON array. If no accessibility issues, return empty array [].

IMPORTANT: Return ONLY the JSON array, no additional text or markdown formatting.`;
}

/**
 * Cross-viewport comparison prompt
 */
function getViewportComparisonPrompt(viewports: string[]): string {
  return `You are analyzing the same web page across different viewport sizes.

Viewports being compared: ${viewports.join(', ')}

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
  "location": "Where in the screenshots",
  "affectedViewports": ["mobile", "desktop"],
  "recommendation": "CSS/design fix suggestion",
  "affectedElements": ["selector1"],
  "confidenceScore": 0.0-1.0
}

Return ONLY valid JSON array of responsive issues found.

IMPORTANT: Return ONLY the JSON array, no additional text or markdown formatting.`;
}

/**
 * Convert screenshot URL or base64 to Gemini image part
 */
async function screenshotToImagePart(screenshot: string | { url: string } | { base64: string }): Promise<any> {
  let base64Data: string;

  if (typeof screenshot === 'string') {
    // Assume it's a URL
    try {
      const response = await fetch(screenshot);
      const buffer = await response.arrayBuffer();
      base64Data = Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('Failed to fetch screenshot:', error);
      throw error;
    }
  } else if ('url' in screenshot) {
    const response = await fetch(screenshot.url);
    const buffer = await response.arrayBuffer();
    base64Data = Buffer.from(buffer).toString('base64');
  } else {
    base64Data = screenshot.base64;
  }

  return {
    inlineData: {
      data: base64Data,
      mimeType: 'image/png',
    },
  };
}

/**
 * Parse JSON response from Gemini, handling various formats
 */
function parseGeminiResponse(responseText: string): Finding[] {
  try {
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanedText);

    // Ensure it's an array
    if (Array.isArray(parsed)) {
      return parsed;
    }

    // If it's an object with a findings or issues property
    if (parsed.findings) {
      return Array.isArray(parsed.findings) ? parsed.findings : [];
    }
    if (parsed.issues) {
      return Array.isArray(parsed.issues) ? parsed.issues : [];
    }

    return [];
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.error('Response text:', responseText);
    return [];
  }
}

/**
 * Analyze screenshots with Gemini
 */
export async function analyzeScreenshots(
  screenshots: Array<string | { url: string } | { base64: string }>,
  context: {
    testName: string;
    viewport: string;
    targetUrl: string;
    testStatus: string;
  },
  analysisType: 'comprehensive' | 'accessibility' = 'comprehensive'
): Promise<Finding[]> {
  await waitForRateLimit();

  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest'
  });

  try {
    // Convert screenshots to image parts
    const imageParts = await Promise.all(
      screenshots.map(screenshot => screenshotToImagePart(screenshot))
    );

    // Select appropriate prompt
    const prompt = analysisType === 'accessibility'
      ? getAccessibilityAnalysisPrompt()
      : getVisualAnalysisPrompt(context);

    // Generate content with retry logic
    const result = await model.generateContent([
      prompt,
      ...imageParts,
    ]);

    const responseText = result.response.text();
    const findings = parseGeminiResponse(responseText);

    return findings;
  } catch (error: any) {
    console.error('Gemini analysis error:', error);

    // Check for rate limiting
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error('Rate limit exceeded. Please try again in a few moments.');
    }

    throw error;
  }
}

/**
 * Compare screenshots across viewports
 */
export async function compareViewports(
  screenshotsByViewport: Record<string, Array<string | { url: string } | { base64: string }>>
): Promise<Finding[]> {
  await waitForRateLimit();

  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest'
  });

  try {
    const viewports = Object.keys(screenshotsByViewport);
    const allScreenshots = Object.values(screenshotsByViewport).flat();

    const imageParts = await Promise.all(
      allScreenshots.map(screenshot => screenshotToImagePart(screenshot))
    );

    const prompt = getViewportComparisonPrompt(viewports);

    const result = await model.generateContent([
      prompt,
      ...imageParts,
    ]);

    const responseText = result.response.text();
    const findings = parseGeminiResponse(responseText);

    return findings;
  } catch (error: any) {
    console.error('Viewport comparison error:', error);
    throw error;
  }
}

/**
 * Analyze with retry logic
 */
export async function analyzeWithRetry(
  screenshots: Array<string | { url: string } | { base64: string }>,
  context: {
    testName: string;
    viewport: string;
    targetUrl: string;
    testStatus: string;
  },
  analysisType: 'comprehensive' | 'accessibility' = 'comprehensive',
  maxRetries: number = 2
): Promise<Finding[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const findings = await analyzeScreenshots(screenshots, context, analysisType);
      return findings;
    } catch (error: any) {
      lastError = error;
      console.error(`Analysis attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt + 1) * 5000; // 10s, 20s, 40s
        console.log(`Retrying in ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Analysis failed after retries');
}
