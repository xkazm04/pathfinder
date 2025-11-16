# Pathfinder - High-Level Project Documentation

## Overview

**Pathfinder** is an AI-powered automated testing platform that revolutionizes web application testing by combining Google's Gemini AI with Playwright browser automation. The platform enables intelligent test generation, multi-viewport execution, visual regression detection, and comprehensive reporting—all accessible through an intuitive visual interface.

**Value Proposition**: Reduce testing time by 80% by transforming manual testing workflows into AI-driven automation, making quality assurance accessible to both technical and non-technical team members.

**Target Users**: QA engineers, front-end developers, product managers, and DevOps personnel who need efficient, intelligent test coverage across web applications.

**Primary Goals**:
- Democratize test automation through natural language test input
- Provide comprehensive multi-viewport testing (desktop, tablet, mobile)
- Enable intelligent visual regression detection and root cause analysis
- Deliver actionable insights through AI-powered test analysis
- Streamline CI/CD integration with automated deployment pipelines

---

## Architecture & Tech Stack

### Core Technologies

**Frontend Framework**:
- **Next.js 16** with App Router and Turbopack for optimized builds
- **React 19** with TypeScript 5 in strict mode
- **Zustand** for global state management (theme, navigation)
- **Tailwind CSS 4** with custom design system and CSS variables
- **Framer Motion** for fluid animations and transitions

**Backend & Infrastructure**:
- **Supabase** for PostgreSQL database, real-time subscriptions, and file storage
- **Next.js API Routes** with serverless functions (60-300s max duration)
- **Playwright 1.56** for cross-browser automation and testing

**AI & Analysis**:
- **Google Gemini AI** (primary) for test generation, visual analysis, and root cause diagnostics
- **Groq AI** (fallback) for reliability and redundancy
- **OpenAI Embeddings** (text-embedding-ada-002) for failure similarity detection
- **Pixelmatch** for pixel-level visual regression analysis

**Development Tools**:
- **Monaco Editor** for in-browser code editing
- **Lucide React** for consistent iconography
- **JSZip** for test artifact packaging

### Architecture Pattern

**Hybrid SPA Architecture**:
- Single-page application (SPA) navigation within Next.js
- All routes rendered at root `/` with conditional component rendering
- Zustand manages navigation state without URL changes
- Server-side API routes handle long-running operations

**State Management**:
```typescript
// Centralized Zustand store
lib/stores/appStore.ts
├── useTheme()        // Theme selection and persistence
└── useNavigation()   // Page routing and report context
```

**Data Flow**:
1. UI components consume Zustand hooks for global state
2. Feature components fetch data via Supabase hooks (`useSupabase`, `useTestRuns`)
3. API routes orchestrate complex operations (Playwright execution, AI analysis)
4. Real-time subscriptions stream updates during test execution

### Key Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `next` | 16.0.3 | Application framework with SSR/SSG |
| `react` | 19.2.0 | UI component library |
| `zustand` | 5.0.8 | Lightweight state management |
| `@supabase/supabase-js` | 2.81.1 | Database and storage client |
| `playwright` | 1.56.1 | Browser automation engine |
| `@google/generative-ai` | 0.24.1 | Gemini AI integration |
| `groq-sdk` | 0.35.0 | Alternative AI provider |
| `pixelmatch` | 7.1.0 | Image comparison algorithm |
| `@monaco-editor/react` | 4.7.0 | Code editor component |
| `framer-motion` | 12.23.24 | Animation library |

### Infrastructure

**Database Schema** (Supabase PostgreSQL):
- `test_suites` - Test configurations and metadata
- `test_runs` - Execution records with status tracking
- `test_results` - Per-viewport results with screenshots
- `test_code` - Versioned Playwright code storage
- `ai_analyses` - AI-generated findings and recommendations
- `visual_regressions` - Pixel-diff comparison results
- `root_cause_analyses` - AI diagnostic data with embeddings
- `failure_resolutions` - Historical fix documentation

**Storage Buckets** (Supabase):
- `screenshots` - Test execution captures
- `baselines` - Visual regression baseline images
- `diff-images` - Highlighted difference visualizations

**Deployment**:
- Serverless functions via Next.js API routes
- Static asset optimization with Turbopack
- Real-time database subscriptions via WebSocket

---

## Features & Capabilities

### Core Features

