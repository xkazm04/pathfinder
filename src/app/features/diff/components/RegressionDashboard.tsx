'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { DiffViewer } from './DiffViewer';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  Eye,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface Regression {
  id: string;
  testName: string;
  viewport: string;
  stepName?: string;
  baselineScreenshotUrl: string;
  currentScreenshotUrl: string;
  diffScreenshotUrl?: string;
  pixelsDifferent: number;
  percentageDifferent: number;
  dimensions: { width: number; height: number };
  threshold: number;
  isSignificant: boolean;
  status: 'pending' | 'approved' | 'bug_reported' | 'investigating' | 'false_positive';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

interface RegressionDashboardProps {
  testRunId: string;
  suiteId?: string;
}

/**
 * Regression Dashboard for reviewing all visual differences
 * Features:
 * - Filter by status and significance
 * - Search by test name
 * - Sort by difference percentage
 * - Expand/collapse individual regressions
 * - Batch review actions
 * - Statistics summary
 */
export function RegressionDashboard({ testRunId, suiteId }: RegressionDashboardProps) {
  const { currentTheme } = useTheme();
  const [regressions, setRegressions] = useState<Regression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSignificant, setFilterSignificant] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'percentage' | 'testName'>('percentage');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRegressions();
  }, [testRunId, filterStatus, filterSignificant]);

  const loadRegressions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ testRunId });
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterSignificant !== 'all') {
        params.append('isSignificant', filterSignificant);
      }

      const response = await fetch(`/api/diff/regressions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load regressions');
      }

      setRegressions(data.regressions || []);
    } catch (err: any) {
      console.error('Failed to load regressions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    regressionId: string,
    status: 'approved' | 'bug_reported' | 'investigating' | 'false_positive'
  ) => {
    try {
      const response = await fetch('/api/diff/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regressionId,
          status,
          reviewedBy: 'Current User', // Replace with actual user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update regression status');
      }

      // Refresh the list
      await loadRegressions();
    } catch (err: any) {
      console.error('Failed to review regression:', err);
      alert(err.message);
    }
  };

  const handleBulkReview = async (
    status: 'approved' | 'bug_reported' | 'investigating' | 'false_positive'
  ) => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => handleReview(id, status))
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Bulk review failed:', err);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleSelected = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredRegressions = regressions
    .filter((r) =>
      searchQuery
        ? r.testName.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (sortBy === 'percentage') {
        return b.percentageDifferent - a.percentageDifferent;
      }
      return a.testName.localeCompare(b.testName);
    });

  const stats = {
    total: regressions.length,
    significant: regressions.filter((r) => r.isSignificant).length,
    pending: regressions.filter((r) => r.status === 'pending').length,
    approved: regressions.filter((r) => r.status === 'approved').length,
    bugs: regressions.filter((r) => r.status === 'bug_reported').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#22c55e';
      case 'bug_reported':
        return '#ef4444';
      case 'investigating':
        return '#f59e0b';
      case 'false_positive':
        return '#6b7280';
      default:
        return currentTheme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'bug_reported':
        return <AlertTriangle className="w-4 h-4" />;
      case 'investigating':
        return <Eye className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#ef4444' }} />
            <p className="text-lg font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Failed to load regressions
            </p>
            <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              {error}
            </p>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <ThemedCard variant="bordered">
          <ThemedCardContent>
            <div className="text-center p-4">
              <p className="text-3xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
                {stats.total}
              </p>
              <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                Total Comparisons
              </p>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard variant="bordered">
          <ThemedCardContent>
            <div className="text-center p-4">
              <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                {stats.significant}
              </p>
              <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                Significant
              </p>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard variant="bordered">
          <ThemedCardContent>
            <div className="text-center p-4">
              <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
                {stats.pending}
              </p>
              <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                Pending Review
              </p>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard variant="bordered">
          <ThemedCardContent>
            <div className="text-center p-4">
              <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>
                {stats.approved}
              </p>
              <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                Approved
              </p>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard variant="bordered">
          <ThemedCardContent>
            <div className="text-center p-4">
              <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
                {stats.bugs}
              </p>
              <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                Bugs Reported
              </p>
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Filters and Actions */}
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="Visual Regressions"
          subtitle={`${filteredRegressions.length} comparison${filteredRegressions.length !== 1 ? 's' : ''}`}
          icon={<Filter className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: currentTheme.colors.text.tertiary }}
                />
                <input
                  type="text"
                  placeholder="Search test name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="bug_reported">Bug Reported</option>
              <option value="investigating">Investigating</option>
              <option value="false_positive">False Positive</option>
            </select>

            {/* Significance Filter */}
            <select
              value={filterSignificant}
              onChange={(e) => setFilterSignificant(e.target.value)}
              className="px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              <option value="all">All Diffs</option>
              <option value="true">Significant Only</option>
              <option value="false">Minor Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'percentage' | 'testName')}
              className="px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              <option value="percentage">Sort by Difference</option>
              <option value="testName">Sort by Test Name</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: currentTheme.colors.accent + '20',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.accent,
              }}
            >
              <span className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => handleBulkReview('approved')}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
              >
                Approve All
              </button>
              <button
                onClick={() => handleBulkReview('bug_reported')}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
              >
                Report as Bugs
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs px-3 py-1 rounded transition-colors"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.secondary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
              >
                Clear Selection
              </button>
            </motion.div>
          )}
        </ThemedCardContent>
      </ThemedCard>

      {/* Regressions List */}
      <div className="space-y-4">
        {filteredRegressions.length === 0 && (
          <ThemedCard variant="bordered">
            <ThemedCardContent>
              <div className="text-center p-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#22c55e' }} />
                <p className="text-lg font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  No regressions found
                </p>
                <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                  All screenshots match the baseline
                </p>
              </div>
            </ThemedCardContent>
          </ThemedCard>
        )}

        {filteredRegressions.map((regression) => (
          <div key={regression.id}>
            <ThemedCard variant="bordered">
              <ThemedCardContent>
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(regression.id)}
                    onChange={() => toggleSelected(regression.id)}
                    className="w-4 h-4"
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                        {regression.testName}
                      </h3>
                      <Badge variant="secondary">{regression.viewport}</Badge>
                      {regression.stepName && <Badge variant="outline">{regression.stepName}</Badge>}
                      {regression.isSignificant && (
                        <Badge variant="error">Significant</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                        {regression.pixelsDifferent.toLocaleString()} pixels ({regression.percentageDifferent.toFixed(2)}%)
                      </span>
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: getStatusColor(regression.status) }}
                      >
                        {getStatusIcon(regression.status)}
                        {regression.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => toggleExpanded(regression.id)}
                    className="px-4 py-2 rounded text-sm transition-colors"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    {expandedIds.has(regression.id) ? 'Collapse' : 'View Details'}
                  </button>
                </div>
              </ThemedCardContent>
            </ThemedCard>

            {/* Expanded View */}
            {expandedIds.has(regression.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <DiffViewer
                  baselineUrl={regression.baselineScreenshotUrl}
                  currentUrl={regression.currentScreenshotUrl}
                  diffUrl={regression.diffScreenshotUrl}
                  testName={regression.testName}
                  viewport={regression.viewport}
                  pixelsDifferent={regression.pixelsDifferent}
                  percentageDifferent={regression.percentageDifferent}
                  isSignificant={regression.isSignificant}
                  threshold={regression.threshold}
                  dimensions={regression.dimensions}
                  onReview={(status) => handleReview(regression.id, status)}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
