import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ANALYZE_REPO_STRUCTURE_PROMPT, SUGGEST_NEXT_TEST_PROMPT } from '@/prompts/test-recommendations';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { projectId, analysisType = 'recommendations' } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch existing tests for this project
    const { data: testSuites } = await supabase
      .from('test_suites')
      .select('name, description, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Fetch test run statistics
    const { data: testRuns } = await supabase
      .from('test_runs')
      .select('id, status, created_at, suite_id')
      .in('suite_id', testSuites?.map(s => s.id) || [])
      .order('created_at', { ascending: false })
      .limit(20);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    if (analysisType === 'recommendations') {
      // Generate test recommendations
      const existingTestsSummary = testSuites?.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n') || 'None';

      const prompt = ANALYZE_REPO_STRUCTURE_PROMPT
        .replace('{repo}', project.repo || 'No repository URL provided')
        .replace('{projectName}', project.name)
        .replace('{projectDescription}', project.description || 'No description')
        .replace('{existingTests}', existingTestsSummary);

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse JSON response
      let recommendations = [];
      try {
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\[[\s\S]*\]/);
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        recommendations = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse recommendations:', text);
        return NextResponse.json(
          { error: 'Failed to parse AI recommendations' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        recommendations,
        project: {
          name: project.name,
          repo: project.repo,
        },
      });
    } else if (analysisType === 'next-test') {
      // Suggest next test based on history
      const completedTests = testSuites?.map(t => t.name).join(', ') || 'None';
      const failedRuns = testRuns?.filter(r => r.status === 'failed').length || 0;
      const totalRuns = testRuns?.length || 0;

      const prompt = SUGGEST_NEXT_TEST_PROMPT
        .replace('{completedTests}', completedTests)
        .replace('{failedTests}', `${failedRuns} out of ${totalRuns} recent runs failed`)
        .replace('{trends}', 'Recent activity shows focus on UI testing');

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let suggestion = null;
      try {
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        suggestion = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse suggestion:', text);
      }

      return NextResponse.json({ suggestion });
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error in analyze-repo API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
