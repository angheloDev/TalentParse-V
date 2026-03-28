import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CandidateRow } from '@/components/CandidateRow';
import {
  FILTER_ANY,
  FILTER_SENIOR_PLUS,
  type CandidateTab,
  buildCandidateFilterOptions,
  filterRankedCandidates,
} from '@/utils/candidateFilters';
import { useAppStore } from '@/store/useAppStore';

export function CandidatesScreen() {
  const router = useRouter();
  const rankings = useAppStore((s) => s.rankings);
  const candidateTab = useAppStore((s) => s.candidateTab);
  const setCandidateTab = useAppStore((s) => s.setCandidateTab);
  const shortlistedIds = useAppStore((s) => s.shortlistedIds);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  const opts = useMemo(() => buildCandidateFilterOptions(rankings), [rankings]);
  const shortSet = useMemo(() => new Set(shortlistedIds), [shortlistedIds]);

  const filtered = useMemo(
    () => filterRankedCandidates(rankings, candidateTab, shortSet, filters),
    [rankings, candidateTab, shortSet, filters]
  );

  function cycleList(full: string[], key: 'role' | 'experience' | 'skill' | 'location') {
    const cur = filters[key];
    const i = full.indexOf(cur);
    const ni = i < 0 ? 0 : (i + 1) % full.length;
    setFilters({ [key]: full[ni]! } as Partial<typeof filters>);
  }

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader showBack title="Candidate Rankings" centerTitle />
      <View className="px-4 pt-2">
        <View className="flex-row justify-between border-b border-slate-200 dark:border-slate-800">
          {(['all', 'top', 'shortlist'] as CandidateTab[]).map((t) => {
            const on = candidateTab === t;
            const label = t === 'all' ? 'All Candidates' : t === 'top' ? 'Top Matches' : 'Shortlisted';
            return (
              <Pressable key={t} onPress={() => setCandidateTab(t)} className="flex-1 pb-3 pt-4">
                <Text
                  className={`text-center text-sm font-semibold tracking-wide ${
                    on ? 'font-bold text-primary dark:text-primary-dark' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </Text>
                {on ? <View className="mt-2 h-0.5 rounded-full bg-primary dark:bg-primary-dark" /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-14 px-4 py-4">
        <View className="flex-row gap-2">
          <FilterChip
            label={filters.role === FILTER_ANY ? 'Role: All' : `Role: ${filters.role}`}
            onPress={() => cycleList([FILTER_ANY, ...opts.titles], 'role')}
          />
          <FilterChip
            label={
              filters.experience === FILTER_ANY
                ? 'Experience: All'
                : filters.experience === FILTER_SENIOR_PLUS
                  ? 'Experience: 5+ Yrs'
                  : `Experience: ${filters.experience}`
            }
            onPress={() => cycleList([FILTER_ANY, FILTER_SENIOR_PLUS, ...opts.levels], 'experience')}
          />
          <FilterChip
            label={filters.skill === FILTER_ANY ? 'Skills: All' : `Skills: ${filters.skill}`}
            onPress={() => cycleList([FILTER_ANY, ...opts.skills], 'skill')}
          />
          <FilterChip
            label={
              filters.location === FILTER_ANY
                ? 'Location: All'
                : filters.location === 'REMOTE_MATCH'
                  ? 'Location: Remote'
                  : `Location: ${filters.location}`
            }
            onPress={() => cycleList([FILTER_ANY, 'REMOTE_MATCH', ...opts.locs], 'location')}
          />
        </View>
      </ScrollView>
      <FlatList
        className="flex-1 px-4"
        contentContainerStyle={{ gap: 16, paddingBottom: 120 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-center text-slate-500 dark:text-slate-400">
              {rankings.length === 0 ? 'Run Job Analysis to rank candidates.' : 'No candidates match these filters.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CandidateRow candidate={item} onPress={() => router.push(`/candidate/${item.id}`)} />
        )}
      />
    </View>
  );
}

function FilterChip(props: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      className="h-9 shrink-0 flex-row items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-4 dark:border-slate-700 dark:bg-slate-800"
    >
      <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{props.label}</Text>
      <MaterialIcons name="expand-more" size={18} color="#64748b" />
    </Pressable>
  );
}
