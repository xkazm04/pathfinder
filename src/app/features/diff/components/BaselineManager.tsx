'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import {
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Calendar,
  FileText,
} from 'lucide-react';

interface BaselineInfo {
  baselineRunId: string | null;
  setAt: string | null;
  notes: string | null;
}

interface TestRun {
  id: string;
  name: string;
  created_at: string;
  status: string;
  total_tests: number;
  passed_tests: number;
}

interface BaselineManagerProps {
  suiteId: string;
  suiteName: string;
  onBaselineChanged?: () => void;
}

/**
 * Baseline Manager for setting and managing visual regression baselines
 * Features:
 * - View current baseline info
 * - Select test run as baseline
 * - Add notes to baseline
 * - Clear baseline
 * - View baseline statistics
 */
export function BaselineManager({
  suiteId,
  suiteName,
  onBaselineChanged,
}: BaselineManagerProps) {
  const { currentTheme } = useTheme();
  const [baseline, setBaseline] = useState<BaselineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showSetBaseline, setShowSetBaseline] = useState(false);

  useEffect(() => {
    loadBaseline();
  }, [suiteId]);

  const loadBaseline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/diff/baselines?suiteId=${suiteId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load baseline');
      }

      if (data.hasBaseline) {
        setBaseline(data.baseline);
      } else {
        setBaseline(null);
      }
    } catch (err: any) {
      console.error('Failed to load baseline:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTestRuns = async () => {
    try {
      setLoadingRuns(true);

      // This would call an actual test runs API
      // For now, we'll show a placeholder
      // const response = await fetch(`/api/test-runs?suiteId=${suiteId}`);
      // const data = await response.json();
      // setTestRuns(data.runs || []);

      // Mock data for now
      setTestRuns([]);
    } catch (err: any) {
      console.error('Failed to load test runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleSetBaseline = async () => {
    if (!selectedRunId) {
      alert('Please select a test run');
      return;
    }

    try {
      const response = await fetch('/api/diff/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suiteId,
          runId: selectedRunId,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set baseline');
      }

      alert('Baseline set successfully!');
      setShowSetBaseline(false);
      setSelectedRunId('');
      setNotes('');
      await loadBaseline();
      onBaselineChanged?.();
    } catch (err: any) {
      console.error('Failed to set baseline:', err);
      alert(err.message);
    }
  };

  const handleClearBaseline = async () => {
    if (!confirm('Are you sure you want to clear the baseline? This will stop visual regression checks until a new baseline is set.')) {
      return;
    }

    try {
      const response = await fetch(`/api/diff/baselines?suiteId=${suiteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear baseline');
      }

      alert('Baseline cleared successfully!');
      await loadBaseline();
      onBaselineChanged?.();
    } catch (err: any) {
      console.error('Failed to clear baseline:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  if (error) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#ef4444' }} />
            <p className="text-lg font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Failed to load baseline
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
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="Baseline Management"
          subtitle={suiteName}
          icon={<Bookmark className="w-5 h-5" />}
          action={
            !showSetBaseline && (
              <button
                onClick={() => {
                  setShowSetBaseline(true);
                  loadTestRuns();
                }}
                className="px-4 py-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: '#ffffff',
                }}
              >
                {baseline ? 'Update Baseline' : 'Set Baseline'}
              </button>
            )
          }
        />
        <ThemedCardContent>
          {/* Current Baseline Info */}
          {baseline && !showSetBaseline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: '#22c55e10',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#22c55e30',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#22c55e' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                        Baseline is set
                      </p>
                      <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                        Visual regression detection is active for this suite
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 shrink-0 mt-0.5" style={{ color: currentTheme.colors.text.tertiary }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                      Set on
                    </p>
                    <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      {baseline.setAt ? new Date(baseline.setAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Bookmark className="w-5 h-5 shrink-0 mt-0.5" style={{ color: currentTheme.colors.text.tertiary }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                      Baseline Run ID
                    </p>
                    <p className="text-xs font-mono" style={{ color: currentTheme.colors.text.secondary }}>
                      {baseline.baselineRunId}
                    </p>
                  </div>
                </div>

                {baseline.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 shrink-0 mt-0.5" style={{ color: currentTheme.colors.text.tertiary }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                        Notes
                      </p>
                      <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                        {baseline.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={handleClearBaseline}
                  className="px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: '#ef444410',
                    color: '#ef4444',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#ef444430',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Baseline
                </button>
              </div>
            </motion.div>
          )}

          {/* No Baseline Set */}
          {!baseline && !showSetBaseline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-8"
            >
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#f59e0b' }} />
              <p className="text-lg font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                No baseline set
              </p>
              <p className="text-sm mb-6" style={{ color: currentTheme.colors.text.secondary }}>
                Set a baseline to enable visual regression detection for this test suite
              </p>
              <button
                onClick={() => {
                  setShowSetBaseline(true);
                  loadTestRuns();
                }}
                className="px-6 py-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  color: '#ffffff',
                }}
              >
                Set Baseline
              </button>
            </motion.div>
          )}

          {/* Set Baseline Form */}
          {showSetBaseline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  Select Test Run
                </label>
                <select
                  value={selectedRunId}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="w-full px-4 py-2 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <option value="">Select a test run...</option>
                  {testRuns.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.name} - {new Date(run.created_at).toLocaleDateString()} (
                      {run.passed_tests}/{run.total_tests} passed)
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Enter a test run ID manually if it's not in the list above
                </p>
                <input
                  type="text"
                  placeholder="Or enter test run ID manually..."
                  value={selectedRunId}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="w-full px-4 py-2 rounded text-sm mt-2"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this baseline (e.g., version, features included, etc.)"
                  rows={3}
                  className="w-full px-4 py-2 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSetBaseline}
                  className="px-6 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: currentTheme.colors.primary,
                    color: '#ffffff',
                  }}
                >
                  Set as Baseline
                </button>
                <button
                  onClick={() => {
                    setShowSetBaseline(false);
                    setSelectedRunId('');
                    setNotes('');
                  }}
                  className="px-6 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </ThemedCardContent>
      </ThemedCard>

      {/* Instructions */}
      <ThemedCard variant="bordered">
        <ThemedCardHeader
          title="How Baselines Work"
          icon={<FileText className="w-5 h-5" />}
        />
        <ThemedCardContent>
          <div className="space-y-3 text-sm" style={{ color: currentTheme.colors.text.secondary }}>
            <p>
              <strong style={{ color: currentTheme.colors.text.primary }}>1. Set a Baseline:</strong> Choose a test run with passing tests as your baseline reference.
            </p>
            <p>
              <strong style={{ color: currentTheme.colors.text.primary }}>2. Run New Tests:</strong> Future test runs will automatically compare screenshots against the baseline.
            </p>
            <p>
              <strong style={{ color: currentTheme.colors.text.primary }}>3. Review Differences:</strong> Any visual changes will be flagged for review in the Regression Dashboard.
            </p>
            <p>
              <strong style={{ color: currentTheme.colors.text.primary }}>4. Update as Needed:</strong> Update the baseline when you intentionally change the UI.
            </p>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    </div>
  );
}
