'use client';

import { useNavigation, useTheme } from '@/lib/stores/appStore';
import { Dashboard } from '@/app/features/dashboard/Dashboard';
import { Designer } from '@/app/features/designer/Designer';
import { RealRunner } from '@/app/features/runner/RealRunner';
import { Reports } from '@/app/features/reports/Reports';
import { FlowBuilder } from './features/flow-builder';

/**
 * Get theme-specific mask overlay color
 */
const getMaskColor = (themeId: string): string => {
  switch (themeId) {
    case 'cyber':
      return 'rgba(3, 7, 18, 0.92)'; // Very dark blue-black with cyan tint
    case 'crimson':
      return 'rgba(0, 0, 0, 0.94)'; // Almost pure black with slight red tint
    case 'slate':
      return 'rgba(0, 0, 0, 0.93)'; // Pure black with slate tint
    default:
      return 'rgba(3, 7, 18, 0.92)';
  }
};

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
      {/* Background image with theme-specific mask */}


      {/* Content layer */}
      <div className="relative z-10">
              <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/logo/logo_full.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.05,
        }}
      >
        {/* Theme-specific mask layer */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `linear-gradient(135deg, ${getMaskColor(currentTheme.id)} 0%, ${currentTheme.colors.background} 100%)`,
          }}
        />
      </div>
        {content}
      </div>
    </div>
  );
}
