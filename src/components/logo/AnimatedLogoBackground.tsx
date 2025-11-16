'use client';

import { motion } from 'framer-motion';
import { Theme } from '@/lib/theme';

interface AnimatedLogoBackgroundProps {
  theme: Theme;
  triggerKey: string; // Changes to this will trigger the animation
}

/**
 * Get theme-specific mask overlay color
 */
const getMaskColor = (themeId: string): string => {
  switch (themeId) {
    case 'cyber':
      return 'rgba(3, 7, 18, 0.92)'; // Very dark blue-black with cyan tint
    case 'crimson':
      return 'rgba(0, 0, 0, 0.94)'; // Almost pure black with slight red tint
    case 'slate':
      return 'rgba(0, 0, 0, 0.93)'; // Pure black with slate tint
    default:
      return 'rgba(3, 7, 18, 0.92)';
  }
};

/**
 * Animated background logo that creates a neon glow effect on page transitions
 * The logo briefly brightens (opacity 30%) then fades back to subtle (opacity 2%)
 */
export function AnimatedLogoBackground({ theme, triggerKey }: AnimatedLogoBackgroundProps) {
  return (
    <motion.div
      key={triggerKey} // Changing the key triggers a remount and restarts the animation
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: 'url(/logo/logo_full.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      initial={{ opacity: 0.02 }}
      animate={{ opacity: [0.02, 0.3, 0.02] }}
      transition={{
        duration: 1.5,
        times: [0, 0.3, 1],
        ease: 'easeInOut',
      }}
    >
      {/* Theme-specific mask layer */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `linear-gradient(135deg, ${getMaskColor(theme.id)} 0%, ${theme.colors.background} 100%)`,
        }}
      />
    </motion.div>
  );
}
