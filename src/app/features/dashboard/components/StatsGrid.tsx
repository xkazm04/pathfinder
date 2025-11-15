'use client';

import { Activity, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import { StatCard } from './StatCard';
import type { DashboardStats } from '@/lib/supabase/dashboard';

interface StatsGridProps {
  dashboardStats: DashboardStats;
  previousStats?: DashboardStats;
}

export function StatsGrid({ dashboardStats, previousStats }: StatsGridProps) {
  // Calculate trend percentages by comparing with previous period
  const calculateTrend = (current: number, previous: number): { trend: string; trendValue: number; isPositive: boolean } => {
    if (previous === 0) {
      return { trend: 'N/A', trendValue: 0, isPositive: true };
    }
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    return {
      trend: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      trendValue: Math.abs(change),
      isPositive,
    };
  };

  // Calculate trends for each stat
  const totalTestsTrend = previousStats
    ? calculateTrend(dashboardStats.totalTests, previousStats.totalTests)
    : { trend: 'N/A', trendValue: 0, isPositive: true };

  const passRateTrend = previousStats
    ? calculateTrend(dashboardStats.passRate, previousStats.passRate)
    : { trend: 'N/A', trendValue: 0, isPositive: true };

  const issuesTrend = previousStats
    ? calculateTrend(dashboardStats.totalIssues, previousStats.totalIssues)
    : { trend: 'N/A', trendValue: 0, isPositive: true };

  const coverageTrend = previousStats
    ? calculateTrend(dashboardStats.coverage, previousStats.coverage)
    : { trend: 'N/A', trendValue: 0, isPositive: true };

  const stats = [
    {
      label: 'Total Tests',
      value: dashboardStats.totalTests.toString(),
      trend: totalTestsTrend.trend,
      trendValue: totalTestsTrend.trendValue,
      isPositive: totalTestsTrend.isPositive,
      icon: Activity,
    },
    {
      label: 'Pass Rate',
      value: `${dashboardStats.passRate.toFixed(1)}%`,
      trend: passRateTrend.trend,
      trendValue: passRateTrend.trendValue,
      isPositive: passRateTrend.isPositive,
      icon: CheckCircle2,
    },
    {
      label: 'Issues Found',
      value: dashboardStats.totalIssues.toString(),
      trend: issuesTrend.trend,
      trendValue: issuesTrend.trendValue,
      isPositive: !issuesTrend.isPositive, // Inverted: fewer issues is positive
      icon: AlertCircle,
    },
    {
      label: 'Coverage',
      value: `${dashboardStats.coverage}%`,
      trend: coverageTrend.trend,
      trendValue: coverageTrend.trendValue,
      isPositive: coverageTrend.isPositive,
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} stat={stat} index={index} />
      ))}
    </div>
  );
}