1. **Visual Test Designer** (4-Step Wizard)
   - URL-based test setup with metadata configuration
   - AI-powered screenshot capture and analysis
   - Real-time scenario generation with Gemini vision models
   - Live code preview with Monaco editor
   - One-click deployment to test suite library

2. **Natural Language Test Input**
   - Write tests in plain English (e.g., "verify users can add items to cart")
   - Intent analysis validates feasibility and extracts requirements
   - Automatic conversion to production-ready Playwright code
   - Context-aware selector generation and assertion building

3. **Multi-Viewport Test Runner**
   - Parallel execution across desktop (1920x1080), tablet (768x1024), mobile (375x667)
   - Real-time log streaming with progress indicators
   - Screenshot capture at configurable checkpoints
   - Graceful error handling with detailed stack traces

4. **Visual Regression Detection**
   - Automated baseline management with version control
   - Pixelmatch-based pixel-level comparison
   - Configurable thresholds (global and per-viewport)
   - Ignore regions for dynamic content (ads, timestamps)
   - Batch comparison with significance scoring

5. **AI-Powered Root Cause Analysis**
   - Screenshot + log analysis via Gemini vision models
   - Vector similarity search for historical failure patterns
   - Confidence-scored diagnostic recommendations
   - Automated severity classification (critical, high, medium, low)
   - Actionable remediation suggestions

6. **Comprehensive Reporting**
   - Test run history with pass/fail trends
   - Screenshot galleries with side-by-side comparisons
   - Error timelines and viewport-specific breakdowns
   - Exportable reports (CSV, JSON, HTML)
   - Health metrics with visual glow indicators

7. **Anomaly Detection**
   - Statistical analysis of test performance (duration, pass rate)
   - Outlier identification using historical baselines
   - Batch processing for trend analysis
   - Early warning system for degrading quality

8. **CI/CD Integration**
   - GitHub Actions workflow generation
   - Playwright config templating
   - Automated deployment scripts
   - Environment variable management

### Unique Selling Points

- **Zero-Code Test Creation**: Non-technical users can generate tests via natural language
- **Intelligent Failure Diagnosis**: AI analyzes failures faster than manual debugging
- **Multi-Viewport by Default**: Ensures responsive design consistency
- **Real-Time Collaboration**: Live test execution monitoring with streaming logs
- **Adaptive Theming**: 3 professionally designed themes (Cyber Blueprint, Crimson Dark, Golden Slate)

### Integration Capabilities

