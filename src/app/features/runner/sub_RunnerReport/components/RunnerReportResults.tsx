'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface StepResult {
  stepIndex: number;
  stepType: string;
  status: 'pass' | 'fail' | 'skipped';
  duration_ms: number;
  message?: string;
  error?: string;
}

interface RunnerReportResultsProps {
  stepResults: StepResult[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function RunnerReportResults({ stepResults, isExpanded, onToggleExpanded }: RunnerReportResultsProps) {
  const { currentTheme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return '#22c55e';
      case 'fail':
        return '#ef4444';
      case 'skipped':
        return currentTheme.colors.text.tertiary;
      default:
        return currentTheme.colors.text.tertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'fail':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!stepResults || stepResults.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <button
        onClick={onToggleExpanded}
        className="w-full flex items-center justify-between p-3 rounded-lg mb-2 hover:bg-opacity-80 transition-colors"
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
          <span className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
            Step Results
          </span>
          <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
            ({stepResults.length} steps)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2"
          >
            {stepResults.map((step, index) => (
              <div
                key={index}
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: `${getStatusColor(step.status)}10`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `${getStatusColor(step.status)}30`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ color: getStatusColor(step.status) }}>
                      {getStatusIcon(step.status)}
                    </div>
                    <span className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                      Step {step.stepIndex + 1}: {step.stepType}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    {step.duration_ms}ms
                  </span>
                </div>
                {step.message && (
                  <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                    {step.message}
                  </p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
