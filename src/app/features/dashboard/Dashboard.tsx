'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Activity, Loader2, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { RecentTestItem } from './components/RecentTestItem';
import { QuickActionsCard } from './components/QuickActionsCard';
import { QualityTrendsChart } from './components/QualityTrendsChart';
import { TestRunsList } from './components/TestRunsList';
import { getDashboardStats, getRecentTestRuns, getQualityTrends, getIssuesByCategory, type TestRunSummary, type DashboardStats, type QualityTrendPoint, type IssuesByCategory } from '@/lib/supabase/dashboard';

export function Dashboard() {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<TestRunSummary[]>([]);
  const [qualityTrends, setQualityTrends] = useState<QualityTrendPoint[]>([]);
  const [issuesByCategory, setIssuesByCategory] = useState<IssuesByCategory[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, runs, trends, issues] = await Promise.all([
        getDashboardStats(30),
        getRecentTestRuns(1, 5),
        getQualityTrends(30),
        getIssuesByCategory(30),
      ]);

      setDashboardStats(stats);
      setRecentRuns(runs.runs);
      setQualityTrends(trends);
      setIssuesByCategory(issues);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert dashboard stats to stat card format
  const stats = dashboardStats ? [
    {
      label: 'Total Tests',
      value: dashboardStats.totalTests.toString(),
      trend: '+12%',
      trendValue: 12,
      isPositive: true,
      icon: Activity,
    },
    {
      label: 'Pass Rate',
      value: `${dashboardStats.passRate.toFixed(1)}%`,
      trend: '+5.2%',
      trendValue: dashboardStats.passRate,
      isPositive: true,
      icon: CheckCircle2,
    },
    {
      label: 'Issues Found',
      value: dashboardStats.totalIssues.toString(),
      trend: '-8%',
      trendValue: 8,
      isPositive: true, // Fewer issues is positive
      icon: AlertCircle,
    },
    {
      label: 'Coverage',
      value: `${dashboardStats.coverage}%`,
      trend: '+2%',
      trendValue: dashboardStats.coverage,
      isPositive: true,
      icon: Target,
    },
  ] : [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: currentTheme.colors.accent }} />
          <p style={{ color: currentTheme.colors.text.secondary }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
          Welcome to Pathfinder
        </h1>
        <p className="text-lg" style={{ color: currentTheme.colors.text.tertiary }}>
          AI-powered test automation platform
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      {/* Quality Trends Chart */}
      {qualityTrends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <QualityTrendsChart trends={qualityTrends} issuesByCategory={issuesByCategory} />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tests */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ThemedCard variant="bordered">
            <ThemedCardHeader
              title="Recent Test Runs"
              subtitle="Latest execution results"
              icon={<Activity className="w-5 h-5" />}
            />
            <ThemedCardContent>
              <div className="space-y-3 mt-4">
                {recentRuns.length === 0 ? (
                  <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
                    No test runs yet. Start by running your first test!
                  </div>
                ) : (
                  recentRuns.map((run, index) => (
                    <RecentTestItem
                      key={run.id}
                      test={{
                        name: run.name,
                        status: run.status === 'completed'
                          ? (run.passed_tests === run.total_tests ? 'pass' : 'fail')
                          : run.status === 'failed' ? 'fail' : 'running',
                        duration: run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '0s',
                        timestamp: new Date(run.created_at).toLocaleString(),
                        viewport: 'Multiple',
                      }}
                      index={index}
                    />
                  ))
                )}
              </div>
            </ThemedCardContent>
          </ThemedCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-6"
        >
          <QuickActionsCard />

          {/* Dashboard Stats Card */}
          {dashboardStats && (
            <ThemedCard variant="bordered">
              <ThemedCardHeader
                title="30-Day Overview"
                subtitle="Recent performance"
              />
              <ThemedCardContent>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Test Runs
                    </span>
                    <span className="text-lg font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                      {dashboardStats.recentTestRuns}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Avg Quality Score
                    </span>
                    <span className="text-lg font-semibold" style={{ color: currentTheme.colors.accent }}>
                      {dashboardStats.avgQualityScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                      Total Issues
                    </span>
                    <span className="text-lg font-semibold" style={{ color: '#ef4444' }}>
                      {dashboardStats.totalIssues}
                    </span>
                  </div>
                </div>
              </ThemedCardContent>
            </ThemedCard>
          )}
        </motion.div>
      </div>

      {/* Full Test Runs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <TestRunsList />
      </motion.div>
    </div>
  );
}
