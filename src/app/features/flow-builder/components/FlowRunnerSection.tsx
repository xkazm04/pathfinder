'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react';
import { TestFlow } from '../lib/flowTypes';
import { executeFlowTest } from '../lib/flowExecution';

interface FlowRunnerSectionProps {
  flow: TestFlow;
  isValid: boolean;
}

type TestStatus = 'idle' | 'running' | 'passed' | 'failed';

interface ConsoleLog {
  type: 'info' | 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export function FlowRunnerSection({ flow, isValid }: FlowRunnerSectionProps) {
  const { currentTheme } = useTheme();

  const [status, setStatus] = useState<TestStatus>('idle');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);

  const canRun = isValid && flow.steps.length > 0;

  const runTest = async () => {
    if (!canRun) return;

    setStatus('running');
    setLogs([]);
    setErrors([]);
    setDuration(0);

    const startTime = Date.now();

    try {
      const result = await executeFlowTest(flow, (log) => {
        setLogs(prev => [...prev, log]);
      });

      setDuration(Date.now() - startTime);

      if (result.success) {
        setStatus('passed');
      } else {
        setStatus('failed');
        setErrors(result.errors || []);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Test execution failed';
      setStatus('failed');
      setErrors([errorMessage]);
      setDuration(Date.now() - startTime);
    }
  };

  const reset = () => {
    setStatus('idle');
    setLogs([]);
    setErrors([]);
    setDuration(0);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin" style={{ color: currentTheme.colors.primary }} />;
      case 'passed':
        return <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} />;
      case 'failed':
        return <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />;
      default:
        return <Play className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge variant="warning">Running...</Badge>;
      case 'passed':
        return <Badge variant="success">Passed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Test Runner"
        subtitle={canRun ? 'Run to validate your flow' : 'Complete configuration to run'}
        icon={getStatusIcon()}
        action={getStatusBadge()}
      />
      <ThemedCardContent>
        {/* Run Button */}
        {status === 'idle' && (
          <button
            onClick={runTest}
            disabled={!canRun}
            className="w-full px-4 py-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: canRun
                ? currentTheme.colors.primary
                : currentTheme.colors.surface,
              color: canRun
                ? '#ffffff'
                : currentTheme.colors.text.tertiary,
              opacity: canRun ? 1 : 0.6,
            }}
            data-testid="run-flow-btn"
          >
            <Play className="w-4 h-4" />
            Run Test
          </button>
        )}

        {/* Running/Results */}
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Duration */}
            {duration > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                <Clock className="w-4 h-4" />
                <span>Duration: {(duration / 1000).toFixed(2)}s</span>
              </div>
            )}

            {/* Errors Summary */}
            {errors.length > 0 && (
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: '#ef444410',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#ef444430',
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: '#ef4444' }}>
                  {errors.length} Error{errors.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-xs font-mono" style={{ color: currentTheme.colors.text.secondary }}>
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                Execution Logs
              </p>
              <div
                className="p-3 rounded font-mono text-xs space-y-1 max-h-64 overflow-y-auto"
                style={{
                  backgroundColor: currentTheme.colors.background,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
              >
                <AnimatePresence mode="popLayout">
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.3) }}
                      style={{
                        color: log.type === 'error'
                          ? '#ef4444'
                          : log.type === 'warn'
                          ? '#f59e0b'
                          : currentTheme.colors.text.secondary,
                      }}
                    >
                      [{log.type.toUpperCase()}] {log.message}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            {(status === 'passed' || status === 'failed') && (
              <div className="flex gap-2">
                <button
                  onClick={runTest}
                  className="flex-1 px-4 py-2 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: currentTheme.colors.primary + '20',
                    color: currentTheme.colors.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.primary + '40',
                  }}
                >
                  <Play className="w-4 h-4" />
                  Run Again
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded text-sm font-medium transition-all"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </motion.div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
