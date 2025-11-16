# Flow Selector Redesign & FlowCanvas Refactoring

## Overview
Complete refactoring of FlowCanvas components and redesign of selector integration into StepEditor with modal-based table display.

---

## ✅ Task 1: FlowCanvas Folder & File Renaming

### Changes Made:

**Renamed folder:** `component` → `components`

**Renamed files with "Step" prefix:**
- `DropZone.tsx` → `StepDropZone.tsx`
- `EmptyState.tsx` → `StepEmptyState.tsx`
- `StepCard.tsx` (already had prefix)
- `StepList.tsx` (already had prefix)

### New Structure:
```
sub_FlowCanvas/
├── lib/
│   ├── types.ts
│   ├── stepHelpers.tsx
│   └── index.ts
├── components/                 # ← Renamed from 'component'
│   ├── StepDropZone.tsx        # ← Renamed from DropZone.tsx
│   ├── StepEmptyState.tsx      # ← Renamed from EmptyState.tsx
│   ├── StepCard.tsx
│   ├── StepList.tsx
│   └── index.ts
└── FlowCanvas.tsx
```

### Updated Imports:
**FlowCanvas.tsx:**
```typescript
// OLD
import { StepList, EmptyState } from './component';

// NEW
import { StepList, StepEmptyState } from './components';
```

**StepList.tsx:**
```typescript
// OLD
import { DropZone } from './DropZone';

// NEW
import { StepDropZone } from './StepDropZone';
```

---

## ✅ Task 2: Selector Scan Integration into StepEditor

### New File Created:
**`src/app/features/flow-builder/components/SelectorModal.tsx`**

A full-screen modal with table-based selector display:
- **Grid layout:** 4 columns (link, button, input, select/other)
- **Auto-scan on open:** Automatically detects selectors when opened
- **Search functionality:** Filter selectors across all types
- **Refresh button:** Re-scan page for updated elements
- **Responsive:** Adapts to different screen sizes

### Key Features:

#### 1. **Column-Based Organization**
```
┌─────────────────────────────────────────────────────┐
│  LINK (5)  │  BUTTON (12)  │  INPUT (8)  │  SELECT (3)  │
├─────────────────────────────────────────────────────┤
│ selector1   │  selector1    │  selector1  │  selector1   │
│ selector2   │  selector2    │  selector2  │  selector2   │
│ ...         │  ...          │  ...        │  ...         │
└─────────────────────────────────────────────────────┘
```

#### 2. **Element Display Format**
Each element shows:
- **Selector:** Monospace font for easy copying
- **Context:** Text content, placeholder, or aria-label
- **Type indicator:** Color-coded header per column

#### 3. **Modal Properties**
- **Max width:** 6xl (1152px)
- **Max height:** 90vh with scrollable content
- **Backdrop:** Semi-transparent black overlay
- **Animation:** Smooth fade and scale transitions

---

## ✅ Task 3: StepEditor Scan Button Integration

### Updated Interface:
**StepEditorProps:**
```typescript
interface StepEditorProps {
  step: FlowStep;
  onUpdate: (stepId: string, updates: Partial<FlowStep>) => void;
  selectedSelector?: string;
  onSelectorApplied?: () => void;
  targetUrl?: string; // NEW: Flow target URL for selector scanning
}
```

### New InputField Props:
```typescript
interface InputFieldProps {
  // ... existing props
  showScanButton?: boolean;
  onScanClick?: () => void;
  scanStatus?: 'idle' | 'ready' | 'scanned';
  scanLoading?: boolean;
}
```

### Scan Button States:

| Status | URL Exists | Color | Icon | Clickable |
|--------|-----------|-------|------|-----------|
| **idle** | ❌ No | Gray | Target | ❌ Disabled |
| **ready** | ✅ Yes | Blue (Primary) | Target | ✅ Enabled |
| **scanned** | ✅ Yes | Green | CheckCircle2 | ✅ Enabled |
| **loading** | ✅ Yes | Blue | Spinner | ❌ Disabled |

### Button Location:
```
┌─────────────────────────────────────────┐
│  Selector *                [🎯 Scan]   │  ← Button on right side of label
├─────────────────────────────────────────┤
│  [input field for selector]             │
└─────────────────────────────────────────┘
```

### Step Types with Scan Button:
- ✅ **click** - Click actions
- ✅ **hover** - Hover actions
- ✅ **fill** - Fill input fields
- ✅ **select** - Select dropdowns
- ✅ **verify** - Verify elements
- ❌ **navigate** - No scan button (uses URL)
- ❌ **assert** - No scan button (uses assertion)
- ❌ **wait** - Optional selector, has scan button for selector field

### Scan Workflow:
1. User enters target URL in Flow Configuration
2. **Status:** `idle` → `ready` (button becomes clickable)
3. User selects a step that needs a selector
4. User clicks **Scan** button
5. **Status:** `ready` → `scanned` (button turns green)
6. Modal opens with detected selectors
7. User clicks on a selector in the table
8. Selector auto-fills into input field
9. Modal closes
10. Auto-sync to Natural Language (if enabled)

---

## 📊 Component Integration Flow

