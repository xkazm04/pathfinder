'use client';

import { useTheme } from '@/lib/stores/appStore';
import { useTestBuilderSync, useTestFlow, useStepSelection } from '@/lib/stores/testBuilderStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { MessageSquare, Sparkles, CheckCircle } from 'lucide-react';
import { StepsList } from '@/app/features/nl-test/components/StepsList';

export function NaturalLanguageMode() {
  const { currentTheme } = useTheme();
  const { flow } = useTestFlow();
  const { naturalLanguageText, setNaturalLanguageText, isSyncing } = useTestBuilderSync();
  const { selectedStepId, setSelectedStepId } = useStepSelection();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Input Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* NL Description Input */}
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Natural Language Description"
            subtitle="Describe your test in plain English"
            icon={<MessageSquare className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <textarea
              value={naturalLanguageText}
              onChange={(e) => setNaturalLanguageText(e.target.value)}
              placeholder={`Example:\nTest the checkout flow:\n1. Navigate to homepage\n2. Click "Shop Now"\n3. Add "Blue T-Shirt" to cart\n4. Proceed to checkout\n5. Fill in shipping information\n6. Complete the purchase`}
              rows={12}
              disabled={isSyncing}
              className="w-full px-4 py-3 rounded text-sm font-mono resize-none"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
                opacity: isSyncing ? 0.6 : 1,
              }}
            />
          </ThemedCardContent>
        </ThemedCard>

        {/* Parsed Steps Preview */}
        {flow.steps.length > 0 && (
          <ThemedCard variant="bordered">
            <ThemedCardHeader
              title="Parsed Steps"
              subtitle="Auto-generated from your description"
              icon={<Sparkles className="w-5 h-5" />}
              action={
                <div className="flex items-center gap-2 text-xs" style={{ color: currentTheme.colors.accent }}>
                  <CheckCircle className="w-4 h-4" />
                  {flow.steps.length} steps detected
                </div>
              }
            />
            <ThemedCardContent>
              <StepsList
                steps={flow.steps}
                selectedStepId={selectedStepId}
                onStepClick={setSelectedStepId}
              />
            </ThemedCardContent>
          </ThemedCard>
        )}
      </div>

      {/* Sidebar - Tips */}
      <div className="space-y-6">
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Writing Tips"
            icon={<MessageSquare className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <ul className="space-y-3 text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Use numbered steps (1. , 2. , 3. ...)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Start with action verbs (Click, Navigate, Fill, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Put UI elements in quotes ("Submit button")</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Be specific about what to verify</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                <span>Include expected values for assertions</span>
              </li>
            </ul>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Example"
            icon={<Sparkles className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <pre
              className="text-xs p-3 rounded overflow-x-auto"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text.secondary,
                fontFamily: 'monospace',
              }}
            >
{`Test login flow:
1. Navigate to homepage
2. Click "Login" button
3. Fill "Email" with "test@example.com"
4. Fill "Password" with "password123"
5. Click "Submit"
6. Verify "Welcome" is visible`}
            </pre>
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
}
