import type { RankedCandidate } from '@/types';

export const FILTER_ANY = '__any__';
export const FILTER_SENIOR_PLUS = 'SENIOR_PLUS';

export type CandidateTab = 'all' | 'top' | 'shortlist';

const TOP_MIN_SCORE = 80;

export function filterRankedCandidates(
  rankings: RankedCandidate[],
  tab: CandidateTab,
  shortlistedIds: Set<string>,
  filters: { role: string; experience: string; skill: string; location: string }
) {
  let out = rankings;
  if (tab === 'top') out = out.filter((c) => c.matchScore >= TOP_MIN_SCORE);
  if (tab === 'shortlist') out = out.filter((c) => shortlistedIds.has(c.id));
  if (filters.role !== FILTER_ANY) out = out.filter((c) => (c.title ?? '') === filters.role);
  if (filters.experience !== FILTER_ANY) {
    if (filters.experience === FILTER_SENIOR_PLUS) out = out.filter((c) => c.experienceLevel === 'Senior');
    else out = out.filter((c) => c.experienceLevel === filters.experience);
  }
  if (filters.skill !== FILTER_ANY) out = out.filter((c) => c.skills.includes(filters.skill));
  if (filters.location !== FILTER_ANY) {
    out = out.filter((c) => {
      const loc = (c.location ?? 'Remote').trim();
      if (filters.location === 'REMOTE_MATCH') return /remote/i.test(loc);
      return loc === filters.location;
    });
  }
  return out;
}

export function buildCandidateFilterOptions(rankings: RankedCandidate[]) {
  const titles = [...new Set(rankings.map((r) => r.title).filter(Boolean))] as string[];
  titles.sort();
  const levels = [...new Set(rankings.map((r) => r.experienceLevel))].sort();
  const skills = [...new Set(rankings.flatMap((r) => r.skills))].sort((a, b) => a.localeCompare(b));
  const locs = [...new Set(rankings.map((r) => (r.location ?? 'Remote').trim()))].sort();
  return { titles, levels, skills, locs };
}
