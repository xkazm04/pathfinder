'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ReportOverview } from './components/ReportOverview';
import { ScreenshotComparison } from './components/ScreenshotComparison';
import { ErrorTimeline } from './components/ErrorTimeline';
import { TestResultsTable } from './components/TestResultsTable';
import { mockReportData, mockErrorDetails } from './lib/mockData';
import { ArrowLeft, Download, Share2 } from 'lucide-react';

interface ReportsProps {
  testRunId?: string;
}

export function Reports({ testRunId }: ReportsProps) {
  const { currentTheme } = useTheme();

  // In a real app, fetch data based on testRunId
  const reportData = mockReportData;
  const errors = mockErrorDetails;

  // Find tests that have visual diffs (failed tests related to screenshots)
  const visualDiffTests = reportData.results.filter(
    r => r.status === 'fail' && r.errors?.some(e => e.message.includes('Screenshot'))
  );

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
          <ThemedButton variant="primary" size="md" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </ThemedButton>
        </div>
      </motion.div>

      {/* Report Overview */}
      <ReportOverview data={reportData} />

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
