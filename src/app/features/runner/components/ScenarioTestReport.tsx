'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Camera,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
} from 'lucide-react';
import type { ScenarioResult } from '@/lib/supabase/scenarioResults';

interface ScenarioTestReportProps {
  scenarioResults: ScenarioResult[];
  testRunId?: string;
}

export function ScenarioTestReport({ scenarioResults, testRunId }: ScenarioTestReportProps) {
  const { currentTheme } = useTheme();
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    steps: boolean;
    screenshots: boolean;
    logs: boolean;
    errors: boolean;
    ai: boolean;
  }>({
    steps: true,
    screenshots: true,
    logs: false,
    errors: true,
    ai: true,
  });

  const selectedScenario = scenarioResults[selectedScenarioIndex];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
        return <CheckCircle2 className="w-4 h-4" />;
      case 'fail':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!scenarioResults || scenarioResults.length === 0) {
    return (
      <ThemedCard>
        <ThemedCardContent>
          <p style={{ color: currentTheme.colors.text.tertiary }}>
            No scenario results available
          </p>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scenario Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {scenarioResults.map((scenario, index) => (
          <motion.button
            key={scenario.id || index}
            onClick={() => setSelectedScenarioIndex(index)}
            className="px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 text-sm font-medium transition-all"
            style={{
              backgroundColor:
                selectedScenarioIndex === index
                  ? currentTheme.colors.primary
                  : currentTheme.colors.surface,
              color:
                selectedScenarioIndex === index
                  ? '#ffffff'
                  : currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor:
                selectedScenarioIndex === index
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ color: getStatusColor(scenario.status) }}>
              {getStatusIcon(scenario.status)}
            </div>
            {scenario.scenario_name || `Scenario ${index + 1}`}
          </motion.button>
        ))}
      </div>

      {/* Selected Scenario Content */}
      {selectedScenario && (
        <motion.div
          key={selectedScenarioIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {/* Scenario Header */}
          <ThemedCard variant="glow">
            <ThemedCardHeader
              title={selectedScenario.scenario_name || 'Scenario'}
              subtitle={`${selectedScenario.viewport} • ${selectedScenario.viewport_size}`}
              icon={<FileText className="w-5 h-5" />}
            />
            <ThemedCardContent>
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: `${getStatusColor(selectedScenario.status)}15`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${getStatusColor(selectedScenario.status)}30`,
                  }}
                >
                  <div className="text-xs mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                    Status
                  </div>
                  <div
                    className="text-lg font-bold flex items-center gap-2"
                    style={{ color: getStatusColor(selectedScenario.status) }}
                  >
                    {getStatusIcon(selectedScenario.status)}
                    {selectedScenario.status.toUpperCase()}
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: `${currentTheme.colors.primary}10`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${currentTheme.colors.primary}30`,
                  }}
                >
                  <div className="text-xs mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                    Duration
                  </div>
                  <div
                    className="text-lg font-bold flex items-center gap-2"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    <Clock className="w-4 h-4" />
                    {selectedScenario.duration_ms}ms
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: `${currentTheme.colors.accent}10`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${currentTheme.colors.accent}30`,
                  }}
                >
                  <div className="text-xs mb-1" style={{ color: currentTheme.colors.text.tertiary }}>
                    Screenshots
                  </div>
                  <div
                    className="text-lg font-bold flex items-center gap-2"
                    style={{ color: currentTheme.colors.accent }}
                  >
                    <Camera className="w-4 h-4" />
                    {selectedScenario.screenshots?.length || 0}
                  </div>
                </div>
              </div>
            </ThemedCardContent>
          </ThemedCard>

          {/* Step Results */}
          {selectedScenario.step_results && selectedScenario.step_results.length > 0 && (
            <ThemedCard>
              <button
                onClick={() => toggleSection('steps')}
                className="w-full"
                style={{ textAlign: 'left' }}
              >
                <ThemedCardHeader
                  title="Step Results"
                  subtitle={`${selectedScenario.step_results.length} steps executed`}
                  icon={expandedSections.steps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                />
              </button>
              <AnimatePresence>
                {expandedSections.steps && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <ThemedCardContent>
                      <div className="space-y-2">
                        {selectedScenario.step_results.map((step: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: `${getStatusColor(step.status)}10`,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: `${getStatusColor(step.status)}30`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div style={{ color: getStatusColor(step.status) }}>
                                  {getStatusIcon(step.status)}
                                </div>
                                <span className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                                  Step {step.stepIndex + 1}: {step.stepType}
                                </span>
                              </div>
                              <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                                {step.duration_ms}ms
                              </span>
                            </div>
                            {step.message && (
                              <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                                {step.message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ThemedCardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </ThemedCard>
          )}

          {/* Screenshots Gallery */}
          {selectedScenario.screenshots && selectedScenario.screenshots.length > 0 && (
            <ThemedCard>
              <button
                onClick={() => toggleSection('screenshots')}
                className="w-full"
                style={{ textAlign: 'left' }}
              >
                <ThemedCardHeader
                  title="Screenshots"
                  subtitle={`${selectedScenario.screenshots.length} captured`}
                  icon={expandedSections.screenshots ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                />
              </button>
              <AnimatePresence>
                {expandedSections.screenshots && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <ThemedCardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedScenario.screenshots.map((screenshot: string, index: number) => (
                          <motion.div
                            key={index}
                            className="relative rounded-lg overflow-hidden cursor-pointer group"
                            style={{
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderColor: currentTheme.colors.border,
                            }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setExpandedScreenshot(screenshot)}
                          >
                            <img
                              src={screenshot}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-auto"
                            />
                            <div
                              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all"
                            >
                              <Maximize2
                                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                            <div
                              className="p-2 text-xs text-center"
                              style={{
                                backgroundColor: currentTheme.colors.surface,
                                color: currentTheme.colors.text.tertiary,
                              }}
                            >
                              Screenshot {index + 1}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ThemedCardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </ThemedCard>
          )}

          {/* Errors */}
          {selectedScenario.errors && selectedScenario.errors.length > 0 && (
            <ThemedCard>
              <button
                onClick={() => toggleSection('errors')}
                className="w-full"
                style={{ textAlign: 'left' }}
              >
                <ThemedCardHeader
                  title="Errors"
                  subtitle={`${selectedScenario.errors.length} errors detected`}
                  icon={expandedSections.errors ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                />
              </button>
              <AnimatePresence>
                {expandedSections.errors && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <ThemedCardContent>
                      <div className="space-y-2">
                        {selectedScenario.errors.map((error: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: '#ef444410',
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              borderColor: '#ef444430',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 mt-0.5" style={{ color: '#ef4444' }} />
                              <div className="flex-1">
                                <p className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                                  {error.message}
                                </p>
                                {error.stack && (
                                  <pre
                                    className="text-xs mt-2 p-2 rounded overflow-x-auto"
                                    style={{
                                      backgroundColor: currentTheme.colors.surface,
                                      color: currentTheme.colors.text.tertiary,
                                    }}
                                  >
                                    {error.stack}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ThemedCardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </ThemedCard>
          )}
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
              className="absolute top-4 right-4 p-2 rounded-lg"
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
    </div>
  );
}
