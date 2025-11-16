'use client';

import { useTheme } from '@/lib/stores/appStore';
import { useFlowBuilder } from '../lib/useFlowBuilder';
import { StepPalette } from './StepPalette';
import { FlowCanvas } from './FlowCanvas';
import { StepEditor } from './StepEditor';
import { NLDescriptionPanel } from './NLDescriptionPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/Badge';
import { PaletteItem, FlowStep } from '../lib/flowTypes';
import { flowStepsToNaturalLanguage, naturalLanguageToFlowSteps } from '../lib/flowSync';
import {
  Play,
  Save,
  Download,
  Trash2,
  Eye,
  FileCode,
  FileText,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { flowToNaturalLanguage, flowToPlaywrightCode, flowToTestTemplate } from '../lib/flowSerializer';
import { useState } from 'react';

interface FlowBuilderProps {
  onSave?: (flowJson: string) => void;
  onExport?: (code: string) => void;
  onGenerate?: (naturalLanguage: string) => void;
}

export function FlowBuilder({ onSave, onExport, onGenerate }: FlowBuilderProps) {
  const { currentTheme } = useTheme();
  const flowBuilder = useFlowBuilder();
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'nl' | 'code'>('nl');

  // NL Description state
  const [nlDescription, setNLDescription] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddStep = (item: PaletteItem, order: number) => {
    const stepId = flowBuilder.addStep(item.type, {
      ...item.defaultConfig,
      description: item.label,
    });

    // Reorder if needed
    if (order < flowBuilder.flow.steps.length - 1) {
      flowBuilder.moveStep(stepId, order);
    }
  };

  const handleSave = () => {
    const json = flowBuilder.exportJson();
    onSave?.(json);
  };

  const handleExport = () => {
    const code = flowToPlaywrightCode(flowBuilder.flow);
    onExport?.(code);
  };

  const handleGenerateNL = () => {
    const nl = flowToNaturalLanguage(flowBuilder.flow);
    onGenerate?.(nl);
  };

  // Sync handlers for NL Description
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

      // Update flow metadata if available
      if (targetUrl && !flowBuilder.flow.targetUrl) {
        flowBuilder.updateMetadata({ targetUrl });
      }
      if (testName && testName !== 'Untitled Test' && !flowBuilder.flow.name) {
        flowBuilder.updateMetadata({ name: testName });
      }

      // Add parsed steps
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
    // Clear existing steps
    flowBuilder.clearFlow();

    // Add AI-generated steps
    steps.forEach((step) => {
      flowBuilder.addStep(step.type, step.config);
    });
  };

  const naturalLanguage = flowToNaturalLanguage(flowBuilder.flow);
  const playwrightCode = flowToPlaywrightCode(flowBuilder.flow);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar - Palette */}
      <div className="lg:col-span-1">
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Step Palette"
            subtitle="Drag to add steps"
            icon={<FileText className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <StepPalette onSelectItem={(item) => handleAddStep(item, flowBuilder.flow.steps.length)} />
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Center - Canvas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Flow Metadata */}
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Flow Configuration"
            icon={<FileCode className="w-5 h-5" />}
            action={
              <div className="flex items-center gap-2">
                {flowBuilder.validation.valid ? (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="error">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {flowBuilder.validation.errors.length} Errors
                  </Badge>
                )}
              </div>
            }
          />
          <ThemedCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  Test Name *
                </label>
                <input
                  type="text"
                  value={flowBuilder.flow.name}
                  onChange={(e) =>
                    flowBuilder.updateMetadata({ name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                  placeholder="My Test Flow"
                  data-testid="flow-name-input"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  Target URL
                </label>
                <input
                  type="url"
                  value={flowBuilder.flow.targetUrl || ''}
                  onChange={(e) =>
                    flowBuilder.updateMetadata({ targetUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                  placeholder="https://example.com"
                  data-testid="flow-target-url-input"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  Description
                </label>
                <textarea
                  value={flowBuilder.flow.description}
                  onChange={(e) =>
                    flowBuilder.updateMetadata({ description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                  rows={2}
                  placeholder="Describe what this test does..."
                  data-testid="flow-description-input"
                />
              </div>
            </div>

            {/* Validation Errors */}
            {!flowBuilder.validation.valid && (
              <div
                className="mt-4 p-3 rounded"
                style={{
                  backgroundColor: '#ef444410',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#ef444430',
                }}
              >
                <p
                  className="text-sm font-medium flex items-center gap-2 mb-2"
                  style={{ color: '#ef4444' }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Validation Errors:
                </p>
                <ul className="space-y-1">
                  {flowBuilder.validation.errors.map((error, idx) => (
                    <li
                      key={idx}
                      className="text-xs"
                      style={{ color: currentTheme.colors.text.secondary }}
                    >
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ThemedCardContent>
        </ThemedCard>

        {/* Flow Canvas */}
        <ThemedCard variant="bordered">
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
        </ThemedCard>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={!flowBuilder.validation.valid}
            className="flex-1 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: '#ffffff',
              opacity: !flowBuilder.validation.valid ? 0.5 : 1,
            }}
            data-testid="save-flow-btn"
          >
            <Save className="w-4 h-4" />
            Save Flow
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={flowBuilder.flow.steps.length === 0}
            className="flex-1 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
              opacity: flowBuilder.flow.steps.length === 0 ? 0.5 : 1,
            }}
            data-testid="preview-flow-btn"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Preview'}
          </button>

          <button
            onClick={handleExport}
            disabled={!flowBuilder.validation.valid}
            className="flex-1 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: currentTheme.colors.accent,
              color: '#ffffff',
              opacity: !flowBuilder.validation.valid ? 0.5 : 1,
            }}
            data-testid="export-code-btn"
          >
            <Download className="w-4 h-4" />
            Export Code
          </button>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <ThemedCard variant="bordered">
                <ThemedCardHeader
                  title="Preview"
                  icon={<Eye className="w-5 h-5" />}
                  action={
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewMode('nl')}
                        className="text-xs px-3 py-1 rounded transition-colors"
                        style={{
                          backgroundColor:
                            previewMode === 'nl'
                              ? currentTheme.colors.primary
                              : currentTheme.colors.surface,
                          color:
                            previewMode === 'nl'
                              ? '#ffffff'
                              : currentTheme.colors.text.secondary,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: currentTheme.colors.border,
                        }}
                        data-testid="preview-nl-btn"
                      >
                        Natural Language
                      </button>
                      <button
                        onClick={() => setPreviewMode('code')}
                        className="text-xs px-3 py-1 rounded transition-colors"
                        style={{
                          backgroundColor:
                            previewMode === 'code'
                              ? currentTheme.colors.primary
                              : currentTheme.colors.surface,
                          color:
                            previewMode === 'code'
                              ? '#ffffff'
                              : currentTheme.colors.text.secondary,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: currentTheme.colors.border,
                        }}
                        data-testid="preview-code-btn"
                      >
                        Playwright Code
                      </button>
                    </div>
                  }
                />
                <ThemedCardContent>
                  <pre
                    className="p-4 rounded text-xs overflow-x-auto"
                    style={{
                      backgroundColor: currentTheme.colors.background,
                      color: currentTheme.colors.text.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    {previewMode === 'nl' ? naturalLanguage : playwrightCode}
                  </pre>
                </ThemedCardContent>
              </ThemedCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar - Step Editor, NL Description, AI Assistant */}
      <div className="lg:col-span-1 space-y-6">
        {/* Step Editor */}
        {flowBuilder.selectedStep ? (
          <StepEditor
            step={flowBuilder.selectedStep}
            onUpdate={flowBuilder.updateStep}
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
        />

        {/* AI Assistant Panel */}
        <AIAssistantPanel
          targetUrl={flowBuilder.flow.targetUrl || ''}
          description={flowBuilder.flow.description}
          onApplySteps={handleApplyAISteps}
        />
      </div>
    </div>
  );
}
