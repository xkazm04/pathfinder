'use client';

import { useState, useEffect } from 'react';
import { useTheme, useProjects } from '@/lib/stores/appStore';
import { useTestFlow, useTestSteps } from '@/lib/stores/testBuilderStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Zap,
  Target,
  GitBranch,
} from 'lucide-react';

interface TestRecommendation {
  testName: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  estimatedComplexity: number;
  reason: string;
  suggestedSteps: Array<{
    type: string;
    action: string;
    target?: string;
    value?: string;
  }>;
}

interface AIRecommendationsProps {
  onClose: () => void;
}

export function AIRecommendations({ onClose }: AIRecommendationsProps) {
  const { currentTheme } = useTheme();
  const { currentProjectId, projects } = useProjects();
  const { updateFlow } = useTestFlow();
  const { addStep } = useTestSteps();

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<TestRecommendation[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentProject = projects.find(p => p.id === currentProjectId);

  useEffect(() => {
    if (currentProjectId) {
      loadRecommendations();
    }
  }, [currentProjectId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/gemini/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          analysisType: 'recommendations',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Unable to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = (rec: TestRecommendation) => {
    // Update flow metadata
    updateFlow({
      name: rec.testName,
      description: rec.description,
    });

    // Add suggested steps
    rec.suggestedSteps.forEach((step) => {
      addStep({
        type: step.type as any,
        action: step.action,
        target: step.target,
        value: step.value,
        description: step.action,
      });
    });

    // Provide feedback
    alert(`Applied "${rec.testName}" - ${rec.suggestedSteps.length} steps added!`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return currentTheme.colors.text.secondary;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      case 'medium':
        return <TrendingUp className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Target className="w-3 h-3" />;
    }
  };

  if (!currentProjectId || !currentProject) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="p-4 text-center" style={{ color: currentTheme.colors.text.secondary }}>
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a project to see AI test recommendations</p>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  if (loading) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="p-6 flex items-center justify-center gap-3" style={{ color: currentTheme.colors.text.secondary }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: currentTheme.colors.primary }} />
            <span>Analyzing {currentProject.name} repository...</span>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  if (error) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
              <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                {error}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" style={{ color: currentTheme.colors.text.secondary }} />
            </button>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  if (recommendations.length === 0) {
    return (
      <ThemedCard variant="bordered">
        <ThemedCardContent>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" style={{ color: currentTheme.colors.accent }} />
              <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
                No recommendations available. Try adding a repository URL to your project.
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" style={{ color: currentTheme.colors.text.secondary }} />
            </button>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  return (
    <ThemedCard variant="bordered">
      <ThemedCardHeader
        title="AI Test Recommendations"
        subtitle={`${recommendations.length} suggestions for ${currentProject.name}`}
        icon={<Sparkles className="w-5 h-5" />}
        action={
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-opacity-10 transition-colors"
            style={{ color: currentTheme.colors.text.secondary }}
          >
            <X className="w-4 h-4" />
          </button>
        }
      />
      <ThemedCardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {recommendations.slice(0, 5).map((rec, index) => {
              const isExpanded = expandedId === index;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg p-3 transition-all"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium" style={{ color: currentTheme.colors.text.primary }}>
                          {rec.testName}
                        </h4>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getPriorityColor(rec.priority),
                            color: getPriorityColor(rec.priority),
                          }}
                        >
                          {getPriorityIcon(rec.priority)}
                          <span className="ml-1">{rec.priority}</span>
                        </Badge>
                        <Badge variant="secondary">{rec.category}</Badge>
                      </div>
                      <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                        {rec.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : index)}
                      className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" style={{ color: currentTheme.colors.text.secondary }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: currentTheme.colors.text.secondary }} />
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: `1px solid ${currentTheme.colors.border}` }}>
                          {/* Reason */}
                          <div>
                            <p className="text-xs font-medium mb-1" style={{ color: currentTheme.colors.text.primary }}>
                              Why this test matters:
                            </p>
                            <p className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                              {rec.reason}
                            </p>
                          </div>

                          {/* Complexity */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: currentTheme.colors.text.secondary }}>
                              Complexity:
                            </span>
                            <div className="flex gap-1">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-3 rounded-sm"
                                  style={{
                                    backgroundColor: i < rec.estimatedComplexity
                                      ? currentTheme.colors.primary
                                      : currentTheme.colors.border,
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
                              {rec.estimatedComplexity}/10
                            </span>
                          </div>

                          {/* Steps Preview */}
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: currentTheme.colors.text.primary }}>
                              Suggested steps ({rec.suggestedSteps.length}):
                            </p>
                            <div className="space-y-1">
                              {rec.suggestedSteps.slice(0, 3).map((step, i) => (
                                <div
                                  key={i}
                                  className="text-xs flex items-start gap-2 p-2 rounded"
                                  style={{ backgroundColor: currentTheme.colors.background }}
                                >
                                  <span className="font-mono" style={{ color: currentTheme.colors.primary }}>
                                    {i + 1}.
                                  </span>
                                  <span style={{ color: currentTheme.colors.text.secondary }}>
                                    {step.action}
                                    {step.target && <span className="font-medium"> → "{step.target}"</span>}
                                  </span>
                                </div>
                              ))}
                              {rec.suggestedSteps.length > 3 && (
                                <p className="text-xs text-center" style={{ color: currentTheme.colors.text.tertiary }}>
                                  +{rec.suggestedSteps.length - 3} more steps
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Apply Button */}
                          <button
                            onClick={() => applyRecommendation(rec)}
                            className="w-full px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{
                              backgroundColor: currentTheme.colors.primary,
                              color: '#ffffff',
                            }}
                          >
                            <Zap className="w-4 h-4" />
                            Apply This Test
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {recommendations.length > 5 && (
            <p className="text-xs text-center py-2" style={{ color: currentTheme.colors.text.tertiary }}>
              Showing top 5 of {recommendations.length} recommendations
            </p>
          )}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
