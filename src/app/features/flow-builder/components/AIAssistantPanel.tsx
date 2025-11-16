'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeIntent, type IntentAnalysis } from '@/lib/nl-test/intentAnalyzer';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { FlowStep, StepType } from '../lib/flowTypes';

interface AIAssistantPanelProps {
  targetUrl: string;
  description: string;
  onApplySteps: (steps: FlowStep[]) => void;
}

export function AIAssistantPanel({ targetUrl, description, onApplySteps }: AIAssistantPanelProps) {
  const { currentTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IntentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const canAnalyze = targetUrl && description && description.length > 10;

  const runAnalysis = async () => {
    if (!canAnalyze) {
      setError('Please enter both target URL and description');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await analyzeIntent(description, targetUrl);
      setAnalysis(result);
      setShowDetails(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applySteps = () => {
    if (!analysis || !analysis.steps.length) return;

    // Convert intent analysis steps to FlowSteps
    const flowSteps: FlowStep[] = analysis.steps.map((step, index) => ({
      id: `step-${Date.now()}-${index}`,
      order: index + 1,
      type: mapActionToType(step.action),
      config: {
        description: step.action,
        selector: step.target,
        value: step.value,
      },
    }));

    onApplySteps(flowSteps);
    setAnalysis(null);
  };

  const mapActionToType = (action: string): StepType => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('navigate') || lowerAction.includes('go to') || lowerAction.includes('visit')) {
      return 'navigate';
    } else if (lowerAction.includes('click') || lowerAction.includes('press')) {
      return 'click';
    } else if (lowerAction.includes('type') || lowerAction.includes('fill') || lowerAction.includes('enter')) {
      return 'fill';
    } else if (lowerAction.includes('select') || lowerAction.includes('choose')) {
      return 'select';
    } else if (lowerAction.includes('verify') || lowerAction.includes('assert') || lowerAction.includes('check')) {
      return 'verify';
    } else if (lowerAction.includes('wait')) {
      return 'wait';
    } else if (lowerAction.includes('hover')) {
      return 'hover';
    }
    return 'navigate'; // Default fallback
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'functional':
        return '#3b82f6';
      case 'visual':
        return '#8b5cf6';
      case 'accessibility':
        return '#10b981';
      case 'performance':
        return '#f59e0b';
      default:
        return currentTheme.colors.text.secondary;
    }
  };

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="AI Assistant"
        subtitle="Get intelligent test recommendations"
        icon={<Sparkles className="w-5 h-5" />}
      />
      <ThemedCardContent>
        {/* Analyze Button */}
        {!analysis && !loading && (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: canAnalyze ? 1.02 : 1 }}
              whileTap={{ scale: canAnalyze ? 0.98 : 1 }}
              onClick={runAnalysis}
              disabled={!canAnalyze}
              className="w-full px-4 py-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: canAnalyze
                  ? currentTheme.colors.primary
                  : currentTheme.colors.surface,
                color: canAnalyze
                  ? '#ffffff'
                  : currentTheme.colors.text.tertiary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: canAnalyze
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
                opacity: canAnalyze ? 1 : 0.6,
              }}
            >
              <Sparkles className="w-4 h-4" />
              Analyze Configuration
            </motion.button>

            {!canAnalyze && (
              <p className="text-xs text-center" style={{ color: currentTheme.colors.text.tertiary }}>
                Complete flow configuration to get AI analysis
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: currentTheme.colors.primary }} />
            <p className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              Analyzing your test...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="p-4 rounded flex items-start gap-3"
            style={{
              backgroundColor: '#ef444410',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#ef444430',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: '#ef4444' }}>
                Analysis Failed
              </p>
              <p className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Overview */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: getConfidenceColor(analysis.confidence) + '20',
                    color: getConfidenceColor(analysis.confidence),
                  }}
                >
                  {analysis.confidence}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                    Confidence
                  </p>
                  <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                    {analysis.isValid ? 'Testable' : 'Needs work'}
                  </p>
                </div>
              </div>

              <Badge
                variant="secondary"
                style={{
                  backgroundColor: getTestTypeColor(analysis.testType) + '20',
                  color: getTestTypeColor(analysis.testType),
                  borderColor: getTestTypeColor(analysis.testType) + '40',
                }}
              >
                {analysis.testType}
              </Badge>
            </div>

            {/* Steps Found */}
            {analysis.steps.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                    Steps ({analysis.steps.length})
                  </p>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    {showDetails ? 'Hide' : 'Show'}
                  </button>
                </div>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {analysis.steps.map((step, index) => (
                        <div
                          key={index}
                          className="p-2 rounded"
                          style={{
                            backgroundColor: step.isAmbiguous
                              ? '#f59e0b10'
                              : currentTheme.colors.surface,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: step.isAmbiguous
                              ? '#f59e0b30'
                              : currentTheme.colors.border,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{
                                backgroundColor: currentTheme.colors.primary + '20',
                                color: currentTheme.colors.primary,
                              }}
                            >
                              {step.order}
                            </span>
                            <div className="flex-1">
                              <p className="text-xs font-medium" style={{ color: currentTheme.colors.text.primary }}>
                                {step.action}
                                {step.target && <span className="font-normal"> → {step.target}</span>}
                              </p>
                              {step.isAmbiguous && step.clarification && (
                                <p className="text-xs mt-1 flex items-start gap-1" style={{ color: '#f59e0b' }}>
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  {step.clarification}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  Warnings
                </p>
                <div className="space-y-1">
                  {analysis.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs" style={{ color: '#f59e0b' }}>
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                  Suggestions
                </p>
                <div className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs" style={{ color: currentTheme.colors.primary }}>
                      <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={applySteps}
                disabled={!analysis.isValid || analysis.steps.length === 0}
                className="flex-1 px-4 py-2 rounded text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: analysis.isValid && analysis.steps.length > 0
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
                  color: analysis.isValid && analysis.steps.length > 0
                    ? '#ffffff'
                    : currentTheme.colors.text.tertiary,
                  opacity: analysis.isValid && analysis.steps.length > 0 ? 1 : 0.5,
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Apply ({analysis.steps.length})
              </button>
              <button
                onClick={() => setAnalysis(null)}
                className="px-4 py-2 rounded text-sm font-medium transition-all"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text.secondary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
