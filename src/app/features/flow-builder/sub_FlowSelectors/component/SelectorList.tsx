'use client';

import { AnimatePresence } from 'framer-motion';
import { ElementCard } from './ElementCard';
import { EmptyState } from './SelectorEmptyStates';
import type { DetectedElement } from '../lib';

interface ElementListProps {
  elements: DetectedElement[];
  loading: boolean;
  onSelectElement: (selector: string, elementInfo: DetectedElement) => void;
}

export function ElementList({ elements, loading, onSelectElement }: ElementListProps) {
  if (elements.length === 0 && !loading) {
    return <EmptyState type="no-results" />;
  }

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto overflow-x-hidden">
      <AnimatePresence mode="popLayout">
        {elements.map((element, index) => (
          <ElementCard
            key={`${element.selector}-${index}`}
            element={element}
            index={index}
            onSelect={onSelectElement}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
