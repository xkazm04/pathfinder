import { Variants } from 'framer-motion';

// Fade in animation
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up animation
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Slide down animation
export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// Slide left animation
export const slideLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Slide right animation
export const slideRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Scale animation
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Scale up animation
export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// Stagger children animation
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Fast stagger children
export const staggerContainerFast: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Slow stagger children
export const staggerContainerSlow: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// Expand vertically
export const expandVertical: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

// Expand horizontally
export const expandHorizontal: Variants = {
  initial: { opacity: 0, width: 0 },
  animate: { opacity: 1, width: 'auto' },
  exit: { opacity: 0, width: 0 },
};

// Rotate in animation
export const rotateIn: Variants = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: 10 },
};

// Bounce in animation
export const bounceIn: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
  exit: { opacity: 0, scale: 0.3 },
};

// Transition presets
export const transitions = {
  fast: { duration: 0.15 },
  base: { duration: 0.2 },
  slow: { duration: 0.3 },
  spring: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },
  springGentle: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 14,
  },
};

// Combine animation with custom transition
export const withTransition = (
  variants: Variants,
  transition: Record<string, unknown>
): Variants => {
  return {
    ...variants,
    animate: {
      ...variants.animate,
      transition,
    },
  };
};

// Page transition variants
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Card hover animation
export const cardHover = {
  rest: { scale: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.2,
      type: 'tween',
      ease: 'easeOut',
    },
  },
};

// Button tap animation
export const buttonTap = {
  scale: 0.95,
};

// Loading pulse animation
export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shimmer loading animation
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
