'use client';

import Link from 'next/link';
import { Bot, Play, Plus } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary-600" />
          <h1 className="text-xl font-bold text-neutral-900">AI Test Agent</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200">
            <Plus className="h-4 w-4" />
            New Test
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
            <Play className="h-4 w-4" />
            Run All
          </button>
        </div>
      </div>
    </header>
  );
}
