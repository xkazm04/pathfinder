'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
      <footer className="border-t border-neutral-200 bg-white px-6 py-4">
        <div className="container flex items-center justify-between text-sm text-neutral-600">
          <p>AI Test Agent &copy; 2024</p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-success-500"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
