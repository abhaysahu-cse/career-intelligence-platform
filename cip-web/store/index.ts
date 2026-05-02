import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ReadinessScore, InterviewStatus, LiveMetrics } from '@/types';

interface JobFilters {
  role: string;
  location: string;
  minScore: number;
  onlyRecommended: boolean;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Score
  score: ReadinessScore | null;
  setScore: (score: ReadinessScore) => void;

  // Interview
  interviewSessionId: string | null;
  interviewStatus: InterviewStatus;
  liveMetrics: LiveMetrics;
  setInterviewSession: (id: string | null) => void;
  setInterviewStatus: (status: InterviewStatus) => void;
  setLiveMetrics: (metrics: LiveMetrics) => void;

  // Job Filters
  jobFilters: JobFilters;
  setJobFilters: (filters: Partial<JobFilters>) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // Score
      score: null,
      setScore: (score) => set({ score }),

      // Interview
      interviewSessionId: null,
      interviewStatus: 'idle',
      liveMetrics: { confidence: 0, accuracy: 0 },
      setInterviewSession: (id) => set({ interviewSessionId: id }),
      setInterviewStatus: (status) => set({ interviewStatus: status }),
      setLiveMetrics: (metrics) => set({ liveMetrics: metrics }),

      // Job Filters
      jobFilters: { role: '', location: '', minScore: 0, onlyRecommended: false },
      setJobFilters: (filters) =>
        set((state) => ({ jobFilters: { ...state.jobFilters, ...filters } })),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'cip-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
