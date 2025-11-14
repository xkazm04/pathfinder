'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { compareTestRuns, getRecentTestRuns, type TestRunSummary } from '@/lib/supabase/dashboard';
import { GitCompare, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';

interface HistoricalComparisonProps {
  currentRunId: string;
}

interface ComparisonData {
  current: TestRunSummary;
  previous: TestRunSummary;
  improvements: number;
  regressions: number;
  newIssues: number;
  resolvedIssues: number;
}

export function HistoricalComparison({ currentRunId }: HistoricalComparisonProps) {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [availableRuns, setAvailableRuns] = useState<TestRunSummary[]>([]);
  const [selectedPreviousRunId, setSelectedPreviousRunId] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableRuns();
  }, []);

  useEffect(() => {
    if (selectedPreviousRunId) {
      loadComparison();
    }
  }, [selectedPreviousRunId]);

  const loadAvailableRuns = async () => {
    try {
      setLoading(true);
      const result = await getRecentTestRuns(1, 10, { status: 'completed' });
      // Filter out current run
      const otherRuns = result.runs.filter(r => r.id !== currentRunId);
      setAvailableRuns(otherRuns);

      // Auto-select the most recent run as the comparison baseline
      if (otherRuns.length > 0) {
        setSelectedPreviousRunId(otherRuns[0].id);
      }
    } catch (error) {
      console.error('Failed to load test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    if (!selectedPreviousRunId) return;

    try {
      setLoading(true);
      const data = await compareTestRuns(currentRunId, selectedPreviousRunId);
      setComparison(data);
    } catch (error) {
      console.error('Failed to load comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !comparison) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: currentTheme.colors.accent }} />
            <p style={{ color: currentTheme.colors.text.secondary }}>Loading comparison...</p>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  if (availableRuns.length === 0) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="Historical Comparison"
          subtitle="Compare with previous runs"
          icon={<GitCompare className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
            No previous test runs available for comparison
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Historical Comparison"
        subtitle="Compare with previous runs"
        icon={<GitCompare className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
              Compare with:
            </label>
            <select
              value={selectedPreviousRunId || ''}
              onChange={(e) => setSelectedPreviousRunId(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text.primary,
              }}
            >
              {availableRuns.map(run => (
                <option key={run.id} value={run.id}>
                  {run.name} - {new Date(run.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <ThemedCardContent>
        {comparison && (
          <div className="mt-4 space-y-6">
            {/* Comparison Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Previous Run
                </div>
                <div className="font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                  {comparison.previous.name}
                </div>
                <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                  {new Date(comparison.previous.created_at).toLocaleString()}
                </div>
              </div>

              <ArrowRight className="w-8 h-8 mx-4" style={{ color: currentTheme.colors.text.tertiary }} />

              <div className="flex-1 text-right">
                <div className="text-sm font-medium mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Current Run
                </div>
                <div className="font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                  {comparison.current.name}
                </div>
                <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                  {new Date(comparison.current.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Improvements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${comparison.improvements > 0 ? '#22c55e' : currentTheme.colors.surface}20`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: comparison.improvements > 0 ? '#22c55e50' : currentTheme.colors.border,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                    Improvements
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                  +{comparison.improvements}
                </div>
                <div className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Tests fixed
                </div>
              </motion.div>

              {/* Regressions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${comparison.regressions > 0 ? '#ef4444' : currentTheme.colors.surface}20`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: comparison.regressions > 0 ? '#ef444450' : currentTheme.colors.border,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
                  <span className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                    Regressions
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                  {comparison.regressions > 0 ? '-' : ''}{comparison.regressions}
                </div>
                <div className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Tests broken
                </div>
              </motion.div>

              {/* Resolved Issues */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${comparison.resolvedIssues > 0 ? '#22c55e' : currentTheme.colors.surface}20`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: comparison.resolvedIssues > 0 ? '#22c55e50' : currentTheme.colors.border,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
                  <span className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                    Resolved Issues
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                  {comparison.resolvedIssues}
                </div>
                <div className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Issues fixed
                </div>
              </motion.div>

              {/* New Issues */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${comparison.newIssues > 0 ? '#f97316' : currentTheme.colors.surface}20`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: comparison.newIssues > 0 ? '#f9731650' : currentTheme.colors.border,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4" style={{ color: '#f97316' }} />
                  <span className="text-xs font-medium" style={{ color: currentTheme.colors.text.tertiary }}>
                    New Issues
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#f97316' }}>
                  {comparison.newIssues}
                </div>
                <div className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  New problems
                </div>
              </motion.div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Previous */}
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Total Tests
                    </span>
                    <span className="font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                      {comparison.previous.total_tests}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Passed
                    </span>
                    <span className="font-semibold" style={{ color: '#22c55e' }}>
                      {comparison.previous.passed_tests}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Failed
                    </span>
                    <span className="font-semibold" style={{ color: '#ef4444' }}>
                      {comparison.previous.failed_tests}
                    </span>
                  </div>
                  {comparison.previous.quality_score !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                        Quality Score
                      </span>
                      <span className="font-semibold" style={{ color: currentTheme.colors.accent }}>
                        {comparison.previous.quality_score}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current */}
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: `${currentTheme.colors.primary}10`,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.primary,
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Total Tests
                    </span>
                    <span className="font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                      {comparison.current.total_tests}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Passed
                    </span>
                    <span className="font-semibold" style={{ color: '#22c55e' }}>
                      {comparison.current.passed_tests}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Failed
                    </span>
                    <span className="font-semibold" style={{ color: '#ef4444' }}>
                      {comparison.current.failed_tests}
                    </span>
                  </div>
                  {comparison.current.quality_score !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                        Quality Score
                      </span>
                      <span className="font-semibold" style={{ color: currentTheme.colors.accent }}>
                        {comparison.current.quality_score}
                        {comparison.previous.quality_score !== undefined && (
                          <span className="ml-2 text-xs" style={{
                            color: comparison.current.quality_score > comparison.previous.quality_score ? '#22c55e' : '#ef4444'
                          }}>
                            ({comparison.current.quality_score > comparison.previous.quality_score ? '+' : ''}
                            {(comparison.current.quality_score - comparison.previous.quality_score).toFixed(1)})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Assessment */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: comparison.improvements > comparison.regressions && comparison.resolvedIssues > comparison.newIssues
                  ? `${' #22c55e'}10`
                  : comparison.regressions > comparison.improvements || comparison.newIssues > comparison.resolvedIssues
                  ? `${'#ef4444'}10`
                  : `${currentTheme.colors.accent}10`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: comparison.improvements > comparison.regressions && comparison.resolvedIssues > comparison.newIssues
                  ? '#22c55e30'
                  : comparison.regressions > comparison.improvements || comparison.newIssues > comparison.resolvedIssues
                  ? '#ef444430'
                  : `${currentTheme.colors.accent}30`,
              }}
            >
              <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                {comparison.improvements > comparison.regressions && comparison.resolvedIssues > comparison.newIssues
                  ? '✓ Overall improvement detected'
                  : comparison.regressions > comparison.improvements || comparison.newIssues > comparison.resolvedIssues
                  ? '⚠ Potential regressions detected'
                  : 'ℹ Similar performance to previous run'}
              </p>
            </div>
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
