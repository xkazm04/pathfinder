# Lightweight Preview vs Full Rendering Toggle

## Metadata
- **Category**: maintenance
- **Effort**: Medium (2/3)
- **Impact**: Medium (2/3)
- **Scan Type**: ambiguity_guardian
- **Generated**: 11/14/2025, 9:46:42 PM

## Description
Offer users a toggle to switch between a lightweight preview that uses DOM snapshots and a full rendering preview that captures actual screenshots. The lightweight mode loads quickly and conserves memory, while the full mode provides more accurate visual feedback.

## Reasoning
Full rendering gives realistic feedback but consumes resources and slows down the wizard. Lightweight previews are faster but less precise. Exposing this choice allows users to balance performance against fidelity based on context (e.g., local dev vs CI).

## Context

**Note**: This section provides supporting architectural documentation and is NOT a hard requirement. Use it as guidance to understand existing code structure and maintain consistency.

### Context: Designer

**Description**: # Designer Feature Overview

## 1. Overview

The **Designer** feature is a wizard‑style UI that guides users through creating, previewing, and publishing automated test suites. It is tailored for QA engineers, front‑end developers, and product owners who want to generate Playwright test code without writing it manually.

### What problem does it solve?
- **Complex test authoring** – Writing Playwright scripts can be tedious and error‑prone. The Designer abstracts the process into logical steps.
- **Lack of visual feedback** – Users often cannot see what the test will look like before committing. The wizard shows scenario and screenshot previews in real time.
- **Reusability & collaboration** – The integration with Supabase allows tests to be stored, versioned, and shared across teams.
- **Theming & accessibility** – Consistent UI styling and animations keep the interface intuitive and modern.

### Who uses it?
- QA engineers building end‑to‑end tests.
- Front‑end developers prototyping UI flows.
- Product owners who need quick test artifacts for demos.

## 2. Architecture

The Designer is built as a composable React application using functional components, hooks, and context. The architecture follows a clear separation of concerns:

| Layer | Responsibility |
|-------|----------------|
| **UI Components** | Presentational elements (`ThemedCard`, `ThemedButton`, step components). |
| **Wizard Controller** | `Designer.tsx` orchestrates the step flow and holds shared state. |
| **State Management** | Uses React `useState`/`useReducer` inside `Designer` and a dedicated `ThemeContext` for global theming. |
| **Code Generation** | `generateTestCode.ts` converts the wizard model into Playwright JavaScript/TypeScript. |
| **Backend Integration** | `supabase.ts` provides a Supabase client; `testSuites.ts` contains CRUD operations for test suites. |
| **Utilities** | `theme.ts` defines theme tokens; `animations.ts` contains reusable animation hooks (e.g., `useFade`). |

### Key Patterns
- **Wizard Pattern** – Each step component represents a stage of the test creation workflow.
- **Context API** – `ThemeContext` provides theme information to all UI components.
- **Separation of Concerns** – UI, business logic, data access, and utilities are isolated.
- **Component‑Driven Development** – Step components are small, reusable, and testable.

## 3. File Structure

```
src/
├─ app/
│  └─ features/
│     └─ designer/
│        ├─ Designer.tsx                 # Main wizard container & state
│        ├─ components/
│        │  ├─ StepSetup.tsx             # Collects initial test metadata
│        │  ├─ StepAnalysis.tsx          # Builds test steps and actions
│        │  ├─ StepReview.tsx            # Review summary of test flow
│        │  ├─ StepComplete.tsx          # Confirmation & publish action
│        │  ├─ StepIndicator.tsx         # Visual step progress bar
│        │  ├─ ScenarioPreview.tsx      # Live preview of the test scenario
│        │  ├─ ScreenshotPreview.tsx    # Screenshot thumbnails for steps
│        │  └─ TestCodeEditor.tsx        # Editable code pane with generated Playwright script
│        └─ ...
├─ components/
│  └─ ui/
│     ├─ ThemedCard.tsx                 # Reusable card with theme support
│     └─ ThemedButton.tsx                # Themed button component
├─ contexts/
│  └─ ThemeContext.tsx                 # React context for theming
├─ lib/
│  ├─ playwright/
│  │  └─ generateTestCode.ts          # Generates Playwright test code from model
│  ├─ supabase/
│  │  ├─ supabase.ts                 # Supabase client initialization
│  │  └─ testSuites.ts                # CRUD for test suites
│  ├─ theme.ts                        # Theme token definitions (colors, spacing, etc.)
│  └─ animations.ts                   # Animation hooks (e.g., fadeIn, slideIn)
├─ types.ts                             # Shared TypeScript types and interfaces
└─ ...
```

