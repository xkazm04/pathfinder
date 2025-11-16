import { FlowStep, PaletteItem } from '../../lib/flowTypes';

/**
 * Props for FlowCanvas component
 */
export interface FlowCanvasProps {
  steps: FlowStep[];
  selectedStepId: string | null;
  onAddStep: (item: PaletteItem, order: number) => void;
  onRemoveStep: (stepId: string) => void;
  onSelectStep: (stepId: string | null) => void;
  onReorderStep: (stepId: string, newOrder: number) => void;
}

/**
 * Props for StepCard component
 */
export interface StepCardProps {
  step: FlowStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Props for DropZone component
 */
export interface DropZoneProps {
  index: number;
  isActive: boolean;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}
