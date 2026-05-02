import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CandidateDetailNav } from '@/components/SubNavBar';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';

export function CandidateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const rankings = useAppStore((s) => s.rankings);
  const shortlistedIds = useAppStore((s) => s.shortlistedIds);
  const toggleShortlisted = useAppStore((s) => s.toggleShortlisted);
  const c = rankings.find((x) => x.id === id);

  if (!c) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <Text className="text-slate-500">Candidate not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const listed = shortlistedIds.includes(c.id);
  const score = Math.round(c.matchScore);
  const analysis = c.breakdown
    ? [
        {
          name: 'Technical alignment',
          level: c.experienceLevel,
          percent: Math.min(100, Math.round(c.breakdown.technicalSkills)),
        },
        {
          name: 'Experience fit',
          level: c.experienceLevel,
          percent: Math.min(100, Math.round(c.breakdown.experienceLevel)),
        },
        {
          name: 'Domain / keywords',
          level: c.experienceLevel,
          percent: Math.min(100, Math.round(c.breakdown.domainKnowledge)),
        },
      ]
    : c.skillAnalysis?.length
      ? c.skillAnalysis
      : [{ name: c.skills[0] ?? 'Skills', level: c.experienceLevel, percent: Math.min(100, score) }];
  const keywords = c.keywords ?? c.skills.slice(0, 8);
  const xp = c.experienceSummary ?? [];
  const summaryText =
    c.summary?.trim() ??
    (c.breakdown
      ? `${score}% blends technical (${Math.round(c.breakdown.technicalSkills)}), experience (${Math.round(c.breakdown.experienceLevel)}), and domain (${Math.round(c.breakdown.domainKnowledge)}) scores vs the job text and your résumé.`
      : `Experience level: ${c.experienceLevel}. Parsed skills include ${c.skills.slice(0, 10).join(', ') || '—'}.`);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <AppHeader
        showBack
        title="Candidate Deep Dive"
        centerTitle
        right={
          <Pressable onPress={() => toggleShortlisted(c.id)} className="size-10 items-center justify-center">
            <MaterialIcons name={listed ? 'bookmark' : 'bookmark-border'} size={22} color="#259df4" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <View className="mb-6 flex-row items-start gap-4">
            {c.avatarUrl ? (
              <Image source={{ uri: c.avatarUrl }} className="size-24 rounded-full" />
            ) : (
              <View className="size-24 items-center justify-center rounded-full bg-primary/15 dark:bg-primary-dark/20">
                <Text className="text-2xl font-bold text-primary dark:text-primary-dark">{c.initials ?? '?'}</Text>
              </View>
            )}
            <View className="min-w-0 flex-1 justify-center pt-2">
              <Text className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{c.name}</Text>
              <Text className="text-base text-slate-600 dark:text-slate-300">{c.title ?? 'Candidate'}</Text>
              {c.location ? (
                <View className="mt-1 flex-row items-center gap-1">
                  <MaterialIcons name="place" size={16} color="#94a3b8" />
                  <Text className="text-sm text-slate-500 dark:text-slate-400">{c.location}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View className="flex-row gap-3">
            <Pressable className="h-10 flex-1 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/15">
              <Text className="text-sm font-bold text-primary dark:text-primary-dark">Message</Text>
            </Pressable>
            <Pressable className="h-10 flex-1 items-center justify-center rounded-lg bg-primary dark:bg-primary-dark">
              <Text className="text-sm font-bold text-white">Download CV</Text>
            </Pressable>
          </View>
        </View>
        <View className="mt-2 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <View className="mb-3 flex-row items-center gap-2">
            <MaterialIcons name="psychology" size={20} color="#259df4" />
            <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Parse Summary</Text>
          </View>
          <Text className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{summaryText}</Text>
        </View>
        <View className="mt-2 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">Skill Match Analysis</Text>
            <View className="flex-row items-center gap-1 rounded-full bg-green-50 px-3 py-1 dark:bg-green-900/30">
              <MaterialIcons name="verified" size={18} color="#15803d" />
              <Text className="text-sm font-semibold text-green-700 dark:text-green-400">{score}% Match</Text>
            </View>
          </View>
          <View className="gap-4">
            {analysis.map((row) => (
              <View key={row.name}>
                <View className="mb-1 flex-row justify-between text-sm">
                  <Text className="font-medium text-slate-700 dark:text-slate-300">{row.name}</Text>
                  <Text className="text-slate-500 dark:text-slate-400">{row.level}</Text>
                </View>
                <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View
                    className="h-2 rounded-full bg-primary dark:bg-primary-dark"
                    style={{ width: `${row.percent}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
          <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Extracted Keywords
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {keywords.map((k) => (
              <View
                key={k}
                className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <Text className="text-xs text-slate-700 dark:text-slate-200">{k}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="mt-2 mb-4 bg-white p-4 dark:bg-slate-950">
          <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Experience</Text>
          {xp.length ? (
            <View className="ml-3 border-l border-slate-200 pl-6 dark:border-slate-700">
              {xp.map((e, i) => (
                <View key={i} className="relative pb-6">
                  <View
                    className={`absolute -left-[29px] top-1.5 size-3 rounded-full border-2 border-white dark:border-slate-950 ${
                      i === 0 ? 'bg-primary dark:bg-primary-dark' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                  <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{e.title}</Text>
                  <Text className="text-sm text-slate-600 dark:text-slate-400">
                    {e.company} · {e.period}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-slate-600 dark:text-slate-400">Experience level: {c.experienceLevel}</Text>
          )}
        </View>
      </ScrollView>
      <CandidateDetailNav active="candidates" />
    </View>
  );
}

