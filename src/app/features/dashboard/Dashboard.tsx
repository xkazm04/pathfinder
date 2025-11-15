'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { Loader2 } from 'lucide-react';
import { StatsGrid } from './components/StatsGrid';
import { RecentTestRuns } from './components/RecentTestRuns';
import { QualityTrendsChart } from './components/QualityTrendsChart';
import { TestRunsList } from './components/TestRunsList';
import { getDashboardStats, getQualityTrends, getIssuesByCategory, type DashboardStats, type QualityTrendPoint, type IssuesByCategory } from '@/lib/supabase/dashboard';

export function Dashboard() {
  const { currentTheme, setHealthGlow } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [previousStats, setPreviousStats] = useState<DashboardStats | null>(null);
  const [qualityTrends, setQualityTrends] = useState<QualityTrendPoint[]>([]);
  const [issuesByCategory, setIssuesByCategory] = useState<IssuesByCategory[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, prevStats, trends, issues] = await Promise.all([
        getDashboardStats(30), // Current period: last 30 days
        getDashboardStats(30, 30), // Previous period: 30-60 days ago
        getQualityTrends(30),
        getIssuesByCategory(30),
      ]);

      setDashboardStats(stats);
      setPreviousStats(prevStats);
      setQualityTrends(trends);
      setIssuesByCategory(issues);

      // Calculate overall health based on pass rate
      updateHealthGlow(stats.passRate);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update health glow based on pass rate thresholds
  const updateHealthGlow = (passRate: number) => {
    if (passRate >= 90) {
      setHealthGlow('excellent'); // Green glow for 90%+
    } else if (passRate >= 70) {
      setHealthGlow('good'); // Yellow glow for 70-90%
    } else if (passRate > 0) {
      setHealthGlow('poor'); // Red glow for below 70%
    } else {
      setHealthGlow('none'); // No glow if no data
    }
  };

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
    <div className="p-8 space-y-8 dashboard-health-glow" data-testid="dashboard-container">
      {/* Stats Grid */}
      {dashboardStats && (
        <StatsGrid dashboardStats={dashboardStats} previousStats={previousStats || undefined} />
      )}

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

      {/* Recent Test Runs - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <RecentTestRuns />
      </motion.div>

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
