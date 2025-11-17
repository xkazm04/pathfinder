'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { Loader2 } from 'lucide-react';
import SlimSelect from 'slim-select';
import 'slim-select/styles';
import './ThemedSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ThemedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  helperText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  label,
  icon,
  helperText,
  isLoading = false,
  disabled = false,
  required = false,
  error,
  className = '',
  size = 'md',
}: ThemedSelectProps) {
  const { currentTheme } = useTheme();
  const selectRef = useRef<HTMLSelectElement>(null);
  const slimSelectRef = useRef<SlimSelect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Helper function to apply theme CSS properties to an element
  const applyCSSProperties = (element: HTMLElement) => {
    element.style.setProperty('--select-bg', currentTheme.colors.surface);
    element.style.setProperty('--select-border', currentTheme.colors.border);
    element.style.setProperty('--select-border-hover', currentTheme.colors.primary);
    element.style.setProperty('--select-border-focus', currentTheme.colors.accent);
    element.style.setProperty('--select-text', currentTheme.colors.text.primary);
    element.style.setProperty('--select-placeholder', currentTheme.colors.text.tertiary);
    element.style.setProperty('--select-arrow', currentTheme.colors.text.tertiary);
    element.style.setProperty('--select-arrow-hover', currentTheme.colors.primary);
    element.style.setProperty('--select-dropdown-bg', currentTheme.colors.surface);
    element.style.setProperty('--select-option-text', currentTheme.colors.text.primary);
    element.style.setProperty('--select-option-hover-bg', currentTheme.colors.surfaceHover);
    element.style.setProperty('--select-option-hover-text', currentTheme.colors.text.primary);
    element.style.setProperty('--select-option-selected-bg', currentTheme.colors.surfaceHover);
    element.style.setProperty('--select-option-selected-text', currentTheme.colors.text.primary);
    element.style.setProperty('--select-option-selected-border', currentTheme.colors.accent);
    element.style.setProperty('--select-option-disabled', currentTheme.colors.text.tertiary);
    element.style.setProperty('--select-search-bg', currentTheme.colors.background);
    element.style.setProperty('--select-search-text', currentTheme.colors.text.primary);
    element.style.setProperty('--select-multi-value-bg', currentTheme.colors.primary);
    element.style.setProperty('--select-multi-value-text', currentTheme.colors.text.primary);

    // Focus ring with semi-transparent accent color
    const accentWithAlpha = `${currentTheme.colors.accent}33`; // 20% opacity
    element.style.setProperty('--select-focus-ring', accentWithAlpha);
  };

  // Initialize SlimSelect
  useEffect(() => {
    if (!selectRef.current || isLoading) return;

    // Initialize SlimSelect with settings
    slimSelectRef.current = new SlimSelect({
      select: selectRef.current,
      settings: {
        showSearch: options.length > 5,
        searchPlaceholder: 'Search...',
        searchText: 'No results found',
        searchingText: 'Searching...',
        placeholderText: placeholder,
        allowDeselect: !required,
        closeOnSelect: true,
      },
      events: {
        afterChange: (newVal) => {
          if (newVal.length > 0) {
            onChange(newVal[0].value);
          } else if (!required) {
            onChange('');
          }
        },
        afterOpen: () => {
          // Apply theme class to dropdown content when it opens
          const slimContent = document.querySelector('.ss-content') as HTMLElement;
          if (slimContent && currentTheme) {
            slimContent.classList.add('themed-select-dynamic');
            slimContent.classList.add(`themed-select-${size}`);
            applyCSSProperties(slimContent);
          }
        },
      },
    });

    // Apply theme classes to SlimSelect container
    const slimContainer = selectRef.current.parentElement?.querySelector('.ss-main');
    if (slimContainer) {
      slimContainer.classList.add('themed-select-dynamic');
      slimContainer.classList.add(`themed-select-${size}`);
      if (error) {
        slimContainer.classList.add('themed-select-error');
      }
    }

    // Also apply class to content if it already exists
    const slimContent = document.querySelector('.ss-content');
    if (slimContent) {
      slimContent.classList.add('themed-select-dynamic');
      slimContent.classList.add(`themed-select-${size}`);
    }

    return () => {
      slimSelectRef.current?.destroy();
      slimSelectRef.current = null;
    };
  }, [options, placeholder, required, isLoading, size]);

  // Update value when prop changes
  useEffect(() => {
    if (slimSelectRef.current && value !== undefined) {
      slimSelectRef.current.setSelected(value);
    }
  }, [value]);

  // Handle disabled state
  useEffect(() => {
    if (slimSelectRef.current) {
      if (disabled) {
        slimSelectRef.current.disable();
      } else {
        slimSelectRef.current.enable();
      }
    }
  }, [disabled]);

  // Update error state
  useEffect(() => {
    if (selectRef.current) {
      const slimContainer = selectRef.current.parentElement?.querySelector('.ss-main');
      if (slimContainer) {
        if (error) {
          slimContainer.classList.add('themed-select-error');
        } else {
          slimContainer.classList.remove('themed-select-error');
        }
      }
      // Also update content if it exists
      const slimContent = document.querySelector('.ss-content');
      if (slimContent) {
        if (error) {
          slimContent.classList.add('themed-select-error');
        } else {
          slimContent.classList.remove('themed-select-error');
        }
      }
    }
  }, [error]);

  // Apply theme colors via CSS custom properties
  useEffect(() => {
    if (!containerRef.current || !currentTheme) return;

    const container = containerRef.current;

    // Apply to container
    applyCSSProperties(container);

    // Also apply to all content elements (for already open dropdowns anywhere in the DOM)
    const allSlimContent = document.querySelectorAll('.ss-content');
    allSlimContent.forEach((slimContent) => {
      if (slimContent instanceof HTMLElement) {
        applyCSSProperties(slimContent);
      }
    });

    // Apply to main select elements
    const allSlimMain = document.querySelectorAll('.ss-main');
    allSlimMain.forEach((slimMain) => {
      if (slimMain instanceof HTMLElement) {
        applyCSSProperties(slimMain);
      }
    });
  }, [currentTheme]);

  // Watch for dropdown creation and apply theme immediately
  useEffect(() => {
    if (!currentTheme) return;

    // Create a MutationObserver to watch for dropdown content being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if this is a SlimSelect content element
            if (node.classList.contains('ss-content')) {
              applyCSSProperties(node);
            }
            // Also check child elements
            const contentElements = node.querySelectorAll('.ss-content');
            contentElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                applyCSSProperties(el);
              }
            });
          }
        });
      });
    });

    // Observe the entire document body for added nodes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [currentTheme]);

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-medium" style={{ color: currentTheme.colors.text.secondary }}>
          {icon && <span className="inline-flex items-center mr-1">{icon}</span>}
          {label}
          {required && <span className="ml-0.5" style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full rounded-md flex items-center justify-center gap-2 px-3"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(100, 116, 139, 0.2)',
              color: currentTheme.colors.text.tertiary,
              minHeight: size === 'sm' ? '32px' : size === 'lg' ? '42px' : '36px',
            }}
          >
            <Loader2 className={`${iconSize[size]} animate-spin`} />
            <span className={size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-sm'}>
              Loading...
            </span>
          </motion.div>
        ) : (
          <select
            ref={selectRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="w-full"
          >
            {placeholder && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1 text-xs mt-1"
          style={{ color: error ? '#ef4444' : currentTheme.colors.text.tertiary }}
        >
          {error || helperText}
        </motion.div>
      )}
    </div>
  );
}
