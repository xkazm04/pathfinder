# Module 7: Auto-Fix Suggestions

## Objective
When AI analysis detects visual, functional, or accessibility issues, automatically generate code suggestions and fixes that developers can review, apply, or adapt. Provide before/after previews and create PR-ready code snippets.

## Dependencies
- Phase 0 completed
- Module 3 completed (AI analysis must detect issues)
- Gemini API configured
- GitHub API (optional for PR generation)

## Features to Implement

### 1. Fix Generation Engine

**API Endpoint:** `/app/api/fixes/generate/route.ts`

**Core Functionality:**
- Accept issue details from AI analysis
- Analyze problematic code/screenshots
- Generate fix suggestions (CSS, HTML, JavaScript)
- Return multiple fix options when applicable
- Include explanations and trade-offs

**Gemini Prompt for Fix Generation:**
```typescript
const FIX_GENERATION_PROMPT = `
You are an expert frontend developer specializing in fixing UI/UX issues.

Issue Details:
- Category: {category}
- Severity: {severity}
- Issue: {issueDescription}
- Location: {location}
- Affected Elements: {affectedElements}
- Current Screenshot: [provided]

Context:
- Framework: {framework}
- Viewport: {viewport}
- Target URL: {targetUrl}

Generate code fixes for this issue. Provide:
1. CSS fixes (if applicable)
2. HTML/JSX changes (if needed)
3. JavaScript fixes (if required)
4. Multiple approaches (if there are different solutions)

For each fix, include:
- The complete code change
- Explanation of what it does
- Pros and cons of this approach
- Which files need to be modified
- Expected visual result

Return as JSON:
{
  "fixes": [
    {
      "type": "css|html|javascript",
      "code": "/* actual code */",
      "explanation": "...",
      "files": ["path/to/file.css"],
      "pros": ["..."],
      "cons": ["..."],
      "confidence": 0.0-1.0,
      "preview": "description of expected result"
    }
  ],
  "recommendedFix": 0 // index of recommended solution
}
`;
```

**Implementation:**
```typescript
// lib/fixes/fixGenerator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

interface FixRequest {
  issue: Finding; // from AI analysis
  screenshot?: string;
  context: {
    framework: string;
    viewport: string;
    targetUrl: string;
    codeSnippet?: string;
  };
}

interface FixSuggestion {
  type: 'css' | 'html' | 'javascript' | 'mixed';
  code: string;
  explanation: string;
  files: string[];
  pros: string[];
  cons: string[];
  confidence: number;
  preview: string;
}

interface FixResponse {
  fixes: FixSuggestion[];
  recommendedFix: number;
}

export async function generateFixes(
  request: FixRequest
): Promise<FixResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = constructFixPrompt(request);
  
  // Include screenshot if available
  const parts = [prompt];
  if (request.screenshot) {
    const imageData = await fetchImageAsBase64(request.screenshot);
    parts.push({
      inlineData: {
        data: imageData,
        mimeType: 'image/png'
      }
    });
  }

  const result = await model.generateContent(parts);
  const responseText = result.response.text();
  
  // Parse JSON response
  const fixResponse: FixResponse = JSON.parse(responseText);
  
  return fixResponse;
}
```

### 2. Fix Categories & Types

**Issue Categories & Corresponding Fixes:**

**Visual/Layout Issues:**
- Overlapping elements → z-index, position, margin fixes
- Text cutoff → overflow, text-overflow, max-width fixes
- Broken responsive → media queries, flexbox/grid fixes
- Alignment issues → flexbox, grid, alignment properties

**Functional Issues:**
- Buttons too small → min-width, min-height, padding
- Hidden elements → display, visibility, opacity fixes
- Z-index problems → stacking context fixes
- Hover state issues → CSS :hover, :focus states

**Accessibility Issues:**
- Low contrast → color adjustments, background changes
- Missing focus indicators → outline, box-shadow styles
- Small touch targets → increased size, spacing
- Missing ARIA attributes → HTML attribute additions

**Responsive Issues:**
- Horizontal scroll → max-width: 100%, overflow-x fixes
- Content reflow → responsive typography, fluid layouts
- Navigation breaks → mobile-specific styles, hamburger menu

### 3. Fix Suggestion UI

