import { Image, Pressable, Text, View } from 'react-native';

import type { RankedCandidate } from '@/types';
import { cn } from '@/utils/cn';

function skillPreview(skills: string[]) {
  const s = skills.slice(0, 3).join(', ');
  return skills.length > 3 ? `${s}...` : s;
}

export function CandidateRow(props: {
  candidate: RankedCandidate;
  onPress: () => void;
  strongScore?: boolean;
}) {
  const { candidate: c } = props;
  const pct = Math.min(100, Math.max(0, c.matchScore));
  const barColor =
    props.strongScore !== false && pct >= 80 ? 'bg-primary dark:bg-primary-dark' : 'bg-slate-400 dark:bg-slate-500';
  return (
    <Pressable
      onPress={props.onPress}
      className="flex-row items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 active:opacity-90 dark:border-slate-800 dark:bg-slate-900"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-4">
        {c.avatarUrl ? (
          <Image
            source={{ uri: c.avatarUrl }}
            className="size-14 rounded-full ring-2 ring-background-light dark:ring-background-dark"
          />
        ) : (
          <View className="size-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-background-light dark:bg-primary-dark/20 dark:ring-background-dark">
            <Text className="text-lg font-bold text-primary dark:text-primary-dark">{c.initials ?? '?'}</Text>
          </View>
        )}
        <View className="min-w-0 flex-1 justify-center">
          <Text className="truncate text-base font-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {c.name}
          </Text>
          <Text className="truncate text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {c.experienceLevel} · {c.title ?? 'Candidate'}
          </Text>
          <Text className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500" numberOfLines={1}>
            Skills: {skillPreview(c.skills)}
          </Text>
        </View>
      </View>
      <View className="shrink-0 items-end">
        <Text
          className={cn(
            'mb-1 text-lg font-bold',
            pct >= 80 ? 'text-primary dark:text-primary-dark' : 'text-slate-600 dark:text-slate-300'
          )}
        >
          {Math.round(pct)}%
        </Text>
        <View className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <View className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
        </View>
      </View>
    </Pressable>
  );
}
