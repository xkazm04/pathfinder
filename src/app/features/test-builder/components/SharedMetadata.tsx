'use client';

import { useTheme } from '@/lib/stores/appStore';
import { useTestFlow } from '@/lib/stores/testBuilderStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/Badge';
import { Settings, CheckCircle, AlertTriangle } from 'lucide-react';

const VIEWPORTS = [
  'Mobile (375x667)',
  'iPhone SE (375x667)',
  'iPhone 12 (390x844)',
  'iPad (768x1024)',
  'Desktop HD (1920x1080)',
  'Desktop 2K (2560x1440)',
];

export function SharedMetadata() {
  const { currentTheme } = useTheme();
  const { flow, updateFlow } = useTestFlow();

  const isValid = flow.name && flow.targetUrl;

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Test Configuration"
        subtitle="These settings apply to both visual and natural language modes"
        icon={<Settings className="w-5 h-5" />}
        action={
          isValid ? (
            <Badge variant="success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="error">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Incomplete
            </Badge>
          )
        }
      />
      <ThemedCardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Test Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Test Name *
            </label>
            <input
              type="text"
              value={flow.name}
              onChange={(e) => updateFlow({ name: e.target.value })}
              placeholder="e.g., Login Flow Test"
              className="w-full px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: !flow.name ? '#ef4444' : currentTheme.colors.border,
              }}
            />
          </div>

          {/* Target URL */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Target URL *
            </label>
            <input
              type="url"
              value={flow.targetUrl}
              onChange={(e) => updateFlow({ targetUrl: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: !flow.targetUrl ? '#ef4444' : currentTheme.colors.border,
              }}
            />
          </div>

          {/* Viewport */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Viewport
            </label>
            <select
              value={flow.viewport}
              onChange={(e) => updateFlow({ viewport: e.target.value })}
              className="w-full px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            >
              {VIEWPORTS.map(vp => (
                <option key={vp} value={vp}>{vp}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
              Description
            </label>
            <textarea
              value={flow.description}
              onChange={(e) => updateFlow({ description: e.target.value })}
              placeholder="Brief description of what this test does..."
              rows={2}
              className="w-full px-4 py-2 rounded text-sm resize-none"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
              }}
            />
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
