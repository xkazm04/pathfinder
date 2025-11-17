# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pathfinder** is an intelligent automated testing platform powered by AI, Playwright, and Next.js. It enables visual test design, AI-driven test generation, multi-viewport test execution, and comprehensive reporting with visual regression detection.

## Commands

### Development
```bash
npm run dev         # Start development server with Turbopack
npm run dev:clean   # Clear lock files and start dev server (uses rm command - may need adjustment on Windows)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

**Note for Windows:** If `npm run dev:clean` fails, manually delete `.next/dev/lock` file or use PowerShell equivalent:
```powershell
powershell -Command "Remove-Item -Path .next/dev/lock -ErrorAction SilentlyContinue; npm run dev"
```

### Database Setup
1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Set up storage buckets per `SUPABASE_SETUP.md`

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
GEMINI_API_KEY                 # Google Gemini API key (server-side only)
GROQ_API_KEY                   # Groq API key for fallback (server-side only)
```

## Architecture Overview

### Technology Stack
- **Next.js 16** with App Router (Turbopack enabled)
- **React 19** with TypeScript 5 (strict mode)
- **Zustand** for state management (replaced Context API)
- **Supabase** for database, storage, and real-time subscriptions
- **Playwright 1.56** for browser automation
- **Gemini AI** (primary) and **Groq AI** (fallback) for test generation and analysis
- **Tailwind CSS 4** with custom design system
- **Framer Motion** for animations

### Client-Side SPA Navigation

This app uses a **unique SPA-style navigation** within Next.js:
- Single route at `/` (no `/dashboard`, `/designer`, etc.)
- `src/app/page.tsx` acts as a router, conditionally rendering feature components
- Navigation state managed via **Zustand** (`useNavigation` hook in `lib/stores/appStore.ts`)
- Pages: `dashboard`, `designer`, `runner`, `reports`

```typescript
// Navigation pattern
const { currentPage, navigateTo } = useNavigation();
navigateTo('designer'); // Changes page without URL change
```

### State Management with Zustand

**Important:** The codebase uses **Zustand** for state management across multiple stores:

```typescript
// lib/stores/appStore.ts - Theme and Navigation
import { useTheme, useNavigation } from '@/lib/stores/appStore';

// Theme management
const { currentTheme, themeId, setTheme } = useTheme();

// Navigation
const { currentPage, reportId, navigateTo, setReportId } = useNavigation();

// lib/stores/testExecutionStore.ts - Test Execution State
import { useTestExecution } from '@/lib/stores/testExecutionStore';

// Test execution management
const {
  executionState,      // 'idle' | 'running' | 'completed' | 'failed'
  testRunId,
  currentScenario,
  progress,            // Current progress metrics
  scenarioResults,     // Results array
  screenshots,         // Screenshot URLs
  logs,                // Console logs
  startExecution,
  updateProgress,
  setCurrentScenario,
  addLog,
  addScenarioResult,
  addScreenshot,
  completeExecution,
  abortExecution,
  resetExecution,
} = useTestExecution();
```

**State Management Pattern:**
- `appStore.ts` - Global app state (theme, navigation)
- `testExecutionStore.ts` - Test runner execution state
- All imports use `@/lib/stores/[storeName]`

### Theme System

**3 Available Themes:**
1. **Cyber Blueprint** (default) - Cyan/blue technical aesthetic
2. **Crimson Dark** - Dark red minimalist
3. **Golden Slate** - Slate gray with gold accents

**Implementation:**
- Theme definitions in `src/lib/theme.ts`
- State managed via Zustand `useTheme()` hook
- CSS variables in `globals.css` (e.g., `--theme-primary`, `--theme-surface`)
- `data-theme` attribute on root element
- LocalStorage persistence

**Styling Pattern:**
```typescript
// Use inline styles with theme values (NOT Tailwind variants)
style={{
  color: currentTheme.colors.text.primary,
  backgroundColor: currentTheme.colors.surface
}}
```

**Health Glow Feature:**
- Dashboard displays ambient glow based on test pass-rate
- Green (≥90%), Yellow (70-89%), Red (<70%)
- Implemented via CSS variables and animations
- See `IMPLEMENTATION_SUMMARY.md` for details

### Component Organization

