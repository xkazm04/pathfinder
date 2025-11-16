'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Eye, Loader2, AlertTriangle } from 'lucide-react';
import { RecentTest } from '../lib/mockData';
import { MascotAvatar } from '@/app/features/designer/sub_Mascot/components/MascotAvatar';
import { useState } from 'react';

export interface AnomalyData {
  isAnomalous: boolean;
  anomalyType?: 'flaky_test' | 'environment_issue' | 'regression' | 'unusual_failure_pattern';
  confidence: number;
  explanation: string;
  suggestedAction?: string;
}

interface RecentTestItemProps {
  test: RecentTest;
  index: number;
  anomaly?: AnomalyData;
}

export function RecentTestItem({ test, index, anomaly }: RecentTestItemProps) {
  const { currentTheme } = useTheme();
  const [showAnomalyTooltip, setShowAnomalyTooltip] = useState(false);

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

  const getAnomalyTypeLabel = (type?: string) => {
    switch (type) {
      case 'flaky_test':
        return 'Flaky Test';
      case 'environment_issue':
        return 'Environment';
      case 'regression':
        return 'Regression';
      case 'unusual_failure_pattern':
        return 'Unusual Pattern';
      default:
        return 'Anomaly';
    }
  };

  const getAnomalyColor = () => {
    if (!anomaly?.isAnomalous) return '#fbbf24';

    if (anomaly.confidence > 0.5) return '#ef4444';
    return '#f97316';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
      className="flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.01]"
      style={{
        background: `${currentTheme.colors.surface}80`,
        borderColor: anomaly?.isAnomalous ? getAnomalyColor() : currentTheme.colors.border,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Mascot Avatar */}
        {test.mascotConfig && (
          <div className="shrink-0" data-testid="test-item-mascot">
            <MascotAvatar config={test.mascotConfig} size="sm" animate={false} />
          </div>
        )}

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

            {anomaly?.isAnomalous && (
              <div
                className="relative"
                onMouseEnter={() => setShowAnomalyTooltip(true)}
                onMouseLeave={() => setShowAnomalyTooltip(false)}
              >
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 cursor-help"
                  style={{
                    backgroundColor: `${getAnomalyColor()}15`,
                    color: getAnomalyColor(),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${getAnomalyColor()}30`,
                  }}
                  data-testid="anomaly-badge"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {getAnomalyTypeLabel(anomaly.anomalyType)}
                </span>

                {showAnomalyTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 left-0 top-full mt-2 p-3 rounded-lg shadow-lg min-w-[280px] max-w-[320px]"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      borderColor: getAnomalyColor(),
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                    data-testid="anomaly-tooltip"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" style={{ color: getAnomalyColor() }} />
                        <p className="font-semibold text-sm" style={{ color: currentTheme.colors.text.primary }}>
                          {getAnomalyTypeLabel(anomaly.anomalyType)}
                        </p>
                        <span
                          className="text-xs ml-auto"
                          style={{ color: currentTheme.colors.text.tertiary }}
                        >
                          {(anomaly.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: currentTheme.colors.text.secondary }}>
                        {anomaly.explanation}
                      </p>
                      {anomaly.suggestedAction && (
                        <div className="pt-2 border-t" style={{ borderColor: currentTheme.colors.border }}>
                          <p className="text-xs font-medium mb-1" style={{ color: currentTheme.colors.text.primary }}>
                            Suggested Action:
                          </p>
                          <p className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                            {anomaly.suggestedAction}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ThemedButton
        variant="ghost"
        size="sm"
        leftIcon={<Eye className="w-3 h-3" />}
        disabled={test.status === 'running'}
        data-testid="view-details-btn"
      >
        Details
      </ThemedButton>
    </motion.div>
  );
}
