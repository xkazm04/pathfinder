'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Designer } from '@/features/designer/Designer';
import { Runner } from '@/features/runner/Runner';
import { Reports } from '@/features/reports/Reports';

// Placeholder for Settings page
function Settings() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
        Settings
      </h1>
      <p className="text-lg" style={{ color: 'var(--theme-text-tertiary)' }}>
        Application settings and configuration
      </p>
    </div>
  );
}

export default function Home() {
  const { currentPage, reportId } = useNavigation();

  // Conditional rendering based on current page
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'designer':
      return <Designer />;
    case 'runner':
      return <Runner />;
    case 'reports':
      return <Reports testRunId={reportId} />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}