**Component:** `components/fixes/FixSuggestionCard.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Fix Suggestion 1 of 3                    ⭐ Recommended│
├──────────────────────────────────────────────────────┤
│ Issue: Header overlaps main content                  │
│ Type: CSS Fix                                        │
│ Confidence: 95%                                      │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ /* Add to header.css */                          │ │
│ │ .header {                                        │ │
│ │   position: sticky;                              │ │
│ │   top: 0;                                        │ │
│ │   z-index: 1000;                                 │ │
│ │ }                                                │ │
│ │                                                  │ │
│ │ .main-content {                                  │ │
│ │   padding-top: 80px; /* header height */        │ │
│ │ }                                                │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ✅ Pros: Fixes overlap, keeps header visible        │
│ ⚠️  Cons: Requires specific header height           │
│                                                      │
│ [Apply Fix] [Preview] [Copy Code] [Next Solution]   │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Navigate between multiple fix options
- See recommended fix first
- Copy code to clipboard
- Apply fix directly (if codebase accessible)
- Preview expected result

### 4. Before/After Preview

**Component:** `components/fixes/BeforeAfterPreview.tsx`

**Visual Comparison:**
```
┌─────────────────────┬─────────────────────┐
│      BEFORE         │       AFTER         │
│   (Current Issue)   │   (With Fix)        │
├─────────────────────┼─────────────────────┤
│                     │                     │
│   [Screenshot]      │   [Simulated]       │
│                     │                     │
└─────────────────────┴─────────────────────┘
         [Slider to Compare]
```

**Implementation:**
- Use actual screenshot for "before"
- Generate simulated "after" using browser dev tools or CSS injection
- Slider for easy comparison

**Simulation Approach:**
```typescript
// lib/fixes/previewGenerator.ts
export async function generateFixPreview(
  url: string,
  fixCode: string,
  fixType: 'css' | 'html' | 'javascript'
): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Inject fix
  if (fixType === 'css') {
    await page.addStyleTag({ content: fixCode });
  } else if (fixType === 'javascript') {
    await page.evaluate(fixCode);
  }
  
  // Capture screenshot
  const screenshot = await page.screenshot({ fullPage: true });
  
  await browser.close();
  
  // Upload and return URL
  return await uploadScreenshot(screenshot);
}
```

### 5. Multi-File Fix Coordination

**Component:** `components/fixes/MultiFileFix.tsx`

**For fixes spanning multiple files:**
```
Files to Modify:
├─ src/components/Header.tsx
│  └─ Add className, update structure
├─ src/styles/header.css
│  └─ Add new CSS rules
└─ src/utils/constants.ts
   └─ Update HEADER_HEIGHT constant

[Apply All] [Review Changes] [Create PR]
```

**Features:**
- Show all files that need changes
- Display diffs for each file
- Apply changes atomically
- Rollback if errors

### 6. Fix Validation & Testing

**Component:** `lib/fixes/fixValidator.ts`

**Validation Process:**
1. Apply fix in sandboxed environment
2. Re-run affected tests
3. Verify issue is resolved
4. Check for regressions (new issues introduced)
5. Return validation result

**Implementation:**
```typescript
interface ValidationResult {
  success: boolean;
  issueResolved: boolean;
  newIssues: Finding[];
  testResults: {
    passed: number;
    failed: number;
    details: string[];
  };
  recommendation: 'apply' | 'review' | 'reject';
}

export async function validateFix(
  fix: FixSuggestion,
  testRunId: string
): Promise<ValidationResult> {
  // Create temp branch/environment
  // Apply fix
  // Run tests
  // Analyze results
  // Return validation
}
```

### 7. Fix Application Methods

**1. Manual Copy/Paste:**
- User copies code and applies manually
- Simplest, works for all setups

**2. Direct File Modification (Advanced):**
- If codebase is accessible (e.g., GitHub integration)
- Automatically apply changes
- Create commit

**3. PR Generation:**
- Create GitHub PR with fix
- Include issue details, screenshots
- Link to test report

**Component:** `components/fixes/FixApplicationMethod.tsx`

### 8. GitHub Integration (Optional)

**Feature:** Automatically create PRs with fixes

**Setup:**
```typescript
// lib/github/prGenerator.ts
import { Octokit } from '@octokit/rest';

interface PRRequest {
  repo: string;
  owner: string;
  fixes: FixSuggestion[];
  issue: Finding;
  testRunId: string;
}

