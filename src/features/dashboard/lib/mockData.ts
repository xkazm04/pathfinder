import { Activity, CheckCircle2, Target, Clock, LucideIcon } from 'lucide-react';

export interface StatData {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendValue: number; // Numeric value for progress bar
  isPositive: boolean;
}

export interface RecentTest {
  name: string;
  status: 'pass' | 'fail' | 'running';
  duration: string;
  viewport: string;
  timestamp: string; // Time ago
}

export const stats: StatData[] = [
  {
    label: 'Total Tests',
    value: '247',
    icon: Activity,
    trend: '+12%',
    trendValue: 12,
    isPositive: true
  },
  {
    label: 'Pass Rate',
    value: '94.3%',
    icon: CheckCircle2,
    trend: '+2.1%',
    trendValue: 94.3,
    isPositive: true
  },
  {
    label: 'Active Suites',
    value: '18',
    icon: Target,
    trend: '+3',
    trendValue: 16.7,
    isPositive: true
  },
  {
    label: 'Avg Duration',
    value: '2.4s',
    icon: Clock,
    trend: '-0.3s',
    trendValue: 12.5,
    isPositive: true
  },
];

export const recentTests: RecentTest[] = [
  {
    name: 'Authentication Flow',
    status: 'pass',
    duration: '1.8s',
    viewport: 'Desktop',
    timestamp: '2 min ago'
  },
  {
    name: 'Checkout Process',
    status: 'pass',
    duration: '3.2s',
    viewport: 'Mobile',
    timestamp: '5 min ago'
  },
  {
    name: 'Product Search',
    status: 'fail',
    duration: '2.1s',
    viewport: 'Tablet',
    timestamp: '12 min ago'
  },
  {
    name: 'User Dashboard',
    status: 'running',
    duration: '1.5s',
    viewport: 'Desktop',
    timestamp: 'Just now'
  },
];
