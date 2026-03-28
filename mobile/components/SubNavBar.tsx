import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

type Item = { href: '/upload' | '/candidates' | '/settings'; label: string; icon: keyof typeof MaterialIcons.glyphMap };

const PARSE_ITEMS: Item[] = [
  { href: '/upload', label: 'Upload', icon: 'cloud-upload' },
  { href: '/candidates', label: 'Candidates', icon: 'group' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export function SubNavBar(props: { active: 'upload' | 'candidates' | 'settings' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      className="border-t border-slate-200 bg-background-light/95 dark:border-slate-800 dark:bg-background-dark/95"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row px-4 pt-2">
        {PARSE_ITEMS.map((item) => {
          const key = item.href.slice(1) as typeof props.active;
          const on = props.active === key;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              className={cn('flex-1 items-center gap-1 rounded-xl p-2', on && 'bg-primary/5 dark:bg-primary-dark/10')}
            >
              <MaterialIcons name={item.icon} size={24} color={on ? '#259df4' : '#94a3b8'} />
              <Text
                className={cn(
                  'text-xs font-semibold',
                  on ? 'text-primary dark:text-primary-dark' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const DASH_ITEMS: {
  href: '/dashboard' | '/jobs' | '/candidates' | '/settings';
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/jobs', label: 'Jobs', icon: 'work' },
  { href: '/candidates', label: 'Candidates', icon: 'group' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export function JobAnalysisNav(props: { active: 'jobs' | 'candidates' | 'settings' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const JOB_ITEMS: {
    href: '/jobs' | '/candidates' | '/settings';
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  }[] = [
    { href: '/jobs', label: 'Analyze', icon: 'work' },
    { href: '/candidates', label: 'Candidates', icon: 'group' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <View
      className="mt-auto border-t border-slate-200 bg-background-light dark:border-slate-800 dark:bg-background-dark"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row gap-2 px-4 pt-2">
        {JOB_ITEMS.map((item) => {
          const key = item.href.slice(1) as typeof props.active;
          const on = props.active === key;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              className="flex-1 items-center gap-1 rounded-full p-2"
            >
              <View className="h-8 items-center justify-center">
                <MaterialIcons name={item.icon} size={24} color={on ? '#259df4' : '#94a3b8'} />
              </View>
              <Text
                className={cn(
                  'text-center text-xs font-semibold',
                  on ? 'text-primary dark:text-primary-dark' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CandidateDetailNav(props: { active: 'dashboard' | 'jobs' | 'candidates' | 'settings' }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row px-4 pt-2">
        {DASH_ITEMS.map((item) => {
          const key = item.href.slice(1) as typeof props.active;
          const on = props.active === key;
          return (
            <Pressable key={item.href} onPress={() => router.push(item.href)} className="flex-1 items-center gap-1 py-1">
              <MaterialIcons name={item.icon} size={24} color={on ? '#259df4' : '#94a3b8'} />
              <Text
                className={cn(
                  'text-[10px] font-medium',
                  on ? 'text-primary dark:text-primary-dark' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
