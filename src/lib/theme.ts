export type ThemeVariant = 'cyber' | 'crimson' | 'slate';

export interface Theme {
  id: ThemeVariant;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderHover: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    gradient: {
      from: string;
      to: string;
      via?: string;
    };
    shadow: string;
    glow: string;
  };
  effects: {
    blur: string;
    opacity: string;
  };
}

export const themes: Record<ThemeVariant, Theme> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Blueprint',
    description: 'Technical precision with blueprint aesthetics',
    colors: {
      primary: '#06b6d4', // cyan-500
      primaryDark: '#0891b2', // cyan-600
      secondary: '#3b82f6', // blue-500
      accent: '#22d3ee', // cyan-400
      background: '#030712', // gray-950
      surface: '#0f172a', // slate-900
      surfaceHover: '#1e293b', // slate-800
      border: 'rgba(6, 182, 212, 0.2)',
      borderHover: 'rgba(6, 182, 212, 0.5)',
      text: {
        primary: '#f8fafc', // slate-50
        secondary: '#cbd5e1', // slate-300
        tertiary: '#64748b', // slate-500
      },
      gradient: {
        from: '#06b6d4', // cyan-500
        to: '#3b82f6', // blue-500
      },
      shadow: 'rgba(6, 182, 212, 0.2)',
      glow: '0 0 20px rgba(6, 182, 212, 0.3)',
    },
    effects: {
      blur: 'backdrop-blur-sm',
      opacity: 'bg-opacity-10',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Dark',
    description: 'Dark elegance with subtle red accents',
    colors: {
      primary: '#991b1b', // red-800
      primaryDark: '#7f1d1d', // red-900
      secondary: '#dc2626', // red-600
      accent: '#b91c1c', // red-700
      background: '#000000', // pure black
      surface: '#0a0a0a', // near black
      surfaceHover: '#1a1a1a', // dark gray
      border: 'rgba(153, 27, 27, 0.15)',
      borderHover: 'rgba(153, 27, 27, 0.4)',
      text: {
        primary: '#f8fafc', // slate-50
        secondary: '#cbd5e1', // slate-300
        tertiary: '#94a3b8', // slate-400
      },
      gradient: {
        from: '#111827', // gray-900
        to: '#000000', // black
      },
      shadow: 'rgba(153, 27, 27, 0.2)',
      glow: '0 0 20px rgba(153, 27, 27, 0.3)',
    },
    effects: {
      blur: 'backdrop-blur-sm',
      opacity: 'bg-opacity-10',
    },
  },
  slate: {
    id: 'slate',
    name: 'Golden Slate',
    description: 'Refined elegance with golden highlights',
    colors: {
      primary: '#64748b', // slate-500
      primaryDark: '#475569', // slate-600
      secondary: '#94a3b8', // slate-400
      accent: '#fbbf24', // amber-400
      background: '#000000', // pure black
      surface: '#0f172a', // slate-900
      surfaceHover: '#1e293b', // slate-800
      border: 'rgba(100, 116, 139, 0.2)',
      borderHover: 'rgba(100, 116, 139, 0.4)',
      text: {
        primary: '#f8fafc', // slate-50
        secondary: '#cbd5e1', // slate-300
        tertiary: '#94a3b8', // slate-400
      },
      gradient: {
        from: '#1e293b', // slate-800
        to: '#000000', // black
      },
      shadow: 'rgba(100, 116, 139, 0.2)',
      glow: '0 0 20px rgba(251, 191, 36, 0.3)',
    },
    effects: {
      blur: 'backdrop-blur-sm',
      opacity: 'bg-opacity-10',
    },
  },
};
