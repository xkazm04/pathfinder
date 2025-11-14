'use client';

import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Zap, Plus, Play, Settings } from 'lucide-react';

interface QuickActionsCardProps {
  onCreateTest?: () => void;
  onRunTests?: () => void;
  onConfigure?: () => void;
}

export function QuickActionsCard({
  onCreateTest,
  onRunTests,
  onConfigure,
}: QuickActionsCardProps) {
  return (
    <ThemedCard variant="glass">
      <ThemedCardHeader
        title="Quick Actions"
        icon={<Zap className="w-5 h-5" />}
      />
      <ThemedCardContent>
        <div className="space-y-3 mt-4">
          <ThemedButton
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onCreateTest}
          >
            Create New Test
          </ThemedButton>
          <ThemedButton
            variant="glow"
            size="md"
            fullWidth
            leftIcon={<Play className="w-4 h-4" />}
            onClick={onRunTests}
          >
            Run All Tests
          </ThemedButton>
          <ThemedButton
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<Settings className="w-4 h-4" />}
            onClick={onConfigure}
          >
            Configure Suite
          </ThemedButton>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
