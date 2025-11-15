# Move Quality Metrics Aggregation to Supabase

## Metadata
- **Category**: performance
- **Effort**: Medium (2/3)
- **Impact**: High (3/3)
- **Scan Type**: perf_optimizer
- **Generated**: 11/14/2025, 9:42:02 PM

## Description
Rewrite the dashboard data fetch to use a single SQL aggregation query that returns pre-computed pass/fail counts and trend data. Replace the client-side mapping of all test runs with this server-side aggregation, shrinking the payload and eliminating heavy JavaScript work.

## Reasoning
Currently the hook pulls every recent run and then aggregates in memory, sending a large data set over the network. By moving the aggregation to Supabase, the API returns only the needed numbers, cutting payload size by ~80% and CPU usage on the client. This results in noticeably faster page load and lower data transfer costs.

## Context

**Note**: This section provides supporting architectural documentation and is NOT a hard requirement. Use it as guidance to understand existing code structure and maintain consistency.

### Context: Dashboard

**Description**: # Dashboard Feature Overview

## 1. Overview

The **Dashboard** feature provides a single‑page view that aggregates key metrics, recent test results, and quick actions for users of the testing platform. It solves the problem of scattered information by presenting:

* **Quality trends** over time (e.g., pass/fail rate).
* **Stat cards** that summarize core KPIs (total tests, success %, etc.).
* A **list of recent test runs** with the ability to drill down.
* **Quick actions** for launching new test cycles or accessing help.

**Target users** include QA engineers, product managers, and developers who need instant visibility into the health of their test suites.

## 2. Architecture

The feature follows a **component‑driven** architecture built on React with TypeScript. It separates concerns into three main layers:

1. **Presentation** – reusable UI components (`ThemedCard`, `ThemedButton`).
2. **Feature components** – dashboard‑specific UI (`StatCard`, `QualityTrendsChart`, `QuickActionsCard`, `RecentTestItem`, `TestRunsList`).
3. **Infrastructure** – data access (`supabase/dashboard.ts`), context providers (`ThemeContext`, `NavigationContext`), and utilities (`theme.ts`, `animations.ts`).

### Key Patterns
* **React Context API** – `ThemeContext` supplies color palette and theme toggling, while `NavigationContext` centralises routing logic.
* **Custom hooks** – The dashboard components consume `useDashboardData()` (defined inside `dashboard.ts`) which wraps Supabase queries and memoises results.
* **Data‑first approach** – Mock data (`mockData.ts`) is used during development and tests; real data is fetched via Supabase in production.
* **Composition over inheritance** – UI components are lightweight and accept `className`/`style` props for styling, enabling high reusability.
* **Animations** – `lib/animations.ts` exposes helpers for subtle entrance animations that are applied to cards and list items.

## 3. File Structure

### Main Feature Files
| File | Purpose |
|------|---------|
| `Dashboard.tsx` | Entry point for the Dashboard page; orchestrates data fetching, renders layout, and wraps content with context providers.
| `components/StatCard.tsx` | Displays a single KPI (title, value, icon) inside a themed card.
| `components/QualityTrendsChart.tsx` | Renders a line/bar chart (using a charting library) that visualises pass/fail trends over time.
| `components/QuickActionsCard.tsx` | Presents a set of buttons for common actions (e.g., “Run New Test”).
| `components/RecentTestItem.tsx` | A row component used by `TestRunsList` to show individual test run details.
| `components/TestRunsList.tsx` | Fetches and displays a paginated list of recent test runs, leveraging `RecentTestItem`.
| `components/ui/ThemedCard.tsx` | A styled card that adapts to the current theme.
| `components/ui/ThemedButton.tsx` | A button that respects theme colors and size variations.

### Context & State
| File | Purpose |
|------|---------|
| `contexts/ThemeContext.tsx` | Provides theme state and toggling logic; exports `ThemeProvider` and `useTheme` hook.
| `contexts/NavigationContext.tsx` | Centralises navigation helpers (e.g., `navigateTo`) and current route info.

### Supabase Integration
| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Initializes and exports the Supabase client instance.
| `lib/supabase/dashboard.ts` | Encapsulates all dashboard‑related queries (e.g., `fetchQualityMetrics`, `fetchRecentRuns`).

### Utilities
| File | Purpose |
|------|---------|
| `lib/theme.ts` | Defines theme tokens (colors, spacing, typography) used by UI components.
| `lib/animations.ts` | Exposes animation helpers (e.g., `fadeIn`, `slideIn`) that can be used in components.

### Mock Data
| File | Purpose |
|------|---------|
| `app/features/dashboard/lib/mockData.ts` | Provides sample data structures for unit/integration tests and for running the app offline.

### File Relationship Diagram
```
src/
├─ app/
│  └─ features/
│     └─ dashboard/
│        ├─ Dashboard.tsx              # Page entry point
│        ├─ components/
│        │  ├─ StatCard.tsx
│        │  ├─ QualityTrendsChart.tsx
│        │  ├─ QuickActionsCard.tsx
│        │  ├─ RecentTestItem.tsx
│        │  ├─ TestRunsList.tsx
│        │  └─ ui/
│        │     ├─ ThemedCard.tsx
│        │     └─ ThemedButton.tsx
│        └─ lib/
│           └─ mockData.ts
├─ components/
│  └─ ui/
│     ├─ ThemedCard.tsx
│     └─ ThemedButton.tsx
├─ contexts/
│  ├─ ThemeContext.tsx
│  └─ NavigationContext.tsx
├─ lib/
│  ├─ supabase.ts
│  ├─ supabase/dashboard.ts
│  ├─ theme.ts
│  └─ animations.ts
└─ ...
```

### Entry Points & Exports
* **`src/app/features/dashboard/Dashboard.tsx`** is the primary route component rendered by the app router.
* **`ThemeContext`** and **`NavigationContext`** are exported as hooks (`useTheme`, `useNavigation`) for use across the app.
* **`supabase/dashboard.ts`** exports functions like `getQualityTrends`, `getRecentRuns` which are consumed by the dashboard components.

---

By following this structure, developers can quickly understand how data flows from Supabase to UI, how theming is applied, and how the dashboard components are composed.
**Related Files**:
- `src/app/features/dashboard/Dashboard.tsx`
- `src/app/features/dashboard/components/QualityTrendsChart.tsx`
- `src/app/features/dashboard/components/QuickActionsCard.tsx`
- `src/app/features/dashboard/components/RecentTestItem.tsx`
- `src/app/features/dashboard/components/StatCard.tsx`
- `src/app/features/dashboard/components/TestRunsList.tsx`
- `src/components/ui/ThemedButton.tsx`
- `src/components/ui/ThemedCard.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/lib/supabase/dashboard.ts`
- `src/app/features/dashboard/lib/mockData.ts`
- `src/contexts/NavigationContext.tsx`
- `src/lib/animations.ts`
- `src/lib/theme.ts`
- `src/lib/supabase.ts`

**Post-Implementation**: After completing this requirement, evaluate if the context description or file paths need updates. Use the appropriate API/DB query to update the context if architectural changes were made.

## Recommended Skills

Use Claude Code skills as appropriate for implementation guidance. Check `.claude/skills/` directory for available skills.

## Notes

This requirement was generated from an AI-evaluated project idea. No specific goal is associated with this idea.