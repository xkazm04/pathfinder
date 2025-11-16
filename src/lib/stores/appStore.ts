import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { ThemeVariant, Theme, themes } from '@/lib/theme';

// Health glow status type
export type HealthGlowStatus = 'excellent' | 'good' | 'poor' | 'none';

// Page view type
export type PageView = 'dashboard' | 'designer' | 'runner' | 'reports' | 'builder' | 'test-builder';

// Project type
export interface Project {
  id: string;
  name: string;
  repo?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Test progress types
export interface TestStep {
  order: number;
  action: string;
  target?: string;
  isAmbiguous?: boolean;
  clarification?: string;
}

export interface TestAnalysis {
  testType: string;
  confidence: number;
  isValid: boolean;
  steps: TestStep[];
  warnings: string[];
  suggestions: string[];
}

// Store state interface
interface AppState {
  // Theme state
  themeId: ThemeVariant;
  currentTheme: Theme;
  healthGlow: HealthGlowStatus;

  // Navigation state
  currentPage: PageView;
  reportId?: string;

  // Project state
  currentProjectId: string | null;
  projects: Project[];

  // NL Test state
  testDescription: string;
  testTargetUrl: string;
  testViewport: string;
  testAnalysis: TestAnalysis | null;
  generatedCode: string | null;
  testName: string | null;
  analyzing: boolean;
  generating: boolean;
  analysisError: string | null;
  generationError: string | null;

  // Actions
  setTheme: (theme: ThemeVariant) => void;
  setHealthGlow: (status: HealthGlowStatus) => void;
  getHealthGlowColor: () => string;

  setCurrentPage: (page: PageView) => void;
  setReportId: (id?: string) => void;

  setCurrentProjectId: (id: string | null) => void;
  setProjects: (projects: Project[]) => void;

  setTestDescription: (description: string) => void;
  setTestTargetUrl: (url: string) => void;
  setTestViewport: (viewport: string) => void;
  setTestAnalysis: (analysis: TestAnalysis | null) => void;
  setGeneratedCode: (code: string | null) => void;
  setTestName: (name: string | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  setGenerationError: (error: string | null) => void;
  resetTestState: () => void;
}

// Helper function to get health glow color
const getHealthGlowColorHelper = (status: HealthGlowStatus | 'excellent' | 'good' | 'poor' | null): string => {
  switch (status) {
    case 'excellent':
      return 'rgba(34, 197, 94, 0.15)'; // green
    case 'good':
      return 'rgba(234, 179, 8, 0.15)'; // yellow
    case 'poor':
      return 'rgba(239, 68, 68, 0.15)'; // red
    default:
      return 'transparent';
  }
};

// Create the store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial theme state
        themeId: 'cyber',
        currentTheme: themes.cyber,
        healthGlow: 'none',

        // Initial navigation state
        currentPage: 'dashboard',
        reportId: undefined,

        // Initial project state
        currentProjectId: null,
        projects: [],

        // Initial NL test state
        testDescription: '',
        testTargetUrl: '',
        testViewport: 'Desktop HD (1920x1080)',
        testAnalysis: null,
        generatedCode: null,
        testName: null,
        analyzing: false,
        generating: false,
        analysisError: null,
        generationError: null,

        // Theme actions
        setTheme: (theme: ThemeVariant) => {
          set({ themeId: theme, currentTheme: themes[theme] });
        },

        setHealthGlow: (status: HealthGlowStatus) => {
          set({ healthGlow: status });
        },

        getHealthGlowColor: () => {
          return getHealthGlowColorHelper(get().healthGlow);
        },

        // Navigation actions
        setCurrentPage: (page: PageView) => set({ currentPage: page }),
        setReportId: (id?: string) => set({ reportId: id }),

        // Project actions
        setCurrentProjectId: (id: string | null) => set({ currentProjectId: id }),
        setProjects: (projects: Project[]) => set({ projects }),

        // NL Test actions
        setTestDescription: (description: string) => set({ testDescription: description }),
        setTestTargetUrl: (url: string) => set({ testTargetUrl: url }),
        setTestViewport: (viewport: string) => set({ testViewport: viewport }),
        setTestAnalysis: (analysis: TestAnalysis | null) => set({ testAnalysis: analysis }),
        setGeneratedCode: (code: string | null) => set({ generatedCode: code }),
        setTestName: (name: string | null) => set({ testName: name }),
        setAnalyzing: (analyzing: boolean) => set({ analyzing }),
        setGenerating: (generating: boolean) => set({ generating }),
        setAnalysisError: (error: string | null) => set({ analysisError: error }),
        setGenerationError: (error: string | null) => set({ generationError: error }),

        resetTestState: () => set({
          testDescription: '',
          testTargetUrl: '',
          testViewport: 'Desktop HD (1920x1080)',
          testAnalysis: null,
          generatedCode: null,
          testName: null,
          analyzing: false,
          generating: false,
          analysisError: null,
          generationError: null,
        }),
      }),
      {
        name: 'pathfinder-app-storage',
        partialize: (state) => ({
          // Only persist theme, navigation, and project state
          themeId: state.themeId,
          currentPage: state.currentPage,
          healthGlow: state.healthGlow,
          currentProjectId: state.currentProjectId,
        }),
      }
    ),
    { name: 'PathfinderAppStore' }
  )
);

// Selectors for optimized component re-renders with shallow equality
export const useTheme = () => useAppStore(
  useShallow((state) => ({
    themeId: state.themeId,
    currentTheme: state.currentTheme,
    setTheme: state.setTheme,
    healthGlow: state.healthGlow,
    setHealthGlow: state.setHealthGlow,
    getHealthGlowColor: state.getHealthGlowColor,
  }))
);

export const useNavigation = () => useAppStore(
  useShallow((state) => ({
    currentPage: state.currentPage,
    setCurrentPage: state.setCurrentPage,
    navigateTo: state.setCurrentPage, // Alias for backwards compatibility
    reportId: state.reportId,
    setReportId: state.setReportId,
  }))
);

export const useTestState = () => useAppStore(
  useShallow((state) => ({
    description: state.testDescription,
    targetUrl: state.testTargetUrl,
    viewport: state.testViewport,
    analysis: state.testAnalysis,
    generatedCode: state.generatedCode,
    testName: state.testName,
    analyzing: state.analyzing,
    generating: state.generating,
    analysisError: state.analysisError,
    generationError: state.generationError,
    setDescription: state.setTestDescription,
    setTargetUrl: state.setTestTargetUrl,
    setViewport: state.setTestViewport,
    setAnalysis: state.setTestAnalysis,
    setGeneratedCode: state.setGeneratedCode,
    setTestName: state.setTestName,
    setAnalyzing: state.setAnalyzing,
    setGenerating: state.setGenerating,
    setAnalysisError: state.setAnalysisError,
    setGenerationError: state.setGenerationError,
    resetTestState: state.resetTestState,
  }))
);

export const useProjects = () => useAppStore(
  useShallow((state) => ({
    currentProjectId: state.currentProjectId,
    projects: state.projects,
    setCurrentProjectId: state.setCurrentProjectId,
    setProjects: state.setProjects,
  }))
);
