import type { TestStep, TestFlow } from '@/lib/stores/testBuilderStore';

/**
 * Simple JavaScript-based conversion from steps to natural language
 * Used for quick, lightweight operations
 */
export function stepsToNaturalLanguageSimple(flow: TestFlow): string {
  const { name, targetUrl, viewport, steps } = flow;

  const header = `Test: ${name || 'Untitled Test'}
URL: ${targetUrl || 'Not specified'}
Viewport: ${viewport}

Steps:`;

  const stepDescriptions = steps.map((step, index) => {
    const num = index + 1;
    const desc = stepToSimpleDescription(step);
    return `${num}. ${desc}`;
  });

  return [header, ...stepDescriptions].join('\n');
}

/**
 * Convert a single step to simple natural language description
 */
function stepToSimpleDescription(step: TestStep): string {
  const { type, action, target, value } = step;

  switch (type) {
    case 'navigate':
      return `Navigate to ${target || 'the page'}`;
    case 'click':
      return `Click on "${target || 'element'}"`;
    case 'fill':
      return `Fill "${target || 'field'}" with "${value || 'value'}"`;
    case 'select':
      return `Select "${value || 'option'}" from "${target || 'dropdown'}"`;
    case 'assert':
      return `Verify that "${target || 'element'}" ${value || 'is visible'}`;
    case 'wait':
      return `Wait for ${target || 'page to load'}`;
    case 'custom':
      return action || 'Perform custom action';
    default:
      return action || 'Perform action';
  }
}

/**
 * Simple JavaScript-based conversion from natural language to steps
 * Parses numbered lists and common patterns
 */
export function naturalLanguageToStepsSimple(text: string): {
  steps: Omit<TestStep, 'id' | 'order'>[];
  targetUrl: string;
  testName: string;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let targetUrl = '';
  let testName = '';
  const steps: Omit<TestStep, 'id' | 'order'>[] = [];

  // Extract metadata
  for (const line of lines) {
    if (line.startsWith('URL:')) {
      targetUrl = line.replace('URL:', '').trim();
    } else if (line.startsWith('Test:')) {
      testName = line.replace('Test:', '').trim();
    } else if (line.match(/^https?:\/\//)) {
      targetUrl = line;
    }
  }

  // Extract steps (numbered lines)
  const stepPattern = /^(\d+)[\.\)]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(stepPattern);
    if (match) {
      const [, , description] = match;
      const step = parseStepDescription(description);
      steps.push(step);
    }
  }

  // If no steps found, treat each line as a potential step
  if (steps.length === 0) {
    for (const line of lines) {
      if (!line.startsWith('URL:') && !line.startsWith('Test:') && !line.startsWith('Viewport:') && !line.match(/^https?:\/\//)) {
        const step = parseStepDescription(line);
        if (step.action) {
          steps.push(step);
        }
      }
    }
  }

  return { steps, targetUrl, testName: testName || 'Untitled Test' };
}

/**
 * Parse a step description into a structured step object
 */
function parseStepDescription(description: string): Omit<TestStep, 'id' | 'order'> {
  const lowerDesc = description.toLowerCase();

  // Navigate patterns
  if (lowerDesc.includes('navigate') || lowerDesc.includes('go to') || lowerDesc.includes('visit') || lowerDesc.includes('open')) {
    return {
      type: 'navigate',
      action: 'Navigate',
      description,
      target: extractTarget(description, ['to', 'page']),
    };
  }

  // Click patterns
  if (lowerDesc.includes('click') || lowerDesc.includes('press') || lowerDesc.includes('tap')) {
    return {
      type: 'click',
      action: 'Click',
      description,
      target: extractTarget(description, ['on', 'the', 'button', 'link']),
    };
  }

  // Fill patterns
  if (lowerDesc.includes('fill') || lowerDesc.includes('enter') || lowerDesc.includes('type') || lowerDesc.includes('input')) {
    const target = extractTarget(description, ['in', 'into', 'field']);
    const value = extractValue(description, ['with', 'as']);
    return {
      type: 'fill',
      action: 'Fill',
      description,
      target,
      value,
    };
  }

  // Select patterns
  if (lowerDesc.includes('select') || lowerDesc.includes('choose')) {
    const value = extractValue(description, ['select', 'choose']);
    const target = extractTarget(description, ['from', 'in']);
    return {
      type: 'select',
      action: 'Select',
      description,
      target,
      value,
    };
  }

  // Assert patterns
  if (lowerDesc.includes('verify') || lowerDesc.includes('check') || lowerDesc.includes('assert') || lowerDesc.includes('ensure')) {
    return {
      type: 'assert',
      action: 'Assert',
      description,
      target: extractTarget(description, ['that', 'if']),
    };
  }

  // Wait patterns
  if (lowerDesc.includes('wait') || lowerDesc.includes('pause')) {
    return {
      type: 'wait',
      action: 'Wait',
      description,
      target: extractTarget(description, ['for', 'until']),
    };
  }

  // Default to custom
  return {
    type: 'custom',
    action: description,
    description,
  };
}

/**
 * Extract target element from description
 */
function extractTarget(description: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}\\s+(?:the\\s+)?["']?([^"',.]+)["']?`, 'i');
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Extract text in quotes
  const quotedMatch = description.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  return '';
}

/**
 * Extract value from description
 */
function extractValue(description: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}\\s+["']?([^"',.]+)["']?`, 'i');
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * AI-powered conversion from natural language to steps using Gemini
 */
export async function naturalLanguageToStepsAI(text: string): Promise<{
  steps: Omit<TestStep, 'id' | 'order'>[];
  targetUrl: string;
  testName: string;
}> {
  try {
    // Call Gemini API
    const response = await fetch('/api/gemini/nl-to-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: text }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert natural language to steps');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in AI conversion:', error);
    // Fallback to simple conversion
    return naturalLanguageToStepsSimple(text);
  }
}

/**
 * AI-powered conversion from steps to natural language using Gemini
 */
export async function stepsToNaturalLanguageAI(flow: TestFlow): Promise<string> {
  try {
    const response = await fetch('/api/gemini/steps-to-nl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flow }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert steps to natural language');
    }

    const data = await response.json();
    return data.naturalLanguage;
  } catch (error) {
    console.error('Error in AI conversion:', error);
    // Fallback to simple conversion
    return stepsToNaturalLanguageSimple(flow);
  }
}

/**
 * Determine if AI should be used based on complexity
 */
export function shouldUseAI(text: string, steps: TestStep[]): boolean {
  // Use AI if:
  // - Text is long (> 500 chars)
  // - Has complex patterns
  // - Many steps (> 10)
  // - Contains conditionals, loops, or complex logic

  const hasComplexPatterns = /\b(if|else|when|until|while|for|each)\b/i.test(text);
  const isLong = text.length > 500;
  const manySteps = steps.length > 10;

  return hasComplexPatterns || isLong || manySteps;
}
