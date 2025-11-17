'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardContent } from '@/components/ui/ThemedCard';
import { X } from 'lucide-react';
import type { ScenarioExecutionResult } from '@/app/features/runner/lib/executionUtils';
import { RunnerReportTabs } from './components/RunnerReportTabs';
import { RunnerReportHeader } from './components/RunnerReportHeader';
import { RunnerReportResults } from './components/RunnerReportResults';
import { RunnerReportErrors } from './components/RunnerReportErrors';

interface ScenarioTestReportProps {
  scenarioResults: ScenarioExecutionResult[];
  testRunId?: string;
}

export function ScenarioTestReport({ scenarioResults, testRunId }: ScenarioTestReportProps) {
  const { currentTheme } = useTheme();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    steps: boolean;
    errors: boolean;
  }>({
    steps: true,
    errors: true,
  });

  const selectedScenario = scenarioResults[selectedScenarioIndex];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!scenarioResults || scenarioResults.length === 0) {
    return null;
  }

  return (
    <ThemedCard variant="glow">
      {/* Scenario Tabs */}
      <RunnerReportTabs
        scenarioResults={scenarioResults}
        selectedIndex={selectedScenarioIndex}
        onSelectIndex={setSelectedScenarioIndex}
      />

      {/* Selected Scenario Content */}
      {selectedScenario && (
        <motion.div
          key={selectedScenarioIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ThemedCardContent>
            {/* Test Result Header */}
            <RunnerReportHeader
              scenario={selectedScenario}
              onViewScreenshot={() => setExpandedScreenshot(selectedScenario.screenshots[0])}
            />

            {/* Step Results - Collapsible */}
            <RunnerReportResults
              stepResults={selectedScenario.stepResults || []}
              isExpanded={expandedSections.steps}
              onToggleExpanded={() => toggleSection('steps')}
            />

            {/* Errors & AI Analysis - Collapsible */}
            <RunnerReportErrors
              errors={selectedScenario.errors || []}
              scenarioResultId={selectedScenario.id}
              isExpanded={expandedSections.errors}
              onToggleExpanded={() => {
                console.log('[ScenarioTestReport] Selected scenario:', {
                  id: selectedScenario.id,
                  name: selectedScenario.scenarioName,
                  viewport: selectedScenario.viewport,
                });
                toggleSection('errors');
              }}
            />
          </ThemedCardContent>
        </motion.div>
      )}

      {/* Screenshot Modal */}
      <AnimatePresence>
        {expandedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            onClick={() => setExpandedScreenshot(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-opacity-80 transition-colors"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
              }}
              onClick={() => setExpandedScreenshot(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={expandedScreenshot}
              alt="Expanded screenshot"
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ThemedCard>
  );
}
