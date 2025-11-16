'use client';

import { useTheme } from '@/lib/stores/appStore';
import { ArrowRight } from 'lucide-react';

export function EmptyState() {
  const { currentTheme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderWidth: '2px',
          borderStyle: 'dashed',
          borderColor: currentTheme.colors.border,
        }}
      >
        <ArrowRight
          className="w-8 h-8"
          style={{ color: currentTheme.colors.text.tertiary }}
        />
      </div>
      <p
        className="text-lg font-medium mb-2"
        style={{ color: currentTheme.colors.text.secondary }}
      >
        Drag steps here to build your test flow
      </p>
      <p
        className="text-sm"
        style={{ color: currentTheme.colors.text.tertiary }}
      >
        Choose actions, assertions, and utilities from the palette
      </p>
    </div>
  );
}
