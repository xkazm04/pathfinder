'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Activity } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { RecentTestItem } from './components/RecentTestItem';
import { QuickActionsCard } from './components/QuickActionsCard';
import { stats, recentTests } from './lib/mockData';

export function Dashboard() {
  const { currentTheme } = useTheme();

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
              action={
                <ThemedButton variant="ghost" size="sm">
                  View All
                </ThemedButton>
              }
            />
            <ThemedCardContent>
              <div className="space-y-3 mt-4">
                {recentTests.map((test, index) => (
                  <RecentTestItem key={`${test.name}-${index}`} test={test} index={index} />
                ))}
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

          {/* Current Theme Info */}
          <ThemedCard variant="bordered">
            <ThemedCardHeader
              title="Current Theme"
              subtitle={currentTheme.description}
            />
            <ThemedCardContent>
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Primary', color: currentTheme.colors.primary },
                  { label: 'Secondary', color: currentTheme.colors.secondary },
                  { label: 'Accent', color: currentTheme.colors.accent },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{
                        background: item.color,
                        borderColor: currentTheme.colors.border,
                      }}
                    />
                    <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </ThemedCardContent>
          </ThemedCard>
        </motion.div>
      </div>
    </div>
  );
}
