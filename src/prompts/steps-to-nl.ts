/**
 * Prompt for converting structured steps to natural language description
 */
export const STEPS_TO_NL_PROMPT = `You are a test automation expert. Convert the following structured test steps into a clear, natural language test description.

Write it as a numbered list that a non-technical person could understand.

Test metadata:
Name: {name}
Target URL: {url}
Viewport: {viewport}

Steps (JSON):
{steps}

Generate a natural language description in this format:
Test: [Name]
URL: [URL]
Viewport: [Viewport]

Steps:
1. [First step description]
2. [Second step description]
...

Be concise and clear. Return ONLY the formatted description, no preamble.`;

/**
 * Prompt for generating test name from steps
 */
export const GENERATE_TEST_NAME_PROMPT = `Based on these test steps, generate a concise, descriptive test name (max 50 characters).

Steps:
{steps}

Return ONLY the test name, nothing else. Use format: "Test [main action] on [target]"`;

/**
 * Prompt for simplifying step description
 */
export const SIMPLIFY_STEP_PROMPT = `Simplify this technical test step into plain English:

Step type: {type}
Action: {action}
Target: {target}
Value: {value}

Return ONLY a single sentence description, nothing else.`;
