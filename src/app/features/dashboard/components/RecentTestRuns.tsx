'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Activity, Loader2, Clock, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import { getRecentTestRuns, type TestRunSummary } from '@/lib/supabase/dashboard';
import Link from 'next/link';

export function RecentTestRuns() {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [recentRuns, setRecentRuns] = useState<TestRunSummary[]>([]);

  useEffect(() => {
    loadRecentRuns();
  }, []);

  const loadRecentRuns = async () => {
    try {
      setLoading(true);
      const { runs } = await getRecentTestRuns(1, 20); // Fetch up to 20 runs
      setRecentRuns(runs);
    } catch (error) {
      console.error('Failed to load recent test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (run: TestRunSummary) => {
    if (run.status === 'running') return currentTheme.colors.accent;
    if (run.status === 'failed') return '#ef4444';
    if (run.passed_tests === run.total_tests) return '#22c55e';
    return '#f59e0b'; // Partial pass (amber)
  };

  const getStatusIcon = (run: TestRunSummary) => {
    if (run.status === 'running') return <PlayCircle className="w-4 h-4" />;
    if (run.status === 'failed') return <XCircle className="w-4 h-4" />;
    if (run.passed_tests === run.total_tests) return <CheckCircle2 className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '0s';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="Recent Test Runs"
          subtitle="Latest execution results"
          icon={<Activity className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: currentTheme.colors.accent }} />
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Recent Test Runs"
        subtitle="Click any run to view detailed report"
        icon={<Activity className="w-5 h-5" />}
      />
      <ThemedCardContent>
        {recentRuns.length === 0 ? (
          <div className="text-center py-12" style={{ color: currentTheme.colors.text.tertiary }}>
            No test runs yet. Start by running your first test!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3 mt-4">
            {recentRuns.map((run, index) => {
              const statusColor = getStatusColor(run);
              const StatusIcon = () => getStatusIcon(run);

              return (
                <Link key={run.id} href={`/reports/${run.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="cursor-pointer group relative"
                  >
                  {/* Card */}
                  <div
                    className="p-3 rounded-lg transition-all duration-200 h-full flex flex-col"
                    style={{
                      background: `${currentTheme.colors.surface}80`,
                      borderColor: currentTheme.colors.border,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentTheme.colors.primary;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${currentTheme.colors.primary}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = currentTheme.colors.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Status indicator - top corner */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="p-1.5 rounded-md"
                        style={{
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                        }}
                      >
                        {run.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <StatusIcon />
                        )}
                      </div>

                      {/* Time badge */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: currentTheme.colors.text.tertiary }} />
                        <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                          {formatDuration(run.duration_ms)}
                        </span>
                      </div>
                    </div>

                    {/* Test name */}
                    <p
                      className="text-sm font-medium mb-2 line-clamp-2 flex-1"
                      style={{ color: currentTheme.colors.text.primary }}
                      title={run.name}
                    >
                      {run.name}
                    </p>

                    {/* Test results */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span style={{ color: currentTheme.colors.text.secondary }}>
                        {run.passed_tests}/{run.total_tests} passed
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div
                      className="text-xs pt-2 border-t"
                      style={{
                        color: currentTheme.colors.text.tertiary,
                        borderColor: currentTheme.colors.border,
                      }}
                    >
                      {formatTimestamp(run.created_at)}
                    </div>
                  </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
