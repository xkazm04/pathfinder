'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestRun } from '@/lib/types';
import { getTestRuns } from '@/lib/supabase/testRuns';
import { History, Play, Eye, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDuration } from '../lib/testExecution';

interface RunHistoryPanelProps {
  suiteId?: string;
  onRelaunch?: (runId: string) => void;
  onViewDetails?: (runId: string) => void;
}

interface RunWithDuration extends TestRun {
  duration_ms?: number;
}

// Helper functions for status display
function getStatusIcon(status: string) {
  const icons = {
    completed: CheckCircle2,
    failed: XCircle,
    running: Loader2,
    default: Clock,
  };
  const Icon = icons[status as keyof typeof icons] || icons.default;
  const className = status === 'running' ? 'animate-spin' : '';
  return <Icon className={`w-4 h-4 ${className}`} />;
}

function getStatusColor(status: string, themeColors: { accent: string; text: { tertiary: string } }) {
  const colors = {
    completed: '#22c55e',
    failed: '#ef4444',
    running: themeColors.accent,
    default: themeColors.text.tertiary,
  };
  return colors[status as keyof typeof colors] || colors.default;
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function RunHistoryPanel({ suiteId, onRelaunch, onViewDetails }: RunHistoryPanelProps) {
  const { currentTheme } = useTheme();
  const [runs, setRuns] = useState<RunWithDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRunHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suiteId]);

  const loadRunHistory = async () => {
    try {
      setLoading(true);
      const data = await getTestRuns(suiteId);

      // Calculate duration for each run
      const runsWithDuration = data.map(run => ({
        ...run,
        duration_ms: run.started_at && run.completed_at
          ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
          : undefined,
      }));

      setRuns(runsWithDuration);
    } catch {
      // Error loading run history - silently handle
    } finally {
      setLoading(false);
    }
  };

  const getSortedRuns = () => {
    const sorted = [...runs].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'duration':
          comparison = (a.duration_ms || 0) - (b.duration_ms || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const toggleSort = (field: 'date' | 'status' | 'duration') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedRuns = getSortedRuns();

  return (
    <ThemedCard variant="glow">
      <ThemedCardHeader
        title="Run History"
        subtitle={`${runs.length} test runs`}
        icon={<History className="w-5 h-5" />}
      />
      <ThemedCardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: currentTheme.colors.primary }}
            />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12">
            <History
              className="w-12 h-12 mx-auto mb-3 opacity-30"
              style={{ color: currentTheme.colors.text.tertiary }}
            />
            <p style={{ color: currentTheme.colors.text.tertiary }}>
              No test runs yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Sort Controls */}
            <div className="flex gap-2 pb-3 border-b" style={{ borderColor: currentTheme.colors.border }}>
              <ThemedButton
                variant={sortBy === 'date' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => toggleSort('date')}
                data-testid="sort-by-date-btn"
              >
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </ThemedButton>
              <ThemedButton
                variant={sortBy === 'status' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => toggleSort('status')}
                data-testid="sort-by-status-btn"
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </ThemedButton>
              <ThemedButton
                variant={sortBy === 'duration' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => toggleSort('duration')}
                data-testid="sort-by-duration-btn"
              >
                Duration {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </ThemedButton>
            </div>

            {/* Run List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedRuns.map((run, index) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="p-3 rounded-lg cursor-pointer transition-transform"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                  onClick={() => onViewDetails?.(run.id)}
                  data-testid={`run-history-item-${run.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: getStatusColor(run.status, currentTheme.colors) }}>
                        {getStatusIcon(run.status)}
                      </span>
                      <span
                        className="text-sm font-medium capitalize"
                        style={{ color: getStatusColor(run.status, currentTheme.colors) }}
                      >
                        {run.status}
                      </span>
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: currentTheme.colors.text.tertiary }}
                    >
                      {formatRelativeDate(run.created_at)}
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  {run.duration_ms !== undefined && (
                    <div className="mb-2">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${currentTheme.colors.border}50` }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: run.status === 'completed' || run.status === 'failed' ? '100%' : '50%',
                            backgroundColor: getStatusColor(run.status, currentTheme.colors),
                            opacity: 0.6,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" style={{ color: currentTheme.colors.text.tertiary }} />
                      <span
                        className="text-xs"
                        style={{ color: currentTheme.colors.text.secondary }}
                      >
                        {run.duration_ms
                          ? formatDuration(run.duration_ms)
                          : 'In progress...'
                        }
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRelaunch?.(run.id);
                        }}
                        className="p-1.5 rounded hover:bg-opacity-20 transition-colors"
                        style={{
                          backgroundColor: `${currentTheme.colors.primary}10`,
                          color: currentTheme.colors.primary
                        }}
                        title="Relaunch test"
                        data-testid={`relaunch-run-btn-${run.id}`}
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(run.id);
                        }}
                        className="p-1.5 rounded hover:bg-opacity-20 transition-colors"
                        style={{
                          backgroundColor: `${currentTheme.colors.accent}10`,
                          color: currentTheme.colors.accent
                        }}
                        title="View details"
                        data-testid={`view-details-btn-${run.id}`}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
