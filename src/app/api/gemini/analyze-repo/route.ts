import { NextResponse } from 'next/server';
import { ANALYZE_REPO_STRUCTURE_PROMPT, SUGGEST_NEXT_TEST_PROMPT } from '@/prompts/test-recommendations';
import { supabase } from '@/lib/supabase';
import { generateCompletion, parseAIJsonResponse } from '@/lib/llm/ai-client';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { projectId, analysisType = 'recommendations' } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch test project details
    const { data: project, error: projectError } = await supabase
      .from('test_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Test project not found' },
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
      .in('suite_id', testSuites?.map(s => (s as any).id) || [])
      .order('created_at', { ascending: false })
      .limit(20);

    if (analysisType === 'recommendations') {
      // Generate test recommendations
      const existingTestsSummary = testSuites?.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n') || 'None';

      const prompt = ANALYZE_REPO_STRUCTURE_PROMPT
        .replace('{repo}', project.repo || 'No repository URL provided')
        .replace('{projectName}', project.name)
        .replace('{projectDescription}', project.description || 'No description')
        .replace('{existingTests}', existingTestsSummary);

      const { text: aiResponse, provider } = await generateCompletion(prompt);
      console.log(`[analyze-repo] Used AI provider: ${provider}`);

      // Parse JSON response
      let recommendations = [];
      try {
        recommendations = parseAIJsonResponse<any[]>(aiResponse);
      } catch (parseError) {
        console.error('[analyze-repo] Failed to parse recommendations:', aiResponse);
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

      const { text: aiResponse, provider } = await generateCompletion(prompt);
      console.log(`[analyze-repo next-test] Used AI provider: ${provider}`);

      let suggestion = null;
      try {
        suggestion = parseAIJsonResponse<any>(aiResponse);
      } catch (parseError) {
        console.error('[analyze-repo] Failed to parse suggestion:', aiResponse);
      }

      return NextResponse.json({ suggestion });
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[analyze-repo] Error in analyze-repo API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
