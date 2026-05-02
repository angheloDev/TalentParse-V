import { create } from 'zustand';

import type { CandidateTab } from '@/utils/candidateFilters';
import { FILTER_ANY } from '@/utils/candidateFilters';
import type { LatestUploadJobContext, ParsedResume, RankedCandidate, SavedJobAnalysis, UploadedResume } from '@/types';

export type CandidateFiltersState = {
  role: string;
  experience: string;
  skill: string;
  location: string;
};

type AppState = {
  uploadedResumes: UploadedResume[];
  latestParsed: ParsedResume | null;
  lastFileName: string | null;
  uploadProgress: number;
  parseProgress: number;
  jobRole: string;
  savedJobs: SavedJobAnalysis[];
  latestUploadJobContext: LatestUploadJobContext | null;
  rankings: RankedCandidate[];
  embeddingsReady: boolean;
  candidateTab: CandidateTab;
  shortlistedIds: string[];
  filters: CandidateFiltersState;
  setUploadProgress: (n: number | ((p: number) => number)) => void;
  setParseProgress: (n: number | ((p: number) => number)) => void;
  setLatestParsed: (p: ParsedResume | null) => void;
  setLastFileName: (n: string | null) => void;
  addUploadedResume: (r: UploadedResume) => void;
  addSavedJob: (job: SavedJobAnalysis) => void;
  setLatestUploadJobContext: (ctx: LatestUploadJobContext | null) => void;
  setJobRole: (t: string) => void;
  setRankings: (r: RankedCandidate[]) => void;
  setEmbeddingsReady: (v: boolean) => void;
  setCandidateTab: (t: CandidateTab) => void;
  toggleShortlisted: (id: string) => void;
  setFilters: (p: Partial<CandidateFiltersState>) => void;
  resetSession: () => void;
};

const defaultFilters: CandidateFiltersState = {
  role: FILTER_ANY,
  experience: FILTER_ANY,
  skill: FILTER_ANY,
  location: FILTER_ANY,
};

export const useAppStore = create<AppState>((set) => ({
  uploadedResumes: [],
  latestParsed: null,
  lastFileName: null,
  uploadProgress: 0,
  parseProgress: 0,
  jobRole: '',
  savedJobs: [],
  latestUploadJobContext: null,
  rankings: [],
  embeddingsReady: false,
  candidateTab: 'top',
  shortlistedIds: [],
  filters: defaultFilters,
  setUploadProgress: (uploadProgress) =>
    set((s) => ({
      uploadProgress:
        typeof uploadProgress === 'function' ? uploadProgress(s.uploadProgress) : uploadProgress,
    })),
  setParseProgress: (parseProgress) =>
    set((s) => ({
      parseProgress: typeof parseProgress === 'function' ? parseProgress(s.parseProgress) : parseProgress,
    })),
  setLatestParsed: (latestParsed) => set({ latestParsed }),
  setLastFileName: (lastFileName) => set({ lastFileName }),
  addUploadedResume: (r) =>
    set((s) => ({ uploadedResumes: [r, ...s.uploadedResumes].slice(0, 50) })),
  addSavedJob: (job) =>
    set((s) => ({
      savedJobs: [job, ...s.savedJobs].slice(0, 100),
    })),
  setLatestUploadJobContext: (latestUploadJobContext) => set({ latestUploadJobContext }),
  setJobRole: (jobRole) => set({ jobRole }),
  setRankings: (rankings) =>
    set((s) => {
      const next = [...rankings].sort((a, b) => b.matchScore - a.matchScore);
      const ids = new Set(next.map((c) => c.id));
      return {
        rankings: next,
        shortlistedIds: s.shortlistedIds.filter((id) => ids.has(id)),
      };
    }),
  setEmbeddingsReady: (embeddingsReady) => set({ embeddingsReady }),
  setCandidateTab: (candidateTab) => set({ candidateTab }),
  toggleShortlisted: (id) =>
    set((s) =>
      s.shortlistedIds.includes(id)
        ? { shortlistedIds: s.shortlistedIds.filter((x) => x !== id) }
        : { shortlistedIds: [...s.shortlistedIds, id] }
    ),
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),
  resetSession: () =>
    set({
      latestParsed: null,
      lastFileName: null,
      uploadProgress: 0,
      parseProgress: 0,
      jobRole: '',
      savedJobs: [],
      latestUploadJobContext: null,
      rankings: [],
      embeddingsReady: false,
      shortlistedIds: [],
      filters: defaultFilters,
      candidateTab: 'top',
    }),
}));
