'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowPreviewProps {
  show: boolean;
  naturalLanguage: string;
  playwrightCode: string;
}

export function FlowPreview({ show, naturalLanguage, playwrightCode }: FlowPreviewProps) {
  const { currentTheme } = useTheme();
  const [previewMode, setPreviewMode] = useState<'nl' | 'code'>('nl');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <ThemedCard variant="bordered">
            <ThemedCardHeader
              title="Preview"
              icon={<Eye className="w-5 h-5" />}
              action={
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode('nl')}
                    className="text-xs px-3 py-1 rounded transition-colors"
                    style={{
                      backgroundColor:
                        previewMode === 'nl'
                          ? currentTheme.colors.primary
                          : currentTheme.colors.surface,
                      color:
                        previewMode === 'nl'
                          ? '#ffffff'
                          : currentTheme.colors.text.secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                    data-testid="preview-nl-btn"
                  >
                    Natural Language
                  </button>
                  <button
                    onClick={() => setPreviewMode('code')}
                    className="text-xs px-3 py-1 rounded transition-colors"
                    style={{
                      backgroundColor:
                        previewMode === 'code'
                          ? currentTheme.colors.primary
                          : currentTheme.colors.surface,
                      color:
                        previewMode === 'code'
                          ? '#ffffff'
                          : currentTheme.colors.text.secondary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: currentTheme.colors.border,
                    }}
                    data-testid="preview-code-btn"
                  >
                    Playwright Code
                  </button>
                </div>
              }
            />
            <ThemedCardContent>
              <pre
                className="p-4 rounded text-xs overflow-x-auto"
                style={{
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text.primary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: currentTheme.colors.border,
                }}
              >
                {previewMode === 'nl' ? naturalLanguage : playwrightCode}
              </pre>
            </ThemedCardContent>
          </ThemedCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
