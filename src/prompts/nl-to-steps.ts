/**
 * Prompt for converting natural language test description to structured steps
 */
export const NL_TO_STEPS_PROMPT = `You are a test automation expert. Convert the following natural language test description into structured test steps.

Return a JSON array of steps where each step has:
- type: one of 'navigate', 'click', 'fill', 'select', 'assert', 'wait', 'custom'
- action: brief description of the action
- target: (optional) the UI element being targeted
- selector: (optional) suggested CSS/XPath selector
- value: (optional) value to input or assert
- description: human-readable description

Example output:
[
  {
    "type": "navigate",
    "action": "Navigate to URL",
    "target": "homepage",
    "selector": "",
    "value": "",
    "description": "Go to the homepage"
  },
  {
    "type": "click",
    "action": "Click button",
    "target": "Shop Now button",
    "selector": "button:has-text('Shop Now')",
    "value": "",
    "description": "Click on the Shop Now button"
  }
]

Natural language description:
{description}

Return ONLY the JSON array, no explanation.`;

/**
 * Prompt for extracting target URL from natural language
 */
export const EXTRACT_URL_PROMPT = `Extract the target URL from this test description. If no URL is explicitly mentioned, return an empty string.

Test description:
{description}

Return ONLY the URL or empty string, nothing else.`;

/**
 * Prompt for determining test type
 */
export const DETERMINE_TEST_TYPE_PROMPT = `Analyze this test description and determine its primary type.

Types:
- E2E (end-to-end flow test)
- UI (user interface interaction test)
- Form (form submission test)
- Navigation (page navigation test)
- Accessibility (accessibility test)
- Performance (performance test)
- Visual (visual regression test)

Test description:
{description}

Return ONLY the type name, nothing else.`;
