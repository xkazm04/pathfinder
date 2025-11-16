'use client';

import { useState, useEffect } from 'react';
import { useFlowBuilder } from '../lib/useFlowBuilder';
import { getTestSuites } from '@/lib/supabase/testSuites';
import { TestSuite } from '@/lib/types';

// Components
import { FlowSuiteControls } from './FlowSuiteControls';
import { FlowConfigSection } from './FlowConfigSection';
import { StepPalette } from './StepPalette';
import { FlowCanvas } from '../sub_FlowCanvas/FlowCanvas';
import { StepEditor } from './StepEditor';
import { NLDescriptionPanel } from './NLDescriptionPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { FlowActions } from './FlowActions';
import { FlowPreview } from './FlowPreview';
import { FlowRunnerSection } from './FlowRunnerSection';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { useTheme } from '@/lib/stores/appStore';

// Types and utilities
import { PaletteItem, FlowStep } from '../lib/flowTypes';
import { flowStepsToNaturalLanguage, naturalLanguageToFlowSteps } from '../lib/flowSync';
import { flowToNaturalLanguage, flowToPlaywrightCode } from '../lib/flowSerializer';

// Icons
import { Play, Trash2, FileCode, FileText } from 'lucide-react';

interface FlowBuilderProps {
  onSave?: (flowJson: string) => void;
  onExport?: (code: string) => void;
}

