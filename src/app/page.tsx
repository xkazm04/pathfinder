'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { Dashboard } from '@/app/features/dashboard/Dashboard';
import { Designer } from '@/app/features/designer/Designer';
import { RealRunner } from '@/app/features/runner/RealRunner';
import { Reports } from '@/app/features/reports/Reports';


export default function Home() {
  const { currentPage, reportId } = useNavigation();

  // Conditional rendering based on current page
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'designer':
      return <Designer />;
    case 'runner':
      return <RealRunner />;
    case 'reports':
      return <Reports testRunId={reportId} />;
    default:
      return <Dashboard />;
  }
}
