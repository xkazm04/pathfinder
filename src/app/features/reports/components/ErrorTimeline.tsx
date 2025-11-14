'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ErrorDetail } from '../lib/mockData';
import { AlertCircle, ChevronDown, ChevronUp, Monitor, Clock } from 'lucide-react';

interface ErrorTimelineProps {
  errors: ErrorDetail[];
}

/**
 * UI Improvement 2: Collapsible error timeline
 * - Chronological display of failures
 * - Expandable stack traces
 * - Visual timeline with connecting lines
 * - Quick error identification with viewport info
 * - Syntax-highlighted error messages
 */
export function ErrorTimeline({ errors }: ErrorTimelineProps) {
  const { currentTheme } = useTheme();
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const toggleError = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Error Timeline"
        subtitle={`${errors.length} failure${errors.length !== 1 ? 's' : ''} detected`}
        icon={<AlertCircle className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="mt-4 space-y-0 relative">
          {/* Timeline vertical line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-0.5"
            style={{ backgroundColor: '#ef444430' }}
          />

          {errors.map((error, index) => (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div
                className="absolute left-6 w-3 h-3 rounded-full transform -translate-x-1/2"
                style={{
                  backgroundColor: '#ef4444',
                  boxShadow: `0 0 0 4px ${currentTheme.colors.background}`,
                  zIndex: 10,
                }}
              />

              {/* Error Card */}
              <div className="ml-12 mb-4">
                <button
                  onClick={() => toggleError(error.id)}
                  className="w-full text-left p-4 rounded-lg transition-all"
                  style={{
                    backgroundColor: '#ef444408',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: expandedErrors.has(error.id) ? '#ef444460' : '#ef444430',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Test Name */}
                      <h4 className="font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                        {error.testName}
                      </h4>

                      {/* Error Message */}
                      <p
                        className="text-sm mb-3 font-mono"
                        style={{ color: '#ef4444' }}
                      >
                        {error.message}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs"
                          style={{ color: currentTheme.colors.text.tertiary }}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>{error.viewport}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs"
                          style={{ color: currentTheme.colors.text.tertiary }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{error.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                      {expandedErrors.has(error.id) ? (
                        <ChevronUp className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Stack Trace */}
                <AnimatePresence>
                  {expandedErrors.has(error.id) && error.stack && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-2 p-4 rounded-lg"
                        style={{
                          backgroundColor: currentTheme.colors.surface,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: currentTheme.colors.border,
                        }}
                      >
                        <p className="text-xs font-semibold mb-2"
                          style={{ color: currentTheme.colors.text.tertiary }}
                        >
                          Stack Trace:
                        </p>
                        <pre
                          className="text-xs font-mono whitespace-pre-wrap overflow-x-auto"
                          style={{ color: currentTheme.colors.text.secondary }}
                        >
                          {error.stack}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
