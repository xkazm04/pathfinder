# Test Run Queue with Auto-Retry & Concurrency

## Metadata
- **Category**: functionality
- **Effort**: High (3/3)
- **Impact**: High (3/3)
- **Scan Type**: insight_synth
- **Generated**: 11/14/2025, 9:44:25 PM

## Description
Implement a lightweight queue system that manages multiple test run requests, automatically retries failed runs, and limits concurrent executions. The queue will expose a hook (useRunQueue) and a UI badge showing queued jobs. It integrates with testExecution.ts, using Supabase to persist queue state so restarts survive.

## Reasoning
Enables batch test execution, improves CI workflow, reduces resource contention, and provides a single source of truth for run ordering. This unlocks parallel testing, scheduled runs, and analytics on retry patterns.

## Context

**Note**: This section provides supporting architectural documentation and is NOT a hard requirement. Use it as guidance to understand existing code structure and maintain consistency.

### Context: Runner

**Description**: # Runner Feature Overview

The **Runner** context is a self‑contained module that powers a test execution dashboard inside the application. It lets users pick a test suite, launch a run, and observe real‑time logs, progress, and viewport configuration. The feature is built around React, TypeScript, Supabase as a backend, and a small theming system.

## 1. Overview

- **What it does**: Provides an interactive UI for selecting a test suite, starting a test run, monitoring execution progress, and viewing live logs.
- **Problem solved**: Developers often need a quick way to spin up a test run and watch it in real time without leaving their editor or CI pipeline. This module removes the boilerplate of wiring UI, state, and backend calls.
- **Target users**: Front‑end developers, QA engineers, and product managers who want instant feedback on the state of the test suite.

## 2. Architecture

### Component‑Driven UI
The feature is split into reusable React components:
- **ExecutionProgress** – visualises the run percentage and status.
- **LiveLogsPanel** – streams raw logs from the backend.
- **TestSuiteSelector** – dropdown to pick a suite.
- **ViewportConfigurator** – lets users tweak viewport size before running.
- **ThemedButton / ThemedCard** – styled UI primitives that consume the global theme context.

### State & Context
- **ThemeContext** (src/contexts/ThemeContext.tsx) provides light/dark theming.
- **Runner Context** is not explicitly exported as a React context; instead, state is managed locally within `RealRunner` and lifted where necessary.

### Business Logic
- **testExecution.ts** contains the core async logic for launching a run, polling status, and streaming logs.
- **mockData.ts** provides in‑memory test suites and logs for local dev/testing.
- **supabase** modules handle persistence: fetching test suites, recording run metadata, and retrieving logs.

### Patterns
- **Separation of Concerns**: UI, business logic, and data fetching live in distinct folders.
- **Hook‑Based Side Effects**: `useEffect` in `RealRunner` orchestrates the lifecycle of a run.
- **Theming via Context**: Components consume `ThemeContext` to adapt colours.
- **Type‑Safe API**: All data shapes are defined in `types.ts`.
- **Animations**: `animations.ts` offers CSS‑in‑JS keyframes used by progress bars and log spinners.

## 3. File Structure

### Main Files & Their Roles
| File | Purpose |
|------|---------|
| `src/app/features/runner/RealRunner.tsx` | Entry component that ties everything together. Handles suite selection, run initiation, and orchestrates the child components. |
| `src/app/features/runner/components/*.tsx` | Individual UI widgets used by `RealRunner`. |
| `src/components/ui/ThemedButton.tsx` & `ThemedCard.tsx` | Reusable styled components that pull colour tokens from `ThemeContext`. |
| `src/contexts/ThemeContext.tsx` | Provides a `ThemeProvider` exposing light/dark tokens. |
| `src/lib/config.ts` | Static configuration (e.g., API URLs, polling intervals). |
| `src/lib/types.ts` | Centralised TypeScript interfaces for test suites, runs, logs, etc. |
| `src/app/features/runner/lib/testExecution.ts` | Core async functions: `startRun`, `pollRunStatus`, `streamLogs`. |
| `src/lib/supabase/testSuites.ts` | Supabase helpers: `getTestSuites`, `createRun`, `getRunLogs`. |
| `src/lib/supabase.ts` | Supabase client initialisation. |
| `src/lib/theme.ts` | Utility functions for deriving theme values, e.g., `getBackgroundColor()`. |
| `src/lib/animations.ts` | CSS‑in‑JS animation keyframes for progress bars and log spinners. |
| `src/app/features/runner/lib/mockData.ts` | Sample data for local dev, used when Supabase is not available. |

### Visual Representation
```
src/
├─ app/
│  └─ features/
│     └─ runner/
│        ├─ RealRunner.tsx
│        ├─ components/
│        │   ├─ ExecutionProgress.tsx
│        │   ├─ LiveLogsPanel.tsx
│        │   ├─ TestSuiteSelector.tsx
│        │   └─ ViewportConfigurator.tsx
│        └─ lib/
│           ├─ testExecution.ts
│           └─ mockData.ts
├─ components/
│  └─ ui/
│     ├─ ThemedButton.tsx
│     └─ ThemedCard.tsx
├─ contexts/
│  └─ ThemeContext.tsx
├─ lib/
│  ├─ config.ts
│  ├─ types.ts
│  ├─ supabase/
│  │  ├─ testSuites.ts
│  │  └─ supabase.ts
│  ├─ theme.ts
│  ├─ animations.ts
│  └─ supabase.ts
└─ ...
```

### Entry Points & Exports
- The public entry point for this feature is `RealRunner.tsx`. It is imported in the app's router or higher‑level layout.
- UI components expose a simple API (props) and are re‑exported from the `components` folder if needed elsewhere.
- Supabase helpers expose typed functions; they are used by `testExecution.ts` and can be imported directly for other features.

This structure keeps the Runner feature modular, testable, and easy to extend with additional widgets or backend services.
",
  "fileStructure": null
}
**Related Files**:
- `src/app/features/runner/RealRunner.tsx`
- `src/app/features/runner/components/ExecutionProgress.tsx`
- `src/app/features/runner/components/LiveLogsPanel.tsx`
- `src/app/features/runner/components/TestSuiteSelector.tsx`
- `src/app/features/runner/components/ViewportConfigurator.tsx`
- `src/components/ui/ThemedButton.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/lib/config.ts`
- `src/lib/types.ts`
- `src/app/features/runner/lib/testExecution.ts`
- `src/components/ui/ThemedCard.tsx`
- `src/lib/supabase/testSuites.ts`
- `src/lib/theme.ts`
- `src/app/features/runner/lib/mockData.ts`
- `src/lib/animations.ts`
- `src/lib/supabase.ts`

**Post-Implementation**: After completing this requirement, evaluate if the context description or file paths need updates. Use the appropriate API/DB query to update the context if architectural changes were made.

## Recommended Skills

- **compact-ui-design**: Use `.claude/skills/compact-ui-design.md` for high-quality UI design references and patterns

## Notes

This requirement was generated from an AI-evaluated project idea. No specific goal is associated with this idea.