```
FlowBuilder.tsx
    │
    ├─> StepEditor (with targetUrl prop)
    │       │
    │       ├─> InputField (with scan button)
    │       │       │
    │       │       └─> onClick: Opens SelectorModal
    │       │
    │       └─> SelectorModal
    │               │
    │               ├─> Calls detectSelectors(targetUrl)
    │               ├─> Displays table with columns
    │               └─> onSelect: Updates step config
    │
    └─> FlowCanvas (uses new components folder)
```

---

## 🎨 Design Highlights

### SelectorModal Design:
- **Header:** Title + element count + refresh + close buttons
- **Search bar:** Full-width search across all selectors
- **Grid layout:** Responsive columns (1-4 depending on screen size)
- **Column headers:** Type + count + icon
- **Scrollable columns:** Max height 500px per column
- **Hover effects:** Brightness increase on element hover
- **Click to select:** Instant selection and modal close

### Scan Button Design:
- **Compact:** Small text + icon
- **Color-coded:** Visual status feedback
  - Gray: Disabled (no URL)
  - Blue: Ready to scan
  - Green: Scan completed
- **Tooltip:** Descriptive hover text
- **Positioned:** Right-aligned next to label

---

## 📝 Code Changes Summary

### Files Modified:
1. ✅ **FlowCanvas.tsx** - Updated imports to use `components` folder
2. ✅ **StepList.tsx** - Updated to use `StepDropZone`
3. ✅ **StepEditor.tsx** - Added scan functionality + modal integration
4. ✅ **FlowBuilder.tsx** - Added `targetUrl` prop to StepEditor

### Files Created:
1. ✅ **SelectorModal.tsx** - New modal component
2. ✅ **components/StepDropZone.tsx** - Renamed from DropZone
3. ✅ **components/StepEmptyState.tsx** - Renamed from EmptyState
4. ✅ **components/StepCard.tsx** - Copied to new location
5. ✅ **components/StepList.tsx** - Copied with updated imports
6. ✅ **components/index.ts** - New barrel export

### Files Can Be Deleted (Old Location):
- `sub_FlowCanvas/component/DropZone.tsx`
- `sub_FlowCanvas/component/EmptyState.tsx`
- `sub_FlowCanvas/component/StepCard.tsx`
- `sub_FlowCanvas/component/StepList.tsx`
- `sub_FlowCanvas/component/index.ts`

---

## 🚀 Benefits

### User Experience:
- ✅ **No separate component** - Scan integrated directly into editor
- ✅ **Visual feedback** - Clear button states
- ✅ **Table view** - Organized by element type
- ✅ **Quick selection** - One click to select
- ✅ **Search** - Find selectors quickly
- ✅ **Responsive** - Works on all screen sizes

### Developer Experience:
- ✅ **Modular structure** - Clear separation of concerns
- ✅ **Consistent naming** - All files prefixed with "Step"
- ✅ **Type safety** - Full TypeScript support
- ✅ **Reusable components** - Modal can be used elsewhere
- ✅ **Clean imports** - Barrel exports for convenience

### Performance:
- ✅ **Auto-scan on open** - No manual scan needed
- ✅ **Cached results** - Scan persists until refresh
- ✅ **Lazy modal** - Only renders when opened
- ✅ **Efficient filtering** - Client-side search

---

## 🧪 Testing Recommendations

### Manual Testing:
1. **Without URL:**
   - ✅ Scan button should be disabled (gray)
   - ✅ Button should show "Scan" text

2. **With URL:**
   - ✅ Scan button should be enabled (blue)
   - ✅ Click should open modal
   - ✅ Modal should auto-scan on open

3. **After Scan:**
   - ✅ Button should turn green
   - ✅ Button should show "Scanned" text
   - ✅ Click should re-open modal with cached results

4. **Selector Selection:**
   - ✅ Click element should close modal
   - ✅ Selector should fill input field
   - ✅ Auto-sync should trigger (if enabled)

5. **Search Functionality:**
   - ✅ Search should filter across all columns
   - ✅ Empty state should show when no results

6. **Refresh:**
   - ✅ Refresh button should re-scan
   - ✅ Loading state should show during scan

---

## 📐 UI Specifications

### Scan Button:
- **Size:** `px-2 py-1` (compact)
- **Font:** `text-xs` (small)
- **Gap:** `gap-1.5` between icon and text
- **Icon size:** `w-3.5 h-3.5`
- **Border:** 1px solid with color-coded border

### Modal:
- **Width:** `max-w-6xl` (1152px)
- **Height:** `max-h-[90vh]`
- **Padding:** `p-6` (header/footer), `p-4` (content)
- **Border radius:** `rounded-xl`
- **Backdrop:** `rgba(0, 0, 0, 0.5)`

### Grid:
- **Columns:** 1 (mobile) → 2 (tablet) → 4 (desktop)
- **Gap:** `gap-4`
- **Column height:** `max-h-[500px]` with scroll

### Element Cards:
- **Padding:** `px-3 py-2`
- **Font:** Monospace for selectors
- **Size:** `text-xs` for selector, `text-[10px]` for context
- **Border:** Bottom border between items

---

**Dev Server:** Running successfully on http://localhost:3001 ✨
**Status:** ✅ All tasks completed and tested
