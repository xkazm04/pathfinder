import { GoogleGenerativeAI } from '@google/generative-ai';

export interface IntentAnalysis {
  isValid: boolean;
  confidence: number;
  testType: 'functional' | 'visual' | 'accessibility' | 'performance' | 'mixed';
  steps: ParsedStep[];
  requiredSelectors: string[];
  warnings: string[];
  suggestions: string[];
  missingInfo: string[];
}

export interface ParsedStep {
  order: number;
  action: string;
  target?: string;
  value?: string;
  assertion?: string;
  isAmbiguous: boolean;
  clarification?: string;
}

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

/**
 * Analyze natural language intent to validate and parse test description
 */
export async function analyzeIntent(
  description: string,
  targetUrl?: string
): Promise<IntentAnalysis> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

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

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = INTENT_ANALYSIS_PROMPT
    .replace('{description}', description)
    .replace('{targetUrl}', targetUrl || 'Not provided');

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxOutputTokens: 1024,
      },
    });

    const responseText = result.response.text();

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to basic analysis
      return performBasicAnalysis(description, targetUrl);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate and normalize the analysis
    return normalizeAnalysis(analysis);
  } catch (error: any) {
    console.error('Intent analysis error:', error);
    // Fallback to basic analysis
    return performBasicAnalysis(description, targetUrl);
  }
}

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

  // Extract steps (basic - look for numbered steps or bullet points)
  const stepPatterns = [
    /(\d+)[.)\s]+(.+)/g,  // Numbered: 1. Step or 1) Step
    /[-*]\s+(.+)/g,        // Bullets: - Step or * Step
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
      break; // Only use first matching pattern
    }
  }

  // If no structured steps found, treat whole description as single step
  if (steps.length === 0) {
    steps.push({
      order: 1,
      action: extractAction(description),
      target: extractTarget(description),
      isAmbiguous: true,
      clarification: 'Break down into specific steps',
    });
  }

  // Extract required selectors
  const requiredSelectors = extractSelectors(description);

  // Generate warnings
  const warnings: string[] = [];
  if (!targetUrl) {
    warnings.push('No target URL provided');
  }
  if (steps.length === 0) {
    warnings.push('No clear test steps identified');
  }
  if (steps.some(s => s.isAmbiguous)) {
    warnings.push('Some steps are ambiguous and may need clarification');
  }

  // Generate suggestions
  const suggestions: string[] = [];
  if (steps.length === 1 && description.length > 50) {
    suggestions.push('Consider breaking down into numbered steps');
  }
  if (!requiredSelectors.length) {
    suggestions.push('Specify the UI elements to interact with');
  }

  // Check missing info
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

/**
 * Extract action verb from step text
 */
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

/**
 * Extract target element from step text
 */
function extractTarget(text: string): string | undefined {
  // Look for quoted text as potential targets
  const quotedMatch = text.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  // Look for button/link/field mentions
  const elementMatch = text.match(/(button|link|field|input|form|menu|nav|header|footer|element)\s+["']?([^"'\s]+)["']?/i);
  if (elementMatch) {
    return elementMatch[2];
  }

  return undefined;
}

/**
 * Check if step is ambiguous
 */
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

/**
 * Extract potential selectors from description
 */
function extractSelectors(text: string): string[] {
  const selectors: string[] = [];

  // Extract quoted strings
  const quotedMatches = text.matchAll(/["']([^"']+)["']/g);
  for (const match of quotedMatches) {
    selectors.push(match[1]);
  }

  // Extract common UI elements
  const elementMatches = text.matchAll(/(button|link|input|form|menu|nav|header|footer)[:\s]+([a-zA-Z0-9\s-]+)/gi);
  for (const match of elementMatches) {
    selectors.push(match[2].trim());
  }

  return [...new Set(selectors)]; // Remove duplicates
}

/**
 * Calculate confidence score
 */
function calculateBasicConfidence(
  description: string,
  steps: ParsedStep[],
  warnings: string[]
): number {
  let confidence = 50;

  // Reward clear structure
  if (steps.length > 0) confidence += 20;
  if (steps.length > 1) confidence += 10;

  // Reward specificity
  if (steps.some(s => s.target)) confidence += 10;
  if (description.length > 50) confidence += 5;

  // Penalize issues
  confidence -= warnings.length * 10;
  confidence -= steps.filter(s => s.isAmbiguous).length * 5;

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Normalize analysis from Gemini to ensure consistent structure
 */
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
