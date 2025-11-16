import { TestFlow, FlowStep } from './flowTypes';
import type { TestTemplate } from '@/lib/nl-test/testTemplates';

/**
 * Serialize flow to JSON format
 */
export function serializeFlow(flow: TestFlow): string {
  return JSON.stringify(flow, null, 2);
}

/**
 * Deserialize JSON to flow
 */
export function deserializeFlow(json: string): TestFlow {
  return JSON.parse(json);
}

/**
 * Convert flow to natural language description
 */
export function flowToNaturalLanguage(flow: TestFlow): string {
  const lines: string[] = [];

  if (flow.name) {
    lines.push(`Test: ${flow.name}`);
  }

  if (flow.description) {
    lines.push(flow.description);
  }

  if (flow.targetUrl) {
    lines.push(`\nTarget: ${flow.targetUrl}`);
  }

  if (flow.viewport) {
    lines.push(`Viewport: ${flow.viewport}`);
  }

  lines.push('\nSteps:');

  flow.steps
    .sort((a, b) => a.order - b.order)
    .forEach((step, index) => {
      lines.push(`${index + 1}. ${stepToNaturalLanguage(step)}`);
    });

  return lines.join('\n');
}

/**
 * Convert single step to natural language
 */
function stepToNaturalLanguage(step: FlowStep): string {
  const { type, config } = step;

  switch (type) {
    case 'navigate':
      return `Navigate to ${config.url || '[URL]'}`;

    case 'click':
      return `Click "${config.selector || '[element]'}"`;

    case 'fill':
      return `Fill "${config.selector || '[field]'}" with "${config.value || '[value]'}"`;

    case 'select':
      return `Select "${config.value || '[option]'}" from "${config.selector || '[dropdown]'}"`;

    case 'hover':
      return `Hover over "${config.selector || '[element]'}"`;

    case 'assert':
      return `Verify ${config.assertion || '[condition]'}`;

    case 'verify':
      return `Check that "${config.selector || '[element]'}" ${config.expectedResult || 'exists'}`;

    case 'screenshot':
      return `Take screenshot${config.description ? `: ${config.description}` : ''}`;

    case 'wait':
      return config.selector
        ? `Wait for "${config.selector}" to appear`
        : `Wait ${config.timeout || 3000}ms`;

    default:
      return config.description || 'Unknown step';
  }
}

/**
 * Convert flow to test template format
 */
export function flowToTestTemplate(flow: TestFlow): TestTemplate {
  const nlDescription = flowToNaturalLanguage(flow);

  // Extract placeholders from the flow
  const placeholders: Array<{
    key: string;
    label: string;
    type: 'text' | 'url' | 'number' | 'select';
    required: boolean;
    defaultValue?: string;
  }> = [];

  // Add URL placeholder if present
  if (flow.targetUrl) {
    placeholders.push({
      key: 'url',
      label: 'Target URL',
      type: 'url',
      required: true,
      defaultValue: flow.targetUrl,
    });
  }

  // Create template with placeholders
  const templateLines: string[] = [];

  flow.steps
    .sort((a, b) => a.order - b.order)
    .forEach((step, index) => {
      templateLines.push(`${index + 1}. ${stepToNaturalLanguage(step)}`);
    });

  return {
    id: flow.id || `flow-${Date.now()}`,
    name: flow.name || 'Custom Flow',
    description: flow.description || 'Custom test flow',
    category: flow.metadata?.category || 'Custom',
    difficulty: flow.metadata?.difficulty,
    estimatedTime: flow.metadata?.estimatedTime,
    template: templateLines.join('\n'),
    placeholders,
  };
}

/**
 * Export flow as Playwright code
 */
export function flowToPlaywrightCode(flow: TestFlow): string {
  const lines: string[] = [];

  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push('');
  lines.push(`test('${flow.name || 'Generated test'}', async ({ page }) => {`);

  flow.steps
    .sort((a, b) => a.order - b.order)
    .forEach(step => {
      const code = stepToPlaywrightCode(step);
      if (code) {
        lines.push(`  ${code}`);
      }
    });

  lines.push('});');

  return lines.join('\n');
}

/**
 * Convert step to Playwright code
 */
function stepToPlaywrightCode(step: FlowStep): string {
  const { type, config } = step;

  switch (type) {
    case 'navigate':
      return `await page.goto('${config.url || ''}', { waitUntil: 'networkidle' });`;

    case 'click':
      return `await page.locator('${config.selector || ''}').click();`;

    case 'fill':
      return `await page.locator('${config.selector || ''}').fill('${config.value || ''}');`;

    case 'select':
      return `await page.locator('${config.selector || ''}').selectOption('${config.value || ''}');`;

    case 'hover':
      return `await page.locator('${config.selector || ''}').hover();`;

    case 'assert':
      return `expect(${config.assertion || 'true'}).toBeTruthy();`;

    case 'verify':
      if (config.expectedResult) {
        return `await expect(page.locator('${config.selector || ''}')).toHaveText('${config.expectedResult}');`;
      }
      return `await expect(page.locator('${config.selector || ''}')).toBeVisible();`;

    case 'screenshot':
      return `await page.screenshot({ path: 'screenshot-${Date.now()}.png' });`;

    case 'wait':
      if (config.selector) {
        return `await page.locator('${config.selector || ''}').waitFor({ state: 'visible', timeout: ${config.timeout || 30000} });`;
      }
      return `await page.waitForTimeout(${config.timeout || 3000});`;

    default:
      return `// ${config.description || 'Unknown step'}`;
  }
}

/**
 * Validate flow structure
 */
export function validateFlow(flow: TestFlow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!flow.name || flow.name.trim().length === 0) {
    errors.push('Flow must have a name');
  }

  if (!flow.steps || flow.steps.length === 0) {
    errors.push('Flow must have at least one step');
  }

  // Check for duplicate step IDs
  const stepIds = new Set<string>();
  flow.steps.forEach(step => {
    if (stepIds.has(step.id)) {
      errors.push(`Duplicate step ID: ${step.id}`);
    }
    stepIds.add(step.id);
  });

  // Validate each step
  flow.steps.forEach((step, index) => {
    if (!step.type) {
      errors.push(`Step ${index + 1} is missing a type`);
    }

    if (step.type === 'navigate' && !step.config.url) {
      errors.push(`Step ${index + 1} (navigate) is missing URL`);
    }

    if ((step.type === 'click' || step.type === 'fill' || step.type === 'select' || step.type === 'hover') && !step.config.selector) {
      errors.push(`Step ${index + 1} (${step.type}) is missing selector`);
    }

    if (step.type === 'fill' && !step.config.value) {
      errors.push(`Step ${index + 1} (fill) is missing value`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
