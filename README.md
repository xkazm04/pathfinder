# Pathfinder 🎯

**AI-Powered Automated Testing Platform**

Pathfinder revolutionizes web application testing by combining Google's Gemini AI with Playwright automation to deliver intelligent, autonomous test generation and execution. Built for the Google AI Hackathon, Pathfinder transforms how teams approach quality assurance.

---

## 🚀 Business Value

### Reduce Testing Time by 80%
Traditional manual testing takes hours or days. Pathfinder's AI-driven approach generates comprehensive test suites in minutes, freeing your team to focus on innovation instead of repetitive testing tasks.

### Lower Barriers to Quality Assurance
Write tests in plain English. No coding required. Gemini AI translates natural language descriptions into production-ready Playwright test code, making testing accessible to product managers, designers, and QA analysts.

### Catch Issues Before Users Do
Multi-viewport testing across desktop, tablet, and mobile ensures consistent experiences. Visual regression detection automatically identifies UI breaks, preventing costly production bugs.

### Data-Driven Insights
Real-time dashboards with health metrics, pass/fail analytics, and AI-powered root cause analysis give stakeholders actionable intelligence to improve quality continuously.

---

## 🤖 Powered by Google Gemini AI

Pathfinder leverages **Google Gemini API** across its entire testing lifecycle:

### 1. **Intelligent Test Generation**
- **Site Complexity Analysis**: Gemini analyzes your application's structure, identifying interactive elements, user flows, and edge cases
- **Scenario Recommendations**: AI suggests comprehensive test scenarios based on real-world usage patterns
- **Code Generation**: Converts test scenarios into production-ready Playwright code with proper assertions and error handling

### 2. **Natural Language Test Input**
- **Intent Analysis**: Understands testing goals from conversational descriptions
- **Context-Aware Translation**: Transforms statements like "verify users can add items to cart" into complete test automation
- **Smart Validation**: Generates appropriate assertions and checkpoints automatically

### 3. **Root Cause Analysis**
- **Failure Diagnostics**: When tests fail, Gemini analyzes screenshots, logs, and error messages to identify root causes
- **Actionable Recommendations**: Provides specific suggestions for fixing issues
- **Severity Scoring**: Prioritizes issues by business impact with confidence ratings

### 4. **Continuous Learning**
- Each test run feeds data back into Gemini for improved analysis
- Pattern recognition across test history identifies recurring issues
- Adaptive scenario generation based on application changes

---

## ✨ Key Features

### Visual Test Designer
**4-Step Intelligent Workflow**
1. **Setup**: Define target URL and test parameters
2. **AI Analysis**: Gemini captures screenshots and analyzes site complexity in real-time
3. **Review & Refine**: Edit AI-generated scenarios and preview Playwright code
4. **Deploy**: Save test suite ready for execution

**Business Impact**: Transform hours of manual test planning into minutes of AI-assisted design.

---

### Multi-Viewport Testing
**Cross-Device Confidence**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
- Parallel execution for faster results

**Business Impact**: Ensure 100% of users have flawless experiences regardless of device.

---

### Real-Time Test Execution
**Live Monitoring Dashboard**
- Streaming execution logs
- Progressive screenshot capture
- Pass/fail status updates
- Parallel test runner

**Business Impact**: Instant feedback loops accelerate development cycles.

---

### Visual Regression Detection
**Pixel-Perfect Accuracy**
- Baseline screenshot management
- Pixelmatch-based comparison
- Configurable thresholds
- Ignore regions for dynamic content
- Batch comparison APIs

**Business Impact**: Automatically catch UI breaks that manual review would miss.

---

### Comprehensive Reporting
**Actionable Intelligence**
- Test run history and trends
- Pass/fail analytics with charts
- Screenshot galleries with before/after comparisons
- AI-detected issues with severity ratings
- **Health Glow**: Ambient visual feedback based on overall test pass rate
  - 🟢 Green (≥90%) - Healthy
  - 🟡 Yellow (70-89%) - Warning
  - 🔴 Red (<70%) - Critical

**Business Impact**: Executives and stakeholders get quality metrics at a glance.

---

### Natural Language Test Creation
**No Code Required**
```
Input: "Test that users can search for products and add them to cart"

Output: Complete Playwright test with:
✓ Navigation to search page
✓ Input validation
✓ Search execution
✓ Results verification
✓ Add to cart interaction
✓ Cart state assertions
```

**Business Impact**: Democratize testing—anyone can contribute to quality assurance.

---

## 🛠️ Technology Stack

### AI & Analysis
- **Google Gemini API** - Core intelligence engine
- **Gemini Pro Vision** - Screenshot analysis
- **Gemini Pro** - Code generation and NL processing

### Testing & Automation
- **Playwright 1.56** - Cross-browser automation
- **Pixelmatch** - Visual regression detection

