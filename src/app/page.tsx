'use client';

import { useNavigation, useTheme } from '@/lib/stores/appStore';
import { Dashboard } from '@/app/features/dashboard/Dashboard';
import { Designer } from '@/app/features/designer/Designer';
import { RealRunner } from '@/app/features/runner/RealRunner';
import { Reports } from '@/app/features/reports/Reports';
import { FlowBuilder } from './features/flow-builder';
import { AnimatedLogoBackground } from '@/components/logo/AnimatedLogoBackground';

export default function Home() {
  const { currentPage, reportId } = useNavigation();
  const { currentTheme } = useTheme();

  // Conditional rendering based on current page
  let content;
  switch (currentPage) {
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'designer':
      content = <Designer />;
      break;
    case 'runner':
      content = <RealRunner />;
      break;
    case 'reports':
      content = <Reports testRunId={reportId} />;
      break;
    case 'builder':
      content = (
          <FlowBuilder />
      );
      break;
    default:
      content = <Dashboard />;
  }

  return (
    <div className="relative">
      {/* Animated background logo with neon glow effect on page transitions */}
      <AnimatedLogoBackground theme={currentTheme} triggerKey={currentPage} />

      {/* Content layer */}
      <div className="relative z-10">
        {content}
      </div>
    </div>
  );
}
