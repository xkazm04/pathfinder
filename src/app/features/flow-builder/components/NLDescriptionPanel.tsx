'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { MessageSquare, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowStep } from '../lib/flowTypes';

interface NLDescriptionPanelProps {
  steps: FlowStep[];
  nlDescription: string;
  onNLDescriptionChange: (text: string) => void;
  onSyncFromSteps: () => void;
  onSyncToSteps: () => void;
  isSyncing?: boolean;
  enableTypewriting?: boolean;
}

export function NLDescriptionPanel({
  steps,
  nlDescription,
  onNLDescriptionChange,
  onSyncFromSteps,
  onSyncToSteps,
  isSyncing = false,
  enableTypewriting = false,
}: NLDescriptionPanelProps) {
  const { currentTheme } = useTheme();
  const [displayedText, setDisplayedText] = useState(nlDescription);
  const [isTyping, setIsTyping] = useState(false);
  const [changedLineIndex, setChangedLineIndex] = useState<number | null>(null);
  const previousTextRef = useRef(nlDescription);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriting effect when nlDescription changes
  useEffect(() => {
    if (!enableTypewriting || nlDescription === displayedText) {
      setDisplayedText(nlDescription);
      return;
    }

    // Find which line changed
    const oldLines = previousTextRef.current.split('\n');
    const newLines = nlDescription.split('\n');
    let changedIndex = -1;

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        changedIndex = i;
        break;
      }
    }

    setChangedLineIndex(changedIndex);
    setIsTyping(true);

    // Typewriting effect
    let currentIndex = displayedText.length;
    const targetText = nlDescription;

    const typeInterval = setInterval(() => {
      if (currentIndex < targetText.length) {
        setDisplayedText(targetText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        previousTextRef.current = nlDescription;

        // Clear highlight after 2 seconds
        setTimeout(() => {
          setChangedLineIndex(null);
        }, 2000);
      }
    }, 20); // 20ms per character for smooth effect

    return () => clearInterval(typeInterval);
  }, [nlDescription, enableTypewriting]);

  // Update displayed text when user manually edits
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDisplayedText(newText);
    onNLDescriptionChange(newText);
    previousTextRef.current = newText;
  };

  return (
    <div>
      <ThemedCardHeader
        title="Natural Language"
        subtitle="Describe test in plain text"
        icon={<MessageSquare className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-1.5">
            {/* Generate from Steps button */}
            <button
              onClick={onSyncFromSteps}
              disabled={isSyncing || steps.length === 0}
              className="p-2 rounded transition-all hover:scale-105"
              style={{
                backgroundColor: currentTheme.colors.primary + '20',
                color: currentTheme.colors.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.primary + '40',
                opacity: isSyncing || steps.length === 0 ? 0.5 : 1,
              }}
              title="Generate from Steps"
            >
              {isSyncing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>

            {/* Parse to Steps button */}
            <button
              onClick={onSyncToSteps}
              disabled={isSyncing || !nlDescription.trim()}
              className="p-2 rounded transition-all hover:scale-105"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: currentTheme.colors.border,
                opacity: isSyncing || !nlDescription.trim() ? 0.5 : 1,
              }}
              title="Parse to Steps"
            >
              {isSyncing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        }
      />
      <ThemedCardContent>
        <div className="space-y-3">
          {/* Textarea with typewriting effect */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={displayedText}
              onChange={handleChange}
              placeholder={`Example:
1. Navigate to homepage
2. Click "Login" button
3. Fill "Email" with "test@example.com"
4. Click "Submit"
5. Verify "Welcome" is visible`}
              rows={10}
              disabled={isSyncing || isTyping}
              className="w-full px-3 py-2 rounded text-xs font-mono resize-none transition-all"
              style={{
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: isTyping
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
                opacity: isSyncing ? 0.6 : 1,
              }}
            />

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs flex items-center gap-1"
                style={{
                  backgroundColor: currentTheme.colors.primary + '20',
                  color: currentTheme.colors.primary,
                }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Syncing...
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </ThemedCardContent>
    </div>
  );
}
