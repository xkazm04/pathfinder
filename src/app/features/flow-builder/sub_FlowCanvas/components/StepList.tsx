'use client';

import { AnimatePresence } from 'framer-motion';
import { StepCard } from './StepCard';
import { StepDropZone } from './StepDropZone';
import type { FlowStep, PaletteItem } from '../../lib/flowTypes';
import { sortSteps } from '../lib';

interface StepListProps {
  steps: FlowStep[];
  selectedStepId: string | null;
  dragOverIndex: number | null;
  onSelectStep: (stepId: string | null) => void;
  onRemoveStep: (stepId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function StepList({
  steps,
  selectedStepId,
  dragOverIndex,
  onSelectStep,
  onRemoveStep,
  onDragOver,
  onDragLeave,
  onDrop,
}: StepListProps) {
  const sortedSteps = sortSteps(steps);

  return (
    <div className="space-y-1">
      <AnimatePresence>
        {sortedSteps.map((step, index) => {
          const isSelected = step.id === selectedStepId;

          return (
            <div key={step.id}>
              {/* Drop zone before step */}
              <StepDropZone
                index={index}
                isActive={dragOverIndex === index}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              />

              {/* Step card */}
              <StepCard
                step={step}
                index={index}
                isSelected={isSelected}
                onSelect={() => onSelectStep(step.id)}
                onEdit={() => onSelectStep(step.id)}
                onDelete={() => onRemoveStep(step.id)}
              />
            </div>
          );
        })}
      </AnimatePresence>

      {/* Drop zone at the end */}
      <StepDropZone
        index={steps.length}
        isActive={dragOverIndex === steps.length}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />
    </div>
  );
}
