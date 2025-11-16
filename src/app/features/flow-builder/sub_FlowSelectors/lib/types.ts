/**
 * Detected element from page scan
 */
export interface DetectedElement {
  type: 'button' | 'input' | 'link' | 'select' | 'text' | 'other';
  selector: string;
  text?: string;
  placeholder?: string;
  role?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Props for TestSelectors component
 */
export interface TestSelectorsProps {
  targetUrl: string;
  onSelectSelector?: (selector: string, elementInfo: DetectedElement) => void;
}

/**
 * Filter state for element filtering
 */
export interface FilterState {
  searchTerm: string;
  selectedType: string;
}