```
src/
├── app/
│   ├── features/              # Feature-based page components
│   │   ├── dashboard/        # Main dashboard view
│   │   ├── designer/         # Test designer workflow (4 steps)
│   │   ├── test-builder/     # Unified test builder (NL + Visual Flow)
│   │   ├── flow-builder/     # Visual flow interface
│   │   │   ├── sub_FlowCanvas/      # Modular canvas with sub-components
│   │   │   │   ├── lib/             # Helpers (types, stepHelpers)
│   │   │   │   ├── components/      # StepCard, StepList, DropZone, EmptyState
│   │   │   │   └── FlowCanvas.tsx   # Main orchestrator
│   │   │   └── sub_FlowSelectors/   # Element selectors
│   │   ├── runner/           # Test execution interface
│   │   │   ├── sub_RunnerReport/    # Report sub-components
│   │   │   │   ├── components/      # Header, Tabs, Results, Errors
│   │   │   │   └── ScenarioTestReport.tsx
│   │   │   ├── lib/                 # executionUtils, testExecution
│   │   │   └── components/          # RunnerMonitor, ExecutionProgress, etc.
│   │   ├── reports/          # Test reports & history
│   │   └── diff/             # Visual regression comparison UI
│   ├── api/                  # Next.js API routes
│   │   ├── playwright/       # Execute test suites, analyze scenarios
│   │   ├── screenshots/      # Capture screenshots
│   │   ├── gemini/           # AI analysis endpoints (intent, page, visual, NL-to-code)
│   │   ├── ai/               # Root cause analysis, embeddings, similar failures
│   │   ├── diff/             # Visual regression APIs (compare, baselines)
│   │   ├── analyze/          # Site complexity analysis
│   │   ├── test-runs/        # Test run APIs (cancel, fetch)
│   │   └── ci/               # CI/CD integration (GitHub deployment)
│   └── page.tsx              # SPA router (renders feature components)
│
├── components/
│   ├── ui/                   # Reusable themed components (ThemedCard, ThemedSelect, etc.)
│   ├── layout/               # Header, Sidebar, MainLayout
│   ├── logo/                 # LogoTitle component
│   └── decorative/           # ThemeBackground
│
├── lib/
│   ├── stores/
│   │   ├── appStore.ts             # Zustand state (theme + navigation)
│   │   └── testExecutionStore.ts   # Test execution state management
│   ├── theme.ts              # Theme definitions
│   ├── types.ts              # TypeScript interfaces
│   ├── supabase/             # Supabase operations (suiteAssets, testRuns, etc.)
│   ├── ai-client.ts          # Unified AI client (Gemini + Groq fallback)
│   ├── gemini/               # Gemini-specific utilities (visualInspector, etc.)
│   ├── groq.ts               # Groq fallback client
│   ├── playwright/           # Playwright execution utilities
│   ├── diff/                 # Screenshot comparison (pixelmatch)
│   └── storage/              # Supabase storage helpers
│
└── hooks/
    ├── useSupabase.ts        # Supabase data operations
    └── useTestRuns.ts        # Real-time test run subscriptions
```

**Modular Architecture Pattern:**
- Features use `sub_*/` directories for complex sub-modules
- Each sub-module has `lib/` (utilities), `components/` (UI), and main orchestrator
- Compact one-row displays throughout UI (54-67% space reduction)
- Hover-based progressive disclosure for actions

### Database Schema (Supabase)

**Key Tables:**
- `test_suites` - Test suite configurations (name, URL, description)
- `test_runs` - Test execution records (status, config, timestamps)
- `test_results` - Individual viewport results (screenshots, errors, logs)
- `ai_analyses` - AI-generated findings (severity, suggestions, confidence)
- `test_code` - Versioned test code (Playwright code, language)

**Relations:**
- `test_runs.suite_id` → `test_suites.id`
- `test_results.run_id` → `test_runs.id`
- `ai_analyses.result_id` → `test_results.id`
- `test_code.suite_id` → `test_suites.id`

**Real-time Subscriptions:**
```typescript
// Subscribe to test runs
subscribeToTestRuns(suiteId, callback);

// Subscribe to test results
subscribeToTestResults(runId, callback);
```

### API Routes

**RESTful Next.js API Routes** in `src/app/api/`:

```
# Test Execution
POST /api/playwright/execute                      # Execute test suite
POST /api/playwright/analyze-scenario-screenshots # Analyze scenario screenshots
POST /api/playwright/execute-scenarios            # Execute specific scenarios
POST /api/test-runs/cancel                        # Cancel running test

# Screenshots & Visual Analysis
POST /api/screenshots/capture                     # Capture screenshots
POST /api/diff/compare                            # Compare two screenshots
POST /api/diff/batch-compare                      # Batch screenshot comparison
GET  /api/diff/baselines                          # Fetch baselines

# AI/Gemini Integration
POST /api/gemini/analyze-intent                   # Analyze NL test intent
POST /api/gemini/nl-to-playwright                 # Generate Playwright from NL
POST /api/gemini/analyze-page                     # Analyze page structure
POST /api/gemini/analyze-visual                   # Visual analysis of screenshots
POST /api/gemini/nl-to-steps                      # Convert NL to test steps
POST /api/gemini/steps-to-nl                      # Convert steps to NL description

# AI Analysis & Root Cause
POST /api/ai/analyze-root-cause                   # Analyze test failure root cause
GET  /api/ai/root-cause-analysis/[resultId]       # Get root cause for specific result
POST /api/ai/similar-failures                     # Find similar test failures

# Site Analysis
POST /api/analyze/complexity                      # Analyze site complexity

# CI/CD Integration
POST /api/ci/deploy-github                        # GitHub deployment integration
```

**Important:** Most endpoints use `maxDuration = 60-300s` for serverless compatibility with long-running operations (Playwright tests, AI analysis).

## Key Features

### Visual Test Designer
**4-Step Workflow:**
1. **Setup** - Name, URL, description
2. **Analyzing** - Screenshot capture + Gemini analysis (with progress)
3. **Review** - Edit scenarios, view generated Playwright code
4. **Complete** - Save to Supabase, ready to run

**Location:** `src/app/features/designer/`

### Unified Test Builder
**Dual-Mode Interface:**
- **Visual Flow Mode** - Drag-and-drop step builder with modular architecture
- **Natural Language Mode** - Write tests in plain English
- **Bi-directional Sync** - Changes in either mode automatically update the other
- **Compact UI** - One-row displays (54-67% space reduction)

**Location:** `src/app/features/test-builder/` and `src/app/features/flow-builder/`

### Test Runner
- Select test suite + viewports (desktop, tablet, mobile)
- Real-time execution monitoring with live logs (via `testExecutionStore`)
- Screenshot capture at key steps
- Parallel execution support
- Test cancellation via `/api/test-runs/cancel`
- Detailed scenario reports in `sub_RunnerReport/`

**Location:** `src/app/features/runner/`

### Reports & Dashboard
- Test run history & metrics
- Pass/fail statistics with charts
- Screenshot galleries
- AI-detected issues with root cause analysis
- **Health Glow** visual feedback (Green ≥90%, Yellow 70-89%, Red <70%)
- Similar failure detection for pattern recognition

**Location:** `src/app/features/dashboard/` and `src/app/features/reports/`

### Visual Regression Detection
- Pixelmatch-based image diffing
- Baseline management
- Ignore regions configuration
- Configurable thresholds
- Batch comparison API
- Dedicated diff viewer UI

**Location:** `src/lib/diff/`, `src/app/api/diff/`, `src/app/features/diff/`

### Natural Language Test Input
- Gemini intent analysis
- Convert NL descriptions to Playwright code
- Bidirectional conversion (steps ↔ NL)
- Example prompts & templates

**Location:** `src/app/features/test-builder/`, `src/app/api/gemini/`

### Additional Features
- **Plugin Marketplace** - Extensible architecture for custom test plugins (see `PLUGIN_SYSTEM.md`)
- **Anomaly Detection** - ML-based pattern recognition across test runs (see `ANOMALY_DETECTION.md`)
- **Test Queue Management** - Intelligent scheduling and prioritization (see `QUEUE_SYSTEM_GUIDE.md`)
- **Preview Mode** - Validate tests before full execution (see `PREVIEW_MODE_IMPLEMENTATION.md`)
- **CI/CD Integration** - GitHub deployment workflows via `/api/ci/deploy-github`

## Development Patterns

### Modular Component Architecture
When creating complex features with multiple sub-components:

```
feature-name/
├── lib/                    # Pure utilities and helpers
│   ├── types.ts           # TypeScript interfaces
│   ├── helpers.ts         # Business logic functions
│   └── index.ts           # Barrel exports
├── components/            # Sub-components
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── index.ts           # Barrel exports
└── MainFeature.tsx        # Main orchestrator (keep under 100 lines)
```

**Benefits:**
- Main component stays focused and readable
- Easy to test individual utilities
- Clear separation of concerns
- Better code reusability

**See:** `src/app/features/flow-builder/sub_FlowCanvas/` for reference implementation