**API Endpoints**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/playwright/execute` | POST | Execute test suite with Playwright |
| `/api/screenshots/capture` | POST | Capture multi-viewport screenshots |
| `/api/gemini/analyze-intent` | POST | Validate natural language test input |
| `/api/gemini/nl-to-playwright` | POST | Generate Playwright code from NL |
| `/api/gemini/analyze-page` | POST | AI visual analysis of screenshots |
| `/api/diff/compare` | POST | Compare two screenshots |
| `/api/diff/batch-compare` | POST | Automated regression analysis |
| `/api/diff/baselines` | GET/POST | Manage baseline images |
| `/api/ai/analyze-root-cause` | POST | Diagnose test failures |
| `/api/ai/similar-failures` | POST | Find historical failure patterns |
| `/api/anomaly-detection/detect` | POST | Detect performance anomalies |
| `/api/ci/deploy-github` | POST | Deploy CI/CD pipeline to GitHub |

---

## Project Structure

### Directory Organization

```
pathfinder/
├── src/
│   ├── app/
│   │   ├── features/              # Feature modules (SPA pages)
│   │   │   ├── dashboard/        # Home dashboard with metrics
│   │   │   ├── designer/         # Test creation wizard
│   │   │   ├── runner/           # Test execution interface
│   │   │   └── reports/          # Test results and history
│   │   ├── api/                  # Next.js API routes
│   │   │   ├── playwright/       # Test execution endpoints
│   │   │   ├── screenshots/      # Screenshot capture
│   │   │   ├── gemini/           # AI analysis APIs
│   │   │   ├── diff/             # Visual regression
│   │   │   ├── ai/               # Root cause & embeddings
│   │   │   ├── anomaly-detection/ # Performance analysis
│   │   │   └── ci/               # CI/CD deployment
│   │   ├── globals.css           # Theme CSS variables
│   │   └── page.tsx              # SPA router component
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable themed components
│   │   │   ├── ThemedCard.tsx
│   │   │   ├── ThemedButton.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── layout/               # App structure
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── logo/                 # Branding
│   │   ├── decorative/           # Theme backgrounds
│   │   └── inspector/            # Issue triage UI
│   │
│   ├── lib/
│   │   ├── stores/
│   │   │   └── appStore.ts       # Zustand global state
│   │   ├── supabase/             # Database operations
│   │   │   ├── supabase.ts       # Client initialization
│   │   │   ├── dashboard.ts      # Metrics queries
│   │   │   ├── testSuites.ts     # CRUD operations
│   │   │   ├── testRuns.ts       # Execution tracking
│   │   │   ├── aiAnalyses.ts     # AI findings storage
│   │   │   └── visualRegressions.ts # Diff results
│   │   ├── gemini/               # AI integration
│   │   │   ├── gemini.ts         # Core client
│   │   │   └── visualInspector.ts # Vision analysis
│   │   ├── playwright/           # Test execution
│   │   │   ├── executor.ts       # Test runner
│   │   │   └── generateTestCode.ts # Code generation
│   │   ├── diff/                 # Visual regression
│   │   │   ├── screenshotComparator.ts # Pixelmatch wrapper
│   │   │   └── comparisonOrchestrator.ts # Batch processing
│   │   ├── ai/                   # AI utilities
│   │   │   ├── rootCauseAnalysis.ts # Failure diagnostics
│   │   │   └── ai-client.ts      # Unified AI client
│   │   ├── nl-test/              # Natural language
│   │   │   ├── testEngine.ts     # Intent parsing
│   │   │   └── examplePrompts.ts # Template library
│   │   ├── anomaly-detection/    # Performance monitoring
│   │   ├── ci/                   # CI/CD templates
│   │   ├── theme.ts              # Theme definitions
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── storage/              # File upload helpers
│   │
│   └── hooks/
│       ├── useSupabase.ts        # Data fetching hooks
│       └── useTestRuns.ts        # Real-time subscriptions
│
├── supabase/
│   ├── schema.sql                # Database schema
│   └── SUPABASE_SETUP.md         # Storage bucket setup
│
├── public/                       # Static assets
├── .claude/                      # Module specifications
├── CLAUDE.md                     # Development guide
├── README.md                     # User documentation
└── package.json                  # Dependencies
```

### Key Files and Their Purpose

**Application Entry Points**:
- `src/app/page.tsx` - SPA router that conditionally renders feature components based on Zustand navigation state
- `src/app/layout.tsx` - Root layout with theme providers and global styles

**State Management**:
- `src/lib/stores/appStore.ts` - Zustand store combining theme and navigation slices

**Feature Modules**:
- `src/app/features/dashboard/Dashboard.tsx` - Main dashboard with health metrics
- `src/app/features/designer/Designer.tsx` - 4-step test creation wizard
- `src/app/features/runner/RealRunner.tsx` - Test execution interface
- `src/app/features/reports/Reports.tsx` - Results visualization

**API Layer**:
- `src/app/api/playwright/execute/route.ts` - Executes Playwright tests with timeout handling
- `src/app/api/gemini/analyze-page/route.ts` - AI visual analysis of screenshots
- `src/app/api/diff/batch-compare/route.ts` - Automated regression testing

**Data Access**:
- `src/lib/supabase/` - Type-safe database operations with error handling

### Module Breakdown

**Dashboard Module** (15 files):
- Entry: `Dashboard.tsx`
- Components: `StatCard`, `QualityTrendsChart`, `QuickActionsCard`, `TestRunsList`
- Data: `lib/supabase/dashboard.ts`

**Designer Module** (18 files):
- Entry: `Designer.tsx`
- Steps: `StepSetup`, `StepAnalysis`, `StepReview`, `StepComplete`
- Code Gen: `lib/playwright/generateTestCode.ts`

**Runner Module** (16 files):
- Entry: `RealRunner.tsx`
- Components: `ExecutionProgress`, `LiveLogsPanel`, `ViewportConfigurator`
- Execution: `lib/playwright/executor.ts`

**Reports Module** (20 files):
- Entry: `Reports.tsx`
- Widgets: `ErrorTimeline`, `ScreenshotComparison`, `ViewportGrid`
- Export: `lib/export/reportExporter.ts`

**NL Test Module** (17 files):
- Entry: `page.tsx` (in `app/nl-test/`)
- Engine: `lib/nl-test/testEngine.ts`
- Templates: `lib/nl-test/examplePrompts.ts`

### Data Flow

```
User Interaction
    ↓
