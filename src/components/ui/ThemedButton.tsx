'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Loader2 } from 'lucide-react';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glow';

interface ThemedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function ThemedButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  onClick,
  ...props
}: ThemedButtonProps) {
  const { currentTheme } = useTheme();

  const isDisabled = disabled || isLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)`,
          color: '#ffffff',
          boxShadow: `0 4px 14px ${currentTheme.colors.shadow}`,
          border: 'none',
        };
      case 'secondary':
        return {
          background: `${currentTheme.colors.surface}`,
          color: currentTheme.colors.text.primary,
          borderColor: currentTheme.colors.border,
          borderWidth: '1px',
          borderStyle: 'solid',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: currentTheme.colors.text.secondary,
          borderColor: 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
        };
      case 'glow':
        return {
          background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.gradient.via || currentTheme.colors.secondary} 50%, ${currentTheme.colors.secondary} 100%)`,
          color: '#ffffff',
          boxShadow: currentTheme.colors.glow,
          border: 'none',
        };
      default:
        return {};
    }
  };

  const variantStyles = getVariantStyles();

  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg transition-all
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      className={`${baseStyles} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={variantStyles}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
          {children}
          {rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
