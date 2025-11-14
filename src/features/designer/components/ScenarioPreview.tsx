'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { TestScenario } from '@/lib/types';
import { CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ScenarioPreviewProps {
  scenarios: TestScenario[];
  onScenariosChange?: (scenarios: TestScenario[]) => void;
}

export function ScenarioPreview({ scenarios, onScenariosChange }: ScenarioPreviewProps) {
  const { currentTheme } = useTheme();
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());

  const toggleScenario = (id: string) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedScenarios(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return currentTheme.colors.text.tertiary;
      default:
        return currentTheme.colors.text.secondary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'functional':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'visual':
        return <Info className="w-4 h-4" />;
      case 'responsive':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Generated Test Scenarios"
        subtitle={`${scenarios.length} scenario${scenarios.length !== 1 ? 's' : ''} detected`}
        icon={<CheckCircle2 className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="mt-4 space-y-3">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-lg overflow-hidden transition-all"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: expandedScenarios.has(scenario.id)
                  ? currentTheme.colors.borderHover
                  : currentTheme.colors.border,
                backgroundColor: currentTheme.colors.surface,
              }}
            >
              {/* Header - Clickable */}
              <button
                onClick={() => toggleScenario(scenario.id)}
                className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div style={{ color: currentTheme.colors.accent }}>
                    {getCategoryIcon(scenario.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate" style={{ color: currentTheme.colors.text.primary }}>
                      {scenario.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${getPriorityColor(scenario.priority)}15`,
                          color: getPriorityColor(scenario.priority),
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: `${getPriorityColor(scenario.priority)}30`,
                        }}
                      >
                        {scenario.priority}
                      </span>
                      <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                        {scenario.category}
                      </span>
                      <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                        {scenario.steps.length} steps
                      </span>
                    </div>
                  </div>
                </div>
                {expandedScenarios.has(scenario.id) ? (
                  <ChevronUp className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: currentTheme.colors.text.secondary }} />
                )}
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedScenarios.has(scenario.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4 space-y-3"
                      style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: currentTheme.colors.border }}
                    >
                      <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                        {scenario.description}
                      </p>

                      {/* Steps */}
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: currentTheme.colors.text.tertiary }}>
                          Test Steps:
                        </p>
                        <ol className="space-y-2">
                          {scenario.steps.map((step, stepIndex) => (
                            <li
                              key={stepIndex}
                              className="text-xs flex gap-2"
                              style={{ color: currentTheme.colors.text.secondary }}
                            >
                              <span style={{ color: currentTheme.colors.accent }}>{stepIndex + 1}.</span>
                              <span>{step.description}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Expected Outcomes */}
                      {scenario.expectedOutcomes && scenario.expectedOutcomes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: currentTheme.colors.text.tertiary }}>
                            Expected Outcomes:
                          </p>
                          <ul className="space-y-1">
                            {scenario.expectedOutcomes.map((outcome, outIndex) => (
                              <li
                                key={outIndex}
                                className="text-xs flex gap-2"
                                style={{ color: currentTheme.colors.text.secondary }}
                              >
                                <span style={{ color: '#22c55e' }}>✓</span>
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Viewports */}
                      {scenario.viewports && scenario.viewports.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                            Viewports:
                          </span>
                          {scenario.viewports.map((viewport) => (
                            <span
                              key={viewport}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${currentTheme.colors.primary}10`,
                                color: currentTheme.colors.text.secondary,
                              }}
                            >
                              {viewport}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
