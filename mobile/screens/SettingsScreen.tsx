import { useClerk } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/useThemeStore';
import type { ThemePreference } from '@/utils/theme';

const modes: { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

export function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader title="Settings" />
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Account
        </Text>
        <Pressable
          onPress={() => router.push('/profile')}
          className="mb-6 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 active:opacity-90 dark:border-slate-700 dark:bg-slate-900"
        >
          <View className="flex-row items-center gap-3">
            <MaterialIcons name="person" size={22} color="#259df4" />
            <Text className="text-base font-medium text-slate-900 dark:text-slate-100">Profile</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
        </Pressable>
        <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Appearance
        </Text>
        <Card className="mb-6 gap-2 p-2">
          {modes.map((m) => {
            const on = preference === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setPreference(m.id)}
                className={`flex-row items-center justify-between rounded-lg px-3 py-3 ${on ? 'bg-primary/10 dark:bg-primary-dark/15' : ''}`}
              >
                <Text className="text-base text-slate-900 dark:text-slate-100">{m.label}</Text>
                {on ? <MaterialIcons name="check" size={20} color="#259df4" /> : null}
              </Pressable>
            );
          })}
        </Card>
        <Pressable
          onPress={() => signOut()}
          className="h-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
        >
          <Text className="font-semibold text-red-700 dark:text-red-400">Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
