'use client';

import { useTheme } from '@/lib/stores/appStore';
import type { TestStep } from '@/lib/stores/testBuilderStore';
import { motion } from 'framer-motion';

interface StepsListProps {
  steps: TestStep[];
  selectedStepId?: string | null;
  onStepClick?: (stepId: string) => void;
}

export function StepsList({ steps, selectedStepId, onStepClick }: StepsListProps) {
  const { currentTheme } = useTheme();

  if (steps.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
        No steps yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onStepClick?.(step.id)}
          className={`p-3 rounded flex items-start gap-3 transition-all ${
            onStepClick ? 'cursor-pointer hover:scale-[1.02]' : ''
          }`}
          style={{
            backgroundColor: selectedStepId === step.id
              ? currentTheme.colors.primary + '20'
              : step.isAmbiguous
              ? '#f59e0b10'
              : currentTheme.colors.surface,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: selectedStepId === step.id
              ? currentTheme.colors.primary
              : step.isAmbiguous
              ? '#f59e0b30'
              : currentTheme.colors.border,
          }}
        >
          <span
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
            style={{
              backgroundColor: currentTheme.colors.primary + '20',
              color: currentTheme.colors.primary,
            }}
          >
            {step.order}
          </span>
          <div className="flex-1">
            <p className="text-sm" style={{ color: currentTheme.colors.text.primary }}>
              {step.action} {step.target && `→ "${step.target}"`}
            </p>
            {step.clarification && (
              <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                ⚠️ {step.clarification}
              </p>
            )}
            {step.description && step.description !== step.action && (
              <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                {step.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
