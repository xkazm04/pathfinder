'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import MainLayout from '@/components/layout/MainLayout';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { TestCodeEditor } from '@/components/designer/TestCodeEditor';
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
} from 'lucide-react';
import { EXAMPLE_PROMPTS, type ExampleCategory } from '@/lib/nl-test/examplePrompts';
import {
  TEST_TEMPLATES,
  getTemplateCategories,
  fillTemplate,
  type TestTemplate,
} from '@/lib/nl-test/testTemplates';
import type { IntentAnalysis } from '@/lib/nl-test/intentAnalyzer';

const VIEWPORTS = [
  'Mobile (375x667)',
  'iPhone SE (375x667)',
  'iPhone 12 (390x844)',
  'iPad (768x1024)',
  'Desktop HD (1920x1080)',
  'Desktop 2K (2560x1440)',
];

export default function NLTestPage() {
  const { currentTheme } = useTheme();
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [viewport, setViewport] = useState('Desktop HD (1920x1080)');
  const [generatedCode, setGeneratedCode] = useState('');
  const [testName, setTestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<IntentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please enter a test description');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysis(null);

      const response = await fetch('/api/gemini/analyze-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, targetUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze intent');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a test description');
      return;
    }

    if (!targetUrl.trim()) {
      setError('Please enter a target URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedCode('');

      const response = await fetch('/api/gemini/nl-to-playwright', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          targetUrl,
          viewport,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test code');
      }

      setGeneratedCode(data.code);
      setTestName(data.testName);

      // Show success message if provided
      if (data.message) {
        console.log(data.message);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExample = (example: string) => {
    setDescription(example);
    setShowExamples(false);
    // Auto-analyze when example is selected
    setTimeout(() => {
      handleAnalyze();
    }, 500);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const filled = fillTemplate(selectedTemplate, templateValues);
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
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Input */}
            <ThemedCard variant="bordered">
              <ThemedCardHeader
                title="Describe Your Test"
                subtitle="Tell us what you want to test in plain English"
                icon={<FileText className="w-5 h-5" />}
                action={
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowExamples(!showExamples)}
                      className="text-xs px-3 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: showExamples ? currentTheme.colors.primary : currentTheme.colors.surface,
                        color: showExamples ? '#ffffff' : currentTheme.colors.text.secondary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: currentTheme.colors.border,
                      }}
                    >
                      {showExamples ? 'Hide' : 'Show'} Examples
                    </button>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-xs px-3 py-1 rounded transition-colors"
                      style={{
                        backgroundColor: showTemplates ? currentTheme.colors.primary : currentTheme.colors.surface,
                        color: showTemplates ? '#ffffff' : currentTheme.colors.text.secondary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: currentTheme.colors.border,
                      }}
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
                      disabled={analyzing || !description.trim()}
                      className="flex-1 px-6 py-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: currentTheme.colors.surface,
                        color: currentTheme.colors.text.primary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: currentTheme.colors.border,
                        opacity: (analyzing || !description.trim()) ? 0.5 : 1,
                      }}
                    >
                      {analyzing ? (
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
                      disabled={loading || !description.trim() || !targetUrl.trim()}
                      className="flex-1 px-6 py-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: '#ffffff',
                        opacity: (loading || !description.trim() || !targetUrl.trim()) ? 0.5 : 1,
                      }}
                    >
                      {loading ? (
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

                  {error && (
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
                    >
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                          Error
                        </p>
                        <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ThemedCardContent>
            </ThemedCard>

            {/* Analysis Results */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ThemedCard variant="bordered">
                  <ThemedCardHeader
                    title="Analysis Results"
                    subtitle={`Confidence: ${analysis.confidence}%`}
                    icon={<Sparkles className="w-5 h-5" />}
                    action={
                      analysis.isValid ? (
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
                        <Badge variant="secondary">{analysis.testType}</Badge>
                      </div>

                      {/* Parsed Steps */}
                      {analysis.steps.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                            Parsed Steps:
                          </p>
                          <div className="space-y-2">
                            {analysis.steps.map((step, idx) => (
                              <div
                                key={idx}
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {analysis.warnings.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: currentTheme.colors.text.primary }}>
                            <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                            Warnings:
                          </p>
                          <ul className="space-y-1">
                            {analysis.warnings.map((warning, idx) => (
                              <li key={idx} className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {analysis.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: currentTheme.colors.text.primary }}>
                            <Lightbulb className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
                            Suggestions:
                          </p>
                          <ul className="space-y-1">
                            {analysis.suggestions.map((suggestion, idx) => (
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
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ThemedCard variant="bordered">
                  <ThemedCardHeader
                    title="Generated Test Code"
                    subtitle={testName}
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
                        >
                          <Play className="w-3 h-3" />
                          Run Test
                        </button>
                      </div>
                    }
                  />
                  <ThemedCardContent>
                    <TestCodeEditor
                      code={generatedCode}
                      onChange={setGeneratedCode}
                      language="typescript"
                    />
                  </ThemedCardContent>
                </ThemedCard>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Examples & Templates */}
          <div className="space-y-6">
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
                        {EXAMPLE_PROMPTS.map((category: ExampleCategory) => (
                          <div key={category.category}>
                            <h3 className="text-sm font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                              {category.category}
                            </h3>
                            <div className="space-y-2">
                              {category.examples.map((example, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleUseExample(example)}
                                  className="w-full text-left px-3 py-2 rounded text-xs transition-all hover:scale-[1.02]"
                                  style={{
                                    backgroundColor: currentTheme.colors.surface,
                                    color: currentTheme.colors.text.secondary,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: currentTheme.colors.border,
                                  }}
                                >
                                  {example}
                                </button>
                              ))}
                            </div>
                          </div>
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
                        {TEST_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
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
                          </button>
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
