'use client';

import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useNavigation } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import {
  Wand2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Code,
  FileText,
  Play,
  Save,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { useTestEngine } from '@/lib/nl-test/hooks/useTestEngine';
import type { TestTemplate, ExampleCategory } from '@/lib/nl-test/testEngine';
import { useAdaptiveDifficulty } from '@/app/features/nl-test/components/AdaptiveDifficultyContext';
import { AdaptiveDifficultyProvider } from '@/app/features/nl-test/components/AdaptiveDifficultyContext';
import { calculateDifficultyScore } from '@/app/features/nl-test/lib/difficultyScoring';

// Lazy load heavy components
const TestCodeEditor = lazy(() =>
  import('@/app/features/designer/components/TestCodeEditor').then(mod => ({ default: mod.TestCodeEditor }))
);
const PerformanceStats = lazy(() =>
  import('@/app/features/nl-test/components/PerformanceStats').then(mod => ({ default: mod.PerformanceStats }))
);
const AdaptivePromptSelector = lazy(() =>
  import('@/app/features/nl-test/components/AdaptivePromptSelector').then(mod => ({ default: mod.AdaptivePromptSelector }))
);
const DifficultyBadge = lazy(() =>
  import('@/app/features/nl-test/components/DifficultyBadge').then(mod => ({ default: mod.DifficultyBadge }))
);

const VIEWPORTS = [
  'Mobile (375x667)',
  'iPhone SE (375x667)',
  'iPhone 12 (390x844)',
  'iPad (768x1024)',
  'Desktop HD (1920x1080)',
  'Desktop 2K (2560x1440)',
];

function NLTestContent() {
  const { currentTheme } = useTheme();
  const { navigateTo } = useNavigation();
  const { userStats, startPrompt } = useAdaptiveDifficulty();

  // Use centralized test engine hook
  const testEngine = useTestEngine({ memoizeExamples: true, memoizeTemplates: true });

  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [viewport, setViewport] = useState('Desktop HD (1920x1080)');
  const [showExamples, setShowExamples] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAdaptive, setShowAdaptive] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [currentDifficulty, setCurrentDifficulty] = useState<ReturnType<typeof calculateDifficultyScore> | null>(null);

  const handleAnalyze = async () => {
    await testEngine.analyze(description, targetUrl);
  };

  const handleGenerate = async () => {
    await testEngine.generate(description, targetUrl, viewport);
  };

  const handleUseExample = (example: string) => {
    setDescription(example);
    setShowExamples(false);
    setShowAdaptive(false);

    // Calculate difficulty for this prompt
    const difficulty = calculateDifficultyScore(example, 'General');
    setCurrentDifficulty(difficulty);

    // Auto-analyze when example is selected
    setTimeout(() => {
      handleAnalyze();
    }, 500);
  };

  const handleUseAdaptivePrompt = (promptText: string) => {
    setDescription(promptText);
    setShowAdaptive(false);
    setShowExamples(false);

    // Calculate and set difficulty
    const difficulty = calculateDifficultyScore(promptText, 'General');
    setCurrentDifficulty(difficulty);

    // Track prompt start
    const stepCount = (promptText.match(/\d+\./g) || []).length;
    const estimatedTime = difficulty.overall * stepCount * 15;
    startPrompt(`adaptive-${Date.now()}`, estimatedTime);

    // Auto-analyze
    setTimeout(() => {
      handleAnalyze();
    }, 500);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const filled = testEngine.buildTemplate(selectedTemplate, templateValues);
    setDescription(filled);

    // Extract URL from template values if available
    const urlKey = selectedTemplate.placeholders.find(p => p.type === 'url')?.key;
    if (urlKey && templateValues[urlKey]) {
      setTargetUrl(templateValues[urlKey]);
    }

    setShowTemplates(false);
    setSelectedTemplate(null);
    setTemplateValues({});
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-3xl font-bold flex items-center gap-3"
            style={{ color: currentTheme.colors.text.primary }}
          >
            <Wand2 className="w-8 h-8" style={{ color: currentTheme.colors.primary }} />
            Natural Language Test Creation
          </h1>
          <p className="mt-2 text-lg" style={{ color: currentTheme.colors.text.secondary }}>
            Describe your test in plain English, and AI will generate the code
          </p>
        </div>

        <button
          onClick={() => navigateTo('flow-builder')}
          className="px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
          style={{
            backgroundColor: currentTheme.colors.accent,
            color: '#ffffff',
          }}
          data-testid="open-flow-builder-btn"
        >
          <Workflow className="w-4 h-4" />
          Visual Flow Builder
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Description Input */}
          <ThemedCard variant="bordered">
            <ThemedCardHeader
              title="Describe Your Test"
              subtitle="Tell us what you want to test in plain English"
              icon={<FileText className="w-5 h-5" />}
              action={
                <div className="flex gap-2 items-center">
                  {currentDifficulty && (
                    <Suspense fallback={<LoadingSpinner size="sm" />}>
                      <DifficultyBadge level={currentDifficulty.level} score={currentDifficulty.overall} showScore />
                    </Suspense>
                  )}
                  <button
                    onClick={() => {
                      setShowAdaptive(!showAdaptive);
                      setShowExamples(false);
                      setShowTemplates(false);
                    }}
                    className="text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                    style={{
                      backgroundColor: showAdaptive ? currentTheme.colors.primary : currentTheme.colors.surface,
                      color: showAdaptive ? '#ffffff' : currentTheme.colors.text.secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                    data-testid="toggle-adaptive-btn"
                  >
                    <TrendingUp className="w-3 h-3" />
                    {showAdaptive ? 'Hide' : 'AI'} Recommended
                  </button>
                  <button
                    onClick={() => {
                      setShowExamples(!showExamples);
                      setShowAdaptive(false);
                      setShowTemplates(false);
                    }}
                    className="text-xs px-3 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: showExamples ? currentTheme.colors.primary : currentTheme.colors.surface,
                      color: showExamples ? '#ffffff' : currentTheme.colors.text.secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                    data-testid="toggle-examples-btn"
                  >
                    {showExamples ? 'Hide' : 'Show'} Examples
                  </button>
                  <button
                    onClick={() => {
                      setShowTemplates(!showTemplates);
                      setShowAdaptive(false);
                      setShowExamples(false);
                    }}
                    className="text-xs px-3 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: showTemplates ? currentTheme.colors.primary : currentTheme.colors.surface,
                      color: showTemplates ? '#ffffff' : currentTheme.colors.text.secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                    data-testid="toggle-templates-btn"
                  >
                    {showTemplates ? 'Hide' : 'Show'} Templates
                  </button>
                </div>
              }
            />
            <ThemedCardContent>
              <div className="space-y-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Example:\nTest the checkout flow on mobile:\n1. Go to the homepage\n2. Click "Shop Now"\n3. Add "Blue T-Shirt" to cart\n4. Proceed to checkout\n5. Fill in shipping information\n6. Complete the purchase`}
                  rows={8}
                  className="w-full px-4 py-3 rounded text-sm font-mono"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
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
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 rounded text-sm"
                      style={{
                        backgroundColor: currentTheme.colors.surface,
                        color: currentTheme.colors.text.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: currentTheme.colors.border,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                      Viewport
                    </label>
                    <select
                      value={viewport}
                      onChange={(e) => setViewport(e.target.value)}
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
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={testEngine.analyzing || !description.trim()}
                    className="flex-1 px-6 py-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text.primary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                      opacity: (testEngine.analyzing || !description.trim()) ? 0.5 : 1,
                    }}
                    data-testid="analyze-description-btn"
                  >
                    {testEngine.analyzing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Description
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={testEngine.generating || !description.trim() || !targetUrl.trim()}
                    className="flex-1 px-6 py-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: currentTheme.colors.primary,
                      color: '#ffffff',
                      opacity: (testEngine.generating || !description.trim() || !targetUrl.trim()) ? 0.5 : 1,
                    }}
                    data-testid="generate-test-btn"
                  >
                    {testEngine.generating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Test Code
                      </>
                    )}
                  </button>
                </div>

                {(testEngine.analysisError || testEngine.generationError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg flex items-start gap-3"
                    style={{
                      backgroundColor: '#ef444410',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#ef444430',
                    }}
                    data-testid="error-message"
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                        Error
                      </p>
                      <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                        {testEngine.analysisError || testEngine.generationError}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </ThemedCardContent>
          </ThemedCard>

          {/* Analysis Results */}
          {testEngine.analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ThemedCard variant="bordered">
                <ThemedCardHeader
                  title="Analysis Results"
                  subtitle={`Confidence: ${testEngine.analysis.confidence}%`}
                  icon={<Sparkles className="w-5 h-5" />}
                  action={
                    testEngine.analysis.isValid ? (
                      <Badge variant="success">Valid</Badge>
                    ) : (
                      <Badge variant="error">Needs Review</Badge>
                    )
                  }
                />
                <ThemedCardContent>
                  <div className="space-y-4">
                    {/* Test Type */}
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                        Test Type:
                      </p>
                      <Badge variant="secondary">{testEngine.analysis.testType}</Badge>
                    </div>

                    {/* Parsed Steps */}
                    {testEngine.analysis.steps.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                          Parsed Steps:
                        </p>
                        <div className="space-y-2">
                          {testEngine.analysis.steps.map((step, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-3 rounded flex items-start gap-3"
                              style={{
                                backgroundColor: step.isAmbiguous ? '#f59e0b10' : currentTheme.colors.surface,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: step.isAmbiguous ? '#f59e0b30' : currentTheme.colors.border,
                              }}
                            >
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{
                                  backgroundColor: currentTheme.colors.primary + '20',
                                  color: currentTheme.colors.primary,
                                }}
                              >
                                {step.order}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm" style={{ color: currentTheme.colors.text.primary }}>
                                  {step.action} {step.target && `→ "${step.target}"`}
                                </p>
                                {step.clarification && (
                                  <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                                    ⚠️ {step.clarification}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {testEngine.analysis.warnings.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: currentTheme.colors.text.primary }}>
                          <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                          Warnings:
                        </p>
                        <ul className="space-y-1">
                          {testEngine.analysis.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {testEngine.analysis.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: currentTheme.colors.text.primary }}>
                          <Lightbulb className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
                          Suggestions:
                        </p>
                        <ul className="space-y-1">
                          {testEngine.analysis.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ThemedCardContent>
              </ThemedCard>
            </motion.div>
          )}

          {/* Generated Code */}
          {testEngine.generatedCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ThemedCard variant="bordered">
                <ThemedCardHeader
                  title="Generated Test Code"
                  subtitle={testEngine.testName}
                  icon={<Code className="w-5 h-5" />}
                  action={
                    <div className="flex gap-2">
                      <button
                        className="text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                        style={{
                          backgroundColor: currentTheme.colors.surface,
                          color: currentTheme.colors.text.secondary,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: currentTheme.colors.border,
                        }}
                        data-testid="save-test-btn"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        className="text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
                        style={{
                          backgroundColor: currentTheme.colors.primary,
                          color: '#ffffff',
                        }}
                        data-testid="run-test-btn"
                      >
                        <Play className="w-3 h-3" />
                        Run Test
                      </button>
                    </div>
                  }
                />
                <ThemedCardContent>
                  <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  }>
                    <TestCodeEditor
                      code={testEngine.generatedCode}
                      onChange={() => {}}
                      language="typescript"
                    />
                  </Suspense>
                </ThemedCardContent>
              </ThemedCard>
            </motion.div>
          )}
        </motion.div>

        {/* Sidebar - Adaptive, Examples & Templates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Performance Stats */}
          {userStats.totalAttempts > 0 && (
            <Suspense fallback={<div className="h-32" />}>
              <PerformanceStats stats={userStats} compact={false} />
            </Suspense>
          )}

          {/* AI-Recommended Prompts */}
          <AnimatePresence>
            {showAdaptive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Suspense fallback={
                  <ThemedCard variant="bordered">
                    <ThemedCardContent>
                      <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="md" />
                      </div>
                    </ThemedCardContent>
                  </ThemedCard>
                }>
                  <AdaptivePromptSelector onSelectPrompt={handleUseAdaptivePrompt} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Examples */}
          <AnimatePresence>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ThemedCard variant="bordered">
                  <ThemedCardHeader
                    title="Example Prompts"
                    subtitle="Click to use"
                    icon={<Lightbulb className="w-5 h-5" />}
                  />
                  <ThemedCardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {testEngine.examples.map((category: ExampleCategory, catIdx: number) => (
                        <motion.div
                          key={category.category}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: catIdx * 0.05 }}
                        >
                          <h3 className="text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                            {category.category}
                          </h3>
                          <div className="space-y-2">
                            {category.examples.map((example, idx) => (
                              <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (catIdx * category.examples.length + idx) * 0.02 }}
                                onClick={() => handleUseExample(example)}
                                className="w-full text-left px-3 py-2 rounded text-xs transition-all hover:scale-[1.02]"
                                style={{
                                  backgroundColor: currentTheme.colors.surface,
                                  color: currentTheme.colors.text.secondary,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  borderColor: currentTheme.colors.border,
                                }}
                                data-testid={`example-${category.category.toLowerCase().replace(/\s+/g, '-')}-${idx}`}
                              >
                                {example}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ThemedCardContent>
                </ThemedCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Templates */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ThemedCard variant="bordered">
                  <ThemedCardHeader
                    title="Test Templates"
                    subtitle="Pre-built test patterns"
                    icon={<FileText className="w-5 h-5" />}
                  />
                  <ThemedCardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {testEngine.templates.map((template, idx) => (
                        <motion.button
                          key={template.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => setSelectedTemplate(template)}
                          className="w-full text-left p-3 rounded transition-all hover:scale-[1.02]"
                          style={{
                            backgroundColor: selectedTemplate?.id === template.id
                              ? currentTheme.colors.primary + '20'
                              : currentTheme.colors.surface,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: selectedTemplate?.id === template.id
                              ? currentTheme.colors.primary
                              : currentTheme.colors.border,
                          }}
                          data-testid={`template-${template.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                                {template.name}
                              </p>
                              <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                                {template.description}
                              </p>
                            </div>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                        </motion.button>
                      ))}

                      {selectedTemplate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 rounded"
                          style={{
                            backgroundColor: currentTheme.colors.surface,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: currentTheme.colors.border,
                          }}
                        >
                          <h4 className="text-sm font-medium mb-3" style={{ color: currentTheme.colors.text.primary }}>
                            Fill Template Values
                          </h4>
                          <div className="space-y-3">
                            {selectedTemplate.placeholders.map((placeholder) => (
                              <div key={placeholder.key}>
                                <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text.secondary }}>
                                  {placeholder.label}{placeholder.required && '*'}
                                </label>
                                <input
                                  type={placeholder.type === 'url' ? 'url' : placeholder.type === 'number' ? 'number' : 'text'}
                                  value={templateValues[placeholder.key] || ''}
                                  onChange={(e) => setTemplateValues({
                                    ...templateValues,
                                    [placeholder.key]: e.target.value,
                                  })}
                                  placeholder={placeholder.placeholder}
                                  className="w-full px-3 py-2 rounded text-xs"
                                  style={{
                                    backgroundColor: currentTheme.colors.background,
                                    color: currentTheme.colors.text.primary,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: currentTheme.colors.border,
                                  }}
                                />
                              </div>
                            ))}
                            <button
                              onClick={handleUseTemplate}
                              className="w-full px-4 py-2 rounded text-sm font-medium transition-colors"
                              style={{
                                backgroundColor: currentTheme.colors.primary,
                                color: '#ffffff',
                              }}
                              data-testid="use-template-btn"
                            >
                              Use Template
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ThemedCardContent>
                </ThemedCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <ThemedCard variant="bordered">
            <ThemedCardHeader
              title="Tips for Better Results"
              icon={<Lightbulb className="w-5 h-5" />}
            />
            <ThemedCardContent>
              <ul className="space-y-2 text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                  <span>Break down your test into numbered steps</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                  <span>Be specific about UI elements (buttons, links, forms)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                  <span>Include expected outcomes and assertions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                  <span>Mention exact text for buttons and links</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: currentTheme.colors.accent }} />
                  <span>Use examples and templates as starting points</span>
                </li>
              </ul>
            </ThemedCardContent>
          </ThemedCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Main component with provider
export function NLTest() {
  return (
    <AdaptiveDifficultyProvider>
      <NLTestContent />
    </AdaptiveDifficultyProvider>
  );
}
