'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { StepSetup } from './components/StepSetup';
import { StepAnalysis } from './components/StepAnalysis';
import { StepReview } from './components/StepReview';
import { StepComplete } from './components/StepComplete';
import { SuiteControls } from './components/SuiteControls';
import { ScreenshotMetadata, TestScenario, MascotConfig, CodeLanguage, PreviewMode, TestSuite } from '@/lib/types';
import { generateTestCode } from '@/lib/playwright/generateTestCode';
import { getTestSuites, getTestSuite, getLatestTestCode } from '@/lib/supabase/testSuites';
import { getSuiteScreenshots, getTestScenarios } from '@/lib/supabase/suiteAssets';
import { AlertCircle } from 'lucide-react';
import { MascotAvatar } from '@/app/features/designer/sub_Mascot/components/MascotAvatar';
import { inferMascotType } from '@/app/features/designer/sub_Mascot/lib/mascotGenerator';

type WorkflowStep = 'setup' | 'analyzing' | 'review' | 'complete';
export function Designer() {
  const { currentTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('setup');
  const [testSuiteName, setTestSuiteName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('typescript');
  const [mascotConfig, setMascotConfig] = useState<MascotConfig>({
    type: 'robot',
    colorScheme: 'default',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screenshots, setScreenshots] = useState<ScreenshotMetadata[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [savedSuiteId, setSavedSuiteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedDurationMs, setEstimatedDurationMs] = useState<number>(300000); // Default 5 minutes
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('lightweight');

  // Suite management state
  const [availableSuites, setAvailableSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);

  // Load preview mode preference from localStorage
  useEffect(() => {
    const savedPreviewMode = localStorage.getItem('pathfinder-preview-mode');
    if (savedPreviewMode === 'lightweight' || savedPreviewMode === 'full') {
      setPreviewMode(savedPreviewMode);
    }
  }, []);

  // Save preview mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('pathfinder-preview-mode', previewMode);
  }, [previewMode]);

  // Auto-infer mascot type when test suite name or description changes
  useEffect(() => {
    if (testSuiteName && mascotConfig.colorScheme === 'default') {
      const inferredType = inferMascotType(testSuiteName, description);
      if (inferredType !== mascotConfig.type) {
        setMascotConfig((prev) => ({ ...prev, type: inferredType }));
      }
    }
  }, [testSuiteName, description]);

  // Load available test suites on mount
  useEffect(() => {
    loadSuites();
  }, []);

  const loadSuites = async () => {
    try {
      setIsLoadingSuites(true);
      const suites = await getTestSuites();
      setAvailableSuites(suites);
    } catch (err) {
      // Failed to load test suites - silently handle
    } finally {
      setIsLoadingSuites(false);
    }
  };

  const loadSuiteData = async (suiteId: string) => {
    try {
      setIsLoadingSuites(true);
      setError(null);

      // Load suite metadata
      const suite = await getTestSuite(suiteId);
      if (!suite) {
        throw new Error('Suite not found');
      }

      // Load latest test code
      const code = await getLatestTestCode(suiteId);

      // Load screenshots
      const suiteScreenshots = await getSuiteScreenshots(suiteId);
      setScreenshots(suiteScreenshots);

      // Load test scenarios
      const suiteScenarios = await getTestScenarios(suiteId);
      setScenarios(suiteScenarios);

      // Populate form with suite data
      setTestSuiteName(suite.name);
      setTargetUrl(suite.target_url);
      setDescription(suite.description || '');
      if (suite.mascot_config) {
        setMascotConfig(suite.mascot_config);
      }

      if (code) {
        setGeneratedCode(code.code);
        setCodeLanguage(code.language);
        // Skip directly to review step if code exists
        setCurrentStep('review');
      } else {
        // No code yet, stay in setup
        setCurrentStep('setup');
      }

      setSelectedSuiteId(suiteId);
    } catch (err) {
      // Failed to load suite data
      setError((err as Error).message);
    } finally {
      setIsLoadingSuites(false);
    }
  };

  const handleNewSuite = () => {
    resetWorkflow();
    setSelectedSuiteId('');
  };

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
          const baseEstimation = complexityData.analysis.estimatedDurationMs;
          // If lightweight mode, reduce estimation to 1/3 of original
          const adjustedEstimation = previewMode === 'lightweight' ? Math.floor(baseEstimation / 3) : baseEstimation;
          setEstimatedDurationMs(adjustedEstimation);
        }
      } catch (error) {
        // Complexity analysis failed, using default estimation
        // Fallback: 5 minutes for full, ~1.67 minutes for lightweight
        const fallbackEstimation = previewMode === 'lightweight' ? 100000 : 300000;
        setEstimatedDurationMs(fallbackEstimation);
      }

      setProgressMessage(previewMode === 'lightweight' ? 'Capturing lightweight previews...' : 'Capturing full screenshots...');
      setProgress(10);
      const screenshotRes = await fetch('/api/screenshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, previewMode }),
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
      const receivedScenarios = analysisData.scenarios || [];
      setScenarios(receivedScenarios);
      setProgress(70);

      setProgressMessage('Generating Playwright test code...');
      const code = generateTestCode(testSuiteName, targetUrl, receivedScenarios, codeLanguage);
      setGeneratedCode(code);
      setProgress(100);

      setTimeout(() => setCurrentStep('review'), 500);
    } catch (err) {
      // Analysis error
      setError((err as Error).message);
      setCurrentStep('setup');
    }
  };

  const handleSaveComplete = (suiteId: string, branchId: string) => {
    setSavedSuiteId(suiteId);
    setSelectedSuiteId(suiteId);
    setSelectedBranchId(branchId);
    setCurrentStep('complete');
  };

  const handleSaveError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const resetWorkflow = () => {
    setCurrentStep('setup');
    setTestSuiteName('');
    setTargetUrl('');
    setDescription('');
    setCodeLanguage('typescript');
    setMascotConfig({ type: 'robot', colorScheme: 'default' });
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {testSuiteName && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              data-testid="designer-mascot"
            >
              <MascotAvatar config={mascotConfig} size="xl" animate={true} />
            </motion.div>
          )}
          <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg"
                style={{ color: currentTheme.colors.text.secondary }}
              >
                {testSuiteName || 'New Test Suite'}
              </motion.p>
          </div>
        </div>
        {/* Suite Management Controls */}
        <SuiteControls
          availableSuites={availableSuites}
          selectedSuiteId={selectedSuiteId}
          sortOrder={sortOrder}
          isLoadingSuites={isLoadingSuites}
          onSelectSuite={loadSuiteData}
          onNewSuite={handleNewSuite}
        />
      </motion.div>
      {error && (
        <ThemedCard variant="bordered">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
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
          mascotConfig={mascotConfig}
          setMascotConfig={setMascotConfig}
          codeLanguage={codeLanguage}
          setCodeLanguage={setCodeLanguage}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
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
          codeLanguage={codeLanguage}
          targetUrl={targetUrl}
          testSuiteName={testSuiteName}
          description={description}
          mascotConfig={mascotConfig}
          onCodeChange={setGeneratedCode}
          onSaveComplete={handleSaveComplete}
          onSaveError={handleSaveError}
          onReset={resetWorkflow}
          onReloadSuites={loadSuites}
        />
      )}

      {currentStep === 'complete' && (
        <StepComplete
          testSuiteName={testSuiteName}
          targetUrl={targetUrl}
          codeLanguage={codeLanguage}
          generatedCode={generatedCode}
          onReset={resetWorkflow}
          onRunTests={() => {}}
        />
      )}
    </div>
  );
}
