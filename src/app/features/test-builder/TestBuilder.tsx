'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { useTestBuilderMode, useTestFlow, useTestBuilderSync } from '@/lib/stores/testBuilderStore';
import { Workflow, MessageSquare, RefreshCw, Sparkles, Lightbulb } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { stepsToNaturalLanguageSimple, naturalLanguageToStepsSimple, shouldUseAI, stepsToNaturalLanguageAI, naturalLanguageToStepsAI } from '@/lib/test-builder/sync';
import { SharedMetadata } from './components/SharedMetadata';

// Lazy load heavy components
const VisualFlowMode = lazy(() =>
  import('./modes/VisualFlowMode').then(mod => ({ default: mod.VisualFlowMode }))
);
const NaturalLanguageMode = lazy(() =>
  import('./modes/NaturalLanguageMode').then(mod => ({ default: mod.NaturalLanguageMode }))
);
const AIRecommendations = lazy(() =>
  import('./components/AIRecommendations').then(mod => ({ default: mod.AIRecommendations }))
);

export function TestBuilder() {
  const { currentTheme } = useTheme();
  const { mode, setMode } = useTestBuilderMode();
  const { flow, updateFlow } = useTestFlow();
  const { isSyncing, naturalLanguageText, setSyncing, setNaturalLanguageText, lastSyncSource } = useTestBuilderSync();

  const [autoSync, setAutoSync] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Auto-sync from Visual to NL when steps change
  useEffect(() => {
    if (autoSync && lastSyncSource === 'visual' && flow.steps.length > 0) {
      syncVisualToNL();
    }
  }, [flow.steps, autoSync, lastSyncSource]);

  // Auto-sync from NL to Visual when text changes
  useEffect(() => {
    if (autoSync && lastSyncSource === 'nl' && naturalLanguageText.trim()) {
      syncNLToVisual();
    }
  }, [naturalLanguageText, autoSync, lastSyncSource]);

  const syncVisualToNL = async () => {
    setSyncing(true);
    try {
      let nlText: string;

      // Determine if we should use AI
      if (shouldUseAI('', flow.steps)) {
        nlText = await stepsToNaturalLanguageAI(flow);
      } else {
        nlText = stepsToNaturalLanguageSimple(flow);
      }

      setNaturalLanguageText(nlText);
    } catch (error) {
      console.error('Error syncing visual to NL:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncNLToVisual = async () => {
    setSyncing(true);
    try {
      let result: {
        steps: any[];
        targetUrl: string;
        testName: string;
      };

      // Determine if we should use AI
      if (shouldUseAI(naturalLanguageText, [])) {
        result = await naturalLanguageToStepsAI(naturalLanguageText);
      } else {
        result = naturalLanguageToStepsSimple(naturalLanguageText);
      }

      // Update flow with parsed data
      updateFlow({
        name: result.testName,
        targetUrl: result.targetUrl,
        steps: result.steps.map((step, index) => ({
          ...step,
          id: `step-${Date.now()}-${index}`,
          order: index + 1,
        })),
      });
    } catch (error) {
      console.error('Error syncing NL to visual:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (mode === 'visual') {
      await syncVisualToNL();
    } else {
      await syncNLToVisual();
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-3xl font-bold flex items-center gap-3"
            style={{ color: currentTheme.colors.text.primary }}
          >
            <Workflow className="w-8 h-8" style={{ color: currentTheme.colors.primary }} />
            Test Builder
          </h1>
          <p className="mt-2 text-lg" style={{ color: currentTheme.colors.text.secondary }}>
            Build tests visually or describe them in natural language
          </p>
        </div>

        {/* Auto-sync toggle */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: currentTheme.colors.primary }}
            />
            <span className="text-sm" style={{ color: currentTheme.colors.text.secondary }}>
              Auto-sync
            </span>
          </label>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            {isSyncing ? (
              <>
                <LoadingSpinner size="sm" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Shared Metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SharedMetadata />
      </motion.div>

      {/* AI Recommendations */}
      {showRecommendations && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Suspense fallback={<div className="h-24" />}>
            <AIRecommendations onClose={() => setShowRecommendations(false)} />
          </Suspense>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex gap-2 p-1 rounded-lg"
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: currentTheme.colors.border,
        }}
      >
        <button
          onClick={() => setMode('visual')}
          className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'visual' ? 'shadow-md' : ''
          }`}
          style={{
            backgroundColor: mode === 'visual' ? currentTheme.colors.primary : 'transparent',
            color: mode === 'visual' ? '#ffffff' : currentTheme.colors.text.secondary,
          }}
        >
          <Workflow className="w-4 h-4" />
          Visual Flow
        </button>

        <button
          onClick={() => setMode('natural-language')}
          className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'natural-language' ? 'shadow-md' : ''
          }`}
          style={{
            backgroundColor: mode === 'natural-language' ? currentTheme.colors.primary : 'transparent',
            color: mode === 'natural-language' ? '#ffffff' : currentTheme.colors.text.secondary,
          }}
        >
          <MessageSquare className="w-4 h-4" />
          Natural Language
        </button>
      </motion.div>

      {/* Syncing Indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: currentTheme.colors.primary + '10',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.primary + '30',
            }}
          >
            <Sparkles className="w-5 h-5 animate-pulse" style={{ color: currentTheme.colors.primary }} />
            <p className="text-sm" style={{ color: currentTheme.colors.text.primary }}>
              Syncing changes between modes...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === 'visual' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'visual' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            {mode === 'visual' ? <VisualFlowMode /> : <NaturalLanguageMode />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
