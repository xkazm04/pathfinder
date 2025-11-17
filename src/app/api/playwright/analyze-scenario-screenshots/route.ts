import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithRetry } from '@/lib/gemini/visualInspector';
import { getScenarioResults, saveAIScreenshotAnalysis } from '@/lib/supabase/scenarioResults';

export const maxDuration = 300; // 5 minutes

/**
 * Analyze screenshots from a scenario execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioResultId, analysisType = 'visual' } = body;

    if (!scenarioResultId) {
      return NextResponse.json(
        { error: 'Missing required parameter: scenarioResultId' },
        { status: 400 }
      );
    }

    // Fetch scenario result with screenshots
    const scenarioResults = await getScenarioResults(scenarioResultId);
    const scenarioResult = scenarioResults.find(r => r.id === scenarioResultId);

    if (!scenarioResult) {
      return NextResponse.json(
        { error: 'Scenario result not found' },
        { status: 404 }
      );
    }

    // Check if screenshots are available
    if (!scenarioResult.screenshots || scenarioResult.screenshots.length === 0) {
      return NextResponse.json(
        { error: 'No screenshots available for analysis' },
        { status: 400 }
      );
    }

    const analyses: Array<{ url: string; analysisId: string; findingsCount: number }> = [];

    // Analyze each screenshot individually
    for (const screenshotUrl of scenarioResult.screenshots) {
      try {
        // Prepare context for analysis
        const context = {
          testName: `Scenario ${scenarioResult.scenario_id}`,
          viewport: `${scenarioResult.viewport} (${scenarioResult.viewport_size})`,
          targetUrl: 'Scenario execution',
          testStatus: scenarioResult.status,
        };

        // Analyze screenshot with Gemini
        const findings = await analyzeWithRetry(
          [screenshotUrl],
          context,
          analysisType === 'accessibility' ? 'accessibility' : 'comprehensive'
        );

        // Prepare issues array from findings
        const issues = findings.map((finding: any) => ({
          type: finding.category || 'unknown',
          severity: finding.severity || 'info',
          description: finding.issue || finding.description || '',
          location: finding.location || '',
          recommendation: finding.recommendation || '',
          affectedElements: finding.affectedElements || [],
          confidenceScore: finding.confidenceScore || 0.5,
        }));

        // Calculate overall confidence score
        const avgConfidence = issues.length > 0
          ? issues.reduce((sum: number, issue: any) => sum + (issue.confidenceScore || 0), 0) / issues.length
          : 0;

        // Generate suggestions summary
        const suggestions = findings
          .map((f: any) => f.recommendation || '')
          .filter(Boolean)
          .join('\n');

        // Save analysis to database
        const analysisId = await saveAIScreenshotAnalysis({
          scenario_result_id: scenarioResultId,
          screenshot_url: screenshotUrl,
          analysis_type: analysisType,
          findings: findings as any,
          issues,
          suggestions,
          confidence_score: avgConfidence,
          model_used: 'gemini-flash-latest',
        });

        analyses.push({
          url: screenshotUrl,
          analysisId,
          findingsCount: findings.length,
        });
      } catch (error: any) {
        console.error(`Failed to analyze screenshot ${screenshotUrl}:`, error);
        // Continue with other screenshots even if one fails
        analyses.push({
          url: screenshotUrl,
          analysisId: '',
          findingsCount: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      analyzedScreenshots: analyses.length,
      analyses,
      totalFindings: analyses.reduce((sum, a) => sum + a.findingsCount, 0),
    });
  } catch (error: any) {
    console.error('Scenario screenshot analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Screenshot analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * Batch analyze all scenarios from a test run
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testRunId } = body;

    if (!testRunId) {
      return NextResponse.json(
        { error: 'Missing required parameter: testRunId' },
        { status: 400 }
      );
    }

    // Fetch all scenario results for this run
    const scenarioResults = await getScenarioResults(testRunId);

    if (scenarioResults.length === 0) {
      return NextResponse.json(
        { error: 'No scenario results found for this run' },
        { status: 404 }
      );
    }

    const batchResults: Array<{ scenarioId: string; status: string; analysesCount: number }> = [];

    // Analyze each scenario
    for (const scenarioResult of scenarioResults) {
      if (!scenarioResult.screenshots || scenarioResult.screenshots.length === 0) {
        console.log(`Skipping scenario ${scenarioResult.id} - no screenshots`);
        batchResults.push({
          scenarioId: scenarioResult.scenario_id,
          status: 'skipped',
          analysesCount: 0,
        });
        continue;
      }

      try {
        let analysisCount = 0;

        for (const screenshotUrl of scenarioResult.screenshots) {
          const context = {
            testName: `Scenario ${scenarioResult.scenario_id}`,
            viewport: `${scenarioResult.viewport} (${scenarioResult.viewport_size})`,
            targetUrl: 'Scenario execution',
            testStatus: scenarioResult.status,
          };

          const findings = await analyzeWithRetry([screenshotUrl], context, 'comprehensive');

          const issues = findings.map((finding: any) => ({
            type: finding.category || 'unknown',
            severity: finding.severity || 'info',
            description: finding.issue || '',
            location: finding.location || '',
            recommendation: finding.recommendation || '',
          }));

          const avgConfidence = issues.length > 0
            ? issues.reduce((sum: number, issue: any) => sum + (issue.confidenceScore || 0), 0) / issues.length
            : 0;

          const suggestions = findings
            .map((f: any) => f.recommendation || '')
            .filter(Boolean)
            .join('\n');

          await saveAIScreenshotAnalysis({
            scenario_result_id: scenarioResult.id!,
            screenshot_url: screenshotUrl,
            analysis_type: 'visual',
            findings: findings as any,
            issues,
            suggestions,
            confidence_score: avgConfidence,
            model_used: 'gemini-flash-latest',
          });

          analysisCount++;
        }

        batchResults.push({
          scenarioId: scenarioResult.scenario_id,
          status: 'completed',
          analysesCount: analysisCount,
        });
      } catch (error: any) {
        console.error(`Failed to analyze scenario ${scenarioResult.scenario_id}:`, error);
        batchResults.push({
          scenarioId: scenarioResult.scenario_id,
          status: 'failed',
          analysesCount: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalScenarios: scenarioResults.length,
      results: batchResults,
      totalAnalyses: batchResults.reduce((sum, r) => sum + r.analysesCount, 0),
    });
  } catch (error: any) {
    console.error('Batch scenario analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch analysis failed' },
      { status: 500 }
    );
  }
}
