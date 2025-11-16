// Types
export type { DetectedElement, TestSelectorsProps, FilterState } from './types';

// Element helpers
export {
  getElementIcon,
  getTypeColor,
  filterElements,
  getElementTypes,
  getElementTypeCount,
} from './elementHelpers';

// API
export { detectSelectors } from './selectorDetection';
