'use client';

import { useState } from 'react';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestCodeEditor } from './TestCodeEditor';
import { ScreenshotPreview } from './ScreenshotPreview';
import { ScenarioPreview } from './ScenarioPreview';
import { MiniTestRunner } from './MiniTestRunner';
import { ScreenshotMetadata, TestScenario } from '@/lib/types';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { Play, Code } from 'lucide-react';

interface StepReviewProps {
  screenshots: ScreenshotMetadata[];
  scenarios: TestScenario[];
  generatedCode: string;
  targetUrl?: string;
  onCodeChange: (code: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export function StepReview({
  screenshots,
  scenarios,
  generatedCode,
  targetUrl = '',
  onCodeChange,
  onSave,
  onReset,
}: StepReviewProps) {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  return (
    <div className="space-y-6">
      {screenshots.length > 0 && <ScreenshotPreview screenshots={screenshots} />}

      {scenarios.length > 0 && <ScenarioPreview scenarios={scenarios} />}

      {/* Tab Switcher */}
      {generatedCode && (
        <div className="flex items-center gap-2 border-b" style={{ borderColor: currentTheme.colors.border }}>
          <button
            onClick={() => setActiveTab('preview')}
            className="flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative"
            style={{
              color: activeTab === 'preview' ? currentTheme.colors.accent : currentTheme.colors.text.secondary,
            }}
            data-testid="preview-tab-btn"
          >
            <Play size={16} />
            Live Preview
            {activeTab === 'preview' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: currentTheme.colors.accent }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className="flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative"
            style={{
              color: activeTab === 'code' ? currentTheme.colors.accent : currentTheme.colors.text.secondary,
            }}
            data-testid="code-tab-btn"
          >
            <Code size={16} />
            Generated Code
            {activeTab === 'code' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: currentTheme.colors.accent }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>
      )}

      {/* Tab Content */}
      {generatedCode && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'preview' && (
            <MiniTestRunner generatedCode={generatedCode} targetUrl={targetUrl} />
          )}
          {activeTab === 'code' && (
            <TestCodeEditor code={generatedCode} onChange={onCodeChange} onSave={onSave} />
          )}
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <ThemedButton variant="secondary" size="lg" onClick={onReset} data-testid="start-over-btn">
          Start Over
        </ThemedButton>
        <ThemedButton variant="glow" size="lg" fullWidth onClick={onSave} data-testid="save-test-suite-btn">
          Save Test Suite
        </ThemedButton>
      </div>
    </div>
  );
}
