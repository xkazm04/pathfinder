'use client';

import { useTheme } from '@/lib/stores/appStore';
import { motion } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';
import { getStepIcon, getStepColor } from '../lib';
import type { StepCardProps } from '../lib';

export function StepCard({
  step,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: StepCardProps) {
  const { currentTheme } = useTheme();
  const IconComponent = getStepIcon(step.type);
  const stepColor = getStepColor(step.type);

  // Build compact config info
  const configInfo = [
    step.config.selector ? `🎯 ${step.config.selector}` : null,
    step.config.value ? `"${step.config.value}"` : null,
    step.config.url ? `🔗 ${step.config.url}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      layout
      onClick={onSelect}
      className="px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-[1.005] group"
      style={{
        backgroundColor: isSelected
          ? currentTheme.colors.primary + '10'
          : currentTheme.colors.surface,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isSelected
          ? currentTheme.colors.primary
          : currentTheme.colors.border,
      }}
      data-testid={`flow-step-${step.id}`}
    >
      <div className="flex items-center gap-2">
        {/* Step Number - Compact */}
        <div
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: stepColor + '20',
            color: stepColor,
          }}
        >
          {index + 1}
        </div>

        {/* Step Icon - Compact */}
        <div
          className="shrink-0 w-7 h-7 rounded flex items-center justify-center"
          style={{
            backgroundColor: currentTheme.colors.background,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: currentTheme.colors.border,
          }}
        >
          {IconComponent && (
            <div style={{ color: stepColor }}>
              <IconComponent className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Step Type Badge - Compact */}
        <span
          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
          style={{
            backgroundColor: stepColor + '15',
            color: stepColor,
          }}
        >
          {step.type}
        </span>

        {/* Description - Flexible */}
        <span
          className="flex-1 text-xs truncate"
          style={{ color: currentTheme.colors.text.primary }}
        >
          {step.config.description}
        </span>

        {/* Config Info - Flexible */}
        {configInfo && (
          <code
            className="flex-1 text-[10px] font-mono truncate"
            style={{ color: currentTheme.colors.text.tertiary }}
          >
            {configInfo}
          </code>
        )}

        {/* Action Buttons - Compact */}
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded transition-colors hover:bg-blue-500/10"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
            }}
            data-testid={`edit-step-${step.id}`}
            title="Edit step"
          >
            <Edit3
              className="w-3.5 h-3.5"
              style={{ color: currentTheme.colors.text.secondary }}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded transition-colors hover:bg-red-500/20"
            style={{
              backgroundColor: currentTheme.colors.background,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: currentTheme.colors.border,
            }}
            data-testid={`delete-step-${step.id}`}
            title="Delete step"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