### Frontend
- **Next.js 16** - App Router with Turbopack
- **React 19** - Modern UI framework
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - Lightweight state management

### Backend & Data
- **Supabase** - PostgreSQL database, real-time subscriptions, storage
- **Next.js API Routes** - Serverless API endpoints

---

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Gemini API key ([Get one here](https://ai.google.dev/))

---

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd pathfinder
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup
1. Run `supabase/schema.sql` in your Supabase SQL Editor
2. Configure storage buckets per `SUPABASE_SETUP.md`

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and start testing!

---

## 📖 Usage

### Creating Your First Test

1. **Navigate to Designer**
   - Click "Designer" in the sidebar
   - Enter your application URL

2. **Let Gemini Analyze**
   - AI captures screenshots across viewports
   - Gemini analyzes site structure and complexity
   - Suggested test scenarios generated automatically

3. **Review & Customize**
   - Edit AI-generated scenarios
   - Preview Playwright code
   - Add custom assertions

4. **Save & Execute**
   - Save test suite to database
   - Navigate to "Runner"
   - Select viewports and execute

5. **View Results**
   - Real-time execution monitoring
   - Screenshots and logs
   - AI-powered failure analysis
   - Visual regression reports

---

## 🎨 Unique Features

### Client-Side SPA Navigation
Unlike traditional Next.js apps, Pathfinder uses a single-route architecture (`/`) with Zustand-based page management for instant navigation without URL changes.

### Dynamic Theme System
3 professionally designed themes with health-based ambient glow:
- **Cyber Blueprint** (default) - Technical cyan/blue aesthetic
- **Crimson Dark** - Minimalist dark red
- **Golden Slate** - Slate gray with gold accents

### Real-Time Data Synchronization
Supabase subscriptions provide live updates during test execution—watch tests run in real-time across the dashboard.

---

## 🏆 Google Hackathon Highlights

### Gemini API Integration Points
1. **Site Analysis Endpoint**: `/api/analyze/complexity`
2. **NL to Playwright**: `/api/gemini/nl-to-playwright`
3. **Intent Analysis**: `/api/gemini/analyze-intent`
4. **Root Cause Analysis**: `/api/ai/root-cause-analysis/[resultId]`

### Innovation Showcase
- **Multi-modal AI**: Combines vision (screenshot analysis) with language (code generation)
- **Autonomous Testing**: End-to-end test creation without human intervention
- **Adaptive Intelligence**: Learns from test history to improve recommendations
- **Accessibility**: Natural language interface democratizes technical workflows

---

## 📊 Project Structure

```
pathfinder/
├── src/
│   ├── app/
│   │   ├── features/          # Feature modules (dashboard, designer, runner, reports)
│   │   ├── api/               # Next.js API routes (Gemini, Playwright, diff)
│   │   └── page.tsx           # SPA router
│   ├── components/            # Reusable UI components
│   ├── lib/
│   │   ├── stores/            # Zustand state management
│   │   ├── supabase/          # Database operations
│   │   ├── gemini.ts          # Gemini AI client
│   │   └── playwright/        # Test execution utilities
│   └── hooks/                 # Custom React hooks
├── supabase/
│   └── schema.sql             # Database schema
└── public/                    # Static assets
```

---

## 🔒 Security & Best Practices

- **API Key Protection**: Gemini API key stored server-side only (never exposed to client)
- **Type Safety**: Strict TypeScript mode throughout
- **Input Validation**: All user inputs sanitized
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Rate Limiting**: API routes protected against abuse

---

## 🚧 Roadmap

- [ ] CI/CD pipeline integration (GitHub Actions, GitLab CI)
- [ ] Slack/Discord notifications for test failures
- [ ] Multi-user collaboration with role-based access
- [ ] Test scheduling and cron jobs
- [ ] API testing support (REST, GraphQL)
- [ ] Performance testing metrics (Lighthouse integration)
- [ ] Advanced Gemini fine-tuning for domain-specific testing

---

## 📄 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide
- **[THEME_SYSTEM.md](./THEME_SYSTEM.md)** - Theme customization
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database configuration
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature details

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow existing code patterns (see CLAUDE.md)
4. Submit a pull request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Google Gemini Team** - For the incredible AI API that powers intelligent testing
- **Playwright Team** - For robust browser automation
- **Supabase Team** - For seamless backend infrastructure
- **Next.js Team** - For the modern web framework

---

## 💡 Support

For issues or questions:
1. Check the [documentation](./CLAUDE.md)
2. Review existing GitHub issues
3. Create a new issue with detailed reproduction steps

---

**Built with ❤️ for the Google AI Hackathon**

Transform testing from a bottleneck into a competitive advantage with AI-powered automation.