export function FlowBuilder({ onSave, onExport }: FlowBuilderProps) {
  const { currentTheme } = useTheme();
  const flowBuilder = useFlowBuilder();

  // Suite management state
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);

  // Suite state
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSelector, setSelectedSelector] = useState<string>('');

  // NL Description state
  const [nlDescription, setNLDescription] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [enableTypewriting, setEnableTypewriting] = useState(false);

  // Load suites on mount
  useEffect(() => {
    loadSuites();
  }, []);

  const loadSuites = async () => {
    try {
      setIsLoadingSuites(true);
      const suites = await getTestSuites();
      setTestSuites(suites);
    } catch (err) {
      console.error('Failed to load test suites:', err);
    } finally {
      setIsLoadingSuites(false);
    }
  };

  // Handlers
  const handleAddStep = (item: PaletteItem, order: number) => {
    const stepId = flowBuilder.addStep(item.type, {
      ...item.defaultConfig,
      description: item.label,
    });

    if (order < flowBuilder.flow.steps.length - 1) {
      flowBuilder.moveStep(stepId, order);
    }
  };

  // NL Sync handlers
  const handleSyncFromSteps = () => {
    setIsSyncing(true);
    try {
      const nl = flowStepsToNaturalLanguage(flowBuilder.flow);
      setNLDescription(nl);
    } catch (error) {
      console.error('Failed to sync from steps:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToSteps = () => {
    setIsSyncing(true);
    try {
      const { steps, targetUrl, testName } = naturalLanguageToFlowSteps(nlDescription);

      if (targetUrl && !flowBuilder.flow.targetUrl) {
        flowBuilder.updateMetadata({ targetUrl });
      }
      if (testName && testName !== 'Untitled Test' && !flowBuilder.flow.name) {
        flowBuilder.updateMetadata({ name: testName });
      }

      steps.forEach((step) => {
        flowBuilder.addStep(step.type, step.config);
      });
    } catch (error) {
      console.error('Failed to sync to steps:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // AI Assistant handler
  const handleApplyAISteps = (steps: FlowStep[]) => {
    flowBuilder.clearFlow();
    steps.forEach((step) => {
      flowBuilder.addStep(step.type, step.config);
    });
  };

  // Selector selection handler
  const handleSelectSelector = (selector: string, elementInfo?: any) => {
    setSelectedSelector(selector);
  };

  // Handle selector applied - trigger autosync
  const handleSelectorApplied = () => {
    // Enable typewriting effect for this update
    setEnableTypewriting(true);

    // Autosync from manual steps to NL description
    const nl = flowStepsToNaturalLanguage(flowBuilder.flow);
    setNLDescription(nl);

    // Disable typewriting after animation completes
    setTimeout(() => {
      setEnableTypewriting(false);
    }, 3000);
  };

  // Handler for scenario selection
  const handleSelectScenario = (scenarioId: string, scenario: any) => {
    setSelectedScenarioId(scenarioId);

    // Populate FlowBuilder with scenario data
    if (scenario && scenario.steps && scenario.steps.length > 0) {
      // Clear existing flow
      flowBuilder.clearFlow();

      // Update metadata
      flowBuilder.updateMetadata({
        name: scenario.name,
        description: scenario.description || '',
      });

      // Add steps
      scenario.steps.forEach((step: any, index: number) => {
        flowBuilder.addStep(step.type, {
          description: step.description || '',
          selector: step.selector,
          value: step.value,
          url: step.url,
          assertion: step.assertion,
          timeout: step.timeout,
          expectedResult: step.expectedResult,
        });
      });
    }
  };

  const naturalLanguage = flowToNaturalLanguage(flowBuilder.flow);
  const playwrightCode = flowToPlaywrightCode(flowBuilder.flow);

  return (
    <div className="space-y-6 bg-slate-800/40 p-2">
      {/* Suite Controls */}
      <FlowSuiteControls
        availableSuites={testSuites}
        selectedSuiteId={selectedSuiteId}
        selectedScenarioId={selectedScenarioId}
        isLoadingSuites={isLoadingSuites}
        onSelectSuite={setSelectedSuiteId}
        onSelectScenario={handleSelectScenario}
      />

      {/* Flow Configuration - Full Width */}
      <FlowConfigSection
        flow={flowBuilder.flow}
        isValid={flowBuilder.validation.valid}
        errors={flowBuilder.validation.errors}
        onUpdateMetadata={flowBuilder.updateMetadata}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Palette */}
        <div className="lg:col-span-1">
          <div>
            <ThemedCardHeader
              title="Step Palette"
              subtitle="Drag to add steps"
              icon={<FileText className="w-5 h-5" />}
            />
            <ThemedCardContent>
              <StepPalette onSelectItem={(item) => handleAddStep(item, flowBuilder.flow.steps.length)} />
            </ThemedCardContent>
          </div>
        </div>

        {/* Center - Flow Canvas (Test Steps) */}
        <div className="lg:col-span-2 ">
          <div>
            <ThemedCardHeader
              title={`Test Steps (${flowBuilder.flow.steps.length})`}
              subtitle="Drag and drop to build your test"
              icon={<Play className="w-5 h-5" />}
              action={
                <button
                  onClick={() => flowBuilder.clearFlow()}
                  disabled={flowBuilder.flow.steps.length === 0}
                  className="text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.secondary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                    opacity: flowBuilder.flow.steps.length === 0 ? 0.5 : 1,
                  }}
                  data-testid="clear-flow-btn"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              }
            />
            <ThemedCardContent>
              <FlowCanvas
                steps={flowBuilder.flow.steps}
                selectedStepId={flowBuilder.selectedStepId}
                onAddStep={handleAddStep}
                onRemoveStep={flowBuilder.removeStep}
                onSelectStep={flowBuilder.setSelectedStepId}
                onReorderStep={flowBuilder.moveStep}
              />
            </ThemedCardContent>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Step Editor */}
          {flowBuilder.selectedStep ? (
            <StepEditor
              step={flowBuilder.selectedStep}
              onUpdate={flowBuilder.updateStep}
              selectedSelector={selectedSelector}
              onSelectorApplied={handleSelectorApplied}
              targetUrl={flowBuilder.flow.targetUrl}
            />
          ) : (
            <ThemedCard variant="bordered">
              <ThemedCardHeader
                title="Step Editor"
                subtitle="Select a step to edit"
                icon={<FileCode className="w-5 h-5" />}
              />
              <ThemedCardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      borderWidth: '2px',
                      borderStyle: 'dashed',
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    <FileCode
                      className="w-8 h-8"
                      style={{ color: currentTheme.colors.text.tertiary }}
                    />
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: currentTheme.colors.text.secondary }}
                  >
                    Click on a step in the canvas to edit its configuration
                  </p>
                </div>
              </ThemedCardContent>
            </ThemedCard>
          )}

          {/* NL Description Panel */}
          <NLDescriptionPanel
            steps={flowBuilder.flow.steps}
            nlDescription={nlDescription}
            onNLDescriptionChange={setNLDescription}
            onSyncFromSteps={handleSyncFromSteps}
            onSyncToSteps={handleSyncToSteps}
            isSyncing={isSyncing}
            enableTypewriting={enableTypewriting}
          />

          {/* AI Assistant Panel */}
          <AIAssistantPanel
            targetUrl={flowBuilder.flow.targetUrl || ''}
            description={flowBuilder.flow.description}
            onApplySteps={handleApplyAISteps}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <FlowActions
        flow={flowBuilder.flow}
        isValid={flowBuilder.validation.valid}
        selectedSuiteId={selectedSuiteId}
        currentScenarioId={currentScenarioId}
        showPreview={showPreview}
        exportJson={flowBuilder.exportJson}
        onScenarioIdChange={setCurrentScenarioId}
        onPreviewToggle={() => setShowPreview(!showPreview)}
        onSaveComplete={() => onSave?.(flowBuilder.exportJson())}
        onExportComplete={() => onExport?.(playwrightCode)}
      />

      {/* Preview */}
      <FlowPreview
        show={showPreview}
        naturalLanguage={naturalLanguage}
        playwrightCode={playwrightCode}
      />

      {/* Test Runner - Full Width Bottom */}
      <FlowRunnerSection
        flow={flowBuilder.flow}
        isValid={flowBuilder.validation.valid}
      />
    </div>
  );
}
