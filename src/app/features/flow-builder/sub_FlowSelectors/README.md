# Test Selectors Module

A modular component for detecting and selecting DOM elements from a target URL for automated testing.

## Structure

```
sub_FlowSelectors/
├── lib/                          # Configs and helpers
│   ├── types.ts                  # TypeScript interfaces and types
│   ├── elementHelpers.tsx        # Helper functions for element operations
│   ├── selectorDetection.ts      # API integration for selector detection
│   └── index.ts                  # Barrel exports
│
├── component/                    # UI components
│   ├── SelectorHeader.tsx        # Header with scan button
│   ├── FilterSection.tsx         # Search and type filter controls
│   ├── ElementList.tsx           # List container for elements
│   ├── ElementCard.tsx           # Individual element card
│   ├── EmptyStates.tsx           # Empty and error state displays
│   └── index.ts                  # Barrel exports
│
├── TestSelectors.tsx             # Main orchestrator component
└── README.md                     # This file
```

## Components

### Main Component

#### `TestSelectors`
The main orchestrator component that manages state and coordinates all sub-components.

**Props:**
- `targetUrl: string` - URL to scan for selectors
- `onSelectSelector?: (selector: string, elementInfo: DetectedElement) => void` - Callback when selector is selected

**Usage:**
```tsx
<TestSelectors
  targetUrl="https://example.com"
  onSelectSelector={(selector, info) => console.log(selector)}
/>
```

### UI Components

#### `SelectorHeader`
Header section with scan button and element count.

#### `FilterSection`
Search input and type filter buttons for filtering elements.

#### `ElementList`
Scrollable list of detected elements with animations.

#### `ElementCard`
Individual card displaying element details with hover effects.

#### `EmptyStates`
- `EmptyState` - Different empty states (no-url, no-scan, no-results)
- `ErrorState` - Error message display

## Library Functions

### Types (`lib/types.ts`)
- `DetectedElement` - Interface for detected DOM elements
- `TestSelectorsProps` - Props for main component
- `FilterState` - Filter state interface

### Element Helpers (`lib/elementHelpers.tsx`)
- `getElementIcon(type)` - Returns icon component for element type
- `getTypeColor(type, fallback)` - Returns color for element type
- `filterElements(elements, searchTerm, selectedType)` - Filter elements by search and type
- `getElementTypes(elements)` - Extract unique element types
- `getElementTypeCount(elements, type)` - Count elements by type

### API (`lib/selectorDetection.ts`)
- `detectSelectors(url)` - Fetch selectors from target URL via API

## Features

- **Automatic Detection** - Scans target URL for interactive elements
- **Smart Filtering** - Filter by type (button, input, link, select) and search term
- **Visual Feedback** - Loading states, error handling, and smooth animations
- **Type-based Styling** - Color-coded element types with icons
- **Accessible** - Clear labels, ARIA support, and keyboard navigation

## Element Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| button | MousePointer2 | Blue (#3b82f6) | Clickable buttons |
| input | Type | Green (#10b981) | Text inputs |
| link | Link | Purple (#8b5cf6) | Anchor links |
| select | ChevronDown | Amber (#f59e0b) | Dropdown selects |
| other | Target | Theme color | Other elements |

## Extending

### Adding New Element Types

1. Update `DetectedElement` type in `lib/types.ts`
2. Add icon mapping in `getElementIcon()` in `lib/elementHelpers.tsx`
3. Add color mapping in `getTypeColor()` in `lib/elementHelpers.tsx`

### Adding New Filters

1. Add filter state to `TestSelectors` component
2. Update `filterElements()` logic in `lib/elementHelpers.tsx`
3. Add UI controls in `FilterSection` component

### Customizing Styles

All components use the theme system from `@/lib/stores/appStore`. Colors automatically adapt to the current theme.

## Dependencies

- React 18+
- Framer Motion (animations)
- Lucide React (icons)
- Custom theme system (`@/lib/stores/appStore`)
- Custom UI components (`@/components/ui/*`)
