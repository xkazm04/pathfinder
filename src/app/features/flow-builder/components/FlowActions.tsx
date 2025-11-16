'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { Save, Download, Eye, EyeOff } from 'lucide-react';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestFlow } from '../lib/flowTypes';
import { convertFlowStepsForDB } from '../lib/flowExecution';
import { saveFlowScenario, updateFlowScenario } from '@/lib/supabase/suiteAssets';
import { flowToPlaywrightCode } from '../lib/flowSerializer';

interface FlowActionsProps {
  flow: TestFlow;
  isValid: boolean;
  selectedSuiteId: string;
  currentScenarioId: string | null;
  showPreview: boolean;
  exportJson: () => string;
  onScenarioIdChange: (id: string) => void;
  onPreviewToggle: () => void;
  onSaveComplete?: () => void;
  onExportComplete?: () => void;
}

export function FlowActions({
  flow,
  isValid,
  selectedSuiteId,
  currentScenarioId,
  showPreview,
  exportJson,
  onScenarioIdChange,
  onPreviewToggle,
  onSaveComplete,
  onExportComplete,
}: FlowActionsProps) {
  const { currentTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveFlow = async () => {
    if (!selectedSuiteId) {
      alert('Please select a test suite first');
      return;
    }

    if (!isValid) {
      alert('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      const dbSteps = convertFlowStepsForDB(flow.steps);

      if (currentScenarioId) {
        // Update existing scenario
        await updateFlowScenario(
          currentScenarioId,
          flow.name,
          flow.description,
          dbSteps
        );
        alert('Flow updated successfully!');
      } else {
        // Create new scenario
        const newScenarioId = await saveFlowScenario(
          selectedSuiteId,
          flow.name,
          flow.description,
          dbSteps
        );
        onScenarioIdChange(newScenarioId);
        alert('Flow saved successfully!');
      }

      onSaveComplete?.();
    } catch (error) {
      console.error('Failed to save flow:', error);
      alert('Failed to save flow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const code = flowToPlaywrightCode(flow);

    // Create downloadable file
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flow.name || 'test'}.spec.ts`;
    link.click();
    URL.revokeObjectURL(url);

    onExportComplete?.();
  };

  return (
    <div className="flex flex-wrap py-2 gap-3 border-t-2" style={{ borderColor: currentTheme.colors.border }}>
      <ThemedButton
        onClick={handleSaveFlow}
        disabled={!isValid || !selectedSuiteId || isSaving}
        isLoading={isSaving}
        variant="primary"
        size="md"
        leftIcon={<Save />}
        fullWidth
        className="flex-1"
        data-testid="save-flow-btn"
      >
        {currentScenarioId ? 'Update Flow' : 'Save Flow'}
      </ThemedButton>

      <ThemedButton
        onClick={onPreviewToggle}
        disabled={flow.steps.length === 0}
        variant="secondary"
        size="md"
        leftIcon={showPreview ? <EyeOff /> : <Eye />}
        fullWidth
        className="flex-1"
        data-testid="preview-flow-btn"
      >
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </ThemedButton>

      <ThemedButton
        onClick={handleExport}
        disabled={!isValid}
        variant="glow"
        size="md"
        leftIcon={<Download />}
        fullWidth
        className="flex-1"
        data-testid="export-code-btn"
      >
        Export Code
      </ThemedButton>
    </div>
  );
}
