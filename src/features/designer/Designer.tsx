'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { TestCodeEditor } from './components/TestCodeEditor';
import { ScreenshotPreview } from './components/ScreenshotPreview';
import { StepIndicator } from './components/StepIndicator';
import { ScenarioPreview } from './components/ScenarioPreview';
import { ScreenshotMetadata, TestScenario } from '@/lib/types';
import { generateTestCode } from '@/lib/playwright/generateTestCode';
import { createTestSuite, saveTestCode } from '@/lib/supabase/testSuites';
import { Wand2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type WorkflowStep = 'setup' | 'analyzing' | 'review' | 'complete';

const STEPS = [
  { id: 'setup', label: 'Setup', description: 'Configure test suite' },
  { id: 'analyzing', label: 'Analyzing', description: 'AI analysis in progress' },
  { id: 'review', label: 'Review', description: 'Review and edit' },
  { id: 'complete', label: 'Complete', description: 'Save and run' },
];

export function Designer() {
  const { currentTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('setup');
  const [testSuiteName, setTestSuiteName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screenshots, setScreenshots] = useState<ScreenshotMetadata[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [savedSuiteId, setSavedSuiteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!testSuiteName || testSuiteName.length < 3) {
      newErrors.testSuiteName = 'Test suite name must be at least 3 characters';
    }
    if (!targetUrl) {
      newErrors.targetUrl = 'Target URL is required';
    } else {
      try {
        const url = new URL(targetUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          newErrors.targetUrl = 'URL must use HTTP or HTTPS protocol';
        }
      } catch {
        newErrors.targetUrl = 'Invalid URL format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startAnalysis = async () => {
    if (!validateForm()) return;
    setCurrentStep('analyzing');
    setProgress(0);
    setError(null);

    try {
      setProgressMessage('Capturing screenshots across viewports...');
      setProgress(10);
      const screenshotRes = await fetch('/api/screenshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!screenshotRes.ok) {
        const errorData = await screenshotRes.json();
        throw new Error(errorData.error || 'Screenshot capture failed');
      }

      const screenshotData = await screenshotRes.json();
      setScreenshots(screenshotData.screenshots);
      setProgress(40);

      setProgressMessage('AI analyzing page structure...');
      const analysisRes = await fetch('/api/gemini/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          screenshots: screenshotData.screenshots,
          codeAnalysis: null,
        }),
      });

      if (!analysisRes.ok) {
        const errorData = await analysisRes.json();
        throw new Error(errorData.error || 'AI analysis failed');
      }

      const analysisData = await analysisRes.json();
      setScenarios(analysisData.scenarios);
      setProgress(70);

      setProgressMessage('Generating Playwright test code...');
      const code = generateTestCode(testSuiteName, targetUrl, analysisData.scenarios);
      setGeneratedCode(code);
      setProgress(100);

      setTimeout(() => setCurrentStep('review'), 500);
    } catch (err) {
      console.error('Analysis error:', err);
      setError((err as Error).message);
      setCurrentStep('setup');
    }
  };

  const handleSaveTests = async () => {
    try {
      const suiteId = await createTestSuite({
        name: testSuiteName,
        target_url: targetUrl,
        description,
      });
      await saveTestCode(suiteId, generatedCode);
      setSavedSuiteId(suiteId);
      setCurrentStep('complete');
    } catch (err) {
      console.error('Save error:', err);
      setError((err as Error).message);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep('setup');
    setTestSuiteName('');
    setTargetUrl('');
    setDescription('');
    setScreenshots([]);
    setScenarios([]);
    setGeneratedCode('');
    setProgress(0);
    setProgressMessage('');
    setSavedSuiteId(null);
    setError(null);
    setErrors({});
  };

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
          Visual Test Designer
        </h1>
        <p className="text-lg" style={{ color: currentTheme.colors.text.tertiary }}>
          AI-powered test generation from screenshots
        </p>
      </motion.div>

      {/* UI Improvement 1: Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {error && (
        <ThemedCard variant="bordered">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: currentTheme.colors.text.primary }}>Error</h3>
              <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>{error}</p>
            </div>
          </div>
        </ThemedCard>
      )}

      {currentStep === 'setup' && (
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

              <ThemedButton variant="glow" size="lg" fullWidth onClick={startAnalysis} leftIcon={<Wand2 className="w-5 h-5" />}>
                Analyze & Generate Tests
              </ThemedButton>
            </div>
          </ThemedCardContent>
        </ThemedCard>
      )}

      {currentStep === 'analyzing' && (
        <ThemedCard variant="glow">
          <div className="p-8 space-y-6">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: currentTheme.colors.accent }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>{progressMessage}</h2>
              <p className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>This may take a few moments...</p>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: currentTheme.colors.surface }}>
              <motion.div className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${currentTheme.colors.primary}, ${currentTheme.colors.accent})`,
                  boxShadow: `0 0 10px ${currentTheme.colors.accent}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center text-sm font-medium" style={{ color: currentTheme.colors.text.secondary }}>{progress}% Complete</p>
          </div>
        </ThemedCard>
      )}

      {currentStep === 'review' && (
        <div className="space-y-6">
          {screenshots.length > 0 && <ScreenshotPreview screenshots={screenshots} />}

          {/* UI Improvement 2: Scenario Preview */}
          {scenarios.length > 0 && <ScenarioPreview scenarios={scenarios} />}

          {generatedCode && <TestCodeEditor code={generatedCode} onChange={setGeneratedCode} onSave={handleSaveTests} />}

          <div className="flex items-center gap-4">
            <ThemedButton variant="secondary" size="lg" onClick={resetWorkflow}>Start Over</ThemedButton>
            <ThemedButton variant="glow" size="lg" fullWidth onClick={handleSaveTests}>Save Test Suite</ThemedButton>
          </div>
        </div>
      )}

      {currentStep === 'complete' && (
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
              <ThemedButton variant="secondary" size="lg" onClick={resetWorkflow}>Create Another</ThemedButton>
              <ThemedButton variant="primary" size="lg" onClick={() => {}}>Run Tests</ThemedButton>
            </div>
          </div>
        </ThemedCard>
      )}
    </div>
  );
}
