'use client';

import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestCodeEditor } from './TestCodeEditor';
import { ScreenshotPreview } from './ScreenshotPreview';
import { ScenarioPreview } from './ScenarioPreview';
import { ScreenshotMetadata, TestScenario } from '@/lib/types';

interface StepReviewProps {
  screenshots: ScreenshotMetadata[];
  scenarios: TestScenario[];
  generatedCode: string;
  onCodeChange: (code: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export function StepReview({
  screenshots,
  scenarios,
  generatedCode,
  onCodeChange,
  onSave,
  onReset,
}: StepReviewProps) {
  return (
    <div className="space-y-6">
      {screenshots.length > 0 && <ScreenshotPreview screenshots={screenshots} />}

      {scenarios.length > 0 && <ScenarioPreview scenarios={scenarios} />}

      {generatedCode && <TestCodeEditor code={generatedCode} onChange={onCodeChange} onSave={onSave} />}

      <div className="flex items-center gap-4">
        <ThemedButton variant="secondary" size="lg" onClick={onReset}>Start Over</ThemedButton>
        <ThemedButton variant="glow" size="lg" fullWidth onClick={onSave}>Save Test Suite</ThemedButton>
      </div>
    </div>
  );
}
