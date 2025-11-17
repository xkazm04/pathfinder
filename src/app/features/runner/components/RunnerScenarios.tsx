'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { FileText, Layers, CheckCircle2 } from 'lucide-react';
import type { TestScenario } from '@/lib/types';

interface RunnerScenariosProps {
  scenarios: TestScenario[];
  selectedSuiteName?: string;
}

export function RunnerScenarios({ scenarios, selectedSuiteName }: RunnerScenariosProps) {
  const { currentTheme } = useTheme();

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: currentTheme.colors.text.tertiary,
      default: currentTheme.colors.text.tertiary,
    };
    return colors[priority as keyof typeof colors] || colors.default;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
    return <Layers className="w-3.5 h-3.5" />;
  };

  const totalSteps = scenarios.reduce((sum, scenario) => sum + scenario.steps.length, 0);

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <ThemedCard variant="glow">
      <ThemedCardHeader
        title="Test Scenarios"
        subtitle={`${scenarios.length} scenario${scenarios.length !== 1 ? 's' : ''} • ${totalSteps} total steps`}
        icon={<FileText className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="space-y-2">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="p-3 rounded-lg hover:scale-[1.01] transition-transform cursor-pointer"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
              data-testid={`scenario-item-${scenario.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Scenario Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <FileText
                      className="w-4 h-4 shrink-0"
                      style={{ color: currentTheme.colors.primary }}
                    />
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: currentTheme.colors.text.primary }}
                    >
                      {scenario.name}
                    </p>
                  </div>

                  {/* Description (if exists) */}
                  {scenario.description && (
                    <p
                      className="text-xs mb-2 line-clamp-2"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      {scenario.description}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Steps Count */}
                    <div className="flex items-center gap-1.5">
                      <Layers
                        className="w-3 h-3"
                        style={{ color: currentTheme.colors.text.tertiary }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: currentTheme.colors.text.secondary }}
                      >
                        {scenario.steps.length} step{scenario.steps.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Category Badge (if exists) */}
                    {scenario.category && (
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${currentTheme.colors.accent}15`,
                          color: currentTheme.colors.accent,
                        }}
                      >
                        {scenario.category}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium shrink-0"
                  style={{
                    backgroundColor: `${getPriorityColor(scenario.priority)}15`,
                    color: getPriorityColor(scenario.priority),
                  }}
                >
                  {getPriorityIcon(scenario.priority)}
                  <span className="capitalize">{scenario.priority}</span>
                </div>
              </div>

              {/* Mini Progress Indicator */}
              <div className="mt-2.5">
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${currentTheme.colors.border}50` }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: '0%',
                      backgroundColor: currentTheme.colors.primary,
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
