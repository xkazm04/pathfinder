'use client';

import { ReactNode } from 'react';
import { BadgeVariant } from '@/lib/types';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  error: 'bg-error-100 text-error-800 border-error-200',
  info: 'bg-primary-100 text-primary-800 border-primary-200',
  default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return <span className={combinedStyles}>{children}</span>;
}

// Specialized badge components for common use cases
interface StatusBadgeProps {
  status: 'pass' | 'fail' | 'skipped' | 'pending' | 'running' | 'completed';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusVariantMap: Record<typeof status, BadgeVariant> = {
    pass: 'success',
    completed: 'success',
    fail: 'error',
    skipped: 'warning',
    pending: 'default',
    running: 'info',
  };

  const statusLabels: Record<typeof status, string> = {
    pass: 'Passed',
    fail: 'Failed',
    skipped: 'Skipped',
    pending: 'Pending',
    running: 'Running',
    completed: 'Completed',
  };

  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {statusLabels[status]}
    </Badge>
  );
}

interface SeverityBadgeProps {
  severity: 'critical' | 'warning' | 'info';
  className?: string;
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const severityVariantMap: Record<typeof severity, BadgeVariant> = {
    critical: 'error',
    warning: 'warning',
    info: 'info',
  };

  const severityLabels: Record<typeof severity, string> = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <Badge variant={severityVariantMap[severity]} className={className}>
      {severityLabels[severity]}
    </Badge>
  );
}
