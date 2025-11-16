import {
  MousePointer2,
  Type,
  Link as LinkIcon,
  ChevronDown,
  Target,
} from 'lucide-react';
import { DetectedElement } from './types';

/**
 * Get icon component for element type
 */
export function getElementIcon(type: string) {
  switch (type) {
    case 'button':
      return <MousePointer2 className="w-4 h-4" />;
    case 'input':
      return <Type className="w-4 h-4" />;
    case 'link':
      return <LinkIcon className="w-4 h-4" />;
    case 'select':
      return <ChevronDown className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
}

/**
 * Get color for element type
 */
export function getTypeColor(type: string, fallbackColor: string): string {
  switch (type) {
    case 'button':
      return '#3b82f6';
    case 'input':
      return '#10b981';
    case 'link':
      return '#8b5cf6';
    case 'select':
      return '#f59e0b';
    default:
      return fallbackColor;
  }
}

/**
 * Filter elements based on search term and type
 */
export function filterElements(
  elements: DetectedElement[],
  searchTerm: string,
  selectedType: string
): DetectedElement[] {
  let filtered = elements;

  // Apply type filter
  if (selectedType !== 'all') {
    filtered = filtered.filter(el => el.type === selectedType);
  }

  // Apply search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(el =>
      el.selector.toLowerCase().includes(term) ||
      el.text?.toLowerCase().includes(term) ||
      el.placeholder?.toLowerCase().includes(term) ||
      el.ariaLabel?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Get unique element types from elements array
 */
export function getElementTypes(elements: DetectedElement[]): string[] {
  return ['all', ...new Set(elements.map(el => el.type))];
}

/**
 * Get count of elements by type
 */
export function getElementTypeCount(elements: DetectedElement[], type: string): number {
  if (type === 'all') {
    return elements.length;
  }
  return elements.filter(el => el.type === type).length;
}
