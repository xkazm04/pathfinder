'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-neutral-600">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6" variant="primary">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