Zustand Store (appStore.ts)
    ↓
Feature Component (e.g., Designer.tsx)
    ↓
API Route (e.g., /api/gemini/analyze-page)
    ↓
Service Layer (e.g., lib/gemini/gemini.ts)
    ↓
External Services (Gemini API, Supabase)
    ↓
Database/Storage (PostgreSQL, Storage Buckets)
    ↓
Real-time Subscription (Supabase channels)
    ↓
UI Update (React state)
```

**Example: Test Execution Flow**:
1. User clicks "Run Test" in Runner UI
2. `RealRunner.tsx` calls `/api/playwright/execute`
3. API route invokes `lib/playwright/executor.ts`
4. Executor launches Playwright browser instances
5. Screenshots saved to Supabase storage
6. Results inserted into `test_results` table
7. Real-time subscription pushes updates to UI
8. `LiveLogsPanel` renders streaming console output

---

## Development Workflow

### Running the Project

**Prerequisites**:
```bash
# Node.js 20+ required
node --version

# Install dependencies
npm install
```

**Environment Setup**:
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
```

**Database Setup**:
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Configure storage buckets per `SUPABASE_SETUP.md`

**Development Server**:
```bash
# Standard development
npm run dev

# Clean start (removes lock files)
npm run dev:clean
```

Server runs at `http://localhost:3000`

### Build Process

**Development Build**:
- Next.js with Turbopack for fast refresh
- Hot module replacement for instant updates
- Source maps enabled for debugging

**Production Build**:
```bash
# Build optimized bundle
npm run build

# Start production server
npm run start
```

**Build Optimizations**:
- Automatic code splitting by route
- Image optimization via Next.js Image component
- CSS minification and purging
- Tree shaking for unused dependencies
- Serverless function bundling

### Testing Approach

**No Unit Testing Framework**:
- This platform **creates** and **runs** Playwright tests
- It does not test itself with Jest/Vitest
- Quality assurance through manual testing and dogfooding

**Playwright for Browser Automation**:
```typescript
// Example generated test
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.locator('h1')).toBeVisible();
});
```

**API Testing**:
- Manual testing via Postman/Thunder Client
- Integration testing through UI workflows

### Development Best Practices

**Code Organization**:
- Feature-first structure: Group by feature, not file type
- Colocation: Keep components near their usage
- Shared utilities in `lib/`, shared UI in `components/ui/`

**Naming Conventions**:
- Components: PascalCase (`ThemedCard.tsx`)
- Utilities: camelCase (`generateTestCode.ts`)
- API routes: lowercase directories (`api/playwright/execute/`)
- Constants: UPPER_SNAKE_CASE

**Import Patterns**:
```typescript
// Use path aliases
import { useTheme } from '@/lib/stores/appStore';
import { ThemedCard } from '@/components/ui/ThemedCard';

// NOT relative paths
import { useTheme } from '../../../lib/stores/appStore';
```

**State Management Rules**:
- Global state: Zustand (`appStore.ts`)
- Local state: React `useState`/`useReducer`
- Server state: Supabase hooks with caching
- Form state: Controlled components

**Error Handling**:
```typescript
// API routes always return structured errors
try {
  // Operation
} catch (error: any) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: error.message || 'Operation failed' },
    { status: 500 }
  );
}
```

---

## Design Patterns & Best Practices

### Notable Patterns

**1. Hybrid SPA Navigation**
```typescript
// Custom navigation without Next.js router
const { currentPage, navigateTo } = useNavigation();

// Navigate without URL change
navigateTo('designer');

// Conditional rendering in page.tsx
{currentPage === 'dashboard' && <Dashboard />}
{currentPage === 'designer' && <Designer />}
```

**Benefits**: No page reloads, instant transitions, preserved state

**2. Theme System with CSS Variables**
```typescript
// Theme definition
export const themes = {
  'cyber-blueprint': {
    colors: {
      primary: 'hsl(185, 100%, 50%)',
      surface: 'hsl(210, 25%, 12%)',
      // ...
    }
  }
};

// CSS variables in globals.css
:root[data-theme="cyber-blueprint"] {
  --theme-primary: hsl(185, 100%, 50%);
  --theme-surface: hsl(210, 25%, 12%);
}

// Component usage (inline styles, NOT Tailwind variants)
<div style={{ backgroundColor: currentTheme.colors.surface }}>
```

