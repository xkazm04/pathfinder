'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Code,
  Loader2,
  BookOpen,
  Clock,
} from 'lucide-react';
import {
  RootCauseAnalysis,
  ProbableCause,
  RemediationSuggestion,
  SimilarFailure,
  performRootCauseAnalysis,
  getCachedAnalysis,
  saveFailureResolution,
} from '@/lib/ai/rootCauseAnalysis';
import { TestResult } from '@/lib/types';
import { getPriorityColor, getCategoryColor } from '../lib/reportHelpers';

interface RootCauseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResult: TestResult;
}

export function RootCauseAnalysisModal({
  isOpen,
  onClose,
  testResult,
}: RootCauseAnalysisModalProps) {
  const { currentTheme } = useTheme();
  const [analysis, setAnalysis] = useState<RootCauseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'causes' | 'remediation' | 'similar'>('causes');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  useEffect(() => {
    if (isOpen && testResult) {
      loadAnalysis();
    }
  }, [isOpen, testResult]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for cached analysis first
      let cachedAnalysis = await getCachedAnalysis(testResult.id);

      if (cachedAnalysis) {
        setAnalysis(cachedAnalysis);
      } else {
        // Generate new analysis
        const newAnalysis = await performRootCauseAnalysis(testResult);
        setAnalysis(newAnalysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze failure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResolution = async (cause: ProbableCause, suggestion: RemediationSuggestion) => {
    setIsSavingResolution(true);
    try {
      await saveFailureResolution(
        testResult.id,
        cause.description,
        suggestion.title,
        resolutionNotes
      );
      // Show success message or update UI
      alert('Resolution saved successfully!');
      setResolutionNotes('');
    } catch (err) {
      alert('Failed to save resolution');
    } finally {
      setIsSavingResolution(false);
    }
  };

  const getCategoryIcon = (category: ProbableCause['category']) => {
    switch (category) {
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'timeout':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
        data-testid="root-cause-analysis-modal"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
          style={{
            backgroundColor: currentTheme.colors.background,
            border: `1px solid ${currentTheme.colors.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
              >
                <Lightbulb className="w-6 h-6" style={{ color: currentTheme.colors.primary }} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  AI Root Cause Analysis
                </h2>
                <p className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
                  {testResult.test_name} - {testResult.viewport}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
              style={{ color: currentTheme.colors.text.tertiary }}
              data-testid="close-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2
                  className="w-12 h-12 animate-spin mb-4"
                  style={{ color: currentTheme.colors.primary }}
                />
                <p style={{ color: currentTheme.colors.text.secondary }}>
                  Analyzing failure patterns...
                </p>
              </div>
            )}

            {error && (
              <div
                className="m-6 p-4 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: '#ef444420', border: '1px solid #ef4444' }}
              >
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <p className="font-medium" style={{ color: '#ef4444' }}>
                    Analysis Failed
                  </p>
                  <p className="text-sm mt-1" style={{ color: currentTheme.colors.text.secondary }}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {analysis && !isLoading && (
              <>
                {/* Tabs */}
                <div
                  className="flex gap-4 px-6 pt-6 border-b"
                  style={{ borderColor: currentTheme.colors.border }}
                >
                  <button
                    onClick={() => setSelectedTab('causes')}
                    className="px-4 py-2 font-medium transition-colors relative"
                    style={{
                      color:
                        selectedTab === 'causes'
                          ? currentTheme.colors.primary
                          : currentTheme.colors.text.tertiary,
                    }}
                    data-testid="causes-tab"
                  >
                    Probable Causes
                    {selectedTab === 'causes' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedTab('remediation')}
                    className="px-4 py-2 font-medium transition-colors relative"
                    style={{
                      color:
                        selectedTab === 'remediation'
                          ? currentTheme.colors.primary
                          : currentTheme.colors.text.tertiary,
                    }}
                    data-testid="remediation-tab"
                  >
                    Remediation
                    {selectedTab === 'remediation' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedTab('similar')}
                    className="px-4 py-2 font-medium transition-colors relative"
                    style={{
                      color:
                        selectedTab === 'similar'
                          ? currentTheme.colors.primary
                          : currentTheme.colors.text.tertiary,
                    }}
                    data-testid="similar-tab"
                  >
                    Similar Failures ({analysis.similar_failures?.length || 0})
                    {selectedTab === 'similar' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {selectedTab === 'causes' && (
                    <div className="space-y-4">
                      {analysis.probable_causes?.map((cause, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: `${currentTheme.colors.surface}40`,
                            border: `1px solid ${currentTheme.colors.border}`,
                          }}
                          data-testid={`cause-${index}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="p-1.5 rounded"
                                style={{ backgroundColor: `${getCategoryColor(cause.category)}20` }}
                              >
                                {getCategoryIcon(cause.category)}
                              </div>
                              <span
                                className="text-xs font-medium uppercase"
                                style={{ color: getCategoryColor(cause.category) }}
                              >
                                {cause.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs"
                                style={{ color: currentTheme.colors.text.tertiary }}
                              >
                                Confidence:
                              </span>
                              <div className="w-24 h-2 rounded-full overflow-hidden bg-gray-700">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${cause.confidence * 100}%`,
                                    backgroundColor: currentTheme.colors.primary,
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-medium"
                                style={{ color: currentTheme.colors.text.secondary }}
                              >
                                {Math.round(cause.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <p
                            className="font-medium mb-2"
                            style={{ color: currentTheme.colors.text.primary }}
                          >
                            {cause.description}
                          </p>
                          {cause.evidence && cause.evidence.length > 0 && (
                            <div className="mt-3">
                              <p
                                className="text-xs font-medium mb-2"
                                style={{ color: currentTheme.colors.text.tertiary }}
                              >
                                Evidence:
                              </p>
                              <ul className="space-y-1">
                                {cause.evidence.map((item, i) => (
                                  <li
                                    key={i}
                                    className="text-sm pl-4 relative"
                                    style={{ color: currentTheme.colors.text.secondary }}
                                  >
                                    <span className="absolute left-0">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {selectedTab === 'remediation' && (
                    <div className="space-y-4">
                      {analysis.remediation_suggestions?.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: `${currentTheme.colors.surface}40`,
                            border: `1px solid ${currentTheme.colors.border}`,
                          }}
                          data-testid={`suggestion-${index}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3
                              className="font-medium text-lg"
                              style={{ color: currentTheme.colors.text.primary }}
                            >
                              {suggestion.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: `${getPriorityColor(suggestion.priority)}20`,
                                  color: getPriorityColor(suggestion.priority),
                                }}
                              >
                                {suggestion.priority} priority
                              </span>
                              <span
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: `${currentTheme.colors.surface}60`,
                                  color: currentTheme.colors.text.secondary,
                                }}
                              >
                                {suggestion.effort} effort
                              </span>
                            </div>
                          </div>
                          <p
                            className="text-sm mb-4"
                            style={{ color: currentTheme.colors.text.secondary }}
                          >
                            {suggestion.description}
                          </p>
                          {suggestion.steps && suggestion.steps.length > 0 && (
                            <div className="mb-4">
                              <p
                                className="text-xs font-medium mb-2"
                                style={{ color: currentTheme.colors.text.tertiary }}
                              >
                                Steps:
                              </p>
                              <ol className="space-y-2">
                                {suggestion.steps.map((step, i) => (
                                  <li
                                    key={i}
                                    className="text-sm flex gap-2"
                                    style={{ color: currentTheme.colors.text.secondary }}
                                  >
                                    <span
                                      className="font-medium"
                                      style={{ color: currentTheme.colors.primary }}
                                    >
                                      {i + 1}.
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {suggestion.code_example && (
                            <div
                              className="p-3 rounded font-mono text-xs overflow-x-auto"
                              style={{
                                backgroundColor: `${currentTheme.colors.surface}80`,
                                color: currentTheme.colors.text.secondary,
                              }}
                            >
                              <pre>{suggestion.code_example}</pre>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {selectedTab === 'similar' && (
                    <div className="space-y-4">
                      {analysis.similar_failures && analysis.similar_failures.length > 0 ? (
                        analysis.similar_failures.map((failure, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-lg"
                            style={{
                              backgroundColor: `${currentTheme.colors.surface}40`,
                              border: `1px solid ${currentTheme.colors.border}`,
                            }}
                            data-testid={`similar-failure-${index}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp
                                  className="w-4 h-4"
                                  style={{ color: currentTheme.colors.primary }}
                                />
                                <span
                                  className="font-medium"
                                  style={{ color: currentTheme.colors.text.primary }}
                                >
                                  {failure.test_name}
                                </span>
                              </div>
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: `${currentTheme.colors.primary}20`,
                                  color: currentTheme.colors.primary,
                                }}
                              >
                                {Math.round(failure.similarity_score * 100)}% similar
                              </span>
                            </div>
                            <p
                              className="text-sm mb-2"
                              style={{ color: currentTheme.colors.text.secondary }}
                            >
                              {failure.error_message}
                            </p>
                            {failure.resolution && (
                              <div
                                className="mt-3 p-3 rounded"
                                style={{ backgroundColor: `${currentTheme.colors.surface}60` }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                                  <span
                                    className="text-xs font-medium"
                                    style={{ color: currentTheme.colors.text.tertiary }}
                                  >
                                    Resolution:
                                  </span>
                                </div>
                                <p
                                  className="text-sm"
                                  style={{ color: currentTheme.colors.text.secondary }}
                                >
                                  {failure.resolution}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen
                            className="w-12 h-12 mx-auto mb-4"
                            style={{ color: currentTheme.colors.text.tertiary }}
                          />
                          <p style={{ color: currentTheme.colors.text.secondary }}>
                            No similar failures found in history
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <ThemedButton variant="ghost" onClick={onClose} data-testid="close-btn">
              Close
            </ThemedButton>
            {analysis && (
              <ThemedButton
                variant="primary"
                onClick={() => {
                  // Could trigger ticket creation with analysis data
                  onClose();
                }}
                data-testid="create-ticket-with-analysis-btn"
              >
                Create Ticket with Analysis
              </ThemedButton>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
