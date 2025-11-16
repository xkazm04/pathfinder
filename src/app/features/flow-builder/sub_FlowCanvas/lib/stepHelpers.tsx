import {
  ArrowRight,
  MousePointer,
  Type,
  List,
  Move,
  CheckCircle,
  Eye,
  Camera,
  Clock,
} from 'lucide-react';

/**
 * Icon map for step types
 */
export const STEP_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  ArrowRight,
  MousePointer,
  Type,
  List,
  Move,
  CheckCircle,
  Eye,
  Camera,
  Clock,
};

/**
 * Get icon name for step type
 */
export function getStepIconName(type: string): string {
  const iconMapping: Record<string, string> = {
    navigate: 'ArrowRight',
    click: 'MousePointer',
    fill: 'Type',
    select: 'List',
    hover: 'Move',
    assert: 'CheckCircle',
    verify: 'Eye',
    screenshot: 'Camera',
    wait: 'Clock',
  };
  return iconMapping[type] || 'ArrowRight';
}

/**
 * Get icon component for step type
 */
export function getStepIcon(type: string) {
  const iconName = getStepIconName(type);
  return STEP_ICON_MAP[iconName];
}

/**
 * Get color for step type
 */
export function getStepColor(type: string): string {
  const colorMapping: Record<string, string> = {
    navigate: '#3b82f6',
    click: '#8b5cf6',
    fill: '#10b981',
    select: '#f59e0b',
    hover: '#06b6d4',
    assert: '#22c55e',
    verify: '#0ea5e9',
    screenshot: '#ec4899',
    wait: '#a855f7',
  };
  return colorMapping[type] || '#6b7280';
}

/**
 * Sort steps by order
 */
export function sortSteps<T extends { order: number }>(steps: T[]): T[] {
  return [...steps].sort((a, b) => a.order - b.order);
}
