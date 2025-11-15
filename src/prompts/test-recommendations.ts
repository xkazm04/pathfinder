/**
 * Prompts for AI-powered test recommendations based on repository analysis
 */

export const ANALYZE_REPO_STRUCTURE_PROMPT = `You are a test automation expert. Analyze this repository structure and suggest test scenarios.

Repository: {repo}
Project Name: {projectName}
Description: {projectDescription}

Existing Tests:
{existingTests}

Based on the repository structure, common patterns, and gaps in existing tests:

1. Identify key user flows that should be tested
2. Find critical features that lack test coverage
3. Suggest priority tests based on:
   - User-facing features
   - Authentication/authorization flows
   - Data entry forms
   - Navigation patterns
   - Common user journeys
   - Error scenarios

Return a JSON array of test recommendations:
[
  {
    "testName": "Short descriptive name",
    "priority": "high" | "medium" | "low",
    "category": "e2e" | "ui" | "form" | "navigation" | "auth" | "data",
    "description": "What this test covers",
    "estimatedComplexity": 1-10,
    "reason": "Why this test is important",
    "suggestedSteps": [
      {
        "type": "navigate" | "click" | "fill" | "select" | "assert" | "wait",
        "action": "Brief action description",
        "target": "UI element",
        "value": "Optional value"
      }
    ]
  }
]

Return ONLY the JSON array, no explanation.`;

export const ANALYZE_PACKAGE_JSON_PROMPT = `Analyze this package.json and suggest relevant tests.

Package.json:
{packageJson}

Identify:
1. Framework used (React, Vue, Next.js, etc.)
2. Key dependencies that suggest testable features
3. Common patterns for this tech stack

Return JSON:
{
  "framework": "name",
  "testableFeatures": ["feature1", "feature2"],
  "suggestedTests": ["test1", "test2"]
}

Return ONLY the JSON, no explanation.`;

export const SUGGEST_NEXT_TEST_PROMPT = `Based on testing history, suggest the next most valuable test to write.

Completed Tests:
{completedTests}

Failed Tests:
{failedTests}

Test Trends:
{trends}

Suggest the next test that would:
1. Maximize coverage
2. Target high-risk areas
3. Complement existing tests
4. Address recent failures

Return JSON:
{
  "testName": "Name",
  "priority": "high" | "medium" | "low",
  "reason": "Why this test matters now",
  "prefillSteps": [
    {
      "type": "action type",
      "action": "description",
      "target": "element",
      "value": "value if applicable"
    }
  ]
}

Return ONLY the JSON, no explanation.`;

export const GENERATE_TEST_VARIATIONS_PROMPT = `Given this test, suggest meaningful variations to improve coverage.

Original Test:
{originalTest}

Suggest variations that test:
1. Different user paths
2. Edge cases
3. Error conditions
4. Different data inputs
5. Different viewport sizes

Return JSON array:
[
  {
    "variationName": "Name",
    "description": "What's different",
    "steps": [/* modified steps */]
  }
]

Return ONLY the JSON array, no explanation.`;
