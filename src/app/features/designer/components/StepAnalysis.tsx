'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { Loader2 } from 'lucide-react';

interface StepAnalysisProps {
  progressMessage: string;
  estimatedDurationMs: number;
}

export function StepAnalysis({ progressMessage, estimatedDurationMs }: StepAnalysisProps) {
  const { currentTheme } = useTheme();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(Math.min(elapsed, estimatedDurationMs));
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [estimatedDurationMs]);

  const progressPercentage = (elapsedTime / estimatedDurationMs) * 100;
  const remainingSeconds = Math.ceil((estimatedDurationMs - elapsedTime) / 1000);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = remainingSeconds % 60;

  // Calculate estimated total time display
  const totalSeconds = Math.ceil(estimatedDurationMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalSecondsDisplay = totalSeconds % 60;
  const estimatedTimeText = totalMinutes > 0
    ? `~${totalMinutes}m ${totalSecondsDisplay}s`
    : `~${totalSeconds}s`;

  return (
    <ThemedCard variant="glow">
      <div className="p-8 space-y-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: currentTheme.colors.accent }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text.primary }}>{progressMessage}</h2>
          <p className="text-sm mb-2" style={{ color: currentTheme.colors.text.tertiary }}>This may take a few moments...</p>
          <p className="text-xs" style={{ color: currentTheme.colors.text.tertiary }}>
            Estimated processing time: {estimatedTimeText}
            {remainingMinutes > 0 && ` (${remainingMinutes}m ${remainingSecondsDisplay}s remaining)`}
          </p>
        </div>

        {/* Thin Bar Loader */}
        <div className="relative h-1 rounded-full overflow-hidden" style={{ backgroundColor: currentTheme.colors.surface }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${currentTheme.colors.primary}, ${currentTheme.colors.accent})`,
              boxShadow: `0 0 8px ${currentTheme.colors.accent}40`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>

        <p className="text-center text-sm font-medium" style={{ color: currentTheme.colors.text.secondary }}>
          {progressPercentage.toFixed(1)}% Complete
        </p>
      </div>
    </ThemedCard>
  );
}
