'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ScenarioExecutionResult } from '@/app/features/runner/lib/executionUtils';

interface RunnerReportTabsProps {
  scenarioResults: ScenarioExecutionResult[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function RunnerReportTabs({ scenarioResults, selectedIndex, onSelectIndex }: RunnerReportTabsProps) {
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
    <div className="px-6 pt-6">
      <div className="flex gap-2 overflow-x-auto pb-4">
        {scenarioResults.map((scenario, index) => (
          <motion.button
            key={scenario.id || index}
            onClick={() => onSelectIndex(index)}
            className="px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 text-sm font-medium transition-all"
            style={{
              backgroundColor:
                selectedIndex === index
                  ? currentTheme.colors.primary
                  : currentTheme.colors.surface,
              color:
                selectedIndex === index
                  ? '#ffffff'
                  : currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor:
                selectedIndex === index
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid={`scenario-tab-${index}`}
          >
            <div style={{ color: selectedIndex === index ? '#ffffff' : getStatusColor(scenario.status) }}>
              {getStatusIcon(scenario.status)}
            </div>
            {scenario.scenarioName || `Scenario ${index + 1}`}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
