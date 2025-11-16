'use client';

import { useTheme } from '@/lib/stores/appStore';
import React from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'url' | 'email' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  testId?: string;
  className?: string;
  helpText?: string;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  testId,
  className = '',
  helpText,
}: InputProps) {
  const { currentTheme } = useTheme();

  return (
    <div className={className}>
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: currentTheme.colors.text.primary }}
      >
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded text-sm"
        style={{
          backgroundColor: currentTheme.colors.surface,
          color: currentTheme.colors.text.primary,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: currentTheme.colors.border,
          opacity: disabled ? 0.6 : 1,
        }}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testId}
      />
      {helpText && (
        <p
          className="text-xs mt-1"
          style={{ color: currentTheme.colors.text.tertiary }}
        >
          {helpText}
        </p>
      )}
    </div>
  );
}
