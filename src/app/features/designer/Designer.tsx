'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { StepIndicator } from './components/StepIndicator';
import { StepSetup } from './components/StepSetup';
import { StepAnalysis } from './components/StepAnalysis';
import { StepReview } from './components/StepReview';
import { StepComplete } from './components/StepComplete';
import { ScreenshotMetadata, TestScenario } from '@/lib/types';
import { generateTestCode } from '@/lib/playwright/generateTestCode';
import { createTestSuite, saveTestCode } from '@/lib/supabase/testSuites';
import { AlertCircle } from 'lucide-react';

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
  const [estimatedDurationMs, setEstimatedDurationMs] = useState<number>(300000); // Default 5 minutes

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
      // Pre-scan site complexity for time estimation
      setProgressMessage('Analyzing site complexity...');
      setProgress(5);
      try {
        const complexityRes = await fetch('/api/analyze/complexity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (complexityRes.ok) {
          const complexityData = await complexityRes.json();
          setEstimatedDurationMs(complexityData.analysis.estimatedDurationMs);
          console.log('Site complexity analysis:', complexityData.analysis);
        }
      } catch (error) {
        console.warn('Complexity analysis failed, using default estimation:', error);
        setEstimatedDurationMs(300000); // Fallback to 5 minutes
      }

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
    setEstimatedDurationMs(300000); // Reset to default 5 minutes
  };

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>
          Visual Test Designer
        </h1>
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
        <StepSetup
          testSuiteName={testSuiteName}
          setTestSuiteName={setTestSuiteName}
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          description={description}
          setDescription={setDescription}
          errors={errors}
          onStartAnalysis={startAnalysis}
        />
      )}

      {currentStep === 'analyzing' && (
        <StepAnalysis progressMessage={progressMessage} estimatedDurationMs={estimatedDurationMs} />
      )}

      {currentStep === 'review' && (
        <StepReview
          screenshots={screenshots}
          scenarios={scenarios}
          generatedCode={generatedCode}
          onCodeChange={setGeneratedCode}
          onSave={handleSaveTests}
          onReset={resetWorkflow}
        />
      )}

      {currentStep === 'complete' && (
        <StepComplete
          testSuiteName={testSuiteName}
          onReset={resetWorkflow}
          onRunTests={() => {}}
        />
      )}
    </div>
  );
}
