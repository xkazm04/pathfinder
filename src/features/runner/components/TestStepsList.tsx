'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { TestExecutionStep } from '../lib/mockData';
import { formatDuration } from '../lib/testExecution';
import { CheckCircle2, XCircle, Loader2, Clock, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TestStepsListProps {
  steps: TestExecutionStep[];
}

/**
 * UI Improvement 2: Detailed test step visualization
 * - Auto-scrolls to currently running test
 * - Shows status icons with animations
 * - Displays execution time for each step
 * - Groups by viewport with icons
 * - Error messages for failed tests
 * - Smooth transitions between states
 */
export function TestStepsList({ steps }: TestStepsListProps) {
  const { currentTheme } = useTheme();
  const [autoScroll, setAutoScroll] = useState(true);
  const runningStepRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to running step
  useEffect(() => {
    if (autoScroll && runningStepRef.current) {
      runningStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [steps, autoScroll]);

  const getStatusIcon = (status: TestExecutionStep['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />;
      case 'failed':
        return <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />;
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin" style={{ color: currentTheme.colors.accent }} />;
      case 'skipped':
        return <Clock className="w-5 h-5" style={{ color: currentTheme.colors.text.tertiary }} />;
      default:
        return <Clock className="w-5 h-5" style={{ color: currentTheme.colors.text.tertiary }} />;
    }
  };

  const getViewportIcon = (viewport: string) => {
    if (viewport.includes('Desktop')) {
      return <Monitor className="w-4 h-4" />;
    }
    if (viewport.includes('iPad') || viewport.includes('Tablet')) {
      return <Tablet className="w-4 h-4" />;
    }
    return <Smartphone className="w-4 h-4" />;
  };

  const getStatusColor = (status: TestExecutionStep['status']) => {
    switch (status) {
      case 'passed':
        return '#22c55e';
      case 'failed':
        return '#ef4444';
      case 'running':
        return currentTheme.colors.accent;
      case 'skipped':
        return currentTheme.colors.text.tertiary;
      default:
        return currentTheme.colors.border;
    }
  };

  const getBackgroundColor = (status: TestExecutionStep['status']) => {
    switch (status) {
      case 'passed':
        return '#22c55e08';
      case 'failed':
        return '#ef444408';
      case 'running':
        return `${currentTheme.colors.accent}08`;
      default:
        return 'transparent';
    }
  };

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Test Execution Details"
        subtitle="Real-time step-by-step progress"
        icon={<Loader2 className="w-5 h-5" />}
        action={
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="text-xs px-3 py-1 rounded transition-colors"
            style={{
              backgroundColor: autoScroll ? currentTheme.colors.primary : currentTheme.colors.surface,
              color: autoScroll ? '#ffffff' : currentTheme.colors.text.secondary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
            }}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
        }
      />
      <ThemedCardContent>
        <div className="mt-4 max-h-[600px] overflow-y-auto space-y-2">
          <AnimatePresence mode="popLayout">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                ref={step.status === 'running' ? runningStepRef : null}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
                className="rounded-lg p-4 transition-all"
                style={{
                  backgroundColor: getBackgroundColor(step.status),
                  borderLeftWidth: '3px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: getStatusColor(step.status),
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: step.status === 'running' ? currentTheme.colors.borderHover : currentTheme.colors.border,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <motion.div
                    className="flex-shrink-0 mt-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    {getStatusIcon(step.status)}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {/* Test Name */}
                      <h4
                        className="text-sm font-medium"
                        style={{ color: currentTheme.colors.text.primary }}
                      >
                        {step.name}
                      </h4>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-3 mt-2">
                      {/* Viewport */}
                      <div className="flex items-center gap-1" style={{ color: currentTheme.colors.text.tertiary }}>
                        {getViewportIcon(step.viewport)}
                        <span className="text-xs">{step.viewport}</span>
                      </div>

                      {/* Duration */}
                      {step.duration !== undefined && (
                        <div className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                          {formatDuration(step.duration)}
                        </div>
                      )}

                      {/* Status Badge */}
                      <div
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${getStatusColor(step.status)}20`,
                          color: getStatusColor(step.status),
                        }}
                      >
                        {step.status}
                      </div>
                    </div>

                    {/* Error Message */}
                    {step.error && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 p-2 rounded text-xs font-mono"
                        style={{
                          backgroundColor: '#ef444410',
                          color: '#ef4444',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: '#ef444430',
                        }}
                      >
                        {step.error}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Running Animation */}
                {step.status === 'running' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: currentTheme.colors.accent }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
