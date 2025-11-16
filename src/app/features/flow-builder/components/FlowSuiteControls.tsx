'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { TestSuite, TestScenario } from '@/lib/types';
import { getFlowScenarios } from '@/lib/supabase/suiteAssets';

interface FlowSuiteControlsProps {
  availableSuites?: TestSuite[];
  selectedSuiteId: string;
  selectedScenarioId?: string;
  isLoadingSuites: boolean;
  onSelectSuite: (suiteId: string) => void;
  onSelectScenario?: (scenarioId: string, scenario: TestScenario) => void;
}

export function FlowSuiteControls({
  availableSuites,
  selectedSuiteId,
  selectedScenarioId,
  isLoadingSuites,
  onSelectSuite,
  onSelectScenario,
}: FlowSuiteControlsProps) {
  const { currentTheme } = useTheme();
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  // Load scenarios when suite is selected
  useEffect(() => {
    if (selectedSuiteId) {
      loadScenarios(selectedSuiteId);
    } else {
      setScenarios([]);
    }
  }, [selectedSuiteId]);

  const loadScenarios = async (suiteId: string) => {
    try {
      setIsLoadingScenarios(true);
      const flowScenarios = await getFlowScenarios(suiteId);
      setScenarios(flowScenarios);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      setScenarios([]);
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  const handleScenarioChange = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario && onSelectScenario) {
      onSelectScenario(scenarioId, scenario);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-lg"
      style={{
        backgroundColor: currentTheme.colors.surface,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: currentTheme.colors.border,
      }}
    >
      {/* Suite Selection */}
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-10 h-10 rounded flex items-center justify-center shrink-0"
          style={{
            backgroundColor: currentTheme.colors.primary + '20',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: currentTheme.colors.primary + '40',
          }}
        >
          <FolderOpen className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
        </div>

        <div className="flex-1" style={{ minWidth: '200px', maxWidth: '400px' }}>
          <ThemedSelect
            value={selectedSuiteId}
            onChange={(suiteId) => {
              if (suiteId) {
                onSelectSuite(suiteId);
              }
            }}
            options={(availableSuites || [])
              .sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA; // Most recent first
              })
              .map(suite => ({
                value: suite.id,
                label: suite.name,
              }))
            }
            placeholder="Select test suite..."
            isLoading={isLoadingSuites}
            size="sm"
          />
        </div>
      </div>

      {/* Scenario Selection */}
      {selectedSuiteId && (
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded flex items-center justify-center shrink-0"
            style={{
              backgroundColor: currentTheme.colors.accent + '20',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.accent + '40',
            }}
          >
            <FileText className="w-5 h-5" style={{ color: currentTheme.colors.accent }} />
          </div>

          <div className="flex-1" style={{ minWidth: '200px', maxWidth: '400px' }}>
            <ThemedSelect
              value={selectedScenarioId || ''}
              onChange={handleScenarioChange}
              options={scenarios.map(scenario => ({
                value: scenario.id || '',
                label: scenario.name,
              }))}
              placeholder={
                isLoadingScenarios
                  ? 'Loading scenarios...'
                  : scenarios.length === 0
                  ? 'No scenarios available'
                  : 'Select scenario...'
              }
              isLoading={isLoadingScenarios}
              size="sm"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
