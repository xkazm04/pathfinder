'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CardVariant } from '@/lib/types';
import { scaleIn } from '@/lib/animations';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white shadow-sm',
  bordered: 'bg-white border-2 border-neutral-200',
  elevated: 'bg-white shadow-md hover:shadow-lg transition-shadow',
};

export function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  animate = true,
}: CardProps) {
  const baseStyles = 'rounded-lg p-6';
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (animate) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className={combinedStyles}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.01 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={combinedStyles} onClick={onClick}>
      {children}
    </div>
  );
}
