'use client';

import { useTheme } from '@/lib/stores/appStore';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Camera } from 'lucide-react';
import type { ScenarioExecutionResult } from '@/app/features/runner/lib/executionUtils';

interface RunnerReportHeaderProps {
  scenario: ScenarioExecutionResult;
  onViewScreenshot: () => void;
}

export function RunnerReportHeader({ scenario, onViewScreenshot }: RunnerReportHeaderProps) {
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
        return <CheckCircle2 className="w-5 h-5" />;
      case 'fail':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div
      className="p-4 rounded-lg mb-4"
      style={{
        backgroundColor: `${getStatusColor(scenario.status)}10`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `${getStatusColor(scenario.status)}30`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div style={{ color: getStatusColor(scenario.status) }}>
            {getStatusIcon(scenario.status)}
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-bold"
              style={{ color: currentTheme.colors.text.primary }}
            >
              {scenario.scenarioName || 'Scenario Result'}
            </h3>
            <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              {scenario.viewport} • {scenario.viewportSize}
            </p>
          </div>
        </div>

        {/* Stats & Screenshot Icon */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: currentTheme.colors.text.tertiary }} />
            <span
              className="text-sm font-medium"
              style={{ color: currentTheme.colors.text.secondary }}
            >
              {scenario.durationMs}ms
            </span>
          </div>

          {/* Screenshot Icon - Click to View */}
          {scenario.screenshots && scenario.screenshots.length > 0 && (
            <button
              onClick={onViewScreenshot}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:scale-105 transition-transform"
              style={{
                backgroundColor: `${currentTheme.colors.accent}20`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `${currentTheme.colors.accent}40`,
              }}
              title="View screenshot"
            >
              <Camera className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
              <span className="text-sm font-medium" style={{ color: currentTheme.colors.accent }}>
                {scenario.screenshots.length}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
