// Main exports for the Flow Builder feature
export { FlowBuilder } from './components/FlowBuilder';
export { FlowCanvas } from './sub_FlowCanvas/FlowCanvas';
export { StepPalette } from './components/StepPalette';
export { StepEditor } from './components/StepEditor';

export { useFlowBuilder } from './lib/useFlowBuilder';
export type { UseFlowBuilderOptions } from './lib/useFlowBuilder';

export {
  serializeFlow,
  deserializeFlow,
  flowToNaturalLanguage,
  flowToTestTemplate,
  flowToPlaywrightCode,
  validateFlow,
} from './lib/flowSerializer';

export {
  PALETTE_ITEMS,
  PALETTE_CATEGORIES,
  getPaletteItemsByCategory,
  getPaletteItemByType,
  getPaletteItemsByIntent,
} from './lib/palettes';

export type {
  StepType,
  QuestionIntent,
  FlowStep,
  FlowStepConfig,
  TestFlow,
  FlowMetadata,
  PaletteItem,
  FlowBuilderState,
} from './lib/flowTypes';
