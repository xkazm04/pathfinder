'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Eye, Loader2 } from 'lucide-react';
import { RecentTest } from '../lib/mockData';

interface RecentTestItemProps {
  test: RecentTest;
  index: number;
}

export function RecentTestItem({ test, index }: RecentTestItemProps) {
  const { currentTheme } = useTheme();

  const getStatusColor = () => {
    switch (test.status) {
      case 'pass':
        return '#22c55e';
      case 'fail':
        return '#ef4444';
      case 'running':
        return currentTheme.colors.accent;
      default:
        return currentTheme.colors.text.tertiary;
    }
  };

  const getStatusText = () => {
    switch (test.status) {
      case 'pass':
        return 'Passed';
      case 'fail':
        return 'Failed';
      case 'running':
        return 'Running';
      default:
        return 'Unknown';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
      className="flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.01]"
      style={{
        background: `${currentTheme.colors.surface}80`,
        borderColor: currentTheme.colors.border,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Status Indicator */}
        <div className="relative">
          {test.status === 'running' ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: getStatusColor() }} />
          ) : (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: getStatusColor(),
                boxShadow: `0 0 8px ${getStatusColor()}`,
              }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: currentTheme.colors.text.primary }}>
            {test.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
              {test.viewport} • {test.duration}
            </p>

            {/* UI Improvement 2: Time-elapsed badge */}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${currentTheme.colors.primary}15`,
                color: currentTheme.colors.text.secondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `${currentTheme.colors.primary}30`,
              }}
            >
              {test.timestamp}
            </span>

            {/* Status badge */}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${getStatusColor()}15`,
                color: getStatusColor(),
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `${getStatusColor()}30`,
              }}
            >
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <ThemedButton
        variant="ghost"
        size="sm"
        leftIcon={<Eye className="w-3 h-3" />}
        disabled={test.status === 'running'}
      >
        Details
      </ThemedButton>
    </motion.div>
  );
}
