import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/Card';
import { useAppAuth } from '@/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';

export function DashboardScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const parsedCount = useAppStore((s) => s.uploadedResumes.length);
  const rankedCount = useAppStore((s) => s.rankings.length);
  const avg =
    useAppStore((s) => {
      const r = s.rankings;
      if (!r.length) return 0;
      return Math.round(r.reduce((a, c) => a + c.matchScore, 0) / r.length);
    }) ?? 0;

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
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Here is what is happening today.
        </Text>
        <View className="flex-row gap-3 px-4 pb-3">
          <Card className="min-w-0 flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Resumes Parsed</Text>
              <MaterialIcons name="description" size={16} color="#259df4" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{parsedCount}</Text>
            <View className="flex-row items-center gap-1 text-green-600 dark:text-green-400">
              <MaterialIcons name="trending-up" size={14} color="#16a34a" />
              <Text className="text-xs font-medium text-green-600 dark:text-green-400">+15%</Text>
            </View>
          </Card>
          <Card className="min-w-0 flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Ranked</Text>
              <MaterialIcons name="bar-chart" size={16} color="#259df4" />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{rankedCount}</Text>
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="trending-up" size={14} color="#16a34a" />
              <Text className="text-xs font-medium text-green-600 dark:text-green-400">+10%</Text>
            </View>
          </Card>
        </View>
        <View className="px-4 pb-6">
          <Card className="gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Avg. Match Score</Text>
              <MaterialIcons name="military-tech" size={16} color="#259df4" />
            </View>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{avg}%</Text>
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="arrow-upward" size={14} color="#16a34a" />
                <Text className="text-xs font-medium text-green-600 dark:text-green-400">5% vs last week</Text>
              </View>
            </View>
            <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <View className="h-1.5 rounded-full bg-primary dark:bg-primary-dark" style={{ width: `${avg}%` }} />
            </View>
          </Card>
        </View>
        <Text className="px-4 pb-3 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Recent Activity
        </Text>
        <View className="flex-col gap-3 px-4">
          <ActivityRow icon="person-add" title="Sarah Jenkins" subtitle="Matched 92% for UX Designer" time="2m ago" />
          <ActivityRow icon="upload-file" title="Batch Upload" subtitle="50 resumes processed successfully" time="1h ago" />
          <ActivityRow icon="star" title="Michael Chen" subtitle="Shortlisted for Frontend Dev" time="3h ago" />
        </View>
        <Text className="px-4 pb-3 pt-6 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Trending Skills
        </Text>
        <View className="flex-row flex-wrap gap-2 px-4 pb-6">
          {[
            ['React', '84%'],
            ['Python', '76%'],
            ['UI/UX', '65%'],
            ['AWS', '52%'],
            ['TypeScript', '48%'],
          ].map(([k, p]) => (
            <View
              key={k}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {k} <Text className="text-xs text-primary dark:text-primary-dark">{p}</Text>
              </Text>
            </View>
          ))}
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
      <Text className="text-xs text-neutral-500">{props.time}</Text>
    </View>
  );
}
