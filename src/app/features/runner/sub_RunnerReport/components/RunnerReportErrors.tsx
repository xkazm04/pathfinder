'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { XCircle, ChevronDown, ChevronUp, Brain, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { getAIAnalyses, type AIScreenshotAnalysis } from '@/lib/supabase/scenarioResults';

interface ErrorObject {
  message: string;
  stack?: string;
}

interface RunnerReportErrorsProps {
  errors: ErrorObject[];
  scenarioResultId?: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function RunnerReportErrors({ errors, scenarioResultId, isExpanded, onToggleExpanded }: RunnerReportErrorsProps) {
  const { currentTheme } = useTheme();
  const [aiAnalyses, setAiAnalyses] = useState<AIScreenshotAnalysis[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Load AI analyses when component mounts or scenario changes
  useEffect(() => {
    if (scenarioResultId) {
      loadAIAnalyses();
    } else {
      setAiAnalyses([]);
    }
  }, [scenarioResultId]);

  const loadAIAnalyses = async () => {
    if (!scenarioResultId) {
      console.log('[RunnerReportErrors] No scenarioResultId provided');
      return;
    }

    console.log('[RunnerReportErrors] Loading AI analyses for scenario:', scenarioResultId);
    setLoadingAI(true);
    try {
      const analyses = await getAIAnalyses(scenarioResultId);
      console.log('[RunnerReportErrors] Retrieved analyses:', analyses.length, 'records');

      if (analyses.length === 0) {
        console.log('[RunnerReportErrors] No AI analyses found for this scenario');
        setAiAnalyses([]);
        setLoadingAI(false);
        return;
      }

      // Sanitize data to prevent Buffer/binary issues in browser
      const sanitizedAnalyses = analyses.map(analysis => ({
        ...analysis,
        findings: sanitizeFindings(analysis.findings),
        issues: sanitizeIssues(analysis.issues),
      }));

      console.log('[RunnerReportErrors] Sanitized analyses:', sanitizedAnalyses);
      setAiAnalyses(sanitizedAnalyses);
    } catch (error: any) {
      console.error('[RunnerReportErrors] Failed to load AI analyses:', error);
      // Don't crash the UI, just show no AI analyses
      setAiAnalyses([]);
    } finally {
      setLoadingAI(false);
    }
  };

  // Sanitize findings to ensure browser-safe data
  const sanitizeFindings = (findings: any): any => {
    if (!findings) return [];
    if (Array.isArray(findings)) return findings;

    // If findings is an object, try to extract array
    try {
      if (typeof findings === 'string') {
        return JSON.parse(findings);
      }
      return Array.isArray(findings) ? findings : [];
    } catch {
      return [];
    }
  };

  // Sanitize issues to ensure browser-safe data
  const sanitizeIssues = (issues: any): any[] => {
    if (!issues) return [];
    if (Array.isArray(issues)) return issues;

    // If issues is an object or string, try to extract array
    try {
      if (typeof issues === 'string') {
        return JSON.parse(issues);
      }
      return [];
    } catch {
      return [];
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f97316';
      case 'info':
        return currentTheme.colors.accent;
      default:
        return currentTheme.colors.text.tertiary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const hasContent = (errors && errors.length > 0) || (aiAnalyses && aiAnalyses.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="mb-4">
      <button
        onClick={onToggleExpanded}
        className="w-full flex items-center justify-between p-3 rounded-lg mb-2 hover:bg-opacity-80 transition-colors"
        style={{
          backgroundColor: '#ef444410',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#ef444430',
        }}
      >
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
          <span className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
            Issues & AI Analysis
          </span>
          <span className="text-sm" style={{ color: currentTheme.colors.text.tertiary }}>
            ({(errors?.length || 0) + (aiAnalyses?.length || 0)} found)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: '#ef4444' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: '#ef4444' }} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3"
          >
            {/* Test Errors */}
            {errors && errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                  <span className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                    Test Errors ({errors.length})
                  </span>
                </div>
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: '#ef444410',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#ef444430',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: currentTheme.colors.text.primary }}>
                          {error.message}
                        </p>
                        {error.stack && (
                          <pre
                            className="text-xs mt-2 p-2 rounded overflow-x-auto"
                            style={{
                              backgroundColor: currentTheme.colors.surface,
                              color: currentTheme.colors.text.tertiary,
                            }}
                          >
                            {error.stack}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Analyses */}
            {loadingAI && (
              <div className="text-center py-4" style={{ color: currentTheme.colors.text.tertiary }}>
                <Brain className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Loading AI analysis...</p>
              </div>
            )}

            {!loadingAI && aiAnalyses && Array.isArray(aiAnalyses) && aiAnalyses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <Brain className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
                  <span className="text-sm font-semibold" style={{ color: currentTheme.colors.text.primary }}>
                    AI Findings ({aiAnalyses.length} screenshots analyzed)
                  </span>
                </div>
                {aiAnalyses.map((analysis, index) => {
                  // Skip invalid analyses
                  if (!analysis || typeof analysis !== 'object') return null;

                  return (
                  <div
                    key={analysis.id || index}
                    className="p-3 rounded-lg space-y-2"
                    style={{
                      backgroundColor: `${currentTheme.colors.accent}10`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `${currentTheme.colors.accent}30`,
                    }}
                  >
                    {/* Screenshot URL */}
                    <div className="flex items-start gap-2 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                      <span className="font-mono truncate">
                        {analysis.screenshot_url ? String(analysis.screenshot_url).split('/').pop() : 'screenshot.png'}
                      </span>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded" style={{ backgroundColor: currentTheme.colors.surface }}>
                        {analysis.confidence_score ? (Number(analysis.confidence_score) * 100).toFixed(0) : '0'}% confidence
                      </span>
                    </div>

                    {/* Issues */}
                    {analysis.issues && Array.isArray(analysis.issues) && analysis.issues.length > 0 && (
                      <div className="space-y-1.5">
                        {analysis.issues.map((issue: any, issueIndex: number) => {
                          // Skip invalid issues that might cause rendering errors
                          if (!issue || typeof issue !== 'object') return null;

                          const severity = String(issue.severity || 'info');
                          const issueType = String(issue.type || 'unknown');
                          const description = String(issue.description || 'No description');
                          const location = issue.location ? String(issue.location) : null;

                          return (
                            <div
                              key={issueIndex}
                              className="flex items-start gap-2 p-2 rounded"
                              style={{
                                backgroundColor: `${getSeverityColor(severity)}10`,
                              }}
                            >
                              <div style={{ color: getSeverityColor(severity) }}>
                                {getSeverityIcon(severity)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold uppercase" style={{ color: getSeverityColor(severity) }}>
                                    {severity}
                                  </span>
                                  <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                                    {issueType}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: currentTheme.colors.text.primary }}>
                                  {description}
                                </p>
                                {location && (
                                  <p className="text-xs mt-1" style={{ color: currentTheme.colors.text.tertiary }}>
                                    Location: {location}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Suggestions */}
                    {analysis.suggestions && typeof analysis.suggestions === 'string' && analysis.suggestions.length > 0 && (
                      <div
                        className="text-sm p-2 rounded"
                        style={{
                          backgroundColor: currentTheme.colors.surface,
                          color: currentTheme.colors.text.secondary,
                        }}
                      >
                        <span className="font-semibold" style={{ color: currentTheme.colors.accent }}>
                          Suggestions:
                        </span>{' '}
                        {String(analysis.suggestions)}
                      </div>
                    )}

                    {/* Model Info */}
                    <div className="text-xs flex items-center gap-1" style={{ color: currentTheme.colors.text.tertiary }}>
                      <Brain className="w-3 h-3" />
                      <span>Analyzed by {analysis.model_used ? String(analysis.model_used) : 'AI'}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {!loadingAI && (!aiAnalyses || aiAnalyses.length === 0) && (!errors || errors.length === 0) && (
              <div
                className="text-center py-4 rounded-lg"
                style={{
                  backgroundColor: `${currentTheme.colors.primary}10`,
                  color: currentTheme.colors.text.secondary,
                }}
              >
                <p className="text-sm">No issues detected ✓</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
