'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wand2, Play, FileText, Settings, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Test Designer', href: '/designer', icon: Wand2 },
  { name: 'Test Runner', href: '/runner', icon: Play },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] border-r border-neutral-200 bg-white transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="flex h-full flex-col justify-between p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-auto flex items-center justify-center rounded-lg p-2 text-neutral-700 transition-colors hover:bg-neutral-100"
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
