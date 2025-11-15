'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Loader2,
  Monitor,
  MousePointer,
  Keyboard,
  Eye,
  Camera,
  Clock,
  ChevronRight
} from 'lucide-react';

interface ParsedTestAction {
  type: 'navigate' | 'click' | 'fill' | 'assert' | 'screenshot' | 'wait' | 'hover' | 'select' | 'unknown';
  selector?: string;
  value?: string;
  description: string;
  codeSnippet: string;
}

interface MiniTestRunnerProps {
  generatedCode: string;
  targetUrl: string;
}

export function MiniTestRunner({ generatedCode, targetUrl }: MiniTestRunnerProps) {
  const { currentTheme } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [parsedActions, setParsedActions] = useState<ParsedTestAction[]>([]);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Parse the generated Playwright code to extract actions
  useEffect(() => {
    const actions = parsePlaywrightCode(generatedCode);
    setParsedActions(actions);
  }, [generatedCode]);

  // Initialize Web Audio API for sound cues
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play subtle sound cue
  const playSound = (frequency: number, duration: number) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  // Run the animation
  const runAnimation = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStepIndex(-1);
    setCompletedSteps([]);
    setProgress(0);

    for (let i = 0; i < parsedActions.length; i++) {
      if (isPaused) break;

      setCurrentStepIndex(i);

      // Play sound based on action type
      const action = parsedActions[i];
      switch (action.type) {
        case 'click':
          playSound(800, 0.1);
          break;
        case 'fill':
          playSound(600, 0.15);
          break;
        case 'assert':
          playSound(1000, 0.1);
          break;
        case 'screenshot':
          playSound(700, 0.2);
          break;
        default:
          playSound(500, 0.1);
      }

      // Simulate action execution time
      const duration = getActionDuration(action.type);
      await new Promise(resolve => setTimeout(resolve, duration));

      setCompletedSteps(prev => [...prev, i]);
      setProgress(((i + 1) / parsedActions.length) * 100);
    }

    setIsRunning(false);
    setCurrentStepIndex(-1);
    playSound(1200, 0.3); // Completion sound
  };

  const pauseAnimation = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resetAnimation = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(-1);
    setCompletedSteps([]);
    setProgress(0);
  };

  const getActionDuration = (type: string): number => {
    const durations: Record<string, number> = {
      navigate: 1500,
      click: 800,
      fill: 1200,
      assert: 600,
      screenshot: 1000,
      wait: 800,
      hover: 500,
      select: 800,
      unknown: 500,
    };
    return durations[type] || 500;
  };

  const getActionIcon = (type: string) => {
    const iconProps = { size: 14, style: { color: currentTheme.colors.accent } };
    switch (type) {
      case 'navigate': return <Monitor {...iconProps} />;
      case 'click': return <MousePointer {...iconProps} />;
      case 'fill': return <Keyboard {...iconProps} />;
      case 'assert': return <Eye {...iconProps} />;
      case 'screenshot': return <Camera {...iconProps} />;
      case 'wait': return <Clock {...iconProps} />;
      case 'hover': return <MousePointer {...iconProps} />;
      case 'select': return <ChevronRight {...iconProps} />;
      default: return <ChevronRight {...iconProps} />;
    }
  };

  return (
    <ThemedCard variant="glow" data-testid="mini-test-runner">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: currentTheme.colors.text.primary }}
            >
              <Play size={18} style={{ color: currentTheme.colors.accent }} />
              Live Test Preview
            </h3>
            <p
              className="text-sm mt-1"
              style={{ color: currentTheme.colors.text.tertiary }}
            >
              Watch your test run in real-time before publishing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemedButton
              variant="secondary"
              size="sm"
              onClick={resetAnimation}
              disabled={isRunning}
              data-testid="reset-animation-btn"
            >
              <RotateCcw size={14} />
            </ThemedButton>
            {isRunning ? (
              <ThemedButton
                variant="secondary"
                size="sm"
                onClick={pauseAnimation}
                data-testid="pause-animation-btn"
              >
                <Pause size={14} />
              </ThemedButton>
            ) : (
              <ThemedButton
                variant="glow"
                size="sm"
                onClick={runAnimation}
                disabled={parsedActions.length === 0}
                data-testid="play-animation-btn"
              >
                <Play size={14} />
                Run Preview
              </ThemedButton>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: currentTheme.colors.surface }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${currentTheme.colors.primary}, ${currentTheme.colors.accent})`,
              boxShadow: `0 0 10px ${currentTheme.colors.accent}80`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            data-testid="progress-bar"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-4">
          {/* Thumbnail Viewport */}
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: currentTheme.colors.text.secondary }}>
              Viewport Preview
            </p>
            <div
              ref={viewportRef}
              className="relative rounded-lg overflow-hidden aspect-[4/3] border-2"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.surface}80 0%, ${currentTheme.colors.surface}40 100%)`,
                borderColor: currentTheme.colors.border
              }}
              data-testid="viewport-preview"
            >
              {/* Simulated browser chrome */}
              <div
                className="h-6 flex items-center px-2 gap-1.5 border-b"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border
                }}
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                </div>
                <div
                  className="flex-1 text-[10px] px-2 py-0.5 rounded ml-2"
                  style={{
                    background: `${currentTheme.colors.surface}80`,
                    color: currentTheme.colors.text.tertiary
                  }}
                >
                  {targetUrl}
                </div>
              </div>

              {/* Content area with current action indicator */}
              <div className="p-4 flex items-center justify-center h-full">
                <AnimatePresence mode="wait">
                  {currentStepIndex >= 0 && parsedActions[currentStepIndex] && (
                    <motion.div
                      key={currentStepIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
                        style={{
                          background: `${currentTheme.colors.primary}20`,
                          border: `2px solid ${currentTheme.colors.primary}`,
                          boxShadow: currentTheme.colors.glow
                        }}
                      >
                        {getActionIcon(parsedActions[currentStepIndex].type)}
                      </div>
                      <p
                        className="text-xs font-medium capitalize"
                        style={{ color: currentTheme.colors.text.primary }}
                      >
                        {parsedActions[currentStepIndex].type}
                      </p>
                    </motion.div>
                  )}
                  {currentStepIndex === -1 && !isRunning && completedSteps.length === parsedActions.length && parsedActions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
                        style={{
                          background: `${currentTheme.colors.primary}20`,
                          border: `2px solid ${currentTheme.colors.primary}`
                        }}
                      >
                        <Check size={32} style={{ color: currentTheme.colors.accent }} />
                      </div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: currentTheme.colors.text.primary }}
                      >
                        Complete!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: currentTheme.colors.text.secondary }}>
              Test Steps ({parsedActions.length})
            </p>
            <div
              className="space-y-1 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin"
              style={{
                scrollbarColor: `${currentTheme.colors.primary} ${currentTheme.colors.surface}`
              }}
              data-testid="steps-list"
            >
              {parsedActions.map((action, index) => {
                const isActive = currentStepIndex === index;
                const isCompleted = completedSteps.includes(index);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 p-2 rounded-lg border transition-all"
                    style={{
                      background: isActive
                        ? `${currentTheme.colors.primary}20`
                        : isCompleted
                        ? `${currentTheme.colors.surface}80`
                        : `${currentTheme.colors.surface}40`,
                      borderColor: isActive
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                      borderWidth: isActive ? '2px' : '1px'
                    }}
                    data-testid={`step-${index}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: currentTheme.colors.primary }}
                        >
                          <Check size={10} style={{ color: currentTheme.colors.background }} />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={16} style={{ color: currentTheme.colors.primary }} />
                        </motion.div>
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full border-2"
                          style={{ borderColor: currentTheme.colors.border }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {getActionIcon(action.type)}
                        <span
                          className="text-xs font-medium capitalize"
                          style={{ color: currentTheme.colors.text.primary }}
                        >
                          {action.type}
                        </span>
                      </div>
                      <p
                        className="text-[11px] leading-tight line-clamp-2"
                        style={{ color: currentTheme.colors.text.secondary }}
                      >
                        {action.description}
                      </p>
                      {action.selector && (
                        <code
                          className="text-[10px] block mt-1 truncate"
                          style={{ color: currentTheme.colors.text.tertiary }}
                        >
                          {action.selector}
                        </code>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <div className="flex items-center gap-4 text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
            <span>Steps: {parsedActions.length}</span>
            <span>•</span>
            <span>Completed: {completedSteps.length}</span>
            <span>•</span>
            <span>Progress: {Math.round(progress)}%</span>
          </div>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs"
              style={{ color: currentTheme.colors.accent }}
            >
              <Loader2 size={12} className="animate-spin" />
              Running...
            </motion.div>
          )}
        </div>
      </div>
    </ThemedCard>
  );
}

/**
 * Parse Playwright code to extract test actions
 */
function parsePlaywrightCode(code: string): ParsedTestAction[] {
  const actions: ParsedTestAction[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, comments (that aren't action descriptions), and imports
    if (!line || line.startsWith('import ') || line.startsWith('test.describe') ||
        line.startsWith('test.beforeEach') || line.startsWith('test(') ||
        line === '});' || line === ');') {
      continue;
    }

    // Extract description from comments
    let description = '';
    if (line.startsWith('//')) {
      description = line.replace('//', '').trim();
      continue;
    }

    // Use previous comment as description for the next action
    if (i > 0 && lines[i - 1].trim().startsWith('//')) {
      description = lines[i - 1].trim().replace('//', '').trim();
    }

    // Parse different action types
    if (line.includes('page.goto(')) {
      const urlMatch = line.match(/goto\(['"]([^'"]+)['"]\)/);
      actions.push({
        type: 'navigate',
        value: urlMatch ? urlMatch[1] : '',
        description: description || 'Navigate to URL',
        codeSnippet: line
      });
    } else if (line.includes('page.click(')) {
      const selectorMatch = line.match(/click\(['"]([^'"]+)['"]\)/);
      actions.push({
        type: 'click',
        selector: selectorMatch ? selectorMatch[1] : '',
        description: description || 'Click element',
        codeSnippet: line
      });
    } else if (line.includes('page.fill(')) {
      const matches = line.match(/fill\(['"]([^'"]+)['"],\s*['"]([^'"]*)['"]\)/);
      actions.push({
        type: 'fill',
        selector: matches ? matches[1] : '',
        value: matches ? matches[2] : '',
        description: description || 'Fill input field',
        codeSnippet: line
      });
    } else if (line.includes('expect(') || line.includes('toBeVisible()')) {
      const selectorMatch = line.match(/locator\(['"]([^'"]+)['"]\)/);
      actions.push({
        type: 'assert',
        selector: selectorMatch ? selectorMatch[1] : '',
        description: description || 'Verify element visibility',
        codeSnippet: line
      });
    } else if (line.includes('page.screenshot(')) {
      actions.push({
        type: 'screenshot',
        description: description || 'Capture screenshot',
        codeSnippet: line
      });
    } else if (line.includes('page.waitForSelector(') || line.includes('page.waitForTimeout(')) {
      const selectorMatch = line.match(/waitForSelector\(['"]([^'"]+)['"]\)/);
      actions.push({
        type: 'wait',
        selector: selectorMatch ? selectorMatch[1] : '',
        description: description || 'Wait for element',
        codeSnippet: line
      });
    } else if (line.includes('page.hover(')) {
      const selectorMatch = line.match(/hover\(['"]([^'"]+)['"]\)/);
      actions.push({
        type: 'hover',
        selector: selectorMatch ? selectorMatch[1] : '',
        description: description || 'Hover over element',
        codeSnippet: line
      });
    } else if (line.includes('page.selectOption(')) {
      const matches = line.match(/selectOption\(['"]([^'"]+)['"],\s*['"]([^'"]*)['"]\)/);
      actions.push({
        type: 'select',
        selector: matches ? matches[1] : '',
        value: matches ? matches[2] : '',
        description: description || 'Select option',
        codeSnippet: line
      });
    } else if (line.includes('await page.')) {
      // Catch-all for other Playwright actions
      actions.push({
        type: 'unknown',
        description: description || line.substring(0, 50),
        codeSnippet: line
      });
    }
  }

  return actions;
}
