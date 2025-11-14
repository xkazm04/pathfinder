'use client';

import { Home, Wand2, Play, FileText, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigation, PageView } from '@/contexts/NavigationContext';

const navigationItems = [
  { name: 'Dashboard', page: 'dashboard' as PageView, icon: Home },
  { name: 'Test Designer', page: 'designer' as PageView, icon: Wand2 },
  { name: 'Test Runner', page: 'runner' as PageView, icon: Play },
  { name: 'Reports', page: 'reports' as PageView, icon: FileText },
];

export function Sidebar() {
  const { currentPage, setCurrentPage } = useNavigation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] border-r transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        backgroundColor: 'var(--theme-surface)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <nav className="flex h-full flex-col justify-between p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;

            return (
              <button
                key={item.name}
                onClick={() => setCurrentPage(item.page)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-auto flex items-center justify-center rounded-lg p-2 transition-colors sidebar-link"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </nav>
    </aside>
  );
}
