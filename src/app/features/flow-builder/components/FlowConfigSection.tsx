'use client';

import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FileCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { TestFlow } from '../lib/flowTypes';

interface FlowConfigSectionProps {
  flow: TestFlow;
  isValid: boolean;
  errors: string[];
  onUpdateMetadata: (updates: Partial<TestFlow>) => void;
}

export function FlowConfigSection({
  flow,
  isValid,
  errors,
  onUpdateMetadata,
}: FlowConfigSectionProps) {
  const { currentTheme } = useTheme();

  return (
    <ThemedCard variant="bordered">
      <div className="relative">
        <ThemedCardHeader
          title="Flow Configuration"
          icon={<FileCode className="w-5 h-5" />}
          action={
            <div className="flex items-center gap-2">
              {isValid ? (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="error">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {errors.length} Error{errors.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          }
        />
        <ThemedCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Test Name"
              value={flow.name}
              onChange={(value) => onUpdateMetadata({ name: value })}
              placeholder="My Test Flow"
              required
              testId="flow-name-input"
            />

            <Input
              label="Target URL"
              type="url"
              value={flow.targetUrl || ''}
              onChange={(value) => onUpdateMetadata({ targetUrl: value })}
              placeholder="https://example.com"
              testId="flow-target-url-input"
            />

            <Input
              label="Description"
              value={flow.description}
              onChange={(value) => onUpdateMetadata({ description: value })}
              placeholder="Describe what this test does..."
              testId="flow-description-input"
            />
          </div>
        </ThemedCardContent>

        {/* Validation Errors - Positioned Absolute on Right */}
        {!isValid && (
          <div
            className="absolute top-16 right-4 p-3 rounded max-w-xs shadow-lg z-10"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: '#ef4444',
            }}
          >
            <p
              className="text-sm font-medium flex items-center gap-2 mb-2"
              style={{ color: '#ef4444' }}
            >
              <AlertTriangle className="w-4 h-4" />
              Validation Errors:
            </p>
            <ul className="space-y-1">
              {errors.map((error, idx) => (
                <li
                  key={idx}
                  className="text-xs"
                  style={{ color: currentTheme.colors.text.secondary }}
                >
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ThemedCard>
  );
}
