// Database Models

export interface TestSuite {
  id: string;
  name: string;
  target_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  id: string;
  suite_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  config?: ViewportConfig;
  created_at: string;
}

export interface TestResult {
  id: string;
  run_id: string;
  viewport: 'mobile' | 'tablet' | 'desktop';
  viewport_size?: string;
  test_name?: string;
  status: 'pass' | 'fail' | 'skipped';
  duration_ms?: number;
  screenshots?: string[];
  errors?: ErrorObject[];
  console_logs?: ConsoleLog[];
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  result_id: string;
  analysis_type: 'visual' | 'functional' | 'accessibility';
  findings?: Record<string, unknown>;
  severity: 'critical' | 'warning' | 'info';
  suggestions?: string;
  confidence_score?: number;
  created_at: string;
}

export interface TestCode {
  id: string;
  suite_id: string;
  code: string;
  language: string;
  version: number;
  created_at: string;
}

// Supporting Types

export interface ViewportConfig {
  mobile?: ViewportSize;
  tablet?: ViewportSize;
  desktop?: ViewportSize;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ErrorObject {
  message: string;
  stack?: string;
  line?: number;
  column?: number;
}

export interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

// UI Component Types

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type CardVariant = 'default' | 'bordered' | 'elevated';

// API Response Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Test Configuration Types

export interface TestConfiguration {
  viewports: ('mobile' | 'tablet' | 'desktop')[];
  targetUrl: string;
  timeout?: number;
  retries?: number;
  captureScreenshots?: boolean;
  captureConsoleLogs?: boolean;
}

export interface PlaywrightConfig {
  headless: boolean;
  slowMo?: number;
  timeout?: number;
}

// Test Scenario Types (for AI-generated tests)

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'functional' | 'visual' | 'responsive' | 'accessibility';
  steps: TestStep[];
  expectedOutcomes: string[];
  viewports: string[];
}

export interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'assert' | 'screenshot' | 'wait' | 'hover' | 'select';
  selector?: string;
  value?: string;
  description: string;
}

export interface CodebaseAnalysis {
  framework: string;
  pages: PageAnalysis[];
  forms: FormAnalysis[];
  navigation: NavigationAnalysis;
}

export interface PageAnalysis {
  path: string;
  components: string[];
  interactions: string[];
}

export interface FormAnalysis {
  id: string;
  fields: FormField[];
  submitAction: string;
}

export interface FormField {
  name: string;
  type: string;
  required: boolean;
}

export interface NavigationAnalysis {
  links: NavLink[];
  dynamicRoutes: string[];
}

export interface NavLink {
  text: string;
  href: string;
}

export interface ScreenshotMetadata {
  viewportName: string;
  width: number;
  height: number;
  url: string;
  base64?: string;
}
