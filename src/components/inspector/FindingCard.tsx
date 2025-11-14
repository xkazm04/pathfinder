'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Finding } from '@/lib/supabase/aiAnalyses';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

export function FindingCard({ finding, index }: FindingCardProps) {
  const { currentTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f97316';
      case 'info':
        return currentTheme.colors.accent;
      default:
        return currentTheme.colors.text.secondary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.9) return 'Very Confident';
    if (score >= 0.75) return 'Confident';
    if (score >= 0.6) return 'Moderate';
    return 'Low Confidence';
  };

  const severityColor = getSeverityColor(finding.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: `${severityColor}08`,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
        borderLeftColor: severityColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `${severityColor}30`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left transition-all hover:opacity-80"
      >
        <div className="flex items-start gap-3">
          {/* Severity Icon */}
          <div style={{ color: severityColor }}>
            {getSeverityIcon(finding.severity)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Category Badge */}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                }}
              >
                {getCategoryLabel(finding.category)}
              </span>

              {/* Severity Badge */}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium uppercase"
                style={{
                  backgroundColor: `${severityColor}30`,
                  color: severityColor,
                }}
              >
                {finding.severity}
              </span>

              {/* Confidence Score */}
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.tertiary,
                }}
              >
                {(finding.confidenceScore * 100).toFixed(0)}% - {getConfidenceLabel(finding.confidenceScore)}
              </span>
            </div>

            {/* Issue Description */}
            <p className="font-medium mb-1" style={{ color: currentTheme.colors.text.primary }}>
              {finding.issue}
            </p>

            {/* Location */}
            {finding.location && (
              <p className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                📍 {finding.location}
              </p>
            )}
          </div>

          {/* Expand Icon */}
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 space-y-3"
              style={{
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: `${severityColor}20`,
              }}
            >
              {/* Recommendation */}
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                  Recommendation:
                </p>
                <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                  {finding.recommendation}
                </p>
              </div>

              {/* Affected Elements */}
              {finding.affectedElements && finding.affectedElements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                    Affected Elements:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {finding.affectedElements.map((element, idx) => (
                      <code
                        key={idx}
                        className="text-xs px-2 py-1 rounded font-mono"
                        style={{
                          backgroundColor: currentTheme.colors.surface,
                          color: currentTheme.colors.accent,
                        }}
                      >
                        {element}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* WCAG Information */}
              {finding.wcagCriterion && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                    WCAG Criterion:
                  </p>
                  <div className="flex gap-2 items-center">
                    <span
                      className="text-xs px-2 py-1 rounded font-mono"
                      style={{
                        backgroundColor: currentTheme.colors.surface,
                        color: currentTheme.colors.primary,
                      }}
                    >
                      {finding.wcagCriterion}
                    </span>
                    {finding.level && (
                      <span
                        className="text-xs px-2 py-1 rounded font-semibold"
                        style={{
                          backgroundColor: `${currentTheme.colors.primary}20`,
                          color: currentTheme.colors.primary,
                        }}
                      >
                        Level {finding.level}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