export async function createFixPR(
  request: PRRequest
): Promise<string> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  // Create branch
  const branch = `fix/issue-${request.issue.id}`;
  await octokit.git.createRef({
    owner: request.owner,
    repo: request.repo,
    ref: `refs/heads/${branch}`,
    sha: 'main-sha'
  });
  
  // Apply file changes
  for (const fix of request.fixes) {
    for (const file of fix.files) {
      await octokit.repos.createOrUpdateFileContents({
        owner: request.owner,
        repo: request.repo,
        path: file,
        message: `Fix: ${request.issue.issue}`,
        content: Buffer.from(fix.code).toString('base64'),
        branch
      });
    }
  }
  
  // Create PR
  const pr = await octokit.pulls.create({
    owner: request.owner,
    repo: request.repo,
    title: `🤖 Auto-fix: ${request.issue.issue}`,
    head: branch,
    base: 'main',
    body: generatePRBody(request)
  });
  
  return pr.data.html_url;
}

function generatePRBody(request: PRRequest): string {
  return `
## Automated Fix

**Issue Detected:** ${request.issue.issue}
**Severity:** ${request.issue.severity}
**Location:** ${request.issue.location}

**Fix Applied:**
${request.fixes.map(f => f.explanation).join('\n')}

**Test Report:** ${getReportUrl(request.testRunId)}

**Before/After:**
[Screenshot comparison]

This PR was automatically generated by the AI Test Agent.
  `.trim();
}
```

### 9. Fix History & Learning

**Database Schema:**
```sql
CREATE TABLE fix_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES ai_analyses(id),
    fix_type VARCHAR(50), -- css, html, javascript, mixed
    fix_code TEXT NOT NULL,
    explanation TEXT,
    files_modified TEXT[], -- array of file paths
    confidence_score DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, applied, rejected, validated
    applied_at TIMESTAMP,
    applied_by VARCHAR(255),
    validation_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fix_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fix_id UUID REFERENCES fix_suggestions(id),
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    was_helpful BOOLEAN,
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Learning System:**
```typescript
// lib/fixes/learningSystem.ts
export async function learnFromFeedback(
  fixId: string,
  feedback: {
    wasHelpful: boolean;
    rating: number;
    comments?: string;
  }
): Promise<void> {
  // Store feedback
  await supabase.from('fix_feedback').insert({
    fix_id: fixId,
    user_rating: feedback.rating,
    was_helpful: feedback.wasHelpful,
    comments: feedback.comments
  });
  
  // Analyze patterns in successful vs unsuccessful fixes
  // Adjust confidence scoring
  // Improve future fix generation
}
```

### 10. Fix Templates Library

**Pre-built Fix Templates:**
```typescript
const FIX_TEMPLATES = {
  contrast: {
    name: "Improve Color Contrast",
    code: `
      /* Increase contrast for accessibility */
      .element {
        color: #000000; /* WCAG AAA compliant */
        background-color: #FFFFFF;
      }
    `,
    applicableWhen: (issue: Finding) => 
      issue.category === 'accessibility' && 
      issue.issue.includes('contrast')
  },
  
  touchTarget: {
    name: "Enlarge Touch Target",
    code: `
      /* Minimum 44x44px for mobile touch targets */
      .button {
        min-width: 44px;
        min-height: 44px;
        padding: 12px 16px;
      }
    `,
    applicableWhen: (issue: Finding) =>
      issue.issue.includes('too small') &&
      issue.viewport.includes('mobile')
  },
  
  responsiveImage: {
    name: "Make Image Responsive",
    code: `
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
    `,
    applicableWhen: (issue: Finding) =>
      issue.issue.includes('image') &&
      issue.category === 'responsive'
  }
};
```

### 11. Interactive Fix Builder

**Component:** `components/fixes/InteractiveFixBuilder.tsx`

**Features:**
- Adjust fix parameters with sliders/inputs
- Real-time preview of changes
- Fine-tune colors, sizes, spacing
- Generate custom fix code

**Example:**
```
Issue: Button too small on mobile

Interactive Adjustments:
Minimum Width:  [====|====] 44px
Minimum Height: [====|====] 44px
Padding:        [===|=====] 12px
Border Radius:  [==|======] 8px

Preview: [Live preview of adjusted button]

[Generate Fix Code]
```

### 12. Batch Fix Application

