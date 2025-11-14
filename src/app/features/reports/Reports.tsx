'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedCard, ThemedCardHeader } from '@/components/ui/ThemedCard';
import { ReportOverview } from './components/ReportOverview';
import { ScreenshotComparison } from './components/ScreenshotComparison';
import { ErrorTimeline } from './components/ErrorTimeline';
import { TestResultsTable } from './components/TestResultsTable';
import { ViewportGrid } from './components/ViewportGrid';
import { HistoricalComparison } from './components/HistoricalComparison';
import { IssueDashboard } from '@/components/inspector/IssueDashboard';
import { mockReportData, mockErrorDetails } from './lib/mockData';
import { getAnalysesForTestRun, getAnalysisStats } from '@/lib/supabase/aiAnalyses';
import { exportAsJSON, exportAsCSV, exportAsMarkdown, exportAsHTML } from '@/lib/export/reportExporter';
import { ArrowLeft, Download, Share2, Brain, Loader2, FileJson, FileText, FileCode } from 'lucide-react';

interface ReportsProps {
  testRunId?: string;
}

export function Reports({ testRunId }: ReportsProps) {
  const { currentTheme } = useTheme();
  const [aiAnalyses, setAiAnalyses] = useState<any[]>([]);
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // In a real app, fetch data based on testRunId
  const reportData = mockReportData;
  const errors = mockErrorDetails;

  // Load AI analyses if testRunId is available
  useEffect(() => {
    if (testRunId) {
      loadAnalyses();
    }
  }, [testRunId]);

  const loadAnalyses = async () => {
    try {
      setLoadingAnalysis(true);
      const analyses = await getAnalysesForTestRun(testRunId || reportData.testRun.id);
      const stats = await getAnalysisStats(testRunId || reportData.testRun.id);
      setAiAnalyses(analyses);
      setAnalysisStats(stats);
    } catch (error) {
      console.error('Failed to load AI analyses:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const runAIAnalysis = async () => {
    try {
      setRunningAnalysis(true);

      const response = await fetch('/api/gemini/analyze-visual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRunId: testRunId || reportData.testRun.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Reload analyses
      await loadAnalyses();
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI analysis failed. Please try again.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  // Collect all findings from analyses
  const allFindings = aiAnalyses.flatMap(a => a.findings || []);

  // Find tests that have visual diffs (failed tests related to screenshots)
  const visualDiffTests = reportData.results.filter(
    r => r.status === 'fail' && r.errors?.some(e => e.message.includes('Screenshot'))
  );

  // Export handlers
  const handleExport = (format: 'json' | 'csv' | 'markdown' | 'html') => {
    const exportData = {
      testRun: {
        id: reportData.testRun.id,
        suite_name: reportData.testSuite?.name || 'Test Suite',
        created_at: reportData.testRun.created_at,
        status: reportData.testRun.status,
        total_tests: reportData.results.length,
      },
      results: reportData.results,
      findings: allFindings,
      qualityScore: analysisStats?.qualityScore,
    };

    switch (format) {
      case 'json':
        exportAsJSON(exportData);
        break;
      case 'csv':
        exportAsCSV(exportData);
        break;
      case 'markdown':
        exportAsMarkdown(exportData);
        break;
      case 'html':
        exportAsHTML(exportData);
        break;
    }

    setShowExportMenu(false);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
            Test Report
          </h1>
          <p className="text-lg" style={{ color: currentTheme.colors.text.tertiary }}>
            Detailed analysis of test execution #{testRunId || reportData.testRun.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemedButton variant="ghost" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Runner
          </ThemedButton>
          <ThemedButton variant="secondary" size="md" leftIcon={<Share2 className="w-4 h-4" />}>
            Share
          </ThemedButton>

          {/* Export Dropdown */}
          <div className="relative">
            <ThemedButton
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
            </ThemedButton>

            {showExportMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />

                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <div className="py-2">
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                      style={{ color: currentTheme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FileJson className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                      style={{ color: currentTheme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                      style={{ color: currentTheme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FileCode className="w-4 h-4" />
                      Export as Markdown
                    </button>
                    <button
                      onClick={() => handleExport('html')}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                      style={{ color: currentTheme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Export as HTML
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Report Overview */}
      <ReportOverview data={reportData} />

      {/* AI Analysis Section */}
      <ThemedCard variant="glow">
        <ThemedCardHeader
          title="AI Visual Analysis"
          subtitle="Powered by Google Gemini"
          icon={<Brain className="w-5 h-5" />}
          action={
            <div className="flex gap-2">
              {aiAnalyses.length > 0 && (
                <ThemedButton
                  variant="ghost"
                  size="sm"
                  onClick={loadAnalyses}
                  disabled={loadingAnalysis}
                >
                  Refresh
                </ThemedButton>
              )}
              <ThemedButton
                variant="primary"
                size="sm"
                onClick={runAIAnalysis}
                disabled={runningAnalysis}
                leftIcon={runningAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              >
                {runningAnalysis ? 'Analyzing...' : aiAnalyses.length > 0 ? 'Re-analyze' : 'Run AI Analysis'}
              </ThemedButton>
            </div>
          }
        />
        <div className="p-6">
          {loadingAnalysis ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: currentTheme.colors.accent }} />
              <p style={{ color: currentTheme.colors.text.secondary }}>Loading AI analysis...</p>
            </div>
          ) : aiAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4" style={{ color: currentTheme.colors.text.tertiary }} />
              <p className="mb-4" style={{ color: currentTheme.colors.text.secondary }}>
                No AI analysis available yet. Run analysis to detect visual, functional, and accessibility issues automatically.
              </p>
            </div>
          ) : (
            <IssueDashboard
              findings={allFindings}
              qualityScore={analysisStats?.qualityScore || 0}
            />
          )}
        </div>
      </ThemedCard>

      {/* Historical Comparison */}
      {testRunId && <HistoricalComparison currentRunId={testRunId || reportData.testRun.id} />}

      {/* Viewport Grid */}
      {reportData.results.length > 0 && (
        <ViewportGrid
          results={reportData.results.map(r => ({
            viewport: r.viewport,
            viewport_size: r.viewport_size,
            status: r.status,
            duration_ms: r.duration_ms,
            errors: r.errors,
            screenshot_url: typeof r.screenshots?.[0] === 'string' ? r.screenshots[0] : r.screenshots?.[0]?.url,
          }))}
          testName={reportData.testSuite?.name || 'Test Suite'}
        />
      )}

      {/* Error Timeline - UI Improvement 2 */}
      {errors.length > 0 && <ErrorTimeline errors={errors} />}

      {/* Screenshot Comparisons - UI Improvement 1 */}
      {visualDiffTests.length > 0 && (
        <div className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text.primary }}
          >
            Visual Differences
          </motion.h2>
          {visualDiffTests.map((test) => (
            <ScreenshotComparison
              key={test.id}
              testName={test.test_name}
              viewport={`${test.viewport} (${test.viewport_size})`}
              hasVisualDiff={true}
            />
          ))}
        </div>
      )}

      {/* Test Results Table */}
      <TestResultsTable results={reportData.results} />
    </div>
  );
}
