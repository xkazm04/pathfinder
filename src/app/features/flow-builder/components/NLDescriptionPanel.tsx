'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { MessageSquare, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FlowStep } from '../lib/flowTypes';

interface NLDescriptionPanelProps {
  steps: FlowStep[];
  nlDescription: string;
  onNLDescriptionChange: (text: string) => void;
  onSyncFromSteps: () => void;
  onSyncToSteps: () => void;
  isSyncing?: boolean;
}

export function NLDescriptionPanel({
  steps,
  nlDescription,
  onNLDescriptionChange,
  onSyncFromSteps,
  onSyncToSteps,
  isSyncing = false,
}: NLDescriptionPanelProps) {
  const { currentTheme } = useTheme();

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="Natural Language"
        subtitle="Describe test in plain text"
        icon={<MessageSquare className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="space-y-3">
          {/* Textarea */}
          <textarea
            value={nlDescription}
            onChange={(e) => onNLDescriptionChange(e.target.value)}
            placeholder={`Example:
1. Navigate to homepage
2. Click "Login" button
3. Fill "Email" with "test@example.com"
4. Click "Submit"
5. Verify "Welcome" is visible`}
            rows={10}
            disabled={isSyncing}
            className="w-full px-3 py-2 rounded text-sm font-mono resize-none"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
              opacity: isSyncing ? 0.6 : 1,
            }}
          />

          {/* Sync Buttons */}
          <div className="space-y-2">
            <button
              onClick={onSyncFromSteps}
              disabled={isSyncing || steps.length === 0}
              className="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: currentTheme.colors.primary + '20',
                color: currentTheme.colors.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.primary + '40',
                opacity: isSyncing || steps.length === 0 ? 0.5 : 1,
              }}
            >
              {isSyncing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Syncing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-3.5 h-3.5" />
                  Generate from Steps
                </>
              )}
            </button>

            <button
              onClick={onSyncToSteps}
              disabled={isSyncing || !nlDescription.trim()}
              className="w-full px-3 py-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
                opacity: isSyncing || !nlDescription.trim() ? 0.5 : 1,
              }}
            >
              {isSyncing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Parse to Steps
                </>
              )}
            </button>
          </div>

          {/* Tips */}
          <div
            className="p-3 rounded text-xs space-y-2"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
            }}
          >
            <p className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
              Tips:
            </p>
            <ul className="space-y-1" style={{ color: currentTheme.colors.text.secondary }}>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Use numbered steps</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Start with action verbs</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Put UI elements in quotes</span>
              </li>
            </ul>
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
