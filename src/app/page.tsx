'use client';

import { lazy, Suspense } from 'react';
import { useNavigation, useTheme } from '@/lib/stores/appStore';
import { Dashboard } from '@/app/features/dashboard/Dashboard';
import { Designer } from '@/app/features/designer/Designer';
import { RealRunner } from '@/app/features/runner/RealRunner';
import { Reports } from '@/app/features/reports/Reports';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load heavy feature pages for better performance
const NLTest = lazy(() =>
  import('@/app/features/nl-test/NLTest').then(mod => ({ default: mod.NLTest }))
);
const FlowBuilder = lazy(() =>
  import('@/app/features/flow-builder/FlowBuilder').then(mod => ({ default: mod.FlowBuilder }))
);

// Loading fallback for lazy-loaded components
function LazyLoadFallback() {
  const { currentTheme } = useTheme();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm" style={{ color: currentTheme.colors.text.secondary }}>
          Loading...
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { currentPage, reportId } = useNavigation();
  const { currentTheme } = useTheme();

  // Create theme-specific mask overlay colors
  const getMaskColor = () => {
    switch (currentTheme.id) {
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
    case 'nl-test':
      content = (
        <Suspense fallback={<LazyLoadFallback />}>
          <NLTest />
        </Suspense>
      );
      break;
    case 'flow-builder':
      content = (
        <Suspense fallback={<LazyLoadFallback />}>
          <FlowBuilder />
        </Suspense>
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
            background: `linear-gradient(135deg, ${getMaskColor()} 0%, ${currentTheme.colors.background} 100%)`,
          }}
        />
      </div>
        {content}
      </div>
    </div>
  );
}
