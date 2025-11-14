# Pathfinder Theme System

## Overview

Pathfinder features a comprehensive theming system with 3 distinct visual identities. Each theme provides a unique aesthetic while maintaining consistency across all UI components.

## Available Themes

### 1. **Cyber Blueprint** (Default)
Technical precision with blueprint aesthetics. Inspired by engineering drawings and technical documentation.

**Color Scheme:**
- Primary: Cyan (#06b6d4)
- Secondary: Blue (#3b82f6)
- Accent: Bright Cyan (#22d3ee)
- Background: Deep space black

**Visual Features:**
- Blueprint grid patterns (fine and major lines)
- Animated scan lines moving vertically
- Corner technical brackets
- Vignette effects for depth
- Crisp, technical aesthetic

**Best For:** Professional testing environments, technical documentation, developer-focused interfaces

---

### 2. **Neon Synthwave**
Retro-futuristic vibes with electric colors. Inspired by 1980s aesthetics and cyberpunk culture.

**Color Scheme:**
- Primary: Purple (#a855f7)
- Secondary: Pink (#ec4899)
- Accent: Orange (#f97316)
- Background: Deep purple-black

**Visual Features:**
- Animated gradient orbs with pulsing effects
- Horizontal scan lines
- Retro grid floor with perspective transform
- Glowing accents and neon effects
- Radial vignette

**Best For:** Creative projects, entertainment applications, modern/trendy interfaces

---

### 3. **Tactical Command**
Military precision with focused execution. Inspired by command centers and military interfaces.

**Color Scheme:**
- Primary: Green (#22c55e)
- Secondary: Lime (#84cc16)
- Accent: Yellow (#eab308)
- Background: Very dark green-black

**Visual Features:**
- Tactical grid overlay
- Central crosshair/targeting system
- Animated radar sweep effect
- Corner bracket decorations
- Directional gradient vignette

**Best For:** Monitoring systems, operations dashboards, mission-critical interfaces

---

## Theme System Architecture

### Core Files

```
src/
├── lib/
│   └── theme.ts                    # Theme definitions and types
├── contexts/
│   └── ThemeContext.tsx            # Theme provider and hooks
├── components/
│   ├── ui/
│   │   ├── ThemedCard.tsx          # Themed card components
│   │   ├── ThemedButton.tsx        # Themed button components
│   │   └── ThemeSwitcher.tsx       # Theme selection UI
│   └── decorative/
│       └── ThemeBackground.tsx     # Theme-specific backgrounds
```

### Theme Structure

Each theme includes:
- **colors**: Primary, secondary, accent, backgrounds, borders, text hierarchy
- **effects**: Blur levels, opacity settings
- **gradients**: Multi-stop color gradients for dynamic effects

### Using the Theme System

#### 1. Access Current Theme

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { currentTheme, themeId, setTheme } = useTheme();

  return (
    <div style={{ color: currentTheme.colors.text.primary }}>
      Current theme: {currentTheme.name}
    </div>
  );
}
```

#### 2. Use Themed Components

```tsx
import { ThemedCard, ThemedCardHeader, ThemedCardContent } from '@/components/ui/ThemedCard';
import { ThemedButton } from '@/components/ui/ThemedButton';

function Dashboard() {
  return (
    <ThemedCard variant="glow" hoverable>
      <ThemedCardHeader
        title="My Card"
        icon={<Icon />}
      />
      <ThemedCardContent>
        <p>Content here</p>
      </ThemedCardContent>

      <ThemedButton variant="primary">
        Action
      </ThemedButton>
    </ThemedCard>
  );
}
```

#### 3. Switch Themes

```tsx
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

function Header() {
  return (
    <header>
      <ThemeSwitcher />
    </header>
  );
}
```

---

## Component Variants

### ThemedCard Variants
- **default**: Standard gradient background
- **bordered**: Emphasized border with solid background
- **glass**: Glassmorphism effect with blur
- **glow**: Enhanced with themed shadow glow

### ThemedButton Variants
- **primary**: Gradient background with primary colors
- **secondary**: Subtle surface background
- **ghost**: Transparent with hover effect
- **glow**: Enhanced gradient with glow effect

### Decorative Backgrounds

Each theme includes unique decorative background elements:
- Automatically rendered via `<ThemeBackground />`
- Positioned in fixed layer behind content
- Non-interactive (pointer-events: none)
- Animated elements for dynamic feel

---

## Theme Persistence

Themes are automatically saved to localStorage and restored on page load:

```typescript
// Saved as: 'pathfinder-theme'
// Values: 'cyber' | 'synthwave' | 'tactical'
```

---

## Design Principles

### 1. Visual Hierarchy
- Primary colors: Main actions and focus areas
- Secondary colors: Supporting elements
- Accent colors: Highlights and indicators
- Text hierarchy: 3 levels (primary, secondary, tertiary)

### 2. Consistency
- All themed components follow same color scheme
- Border styles and radii are consistent
- Spacing follows 4px base scale
- Animations use consistent timing (200-300ms)

### 3. Accessibility
- WCAG AA color contrast standards
- Focus states visible on all interactive elements
- Hover states provide clear feedback
- Motion respects user preferences

### 4. Performance
- CSS-based animations (GPU accelerated)
- Minimal re-renders on theme change
- Efficient background decorations
- Optimized Framer Motion usage

---

## Extending the Theme System

### Adding a New Theme

1. **Define theme in** `src/lib/theme.ts`:

```typescript
export const themes: Record<ThemeVariant, Theme> = {
  // ... existing themes
  myTheme: {
    id: 'myTheme',
    name: 'My Theme Name',
    description: 'Theme description',
    colors: {
      primary: '#color',
      // ... other colors
    },
    effects: {
      blur: 'backdrop-blur-sm',
      opacity: 'bg-opacity-10',
    },
  },
};
```

2. **Add decorative background** in `src/components/decorative/ThemeBackground.tsx`:

```typescript
function MyThemeBackground({ theme }: { theme: any }) {
  return (
    <>
      {/* Your custom decorative elements */}
    </>
  );
}
```

3. **Update ThemeVariant type**:

```typescript
export type ThemeVariant = 'cyber' | 'synthwave' | 'tactical' | 'myTheme';
```

---

## Best Practices

1. **Use themed components** when possible instead of raw HTML elements
2. **Reference theme colors** via `currentTheme.colors.*` instead of hardcoding
3. **Test all themes** when creating new UI components
4. **Maintain visual consistency** across all themes
5. **Keep decorative elements subtle** - they should enhance, not distract
6. **Consider performance** - avoid heavy animations in backgrounds

---

## Implementation Notes

### Framer Motion Integration
- All themed components support optional animation
- Hover and tap interactions are theme-aware
- Exit animations maintain theme consistency

### TypeScript Support
- Fully typed theme system
- IntelliSense support for all theme properties
- Type-safe component variants

### Dark Mode
- All themes are dark by default
- Light mode support can be added per-theme
- Respects system preferences

---

## Troubleshooting

### Theme not persisting
- Check localStorage is enabled
- Verify key: 'pathfinder-theme'
- Ensure valid theme ID

### Colors not updating
- Verify ThemeProvider wraps your app
- Check component uses `useTheme()` hook
- Ensure dynamic styles use theme values

### Decorations not showing
- Verify `<ThemeBackground />` is rendered
- Check z-index layering (-z-10)
- Ensure fixed positioning is not blocked

---

## Future Enhancements

Potential additions to the theme system:
- User-created custom themes
- Theme animation transitions
- Per-page theme overrides
- Light mode variants
- Accessibility themes (high contrast)
- Export/import theme configurations
- Theme marketplace/sharing

---

## Credits

Inspired by:
- Blueprint design systems (Cyber theme)
- 1980s synthwave aesthetics (Synthwave theme)
- Military HUD interfaces (Tactical theme)
- Compact UI Design philosophy from Vibeman

Built with:
- Next.js 16
- Framer Motion
- TypeScript
- Tailwind CSS 4
