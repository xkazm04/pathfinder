'use client';

import { useTheme } from '@/lib/stores/appStore';
import { FileText } from 'lucide-react';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';

interface NLTestInputProps {
  description: string;
  targetUrl: string;
  viewport: string;
  onDescriptionChange: (value: string) => void;
  onTargetUrlChange: (value: string) => void;
  onViewportChange: (value: string) => void;
  viewportOptions: string[];
  disabled?: boolean;
}

export function NLTestInput({
  description,
  targetUrl,
  viewport,
  onDescriptionChange,
  onTargetUrlChange,
  onViewportChange,
  viewportOptions,
  disabled = false,
}: NLTestInputProps) {
  const { currentTheme } = useTheme();

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Describe Your Test"
        subtitle="Tell us what you want to test in plain English"
        icon={<FileText className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={`Example:\nTest the checkout flow on mobile:\n1. Go to the homepage\n2. Click "Shop Now"\n3. Add "Blue T-Shirt" to cart\n4. Proceed to checkout\n5. Fill in shipping information\n6. Complete the purchase`}
            rows={8}
            disabled={disabled}
            className="w-full px-4 py-3 rounded text-sm font-mono resize-none"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
              opacity: disabled ? 0.6 : 1,
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                Target URL
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => onTargetUrlChange(e.target.value)}
                placeholder="https://example.com"
                disabled={disabled}
                className="w-full px-4 py-2 rounded text-sm"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                  opacity: disabled ? 0.6 : 1,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                Viewport
              </label>
              <select
                value={viewport}
                onChange={(e) => onViewportChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-2 rounded text-sm"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {viewportOptions.map(vp => (
                  <option key={vp} value={vp}>{vp}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
