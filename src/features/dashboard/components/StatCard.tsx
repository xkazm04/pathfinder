'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader } from '@/components/ui/ThemedCard';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatData } from '../lib/mockData';

interface StatCardProps {
  stat: StatData;
  index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
  const { currentTheme } = useTheme();
  const Icon = stat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <ThemedCard variant="glow" hoverable>
        <ThemedCardHeader icon={<Icon className="w-5 h-5" />} />
        <div className="mt-2">
          <p className="text-3xl font-bold" style={{ color: currentTheme.colors.text.primary }}>
            {stat.value}
          </p>
          <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
            {stat.label}
          </p>

          {/* UI Improvement 1: Trend with icon and progress bar */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1">
              {stat.isPositive ? (
                <TrendingUp className="w-3 h-3" style={{ color: currentTheme.colors.accent }} />
              ) : (
                <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />
              )}
              <span className="text-xs font-medium" style={{ color: currentTheme.colors.accent }}>
                {stat.trend}
              </span>
            </div>

            {/* Animated progress bar */}
            <div className="relative h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${currentTheme.colors.border}40` }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${currentTheme.colors.primary}, ${currentTheme.colors.accent})`,
                  boxShadow: `0 0 4px ${currentTheme.colors.accent}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stat.trendValue, 100)}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </ThemedCard>
    </motion.div>
  );
}
