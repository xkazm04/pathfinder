import { TestSuite, TestRun } from '@/lib/types';

export interface TestSuiteWithCode extends TestSuite {
  testCount: number;
  lastRun?: {
    status: 'passed' | 'failed' | 'running';
    timestamp: string;
    duration: string;
  };
}

export const mockTestSuites: TestSuiteWithCode[] = [
  {
    id: '1',
    name: 'Homepage Tests',
    target_url: 'https://example.com',
    description: 'Comprehensive tests for homepage functionality and responsiveness',
    testCount: 8,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastRun: {
      status: 'passed',
      timestamp: '2 hours ago',
      duration: '2m 34s',
    },
  },
  {
    id: '2',
    name: 'Authentication Flow',
    target_url: 'https://example.com/login',
    description: 'Login, logout, and session management tests',
    testCount: 12,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    lastRun: {
      status: 'failed',
      timestamp: '1 day ago',
      duration: '3m 12s',
    },
  },
  {
    id: '3',
    name: 'E-commerce Checkout',
    target_url: 'https://example.com/checkout',
    description: 'End-to-end checkout process validation',
    testCount: 15,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastRun: {
      status: 'passed',
      timestamp: '3 days ago',
      duration: '4m 45s',
    },
  },
  {
    id: '4',
    name: 'Mobile Navigation',
    target_url: 'https://example.com',
    description: 'Mobile-specific navigation and interaction tests',
    testCount: 6,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export interface TestExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  viewport: string;
}

export const generateMockSteps = (testCount: number): TestExecutionStep[] => {
  const viewports = ['Desktop HD', 'iPad', 'iPhone 12'];
  const testNames = [
    'Page loads successfully',
    'Navigation menu is visible',
    'Hero section displays correctly',
    'Call-to-action buttons work',
    'Footer links are accessible',
    'Images load properly',
    'Forms validate input',
    'Search functionality works',
    'Responsive layout adapts',
    'Modal dialogs function',
    'Tooltips display on hover',
    'Animations complete smoothly',
    'Dark mode toggles correctly',
    'Accessibility landmarks present',
    'Performance metrics acceptable',
  ];

  const steps: TestExecutionStep[] = [];
  let stepId = 0;

  for (let i = 0; i < testCount && i < testNames.length; i++) {
    for (const viewport of viewports) {
      steps.push({
        id: `step-${stepId++}`,
        name: `${testNames[i]} [${viewport}]`,
        status: 'pending',
        viewport,
      });
    }
  }

  return steps;
};
