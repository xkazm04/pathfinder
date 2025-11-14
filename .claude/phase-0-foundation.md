# Phase 0: Foundation & Visual Structure

## Objective
Set up the NextJS application foundation with routing, layout structure, Supabase integration, and establish the visual design system using Tailwind CSS and Framer Motion.

## Technical Stack
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (Client & Auth)

## Tasks

### 1. Project Initialization
- Initialize Next.js project with TypeScript
- Configure Tailwind CSS with custom theme
- Set up Framer Motion
- Install and configure Supabase client
- Set up environment variables for Supabase connection

### 2. Design System & Theme
**Color Palette:**
- Primary: Indigo/Blue (for actions, active states)
- Success: Green (passing tests)
- Warning: Amber (warnings, potential issues)
- Error: Red (failing tests, critical issues)
- Neutral: Slate grays (backgrounds, text)
- Accent: Purple (AI-related features)

**Typography:**
- Headings: font-semibold to font-bold
- Body: font-normal
- Code: monospace font for test code display

**Spacing & Layout:**
- Consistent spacing scale (4px base)
- Card-based design with subtle shadows
- Rounded corners (rounded-lg for cards, rounded-md for inputs)

### 3. App Structure & Routing
Create the following route structure:
```
/app
├── page.tsx                    # Landing/redirect to dashboard
├── /dashboard
│   └── page.tsx               # Main dashboard view
├── /designer
│   └── page.tsx               # Test designer interface
├── /runner
│   └── page.tsx               # Test execution view
├── /reports
│   └── [testRunId]
│       └── page.tsx           # Detailed test report
└── /api
    ├── /playwright            # Playwright execution endpoints
    ├── /gemini                # Gemini AI integration endpoints
    └── /screenshots           # Screenshot capture endpoints
```

### 4. Layout Components
Create reusable layout components:

**MainLayout.tsx:**
- Top navigation bar with app logo and quick actions
- Sidebar navigation (collapsible)
- Main content area with proper spacing
- Footer with status indicators

**Sidebar Navigation Items:**
- Dashboard (home icon)
- Test Designer (wand/magic icon)
- Test Runner (play icon)
- Reports (document icon)
- Settings (gear icon)

**Header Component:**
- App branding: "AI Test Agent" with robot/AI icon
- Breadcrumb navigation
- User profile dropdown (if auth implemented)
- Quick action buttons (New Test, Run All)

### 5. Supabase Schema Setup
Create initial database schema:

```sql
-- Test Suites table
CREATE TABLE test_suites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test Runs table
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    config JSONB, -- viewport settings, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test Results table
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES test_runs(id) ON DELETE CASCADE,
    viewport VARCHAR(50) NOT NULL, -- mobile, tablet, desktop
    viewport_size VARCHAR(50), -- e.g., "375x667"
    test_name VARCHAR(255),
    status VARCHAR(50), -- pass, fail, skipped
    duration_ms INTEGER,
    screenshots JSONB, -- array of screenshot URLs
    errors JSONB, -- array of error objects
    console_logs JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Analyses table
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50), -- visual, functional, accessibility
    findings JSONB, -- structured findings
    severity VARCHAR(50), -- critical, warning, info
    suggestions TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test Code Storage
CREATE TABLE test_code (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'typescript',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_test_runs_suite_id ON test_runs(suite_id);
CREATE INDEX idx_test_results_run_id ON test_results(run_id);
CREATE INDEX idx_ai_analyses_result_id ON ai_analyses(result_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);
```

### 6. Utility Functions & Hooks
Create shared utilities:

**lib/supabase.ts:**
- Supabase client initialization
- Helper functions for common queries

**lib/types.ts:**
- TypeScript interfaces for all database models
- Common type definitions

**hooks/useTestRuns.ts:**
- React hook for fetching test runs
- Real-time subscription to test status updates

**hooks/useSupabase.ts:**
- Wrapper hook for Supabase operations

### 7. Common UI Components
Build foundational UI components:

**components/ui/Card.tsx:**
- Reusable card component with consistent styling
- Variants: default, bordered, elevated

**components/ui/Badge.tsx:**
- Status badges (pass, fail, running, pending)
- Severity badges (critical, warning, info)

**components/ui/Button.tsx:**
- Primary, secondary, ghost variants
- Loading states
- Icon support

**components/ui/LoadingSpinner.tsx:**
- Animated loading indicator
- Size variants (sm, md, lg)

**components/ui/EmptyState.tsx:**
- Placeholder for empty lists/states
- With call-to-action button

### 8. Animation Definitions
Create Framer Motion animation presets:

**lib/animations.ts:**
```typescript
// Fade in animation
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

// Slide up animation
export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

// Scale animation
export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

// Stagger children
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};
```

## Acceptance Criteria
- [ ] Next.js app runs successfully on localhost
- [ ] All routes are accessible and render basic layouts
- [ ] Supabase is connected and schema is deployed
- [ ] Navigation works between all main sections
- [ ] Design system is consistently applied across components
- [ ] Responsive layout works on mobile, tablet, and desktop
- [ ] Basic animations enhance user experience without being distracting
- [ ] TypeScript has no compilation errors
- [ ] All shared components are documented with props

## Visual Design Guidelines
- Use subtle gradients for headers and hero sections
- Implement smooth transitions (200-300ms) for interactive elements
- Cards should have hover states with slight elevation change
- Use iconography consistently (lucide-react recommended)
- Maintain adequate white space for readability
- Ensure WCAG AA color contrast standards
- Use skeleton loaders for async content

## Notes for Claude Code
- Prioritize clean, maintainable code structure
- Use TypeScript strictly (no `any` types)
- Follow Next.js 14+ App Router conventions
- Implement error boundaries for resilience
- Add meaningful comments for complex logic
- Use environment variables for all sensitive config
- Set up proper .gitignore for Next.js and Node
