'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { CheckCircle2 } from 'lucide-react';

interface StepCompleteProps {
  testSuiteName: string;
  onReset: () => void;
  onRunTests: () => void;
}

export function StepComplete({ testSuiteName, onReset, onRunTests }: StepCompleteProps) {
  const { currentTheme } = useTheme();

  return (
    <ThemedCard variant="glow">
      <div className="p-8 text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 mx-auto" style={{ color: '#22c55e' }} />
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>Test Suite Created!</h2>
          <p className="text-lg" style={{ color: currentTheme.colors.text.secondary }}>
            Your test suite &quot;{testSuiteName}&quot; has been saved successfully.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <ThemedButton variant="secondary" size="lg" onClick={onReset}>Create Another</ThemedButton>
          <ThemedButton variant="primary" size="lg" onClick={onRunTests}>Run Tests</ThemedButton>
        </div>
      </div>
    </ThemedCard>
  );
}