**3. Real-Time Subscriptions**
```typescript
// Subscribe to test run updates
const subscription = supabase
  .channel('test-runs')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'test_runs' },
    (payload) => handleUpdate(payload)
  )
  .subscribe();

// Cleanup
return () => { subscription.unsubscribe(); };
```

**4. AI Retry Logic with Fallback**
```typescript
// Primary: Gemini, Fallback: Groq
async function analyzeWithRetry(prompt: string) {
  try {
    return await geminiClient.analyze(prompt);
  } catch (error) {
    console.warn('Gemini failed, trying Groq');
    return await groqClient.analyze(prompt);
  }
}
```

**5. Long-Running Serverless Functions**
```typescript
// API route configuration
export const maxDuration = 300; // 5 minutes

// Handles Playwright test execution timeouts
export async function POST(request: NextRequest) {
  // Long operation
}
```

**6. Type-Safe Database Operations**
```typescript
// Supabase with TypeScript
interface TestSuite {
  id: string;
  name: string;
  target_url: string;
  // ...
}

const { data, error } = await supabase
  .from('test_suites')
  .select('*')
  .returns<TestSuite[]>();
```

### Code Quality Measures

**TypeScript Strict Mode**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

- No `any` types without explicit reasoning
- All props interfaces defined
- Comprehensive type coverage in `lib/types.ts`

**ESLint Configuration**:
```bash
npm run lint
```
- Next.js recommended rules
- React hooks validation
- Import order enforcement

**Code Review Checklist**:
- [ ] TypeScript errors resolved
- [ ] Theme colors use CSS variables, not hardcoded values
- [ ] API routes include error handling
- [ ] Supabase queries check for errors
- [ ] Components use `useTheme()` for styling
- [ ] Navigation uses `useNavigation()`, not window.location

### Performance Considerations

**1. Lazy Loading**:
```typescript
// Sidebar loaded on-demand
const Sidebar = dynamic(() => import('@/components/layout/Sidebar'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

**2. Image Optimization**:
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="Pathfinder"
/>
```

**3. Memoization**:
```typescript
// Expensive computations
const sortedResults = useMemo(() =>
  results.sort((a, b) => b.timestamp - a.timestamp),
  [results]
);

// Callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

**4. Batching API Calls**:
```typescript
// Batch visual regression comparisons
POST /api/diff/batch-compare
{
  "testRunId": "run-123",
  // Processes all screenshots in parallel
}
```

**5. Skeleton States**:
```typescript
// Loading placeholders
{isLoading ? <SkeletonCard /> : <StatCard data={data} />}
```

### Security Practices

**1. Environment Variable Isolation**:
- Server-only secrets: `GEMINI_API_KEY`, `GROQ_API_KEY`
- Public keys: `NEXT_PUBLIC_SUPABASE_URL`
- Never expose API keys to client

**2. Input Validation**:
```typescript
// API route validation
if (!url || !isValidUrl(url)) {
  return NextResponse.json(
    { error: 'Invalid URL provided' },
    { status: 400 }
  );
}
```

**3. SQL Injection Prevention**:
- Supabase client uses parameterized queries
- No raw SQL string concatenation

**4. XSS Protection**:
- React automatically escapes JSX content
- User-generated content sanitized before rendering

**5. CORS Configuration**:
```typescript
// API routes restrict origins in production
const origin = request.headers.get('origin');
if (!isAllowedOrigin(origin)) {
  return new Response('Forbidden', { status: 403 });
}
```

**6. Rate Limiting** (Recommended for Production):
- Implement middleware for API routes
- Use Vercel's edge config for IP-based throttling

---

## Additional Resources

**Documentation**:
- `CLAUDE.md` - Comprehensive development guide
- `README.md` - User-facing product documentation
- `THEME_SYSTEM.md` - Theme customization guide
- `SUPABASE_SETUP.md` - Database and storage setup
- `.claude/module-*.md` - Feature-specific specifications

**External Dependencies**:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Playwright Docs](https://playwright.dev)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Zustand Docs](https://zustand-demo.pmnd.rs)

**Community & Support**:
- GitHub Repository: [Internal]
- Issue Tracker: [Internal]
- Team Wiki: [Internal]

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Maintained By**: Development Team
