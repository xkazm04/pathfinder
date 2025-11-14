'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { TestResultWithDetails } from '../lib/mockData';
import { CheckCircle2, XCircle, Minus, Monitor, Tablet, Smartphone } from 'lucide-react';

interface TestResultsTableProps {
  results: TestResultWithDetails[];
}

export function TestResultsTable({ results }: TestResultsTableProps) {
  const { currentTheme } = useTheme();

  const getStatusIcon = (status: 'pass' | 'fail' | 'skipped') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />;
      case 'fail':
        return <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />;
      case 'skipped':
        return <Minus className="w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'skipped') => {
    switch (status) {
      case 'pass':
        return '#22c55e';
      case 'fail':
        return '#ef4444';
      case 'skipped':
        return currentTheme.colors.text.tertiary;
    }
  };

  const getViewportIcon = (viewport: 'mobile' | 'tablet' | 'desktop') => {
    switch (viewport) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Group results by test name
  const groupedResults = results.reduce((acc, result) => {
    const key = result.test_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {} as Record<string, TestResultWithDetails[]>);

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Test Results"
        subtitle={`${results.length} test execution${results.length !== 1 ? 's' : ''}`}
        icon={<CheckCircle2 className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: currentTheme.colors.border,
                }}
              >
                <th className="text-left p-3 text-xs font-semibold"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  Test Name
                </th>
                <th className="text-center p-3 text-xs font-semibold"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  Viewport
                </th>
                <th className="text-center p-3 text-xs font-semibold"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  Status
                </th>
                <th className="text-center p-3 text-xs font-semibold"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedResults).map(([testName, testResults], groupIndex) => (
                <motion.tr
                  key={testName}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                >
                  <td
                    colSpan={4}
                    className="p-0"
                    style={{
                      borderTopWidth: groupIndex > 0 ? '1px' : '0',
                      borderTopStyle: 'solid',
                      borderTopColor: currentTheme.colors.border,
                    }}
                  >
                    {/* Test Name Row */}
                    <div
                      className="p-3 font-medium"
                      style={{
                        backgroundColor: `${currentTheme.colors.surface}40`,
                        color: currentTheme.colors.text.primary,
                      }}
                    >
                      {testName}
                    </div>

                    {/* Viewport Results */}
                    {testResults.map((result, resultIndex) => (
                      <div
                        key={result.id}
                        className="grid grid-cols-4 p-3 transition-colors hover:bg-opacity-50"
                        style={{
                          backgroundColor: resultIndex % 2 === 0 ? 'transparent' : `${currentTheme.colors.surface}20`,
                          borderTopWidth: '1px',
                          borderTopStyle: 'solid',
                          borderTopColor: currentTheme.colors.border,
                        }}
                      >
                        <div></div>
                        <div className="flex items-center justify-center gap-2">
                          {getViewportIcon(result.viewport)}
                          <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                            {result.viewport_size}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(result.status)}
                          <span
                            className="text-sm font-medium capitalize"
                            style={{ color: getStatusColor(result.status) }}
                          >
                            {result.status}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-mono" style={{ color: currentTheme.colors.text.secondary }}>
                            {formatDuration(result.duration_ms)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
