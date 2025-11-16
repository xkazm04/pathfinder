import { NextResponse } from 'next/server';
import { NL_TO_STEPS_PROMPT, EXTRACT_URL_PROMPT } from '@/prompts/nl-to-steps';
import { generateCompletion, parseAIJsonResponse } from '@/lib/llm/ai-client';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Convert natural language to steps
    const stepsPrompt = NL_TO_STEPS_PROMPT.replace('{description}', description);
    const { text: stepsResponse, provider: stepsProvider } = await generateCompletion(stepsPrompt);
    console.log(`[nl-to-steps] Used AI provider for steps: ${stepsProvider}`);

    // Parse JSON response
    let steps = [];
    try {
      steps = parseAIJsonResponse<any[]>(stepsResponse);
    } catch (parseError) {
      console.error('[nl-to-steps] Failed to parse Gemini response:', stepsResponse);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Extract URL
    const urlPrompt = EXTRACT_URL_PROMPT.replace('{description}', description);
    const { text: urlResponse, provider: urlProvider } = await generateCompletion(urlPrompt);
    console.log(`[nl-to-steps] Used AI provider for URL: ${urlProvider}`);
    const targetUrl = urlResponse.trim();

    // Generate test name
    const testName = generateTestName(description);

    return NextResponse.json({
      steps,
      targetUrl: targetUrl.startsWith('http') ? targetUrl : '',
      testName,
    });
  } catch (error: any) {
    console.error('[nl-to-steps] Error in nl-to-steps API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTestName(description: string): string {
  // Extract first meaningful line
  const lines = description.split('\n').filter(l => l.trim());
  const firstLine = lines[0] || 'Untitled Test';

  // Clean up and truncate
  let name = firstLine
    .replace(/^Test:?\s*/i, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .trim();

  if (name.length > 50) {
    name = name.substring(0, 47) + '...';
  }

  return name || 'Untitled Test';
}
