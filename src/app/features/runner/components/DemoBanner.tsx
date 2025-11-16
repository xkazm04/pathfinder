'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Sparkles, X } from 'lucide-react';

interface DemoBannerProps {
  onDismiss: () => void;
  onCreateRealSuite: () => void;
}

export function DemoBanner({ onDismiss, onCreateRealSuite }: DemoBannerProps) {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 p-6 rounded-lg relative overflow-hidden"
      style={{
        backgroundColor: `${currentTheme.colors.primary}15`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `${currentTheme.colors.primary}40`,
      }}
      data-testid="demo-banner"
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${currentTheme.colors.primary} 0, ${currentTheme.colors.primary} 1px, transparent 0, transparent 50%)`,
          backgroundSize: '10px 10px',
        }}
      />

      {/* Content */}
      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: `${currentTheme.colors.primary}20`,
          }}
        >
          <Sparkles className="w-6 h-6" style={{ color: currentTheme.colors.primary }} />
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: currentTheme.colors.text.primary }}
          >
            Welcome to the Test Runner!
          </h3>
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{ color: currentTheme.colors.text.secondary }}
          >
            This is a <strong>demo run</strong> to show you how the Runner works. Watch the live
            progress, streaming logs, and real-time updates. When you&apos;re ready, create your own
            test suite to start testing your applications.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <ThemedButton
              variant="primary"
              size="sm"
              onClick={onCreateRealSuite}
              data-testid="create-real-suite-btn"
            >
              Create Your Test Suite
            </ThemedButton>
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              data-testid="dismiss-demo-banner-btn"
            >
              Got it, thanks
            </ThemedButton>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-md transition-colors"
          style={{
            color: currentTheme.colors.text.tertiary,
          }}
          aria-label="Close demo banner"
          data-testid="close-demo-banner-btn"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
