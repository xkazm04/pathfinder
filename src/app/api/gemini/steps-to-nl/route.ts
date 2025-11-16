import { NextResponse } from 'next/server';
import { STEPS_TO_NL_PROMPT } from '@/prompts/steps-to-nl';
import { generateCompletion } from '@/lib/llm/ai-client';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { flow } = await request.json();

    if (!flow || !flow.steps) {
      return NextResponse.json(
        { error: 'Flow with steps is required' },
        { status: 400 }
      );
    }

    // Convert steps to natural language
    const prompt = STEPS_TO_NL_PROMPT
      .replace('{name}', flow.name || 'Untitled Test')
      .replace('{url}', flow.targetUrl || 'Not specified')
      .replace('{viewport}', flow.viewport || 'Desktop HD (1920x1080)')
      .replace('{steps}', JSON.stringify(flow.steps, null, 2));

    const { text: naturalLanguage, provider } = await generateCompletion(prompt);
    console.log(`[steps-to-nl] Used AI provider: ${provider}`);

    return NextResponse.json({
      naturalLanguage: naturalLanguage.trim(),
    });
  } catch (error: any) {
    console.error('[steps-to-nl] Error in steps-to-nl API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
