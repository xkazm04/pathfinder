'use client';

import { useTheme } from '@/lib/stores/appStore';
import { Target, Search, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-url' | 'no-scan' | 'no-results';
}

export function EmptyState({ type }: EmptyStateProps) {
  const { currentTheme } = useTheme();

  switch (type) {
    case 'no-url':
      return (
        <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Enter a target URL to scan for selectors</p>
        </div>
      );

    case 'no-scan':
      return (
        <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click &quot;Scan Page&quot; to detect interactive elements</p>
        </div>
      );

    case 'no-results':
      return (
        <div className="text-center py-8" style={{ color: currentTheme.colors.text.tertiary }}>
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No elements match your filters</p>
        </div>
      );

    default:
      return null;
  }
}

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  const { currentTheme } = useTheme();

  return (
    <div
      className="p-3 rounded mb-4 flex items-center gap-2"
      style={{
        backgroundColor: '#ef444410',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#ef444430',
      }}
    >
      <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
      <span className="text-sm" style={{ color: currentTheme.colors.text.primary }}>
        {error}
      </span>
    </div>
  );
}
