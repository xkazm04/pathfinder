'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type PageView = 'dashboard' | 'designer' | 'runner' | 'reports';

interface NavigationContextType {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  reportId?: string;
  setReportId: (id?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [reportId, setReportId] = useState<string | undefined>();

  return (
    <NavigationContext.Provider value={{ currentPage, setCurrentPage, reportId, setReportId }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