**Component:** `components/fixes/BatchFixManager.tsx`

**Features:**
- Select multiple issues to fix
- Apply consistent fixes across similar issues
- Preview all changes before applying
- Rollback entire batch if needed

**UI:**
```
Batch Fix Manager

☑ Issue 1: Low contrast in navigation (CSS fix)
☑ Issue 2: Low contrast in footer (CSS fix)
☑ Issue 3: Button too small on mobile (CSS fix)
☐ Issue 4: Missing alt text (HTML fix)

Selected: 3 issues
Estimated time: ~2 minutes

[Preview All] [Apply Batch] [Cancel]
```

### 13. Fix Confidence Scoring

**Factors:**
```typescript
function calculateFixConfidence(
  issue: Finding,
  fix: FixSuggestion,
  context: {
    similarIssuesFixed: number;
    validationSuccess: boolean;
    userFeedback: number; // average rating
  }
): number {
  let confidence = 0.5; // base
  
  // Boost for simple, common fixes
  if (fix.type === 'css' && fix.files.length === 1) {
    confidence += 0.2;
  }
  
  // Boost based on past success
  confidence += context.similarIssuesFixed * 0.05;
  
  // Boost if validation passed
  if (context.validationSuccess) {
    confidence += 0.15;
  }
  
  // Adjust based on user feedback
  confidence += (context.userFeedback - 3) * 0.1;
  
  return Math.min(1.0, Math.max(0.0, confidence));
}
```

### 14. Rollback Mechanism

**Component:** `components/fixes/FixRollback.tsx`

**Features:**
- Undo applied fixes
- Restore previous code
- Show diff of what will be reverted
- Confirm before rollback

**Database Tracking:**
```sql
CREATE TABLE fix_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fix_id UUID REFERENCES fix_suggestions(id),
    original_code TEXT, -- backup of original
    applied_code TEXT,
    files_affected TEXT[],
    status VARCHAR(50), -- applied, rolled_back
    applied_at TIMESTAMP,
    rolled_back_at TIMESTAMP
);
```

### 15. Export Fix Report

**Component:** `components/fixes/FixExporter.tsx`

**Export Formats:**
- Markdown (for documentation)
- JSON (for automation)
- Diff file (for patching)

**Example Markdown Output:**
```markdown
# Auto-Fix Report

## Issue: Header Overlaps Content
**Severity:** Critical
**Location:** Homepage header

### Recommended Fix
**Type:** CSS
**Confidence:** 95%

```css
/* Add to header.css */
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.main-content {
  padding-top: 80px;
}
```

**Explanation:** This fix ensures the header stays visible while preventing overlap with main content.

**Pros:**
- Simple CSS-only solution
- No JavaScript required
- Maintains header visibility on scroll

**Cons:**
- Requires knowing exact header height
- May need adjustment for responsive layouts
```

## API Operations

**Generate Fix:**
```typescript
export async function generateFixForIssue(
  analysisId: string
): Promise<FixResponse> {
  const analysis = await getAnalysis(analysisId);
  
  const fixes = await generateFixes({
    issue: analysis.findings[0],
    screenshot: analysis.screenshotUrl,
    context: {
      framework: 'React',
      viewport: analysis.viewport,
      targetUrl: analysis.targetUrl
    }
  });
  
  // Save to database
  await saveFixes(analysisId, fixes);
  
  return fixes;
}
```

## Acceptance Criteria
- [ ] Fixes are generated for detected issues
- [ ] Multiple fix options provided when applicable
- [ ] Code suggestions are syntactically valid
- [ ] Before/after previews are available
- [ ] Fixes can be applied manually or automatically
- [ ] Validation confirms fixes resolve issues
- [ ] PR generation works (if GitHub integrated)
- [ ] User feedback improves future suggestions
- [ ] Rollback mechanism works correctly
- [ ] Export functionality provides useful output

## Performance Considerations
- Cache similar fix patterns
- Limit concurrent fix generation
- Optimize preview generation
- Batch process multiple fixes

## Testing Notes for Claude Code
- Test fix generation for various issue types
- Verify code validity of generated fixes
- Test preview generation
- Validate rollback mechanism
- Test batch application

## Documentation Requirements
- Guide to reviewing and applying fixes
- Explanation of confidence scores
- Best practices for manual fixes
- Troubleshooting common issues
- API documentation for fix generation
