import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { STEPS_TO_NL_PROMPT } from '@/prompts/steps-to-nl';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { flow } = await request.json();

    if (!flow || !flow.steps) {
      return NextResponse.json(
        { error: 'Flow with steps is required' },
        { status: 400 }
      );
    }

    // Use lightweight Gemini Flash Lite model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Convert steps to natural language
    const prompt = STEPS_TO_NL_PROMPT
      .replace('{name}', flow.name || 'Untitled Test')
      .replace('{url}', flow.targetUrl || 'Not specified')
      .replace('{viewport}', flow.viewport || 'Desktop HD (1920x1080)')
      .replace('{steps}', JSON.stringify(flow.steps, null, 2));

    const result = await model.generateContent(prompt);
    const response = result.response;
    const naturalLanguage = response.text().trim();

    return NextResponse.json({
      naturalLanguage,
    });
  } catch (error: any) {
    console.error('Error in steps-to-nl API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
