'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

export function ThemeBackground() {
  const { themeId, currentTheme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base background */}
      <div
        className="absolute inset-0"
        style={{ background: currentTheme.colors.background }}
      />

      {/* Theme-specific decorations */}
      {themeId === 'cyber' && <CyberBackground theme={currentTheme} />}
      {themeId === 'crimson' && <CrimsonBackground theme={currentTheme} />}
      {themeId === 'slate' && <SlateBackground theme={currentTheme} />}
    </div>
  );
}

// Cyber Blueprint Background
function CyberBackground({ theme }: { theme: any }) {
  return (
    <>
      {/* Blueprint grid - fine lines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(${theme.colors.primary}30 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.primary}30 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Blueprint grid - major lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(${theme.colors.primary}50 2px, transparent 2px),
            linear-gradient(90deg, ${theme.colors.primary}50 2px, transparent 2px)
          `,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.colors.accent}, transparent)`,
          boxShadow: `0 0 10px ${theme.colors.accent}`,
        }}
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-32 h-32 opacity-20">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 20 L 20 20 L 20 0" stroke={theme.colors.primary} strokeWidth="2" />
          <circle cx="20" cy="20" r="3" fill={theme.colors.accent} />
        </svg>
      </div>

      <div className="absolute bottom-8 right-8 w-32 h-32 opacity-20 rotate-180">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 20 L 20 20 L 20 0" stroke={theme.colors.primary} strokeWidth="2" />
          <circle cx="20" cy="20" r="3" fill={theme.colors.accent} />
        </svg>
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/50 via-transparent to-gray-950/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-transparent to-gray-950/50" />
    </>
  );
}

// Crimson Dark Background
function CrimsonBackground({ theme }: { theme: any }) {
  return (
    <>
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at top, ${theme.colors.primary}10, transparent 50%)`,
        }}
      />

      {/* Minimal grid - very subtle */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(${theme.colors.primary}60 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.primary}60 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Corner accent lines */}
      {[
        { top: 0, left: 0, width: '200px', height: '1px' },
        { top: 0, left: 0, width: '1px', height: '200px' },
        { top: 0, right: 0, width: '200px', height: '1px' },
        { top: 0, right: 0, width: '1px', height: '200px' },
        { bottom: 0, left: 0, width: '200px', height: '1px' },
        { bottom: 0, left: 0, width: '1px', height: '200px' },
        { bottom: 0, right: 0, width: '200px', height: '1px' },
        { bottom: 0, right: 0, width: '1px', height: '200px' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute opacity-20"
          style={{
            ...pos,
            background: `linear-gradient(${i % 2 === 0 ? '90deg' : '180deg'}, ${theme.colors.primary}, transparent)`,
          }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/50" />
    </>
  );
}

// Golden Slate Background
function SlateBackground({ theme }: { theme: any }) {
  return (
    <>
      {/* Elegant gradient overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at center, ${theme.colors.surface}80, transparent 70%)`,
        }}
      />

      {/* Medium gray grid */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(${theme.colors.primary}50 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.primary}50 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Golden accent corners */}
      {[
        { top: '3rem', left: '3rem' },
        { top: '3rem', right: '3rem' },
        { bottom: '3rem', right: '3rem' },
        { bottom: '3rem', left: '3rem' },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full opacity-40"
          style={{
            ...pos,
            background: theme.colors.accent,
            boxShadow: `0 0 10px ${theme.colors.accent}`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Elegant border lines */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-px opacity-20"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)`,
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 right-1/4 h-px opacity-20"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)`,
        }}
      />

      {/* Small golden decorative elements */}
      <motion.div
        className="absolute top-1/3 right-16 w-1 h-8 opacity-30"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.accent}, transparent)`,
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scaleY: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
    </>
  );
}
