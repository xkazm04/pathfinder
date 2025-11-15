import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// Test step interface
export interface TestStep {
  id: string;
  order: number;
  type: 'navigate' | 'click' | 'fill' | 'select' | 'assert' | 'wait' | 'custom';
  action: string;
  target?: string;
  value?: string;
  selector?: string;
  description?: string;
  isAmbiguous?: boolean;
  clarification?: string;
}

// Test flow interface
export interface TestFlow {
  id?: string;
  name: string;
  targetUrl: string;
  description: string;
  viewport: string;
  steps: TestStep[];
}

// Mode type
export type TestBuilderMode = 'visual' | 'natural-language';

// Store state interface
interface TestBuilderState {
  // Mode
  mode: TestBuilderMode;

  // Shared test flow data
  flow: TestFlow;

  // Natural language text (raw)
  naturalLanguageText: string;

  // Sync state
  isSyncing: boolean;
  lastSyncSource: 'visual' | 'nl' | null;
  syncError: string | null;

  // Selected step for highlighting
  selectedStepId: string | null;

  // Actions
  setMode: (mode: TestBuilderMode) => void;
  setFlow: (flow: TestFlow) => void;
  updateFlow: (updates: Partial<TestFlow>) => void;
  addStep: (step: Omit<TestStep, 'id' | 'order'>) => void;
  updateStep: (id: string, updates: Partial<TestStep>) => void;
  removeStep: (id: string) => void;
  reorderSteps: (startIndex: number, endIndex: number) => void;
  setNaturalLanguageText: (text: string) => void;
  setSelectedStepId: (id: string | null) => void;
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncSource: (source: 'visual' | 'nl' | null) => void;
  resetFlow: () => void;
}

// Initial state
const initialFlow: TestFlow = {
  name: '',
  targetUrl: '',
  description: '',
  viewport: 'Desktop HD (1920x1080)',
  steps: [],
};

// Create the store
export const useTestBuilderStore = create<TestBuilderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      mode: 'visual',
      flow: initialFlow,
      naturalLanguageText: '',
      isSyncing: false,
      lastSyncSource: null,
      syncError: null,
      selectedStepId: null,

      // Actions
      setMode: (mode) => set({ mode }),

      setFlow: (flow) => set({ flow }),

      updateFlow: (updates) => set((state) => ({
        flow: { ...state.flow, ...updates },
      })),

      addStep: (stepData) => {
        const state = get();
        const newStep: TestStep = {
          ...stepData,
          id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order: state.flow.steps.length + 1,
        };

        set((state) => ({
          flow: {
            ...state.flow,
            steps: [...state.flow.steps, newStep],
          },
          lastSyncSource: 'visual',
        }));
      },

      updateStep: (id, updates) => set((state) => ({
        flow: {
          ...state.flow,
          steps: state.flow.steps.map((step) =>
            step.id === id ? { ...step, ...updates } : step
          ),
        },
        lastSyncSource: 'visual',
      })),

      removeStep: (id) => set((state) => ({
        flow: {
          ...state.flow,
          steps: state.flow.steps
            .filter((step) => step.id !== id)
            .map((step, index) => ({ ...step, order: index + 1 })),
        },
        lastSyncSource: 'visual',
      })),

      reorderSteps: (startIndex, endIndex) => set((state) => {
        const steps = [...state.flow.steps];
        const [removed] = steps.splice(startIndex, 1);
        steps.splice(endIndex, 0, removed);

        return {
          flow: {
            ...state.flow,
            steps: steps.map((step, index) => ({ ...step, order: index + 1 })),
          },
          lastSyncSource: 'visual',
        };
      }),

      setNaturalLanguageText: (text) => set({
        naturalLanguageText: text,
        lastSyncSource: 'nl',
      }),

      setSelectedStepId: (id) => set({ selectedStepId: id }),

      setSyncing: (isSyncing) => set({ isSyncing }),

      setSyncError: (error) => set({ syncError: error }),

      setLastSyncSource: (source) => set({ lastSyncSource: source }),

      resetFlow: () => set({
        flow: initialFlow,
        naturalLanguageText: '',
        selectedStepId: null,
        lastSyncSource: null,
        syncError: null,
      }),
    }),
    { name: 'TestBuilderStore' }
  )
);

// Selectors for optimized component re-renders
export const useTestBuilderMode = () => useTestBuilderStore(
  useShallow((state) => ({
    mode: state.mode,
    setMode: state.setMode,
  }))
);

export const useTestFlow = () => useTestBuilderStore(
  useShallow((state) => ({
    flow: state.flow,
    setFlow: state.setFlow,
    updateFlow: state.updateFlow,
    resetFlow: state.resetFlow,
  }))
);

export const useTestSteps = () => useTestBuilderStore(
  useShallow((state) => ({
    steps: state.flow.steps,
    addStep: state.addStep,
    updateStep: state.updateStep,
    removeStep: state.removeStep,
    reorderSteps: state.reorderSteps,
  }))
);

export const useTestBuilderSync = () => useTestBuilderStore(
  useShallow((state) => ({
    isSyncing: state.isSyncing,
    syncError: state.syncError,
    lastSyncSource: state.lastSyncSource,
    naturalLanguageText: state.naturalLanguageText,
    setSyncing: state.setSyncing,
    setSyncError: state.setSyncError,
    setLastSyncSource: state.setLastSyncSource,
    setNaturalLanguageText: state.setNaturalLanguageText,
  }))
);

export const useStepSelection = () => useTestBuilderStore(
  useShallow((state) => ({
    selectedStepId: state.selectedStepId,
    setSelectedStepId: state.setSelectedStepId,
  }))
);
