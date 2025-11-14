'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeStyles[size]} rounded-full border-4 border-neutral-200 border-t-primary-600`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Full page loading spinner
export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}

// Inline loading spinner with text
interface LoadingInlineProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingInline({ text = 'Loading...', size = 'sm' }: LoadingInlineProps) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size={size} />
      <span className="text-neutral-600">{text}</span>
    </div>
  );
}
