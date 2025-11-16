'use client';

import { useTheme } from '@/lib/stores/appStore';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { getElementIcon, getTypeColor } from '../lib';
import type { DetectedElement } from '../lib';

interface ElementCardProps {
  element: DetectedElement;
  index: number;
  onSelect: (selector: string, elementInfo: DetectedElement) => void;
}

export function ElementCard({ element, index, onSelect }: ElementCardProps) {
  const { currentTheme } = useTheme();
  const typeColor = getTypeColor(element.type, currentTheme.colors.text.secondary);

  // Get display text (prioritize text, then placeholder, then aria-label)
  const displayText = element.text || element.placeholder || element.ariaLabel;

  // Build compact info string
  const info = [
    element.id ? `#${element.id}` : null,
    displayText,
  ].filter(Boolean).join(' • ');

  return (
    <motion.button
      key={`${element.selector}-${index}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      onClick={() => onSelect(element.selector, element)}
      className="w-full px-2.5 py-1.5 rounded text-left transition-all cursor-pointer group hover:brightness-110"
      style={{
        backgroundColor: currentTheme.colors.surface,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: currentTheme.colors.border,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Type Icon - Compact */}
        <div
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
          style={{
            backgroundColor: typeColor + '15',
            color: typeColor,
          }}
        >
          {getElementIcon(element.type)}
        </div>

        {/* Type Badge - Compact */}
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
          style={{
            backgroundColor: typeColor + '15',
            color: typeColor,
          }}
        >
          {element.type}
        </span>

        {/* Selector - Flexible width */}
        <code
          className="flex-1 text-xs font-mono truncate"
          style={{ color: currentTheme.colors.text.primary }}
        >
          {element.selector}
        </code>

        {/* Additional Info - Flexible width */}
        {info && (
          <span
            className="flex-1 text-xs truncate"
            style={{ color: currentTheme.colors.text.tertiary }}
          >
            {info}
          </span>
        )}

        {/* Check icon - Hover indicator */}
        <CheckCircle2
          className="shrink-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: currentTheme.colors.primary }}
        />
      </div>
    </motion.button>
  );
}
