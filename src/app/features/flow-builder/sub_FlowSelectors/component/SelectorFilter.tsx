'use client';

import { useTheme } from '@/lib/stores/appStore';
import { Search } from 'lucide-react';
import { getElementTypeCount } from '../lib';
import type { DetectedElement } from '../lib';

interface FilterSectionProps {
  searchTerm: string;
  selectedType: string;
  elementTypes: string[];
  elements: DetectedElement[];
  onSearchChange: (term: string) => void;
  onTypeChange: (type: string) => void;
}

export function FilterSection({
  searchTerm,
  selectedType,
  elementTypes,
  elements,
  onSearchChange,
  onTypeChange,
}: FilterSectionProps) {
  const { currentTheme } = useTheme();

  return (
    <div className="space-y-3 mb-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: currentTheme.colors.text.tertiary }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search selectors..."
          className="w-full pl-10 pr-4 py-2 rounded text-sm"
          style={{
            backgroundColor: currentTheme.colors.surface,
            color: currentTheme.colors.text.primary,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: currentTheme.colors.border,
          }}
        />
      </div>

      {/* Type Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {elementTypes.map((type) => {
          const count = getElementTypeCount(elements, type);
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: isSelected
                  ? currentTheme.colors.primary + '20'
                  : currentTheme.colors.surface,
                color: isSelected
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text.secondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: isSelected
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
              }}
            >
              {type === 'all' ? `All (${count})` : `${type} (${count})`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