### How Files Relate
- `Designer.tsx` imports all step components and manages the wizard state.
- `StepIndicator.tsx` consumes the current step index from `Designer` and renders progress.
- `ScenarioPreview`, `ScreenshotPreview`, and `TestCodeEditor` are nested inside relevant steps and display real‑time data from the wizard state.
- `ThemedCard` and `ThemedButton` are used throughout the wizard for consistent styling.
- `generateTestCode.ts` is invoked in `StepComplete` to produce the final Playwright script.
- `testSuites.ts` is called from `Designer` (or a dedicated service) to persist the created test suite to Supabase.
- `ThemeContext` is provided at the top level (likely in `App.tsx`) and consumed by `ThemedCard`, `ThemedButton`, and the wizard components.
- `animations.ts` hooks are used in step components to animate entrance/exit transitions.

---

**Key Export Points**
- `src/app/features/designer/Designer.tsx` – the entry point for the designer wizard.
- `src/components/ui/ThemedCard.tsx` and `ThemedButton.tsx` – public UI components.
- `src/lib/playwright/generateTestCode.ts` – utility for generating code.
- `src/contexts/ThemeContext.tsx` – provides `ThemeProvider`.
- `src/lib/supabase/testSuites.ts` – exposes `createTestSuite`, `fetchTestSuites`, etc.

With this structure, developers can quickly locate the wizard logic, UI components, theming, and backend integration, facilitating both extension and maintenance of the Designer feature.",
  "fileStructure": "src/
├─ app/
│  └─ features/
│     └─ designer/
│        ├─ Designer.tsx
│        ├─ components/
│        │  ├─ StepSetup.tsx
│        │  ├─ StepAnalysis.tsx
│        │  ├─ StepReview.tsx
│        │  ├─ StepComplete.tsx
│        │  ├─ StepIndicator.tsx
│        │  ├─ ScenarioPreview.tsx
│        │  ├─ ScreenshotPreview.tsx
│        │  └─ TestCodeEditor.tsx
├─ components/
│  └─ ui/
│     ├─ ThemedCard.tsx
│     └─ ThemedButton.tsx
├─ contexts/
│  └─ ThemeContext.tsx
├─ lib/
│  ├─ playwright/
│  │  └─ generateTestCode.ts
│  ├─ supabase/
│  │  ├─ supabase.ts
│  │  └─ testSuites.ts
│  ├─ theme.ts
│  └─ animations.ts
├─ types.ts
└─ ...
"
}
**Related Files**:
- `src/app/features/designer/Designer.tsx`
- `src/app/features/designer/components/StepAnalysis.tsx`
- `src/app/features/designer/components/StepComplete.tsx`
- `src/app/features/designer/components/StepIndicator.tsx`
- `src/app/features/designer/components/StepReview.tsx`
- `src/app/features/designer/components/StepSetup.tsx`
- `src/components/ui/ThemedCard.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/lib/playwright/generateTestCode.ts`
- `src/lib/supabase/testSuites.ts`
- `src/lib/types.ts`
- `src/app/features/designer/components/ScenarioPreview.tsx`
- `src/app/features/designer/components/ScreenshotPreview.tsx`
- `src/app/features/designer/components/TestCodeEditor.tsx`
- `src/components/ui/ThemedButton.tsx`
- `src/lib/animations.ts`
- `src/lib/supabase.ts`
- `src/lib/theme.ts`

**Post-Implementation**: After completing this requirement, evaluate if the context description or file paths need updates. Use the appropriate API/DB query to update the context if architectural changes were made.

## Recommended Skills

- **compact-ui-design**: Use `.claude/skills/compact-ui-design.md` for high-quality UI design references and patterns

## Notes

This requirement was generated from an AI-evaluated project idea. No specific goal is associated with this idea.