### Themed Components
```typescript
// Always use useTheme from Zustand store
import { useTheme } from '@/lib/stores/appStore';

const { currentTheme } = useTheme();

// Use inline styles for theme-dependent colors
<div style={{
  backgroundColor: currentTheme.colors.surface,
  color: currentTheme.colors.text.primary
}}>
```

### Navigation
```typescript
// Use Zustand navigation hook
import { useNavigation } from '@/lib/stores/appStore';

const { currentPage, navigateTo, reportId, setReportId } = useNavigation();

// Navigate to a page
navigateTo('designer');

// Navigate to reports with specific run ID
navigateTo('reports');
setReportId(runId);
```

### Test Execution State Management
```typescript
// Use testExecutionStore for runner state
import { useTestExecution } from '@/lib/stores/testExecutionStore';

const {
  executionState,
  startExecution,
  updateProgress,
  addLog,
  completeExecution,
  resetExecution
} = useTestExecution();

// Start a test run
startExecution(testRunId);

// Update progress during execution
updateProgress({ current: 5, total: 10, percentage: 50 });

// Add console logs
addLog({ type: 'info', message: 'Test step completed', timestamp: new Date().toISOString() });

// Complete execution
completeExecution('completed', scenarioResults);
```

### API Route Pattern
```typescript
// route.ts
export const maxDuration = 60; // For long-running operations

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Handle request
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Supabase Operations
```typescript
import { supabase } from '@/lib/supabase';

// Fetch data
const { data, error } = await supabase
  .from('test_suites')
  .select('*')
  .order('created_at', { ascending: false });

// Insert data
const { data, error } = await supabase
  .from('test_suites')
  .insert({ name, target_url, description })
  .select()
  .single();

// Real-time subscription
const subscription = supabase
  .channel('test-runs')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'test_runs' },
    (payload) => callback(payload)
  )
  .subscribe();
```

### Performance Optimizations
- **Lazy Loading:** Sidebar uses dynamic import with Suspense
- **Code Splitting:** Feature components loaded on-demand
- **Skeleton States:** Loading states for better UX
- **Turbopack:** Enabled for faster development builds

## Important Notes

### No Unit Testing
- No Jest, Vitest, or React Testing Library configured
- This app **creates** and **runs** Playwright tests; it's not self-tested
- Playwright is for browser automation, not testing this codebase

### TypeScript Strict Mode
- All types must be properly defined
- No `any` types (use `unknown` with type guards)
- Comprehensive interfaces in `src/lib/types.ts`

### CSS Architecture
- **CSS Variables** for theming (NOT Tailwind color variants)
- Tailwind for layout/spacing utilities
- Framer Motion for animations
- Global styles in `src/app/globals.css`

### Server vs Client Components
- API routes are server-side
- Feature components are client components (`'use client'`)
- Layout components use Suspense for lazy loading

## UI/UX Design Principles

### Compact Display Strategy
The codebase follows a **one-row, high-density** UI pattern:

- **Element Cards** - All info in single horizontal line (54% height reduction)
- **Step Cards** - Icon + badge + description + config inline (67% height reduction)
- **Hover Actions** - Buttons appear on hover to save space
- **Progressive Disclosure** - Show essential info always, details on interaction

**See:** `UI_UX_OPTIMIZATIONS.md` for detailed implementation guide

### Component Styling
- Use `inline styles` with theme values (NOT Tailwind color variants)
- Compact padding: `px-2.5 py-1.5` for dense layouts
- Small icons: `w-6 h-6` or `w-7 h-7`
- Compact badges: `text-[10px]` with minimal padding
- Hover effects: `hover:scale-105`, `hover:bg-opacity-50`

## Reference Documentation

### Core Documentation
- `README.md` - Project overview, features, and setup guide
- `THEME_SYSTEM.md` - Comprehensive theme system guide
- `SUPABASE_SETUP.md` - Storage bucket setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Health glow feature details
- `.claude/module-*.md` - Feature module specifications (if exists)
- `supabase/schema.sql` - Database schema

### Feature-Specific Guides
- `PLUGIN_SYSTEM.md` - Plugin architecture and marketplace
- `ANOMALY_DETECTION.md` - Anomaly detection system details
- `QUEUE_SYSTEM_GUIDE.md` - Test queue management
- `PREVIEW_MODE_IMPLEMENTATION.md` - Preview mode feature guide
- `UI_UX_OPTIMIZATIONS.md` - Compact UI design patterns
- `FLOW_SELECTOR_REDESIGN.md` - Flow selector component redesign (if relevant)
