import { TestRun, TestResult } from '@/lib/types';

export interface ReportData {
  testRun: TestRun;
  testSuite: {
    id: string;
    name: string;
    target_url: string;
  };
  results: TestResultWithDetails[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: string;
    passRate: number;
  };
}

export interface TestResultWithDetails {
  id: string;
  run_id: string;
  test_name: string;
  viewport: 'mobile' | 'tablet' | 'desktop';
  viewport_size: string;
  status: 'pass' | 'fail' | 'skipped';
  duration_ms?: number;
  screenshots: Screenshot[];
  errors?: Array<{
    message: string;
    stack?: string;
    line?: number;
    column?: number;
  }>;
  console_logs?: Array<{
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>;
  created_at: string;
}

export interface Screenshot {
  id: string;
  type: 'before' | 'after' | 'diff';
  url: string;
  base64?: string;
}

export interface ErrorDetail {
  id: string;
  testName: string;
  viewport: string;
  timestamp: string;
  message: string;
  stack?: string;
  screenshot?: string;
}

export const mockReportData: ReportData = {
  testRun: {
    id: 'run-1',
    suite_id: 'suite-1',
    status: 'completed',
    started_at: new Date(Date.now() - 300000).toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  testSuite: {
    id: 'suite-1',
    name: 'Homepage Tests',
    target_url: 'https://example.com',
  },
  results: [
    {
      id: 'result-1',
      run_id: 'run-1',
      test_name: 'Page loads successfully',
      viewport: 'desktop',
      viewport_size: '1920x1080',
      status: 'pass',
      duration_ms: 1234,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-2',
      run_id: 'run-1',
      test_name: 'Page loads successfully',
      viewport: 'tablet',
      viewport_size: '768x1024',
      status: 'pass',
      duration_ms: 1156,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-3',
      run_id: 'run-1',
      test_name: 'Page loads successfully',
      viewport: 'mobile',
      viewport_size: '390x844',
      status: 'pass',
      duration_ms: 1089,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-4',
      run_id: 'run-1',
      test_name: 'Navigation menu is visible',
      viewport: 'desktop',
      viewport_size: '1920x1080',
      status: 'pass',
      duration_ms: 856,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-5',
      run_id: 'run-1',
      test_name: 'Navigation menu is visible',
      viewport: 'tablet',
      viewport_size: '768x1024',
      status: 'fail',
      duration_ms: 945,
      screenshots: [],
      errors: [
        {
          message: 'Expected element to be visible: .nav-menu',
          stack: 'Error: Expected element to be visible\n    at Object.<anonymous> (tests/homepage.spec.ts:45:12)',
          line: 45,
          column: 12,
        },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-6',
      run_id: 'run-1',
      test_name: 'Navigation menu is visible',
      viewport: 'mobile',
      viewport_size: '390x844',
      status: 'pass',
      duration_ms: 923,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-7',
      run_id: 'run-1',
      test_name: 'Hero section displays correctly',
      viewport: 'desktop',
      viewport_size: '1920x1080',
      status: 'pass',
      duration_ms: 1345,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-8',
      run_id: 'run-1',
      test_name: 'Hero section displays correctly',
      viewport: 'tablet',
      viewport_size: '768x1024',
      status: 'pass',
      duration_ms: 1267,
      screenshots: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'result-9',
      run_id: 'run-1',
      test_name: 'Hero section displays correctly',
      viewport: 'mobile',
      viewport_size: '390x844',
      status: 'fail',
      duration_ms: 1189,
      screenshots: [],
      errors: [
        {
          message: 'Screenshot comparison failed: Visual diff detected',
          stack: 'Error: Screenshot comparison failed\n    at Object.<anonymous> (tests/homepage.spec.ts:67:12)',
          line: 67,
          column: 12,
        },
      ],
      created_at: new Date().toISOString(),
    },
  ],
  summary: {
    totalTests: 9,
    passed: 7,
    failed: 2,
    skipped: 0,
    duration: '5m 2s',
    passRate: 77.8,
  },
};

export const mockErrorDetails: ErrorDetail[] = [
  {
    id: 'error-1',
    testName: 'Navigation menu is visible',
    viewport: 'Tablet (768x1024)',
    timestamp: '14:32:45',
    message: 'Expected element to be visible: .nav-menu',
    stack: `Error: Expected element to be visible: .nav-menu
    at Object.<anonymous> (tests/homepage.spec.ts:45:12)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:333:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (node_modules/jest-circus/build/utils.js:259:10)`,
  },
  {
    id: 'error-2',
    testName: 'Hero section displays correctly',
    viewport: 'Mobile (390x844)',
    timestamp: '14:33:12',
    message: 'Screenshot comparison failed: Visual diff detected',
    stack: `Error: Screenshot comparison failed: Visual diff detected
    at Object.<anonymous> (tests/homepage.spec.ts:67:12)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:333:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (node_modules/jest-circus/build/utils.js:259:10)`,
  },
];
