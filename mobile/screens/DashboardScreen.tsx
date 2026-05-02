import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/Card';
import { getSavedJobs } from '@/services/resumeApi';
import { useAppAuth } from '@/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import {
  averageMatchScore,
  formatRelativeTime,
  skillFrequencyInsights,
  totalSavedRankedProfiles,
} from '@/utils/insights';

export function DashboardScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const uploadedResumes = useAppStore((s) => s.uploadedResumes);
  const rankings = useAppStore((s) => s.rankings);
  const latestCtx = useAppStore((s) => s.latestUploadJobContext);

  const [savedJobs, setSavedJobs] = useState<Awaited<ReturnType<typeof getSavedJobs>>>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setJobsLoading(true);
        try {
          const rows = await getSavedJobs();
          if (!cancelled) setSavedJobs(rows);
        } catch {
          if (!cancelled) setSavedJobs([]);
        } finally {
          if (!cancelled) setJobsLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const sessionUploadCount = uploadedResumes.length;
  const rankedPoolCount = rankings.length;
  const avgMatch = useMemo(() => averageMatchScore(rankings), [rankings]);
  const savedJobCount = savedJobs.length;
  const totalRankedSaved = useMemo(() => totalSavedRankedProfiles(savedJobs), [savedJobs]);
  const skillTrends = useMemo(() => skillFrequencyInsights(rankings, 8), [rankings]);

  const activityRows = useMemo(() => {
    type Row = {
      id: string;
      icon: keyof typeof MaterialIcons.glyphMap;
      title: string;
      subtitle: string;
      time: string;
      sortKey: number;
    };
    const rows: Row[] = [];

    for (const u of uploadedResumes) {
      const ts = Date.parse(u.uploadedAt);
      rows.push({
        id: `up-${u.id}`,
        icon: 'upload-file',
        title: u.fileName || 'Resume',
        subtitle: 'Uploaded for parsing',
        time: formatRelativeTime(u.uploadedAt) || 'Recently',
        sortKey: Number.isFinite(ts) ? ts : 0,
      });
    }
    for (const j of savedJobs) {
      const ts = Date.parse(j.createdAt);
      rows.push({
        id: `job-${j.id}`,
        icon: 'work-outline',
        title: j.jobRole,
        subtitle: `${j.industry} · ${j.rankedCandidateCount} ranked`,
        time: formatRelativeTime(j.createdAt) || 'Saved',
        sortKey: Number.isFinite(ts) ? ts : 0,
      });
    }

    rows.sort((a, b) => b.sortKey - a.sortKey);
    const top = rows.slice(0, 6);

    if (!top.length && rankings.length) {
      return rankings.slice(0, 5).map((r, i) => ({
        id: `rk-${r.id}-${i}`,
        icon: 'military-tech' as const,
        title: r.name,
        subtitle: `${Math.round(r.matchScore)}% match · ${r.experienceLevel}`,
        time: 'Current pool',
        sortKey: 0,
      }));
    }

    return top;
  }, [uploadedResumes, savedJobs, rankings]);

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader
        title="TalentParse"
        right={
          <Pressable
            onPress={() => router.push('/profile')}
            className="size-10 items-center justify-center rounded-full bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
          >
            <MaterialIcons name="person" size={22} color="#64748b" />
          </Pressable>
        }
      />
      <ScrollView className="mx-auto w-full max-w-md flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="px-4 pb-2 pt-6 text-[32px] font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100">
          Dashboard
        </Text>
        <Text className="px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Live stats from your account and this session.
        </Text>

        {latestCtx ? (
          <View className="px-4 pb-3">
            <Card className="gap-1 border-primary/20 bg-primary/5 p-3 dark:bg-primary-dark/10">
              <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Last ranking context
              </Text>
              <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {latestCtx.industry} · {latestCtx.jobRole}
              </Text>
            </Card>
          </View>
        ) : null}

        <View className="flex-row gap-3 px-4 pb-3">
          <Card className="min-w-0 flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Session uploads</Text>
              <MaterialIcons name="description" size={16} color="#259df4" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{sessionUploadCount}</Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">Files uploaded this app session</Text>
          </Card>
          <Card className="min-w-0 flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Pool (last run)</Text>
              <MaterialIcons name="groups" size={16} color="#259df4" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{rankedPoolCount}</Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">Candidates in current ranking list</Text>
          </Card>
        </View>

        <View className="flex-row gap-3 px-4 pb-3">
          <Card className="min-w-0 flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Saved jobs</Text>
              <MaterialIcons name="bookmark-added" size={16} color="#259df4" />
            </View>
            {jobsLoading ? (
              <ActivityIndicator size="small" color="#259df4" />
            ) : (
              <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{savedJobCount}</Text>
            )}
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">
              {totalRankedSaved} total ranked rows stored on jobs
            </Text>
          </Card>
          <Card className="min-w-0 flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Avg. match</Text>
              <MaterialIcons name="bar-chart" size={16} color="#259df4" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {rankedPoolCount ? `${avgMatch}%` : '—'}
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">Mean of current pool scores</Text>
          </Card>
        </View>

        <View className="px-4 pb-6">
          <Card className="gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Match score spread</Text>
              <MaterialIcons name="military-tech" size={16} color="#259df4" />
            </View>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {rankedPoolCount ? `${avgMatch}%` : '—'}
              </Text>
            </View>
            <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <View
                className="h-1.5 rounded-full bg-primary dark:bg-primary-dark"
                style={{ width: rankedPoolCount ? `${Math.min(100, avgMatch)}%` : '0%' }}
              />
            </View>
            <Text className="text-xs text-neutral-500 dark:text-neutral-500">
              {rankedPoolCount
                ? `Based on ${rankedPoolCount} candidate${rankedPoolCount === 1 ? '' : 's'} in your latest ranking run.`
                : 'Run job analysis or upload against a saved job to populate scores.'}
            </Text>
          </Card>
        </View>

        <Text className="px-4 pb-3 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Recent activity
        </Text>
        <View className="flex-col gap-3 px-4">
          {activityRows.length ? (
            activityRows.map((row) => (
              <ActivityRow key={row.id} icon={row.icon} title={row.title} subtitle={row.subtitle} time={row.time} />
            ))
          ) : (
            <Card className="p-4">
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                No activity yet. Upload a résumé or save a job analysis to see timeline items here.
              </Text>
            </Card>
          )}
        </View>

        <Text className="px-4 pb-3 pt-6 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Skill mix (current pool)
        </Text>
        <View className="flex-row flex-wrap gap-2 px-4 pb-6">
          {skillTrends.length ? (
            skillTrends.map(({ skill, pct }) => (
              <View
                key={skill}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {skill}{' '}
                  <Text className="text-xs text-primary dark:text-primary-dark">{pct}% of pool</Text>
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Rank candidates to see which skills appear most often in your current pool.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ActivityRow(props: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="size-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-dark/15">
        <MaterialIcons name={props.icon} size={20} color="#259df4" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{props.title}</Text>
        <Text className="truncate text-xs text-neutral-600 dark:text-neutral-400">{props.subtitle}</Text>
      </View>
      <Text className="shrink-0 text-xs text-neutral-500">{props.time}</Text>
    </View>
  );
}
