'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { StepList, StepEmptyState } from './components';
import type { FlowCanvasProps } from './lib';
import type { PaletteItem } from '../lib/flowTypes';

export function FlowCanvas({
  steps,
  selectedStepId,
  onAddStep,
  onRemoveStep,
  onSelectStep,
  onReorderStep,
}: FlowCanvasProps) {
  const { currentTheme } = useTheme();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    try {
      const itemData = e.dataTransfer.getData('application/json');
      const item: PaletteItem = JSON.parse(itemData);
      onAddStep(item, index);
    } catch (error) {
      // Failed to parse dropped item - silently ignore
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div
      className="min-h-[500px] p-4 rounded-xl"
      style={{
        backgroundColor: currentTheme.colors.background,
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: currentTheme.colors.border,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, steps.length)}
      data-testid="flow-canvas"
    >
      {steps.length === 0 ? (
        <StepEmptyState />
      ) : (
        <StepList
          steps={steps}
          selectedStepId={selectedStepId}
          dragOverIndex={dragOverIndex}
          onSelectStep={onSelectStep}
          onRemoveStep={onRemoveStep}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}
    </div>
  );
}
