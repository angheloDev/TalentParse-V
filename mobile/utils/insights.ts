import type { RankedCandidate } from '@/types';

/** Relative time like "12m ago", "3h ago". */
export function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Skill frequency in current ranking pool → share of candidates mentioning each skill (for chips). */
export function skillFrequencyInsights(rankings: RankedCandidate[], limit = 8) {
  if (!rankings.length) return [] as { skill: string; pct: number; count: number }[];
  const counts = new Map<string, number>();
  for (const r of rankings) {
    for (const raw of r.skills) {
      const k = raw.trim();
      if (k.length < 2) continue;
      const key = k.length > 40 ? k.slice(0, 37) + '…' : k;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const n = rankings.length;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill, count]) => ({
      skill,
      count,
      pct: Math.round((count / n) * 100),
    }));
}

export function averageMatchScore(rankings: RankedCandidate[]): number {
  if (!rankings.length) return 0;
  return Math.round(rankings.reduce((a, c) => a + c.matchScore, 0) / rankings.length);
}

export function totalSavedRankedProfiles(jobs: { rankedCandidateCount: number }[]): number {
  return jobs.reduce((s, j) => s + (j.rankedCandidateCount ?? 0), 0);
}
