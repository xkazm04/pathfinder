'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
      <footer
        className="border-t px-6 py-4"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="container flex items-center justify-between text-sm">
          <p style={{ color: 'var(--theme-text-tertiary)' }}>
            Pathfinder &copy; 2024
          </p>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--theme-accent)', boxShadow: '0 0 8px var(--theme-accent)' }}
            />
            <span style={{ color: 'var(--theme-text-secondary)' }}>System Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
