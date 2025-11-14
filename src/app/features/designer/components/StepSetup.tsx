'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Wand2 } from 'lucide-react';

interface StepSetupProps {
  testSuiteName: string;
  setTestSuiteName: (value: string) => void;
  targetUrl: string;
  setTargetUrl: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  errors: Record<string, string>;
  onStartAnalysis: () => void;
}

export function StepSetup({
  testSuiteName,
  setTestSuiteName,
  targetUrl,
  setTargetUrl,
  description,
  setDescription,
  errors,
  onStartAnalysis,
}: StepSetupProps) {
  const { currentTheme } = useTheme();

  return (
    <ThemedCard variant="glow">
      <ThemedCardHeader title="Test Suite Setup" subtitle="Configure your test suite" icon={<Wand2 className="w-5 h-5" />} />
      <ThemedCardContent>
        <div className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.secondary }}>
              Test Suite Name *
            </label>
            <input
              type="text"
              value={testSuiteName}
              onChange={(e) => setTestSuiteName(e.target.value)}
              placeholder="e.g., Homepage Tests"
              className="w-full px-4 py-3 rounded-lg transition-colors"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: errors.testSuiteName ? '#ef4444' : currentTheme.colors.border,
                color: currentTheme.colors.text.primary,
              }}
            />
            {errors.testSuiteName && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.testSuiteName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.secondary }}>
              Target URL *
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-lg transition-colors"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: errors.targetUrl ? '#ef4444' : currentTheme.colors.border,
                color: currentTheme.colors.text.primary,
              }}
            />
            {errors.targetUrl && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.targetUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.secondary }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this test suite covers..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg transition-colors resize-none"
              style={{
                backgroundColor: currentTheme.colors.surface,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text.primary,
              }}
            />
          </div>

          <ThemedButton variant="glow" size="lg" fullWidth onClick={onStartAnalysis} leftIcon={<Wand2 className="w-5 h-5" />}>
            Analyze & Generate Tests
          </ThemedButton>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
