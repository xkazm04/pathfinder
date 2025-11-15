import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NL_TO_STEPS_PROMPT, EXTRACT_URL_PROMPT } from '@/prompts/nl-to-steps';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Use lightweight Gemini Flash Lite model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Convert natural language to steps
    const prompt = NL_TO_STEPS_PROMPT.replace('{description}', description);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    let steps = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      steps = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Extract URL
    const urlPrompt = EXTRACT_URL_PROMPT.replace('{description}', description);
    const urlResult = await model.generateContent(urlPrompt);
    const targetUrl = urlResult.response.text().trim();

    // Generate test name
    const testName = generateTestName(description);

    return NextResponse.json({
      steps,
      targetUrl: targetUrl.startsWith('http') ? targetUrl : '',
      testName,
    });
  } catch (error: any) {
    console.error('Error in nl-to-steps API:', error);
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
