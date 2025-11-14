'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestSuiteWithCode } from '../lib/mockData';
import { Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface TestSuiteCardProps {
  suite: TestSuiteWithCode;
  onRun: (suiteId: string) => void;
  isRunning?: boolean;
}

export function TestSuiteCard({ suite, onRun, isRunning }: TestSuiteCardProps) {
  const { currentTheme } = useTheme();

  const getStatusColor = (status?: 'passed' | 'failed' | 'running') => {
    switch (status) {
      case 'passed':
        return '#22c55e';
      case 'failed':
        return '#ef4444';
      case 'running':
        return currentTheme.colors.accent;
      default:
        return currentTheme.colors.text.tertiary;
    }
  };

  const getStatusIcon = (status?: 'passed' | 'failed' | 'running') => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'running':
        return <Clock className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ThemedCard variant="bordered">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1 truncate" style={{ color: currentTheme.colors.text.primary }}>
                {suite.name}
              </h3>
              <p className="text-sm mb-2" style={{ color: currentTheme.colors.text.secondary }}>
                {suite.description || 'No description'}
              </p>
              <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                {suite.target_url}
              </p>
            </div>
            <ThemedButton
              variant="primary"
              size="sm"
              onClick={() => onRun(suite.id)}
              disabled={isRunning}
              leftIcon={<Play className="w-4 h-4" />}
            >
              {isRunning ? 'Running...' : 'Run'}
            </ThemedButton>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4"
            style={{
              borderTopWidth: '1px',
              borderTopStyle: 'solid',
              borderTopColor: currentTheme.colors.border,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span style={{ color: currentTheme.colors.text.tertiary }}>Tests: </span>
                <span className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                  {suite.testCount}
                </span>
              </div>
              {suite.lastRun && (
                <>
                  <div className="flex items-center gap-2">
                    <span style={{ color: getStatusColor(suite.lastRun.status) }}>
                      {getStatusIcon(suite.lastRun.status)}
                    </span>
                    <span className="text-sm font-medium" style={{ color: getStatusColor(suite.lastRun.status) }}>
                      {suite.lastRun.status === 'passed' ? 'Passed' : suite.lastRun.status === 'failed' ? 'Failed' : 'Running'}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    {suite.lastRun.timestamp} • {suite.lastRun.duration}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ThemedCard>
    </motion.div>
  );
}
