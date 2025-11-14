'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { ReportData } from '../lib/mockData';
import { CheckCircle2, XCircle, Clock, TrendingUp, Monitor } from 'lucide-react';

interface ReportOverviewProps {
  data: ReportData;
}

export function ReportOverview({ data }: ReportOverviewProps) {
  const { currentTheme } = useTheme();
  const { summary, testSuite, testRun } = data;

  const stats = [
    {
      label: 'Total Tests',
      value: summary.totalTests,
      icon: Monitor,
      color: currentTheme.colors.text.primary,
    },
    {
      label: 'Passed',
      value: summary.passed,
      icon: CheckCircle2,
      color: '#22c55e',
    },
    {
      label: 'Failed',
      value: summary.failed,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      label: 'Duration',
      value: summary.duration,
      icon: Clock,
      color: currentTheme.colors.accent,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <ThemedCard variant="glow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
                {testSuite.name}
              </h2>
              <p className="text-sm mb-1" style={{ color: currentTheme.colors.text.secondary }}>
                {testSuite.target_url}
              </p>
              <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                Run ID: {testRun.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Pass Rate Circle */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke={currentTheme.colors.border}
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke={summary.passRate >= 80 ? '#22c55e' : summary.passRate >= 50 ? '#eab308' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - summary.passRate / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
                    {summary.passRate.toFixed(0)}%
                  </span>
                  <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    Pass Rate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ThemedCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ThemedCard variant="bordered">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  <span className="text-sm font-medium" style={{ color: currentTheme.colors.text.secondary }}>
                    {stat.label}
                  </span>
                </div>
                <div className="text-3xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
                  {stat.value}
                </div>
              </div>
            </ThemedCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
