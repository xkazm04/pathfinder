'use client';

import { useTheme } from '@/lib/stores/appStore';
import { useTestSteps, useStepSelection } from '@/lib/stores/testBuilderStore';
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { Plus, GripVertical } from 'lucide-react';
import { StepsList } from '@/app/features/nl-test/components/StepsList';

export function VisualFlowMode() {
  const { currentTheme } = useTheme();
  const { steps, addStep } = useTestSteps();
  const { selectedStepId, setSelectedStepId } = useStepSelection();

  const handleAddStep = (type: any) => {
    addStep({
      type,
      action: `New ${type} step`,
      description: `Perform ${type} action`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar - Step Palette */}
      <div className="lg:col-span-1 space-y-4">
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Step Types"
            subtitle="Click to add"
            icon={<Plus className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <div className="space-y-2">
              {['navigate', 'click', 'fill', 'select', 'assert', 'wait'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddStep(type)}
                  className="w-full px-4 py-3 rounded text-sm font-medium transition-all hover:scale-[1.02] flex items-center gap-2"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text.primary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Center - Steps */}
      <div className="lg:col-span-3 space-y-6">
        {/* Steps */}
        <ThemedCard variant="bordered">
          <ThemedCardHeader
            title="Test Steps"
            subtitle={`${steps.length} steps`}
            icon={<GripVertical className="w-5 h-5" />}
          />
          <ThemedCardContent>
            <StepsList
              steps={steps}
              selectedStepId={selectedStepId}
              onStepClick={setSelectedStepId}
            />
          </ThemedCardContent>
        </ThemedCard>
      </div>
    </div>
  );
}
