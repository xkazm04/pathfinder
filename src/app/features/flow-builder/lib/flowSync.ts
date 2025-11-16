import { FlowStep, TestFlow, StepType } from './flowTypes';

/**
 * Convert flow steps to natural language description
 */
export function flowStepsToNaturalLanguage(flow: TestFlow): string {
  const { name, targetUrl, steps } = flow;

  const header = `Test: ${name || 'Untitled Test'}
URL: ${targetUrl || 'Not specified'}

Steps:`;

  const stepDescriptions = steps
    .sort((a, b) => a.order - b.order)
    .map((step, index) => {
      const num = index + 1;
      const desc = stepToDescription(step);
      return `${num}. ${desc}`;
    });

  return [header, ...stepDescriptions].join('\n');
}

/**
 * Convert a single step to natural language description
 */
function stepToDescription(step: FlowStep): string {
  const { type, config } = step;

  switch (type) {
    case 'navigate':
      return `Navigate to ${config.url || config.selector || 'the page'}`;
    case 'click':
      return `Click on "${config.selector || 'element'}"`;
    case 'fill':
      return `Fill "${config.selector || 'field'}" with "${config.value || 'value'}"`;
    case 'select':
      return `Select "${config.value || 'option'}" from "${config.selector || 'dropdown'}"`;
    case 'assert':
      return `Assert that ${config.assertion || config.expectedResult || 'condition is met'}`;
    case 'verify':
      return `Verify "${config.selector || 'element'}" ${config.expectedResult ? `shows "${config.expectedResult}"` : 'is visible'}`;
    case 'wait':
      if (config.selector) {
        return `Wait for "${config.selector}" to appear`;
      }
      return `Wait ${config.timeout || 3000}ms`;
    case 'hover':
      return `Hover over "${config.selector || 'element'}"`;
    case 'screenshot':
      return `Take screenshot`;
    default:
      return config.description || 'Perform action';
  }
}

/**
 * Parse natural language description to flow steps
 */
export function naturalLanguageToFlowSteps(text: string): {
  steps: FlowStep[];
  targetUrl: string;
  testName: string;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let targetUrl = '';
  let testName = '';
  const steps: FlowStep[] = [];

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

  let order = 1;
  for (const line of lines) {
    const match = line.match(stepPattern);
    if (match) {
      const [, , description] = match;
      const step = parseStepDescription(description, order);
      if (step) {
        steps.push(step);
        order++;
      }
    }
  }

  // If no steps found, treat each line as a potential step
  if (steps.length === 0) {
    for (const line of lines) {
      if (!line.startsWith('URL:') && !line.startsWith('Test:') && !line.startsWith('Viewport:') && !line.match(/^https?:\/\//)) {
        const step = parseStepDescription(line, order);
        if (step && step.config.description) {
          steps.push(step);
          order++;
        }
      }
    }
  }

  return { steps, targetUrl, testName: testName || 'Untitled Test' };
}

/**
 * Parse a step description into a FlowStep object
 */
function parseStepDescription(description: string, order: number): FlowStep | null {
  const lowerDesc = description.toLowerCase();

  let type: StepType = 'navigate';
  const config: any = {
    description,
  };

  // Navigate patterns
  if (lowerDesc.includes('navigate') || lowerDesc.includes('go to') || lowerDesc.includes('visit') || lowerDesc.includes('open')) {
    type = 'navigate';
    config.url = extractTarget(description, ['to', 'page']);
  }
  // Click patterns
  else if (lowerDesc.includes('click') || lowerDesc.includes('press') || lowerDesc.includes('tap')) {
    type = 'click';
    config.selector = extractTarget(description, ['on', 'the', 'button', 'link']);
  }
  // Fill patterns
  else if (lowerDesc.includes('fill') || lowerDesc.includes('enter') || lowerDesc.includes('type') || lowerDesc.includes('input')) {
    type = 'fill';
    config.selector = extractTarget(description, ['in', 'into', 'field']);
    config.value = extractValue(description, ['with', 'as']);
  }
  // Select patterns
  else if (lowerDesc.includes('select') || lowerDesc.includes('choose')) {
    type = 'select';
    config.value = extractValue(description, ['select', 'choose']);
    config.selector = extractTarget(description, ['from', 'in']);
  }
  // Assert patterns
  else if (lowerDesc.includes('assert')) {
    type = 'assert';
    config.assertion = extractTarget(description, ['that', 'if']);
  }
  // Verify patterns
  else if (lowerDesc.includes('verify') || lowerDesc.includes('check') || lowerDesc.includes('ensure')) {
    type = 'verify';
    config.selector = extractTarget(description, ['that', 'if', 'verify', 'check']);
    config.expectedResult = extractValue(description, ['shows', 'contains', 'equals']);
  }
  // Wait patterns
  else if (lowerDesc.includes('wait') || lowerDesc.includes('pause')) {
    type = 'wait';
    config.selector = extractTarget(description, ['for', 'until']);
    const timeMatch = description.match(/(\d+)\s*m?s/);
    if (timeMatch) {
      config.timeout = parseInt(timeMatch[1]);
    }
  }
  // Hover patterns
  else if (lowerDesc.includes('hover')) {
    type = 'hover';
    config.selector = extractTarget(description, ['over', 'on']);
  }
  // Screenshot
  else if (lowerDesc.includes('screenshot') || lowerDesc.includes('capture')) {
    type = 'screenshot';
  }
  // If no match, return null
  else {
    return null;
  }

  return {
    id: `step-${Date.now()}-${order}`,
    type,
    order,
    config,
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
