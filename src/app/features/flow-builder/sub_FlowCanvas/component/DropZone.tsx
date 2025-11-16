'use client';

import { useTheme } from '@/lib/stores/appStore';
import type { DropZoneProps } from '../lib';

export function DropZone({
  index,
  isActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropZoneProps) {
  const { currentTheme } = useTheme();

  return (
    <div
      className={`h-1 rounded transition-all ${isActive ? 'h-8' : ''}`}
      style={{
        backgroundColor: isActive
          ? currentTheme.colors.primary + '20'
          : 'transparent',
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
    />
  );
}
