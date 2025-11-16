'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/stores/appStore';
import { scaleIn } from '@/lib/animations';

export type CardVariant = 'default' | 'bordered' | 'glass' | 'glow';

interface ThemedCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
  animate?: boolean;
}

export function ThemedCard({
  children,
  variant = 'default',
  hoverable = false,
  animate = true,
  className = '',
  ...props
}: ThemedCardProps) {
  const { currentTheme, themeId } = useTheme();

  const baseStyles = 'rounded-xl p-6 transition-all duration-300';

  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return {
          background: `linear-gradient(135deg, ${currentTheme.colors.surface}ee 0%, ${currentTheme.colors.surface}aa 100%)`,
          borderColor: currentTheme.colors.border,
          borderWidth: '2px',
        };
      case 'glass':
        return {
          background: `${currentTheme.colors.surface}20`,
          backdropFilter: 'blur(10px)',
          borderColor: currentTheme.colors.border,
          borderWidth: '1px',
        };
      case 'glow':
        return {
          background: `linear-gradient(135deg, ${currentTheme.colors.surface}ee 0%, ${currentTheme.colors.surface}aa 100%)`,
          borderColor: currentTheme.colors.borderHover,
          borderWidth: '2px',
          boxShadow: currentTheme.colors.glow,
        };
      default:
        return {
          background: `linear-gradient(135deg, ${currentTheme.colors.surface}dd 0%, ${currentTheme.colors.surface}99 100%)`,
          borderColor: currentTheme.colors.border,
          borderWidth: '1px',
        };
    }
  };

  const hoverStyles = hoverable
    ? {
        cursor: 'pointer',
        '&:hover': {
          borderColor: currentTheme.colors.borderHover,
          transform: 'translateY(-2px)',
          boxShadow: currentTheme.colors.glow,
        },
      }
    : {};

  const variantStyles = getVariantStyles();

  const combinedStyles = {
    ...variantStyles,
    borderStyle: 'solid',
    color: currentTheme.colors.text.primary,
  };

  if (animate) {
    return (
      <motion.div
        className={`${baseStyles} ${className}`}
        style={combinedStyles}
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover={hoverable ? { scale: 1.01, y: -2 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${className}`}
      style={combinedStyles}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export function ThemedCardHeader({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  ...props
}: CardHeaderProps) {
  const { currentTheme } = useTheme();

  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`} {...props}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
            style={{
              background: `${currentTheme.colors.primary}20`,
              borderColor: `${currentTheme.colors.primary}40`,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <span style={{ color: currentTheme.colors.accent }}>{icon}</span>
          </div>
        )}
        {(title || subtitle || children) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h3
                className="text-base font-semibold truncate"
                style={{ color: currentTheme.colors.text.primary }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className="text-sm truncate mt-0.5"
                style={{ color: currentTheme.colors.text.tertiary }}
              >
                {subtitle}
              </p>
            )}
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ThemedCardContent({ className = '', children, ...props }: CardContentProps) {
  const { currentTheme } = useTheme();

  return (
    <div
      className={`text-sm ${className}`}
      style={{ color: currentTheme.colors.text.secondary }}
      {...props}
    >
      {children}
    </div>
  );
}
