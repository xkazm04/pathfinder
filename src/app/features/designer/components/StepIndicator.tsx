'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { currentTheme } = useTheme();

  const getCurrentIndex = () => steps.findIndex(s => s.id === currentStep);
  const currentIndex = getCurrentIndex();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Base Line (subtle) */}
        <div
          className="absolute top-5 left-0 right-0 h-0.5 -z-10"
          style={{ backgroundColor: `${currentTheme.colors.border}20` }}
        />

        {/* Connecting Lines Between Accomplished Steps */}
        <div className="absolute top-5 left-0 right-0 h-0.5 -z-10 flex items-center justify-between">
          {steps.map((step, index) => {
            if (index === steps.length - 1) return null;

            const isCompleted = index < currentIndex;
            const nextIsCompleted = index + 1 < currentIndex;
            const showLine = isCompleted && nextIsCompleted;

            return (
              <motion.div
                key={`line-${step.id}`}
                className="h-0.5"
                style={{
                  flex: 1,
                  backgroundColor: showLine ? '#9ca3af' : 'transparent',
                  marginLeft: index === 0 ? '0' : '0',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: showLine ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              />
            );
          })}
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <motion.div
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                style={{
                  backgroundColor: isCompleted || isCurrent
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: isCompleted || isCurrent
                    ? currentTheme.colors.primary
                    : currentTheme.colors.border,
                  boxShadow: isCurrent
                    ? `0 0 16px ${currentTheme.colors.primary}40`
                    : 'none',
                }}
                initial={false}
                animate={isCurrent ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    `0 0 16px ${currentTheme.colors.primary}40`,
                    `0 0 24px ${currentTheme.colors.primary}60`,
                    `0 0 16px ${currentTheme.colors.primary}40`,
                  ],
                } : {
                  scale: 1,
                }}
                transition={isCurrent ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                } : {
                  duration: 0.3,
                }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" style={{ color: '#ffffff' }} />
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: isCurrent ? '#ffffff' : currentTheme.colors.text.tertiary,
                    }}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Step Label */}
              <div className="mt-2 text-center max-w-24">
                <p
                  className="text-xs font-medium"
                  style={{
                    color: isCurrent
                      ? currentTheme.colors.text.primary
                      : isUpcoming
                        ? currentTheme.colors.text.tertiary
                        : currentTheme.colors.text.secondary,
                  }}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
