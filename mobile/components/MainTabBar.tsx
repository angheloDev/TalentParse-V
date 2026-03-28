import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

const items: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'candidates', label: 'Candidates', icon: 'group' },
  { key: 'upload', label: 'Upload', icon: 'add' },
  { key: 'jobs', label: 'Jobs', icon: 'work' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const active = state.routes[state.index]?.name;

  return (
    <View
      className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-background-dark"
      style={{ paddingBottom: Math.max(insets.bottom, 10), paddingTop: 8 }}
    >
      <View className="mx-auto w-full max-w-md flex-row items-center justify-between px-1">
        {items.map((item) => {
          const focused = active === item.key;
          const isUpload = item.key === 'upload';
          if (isUpload) {
            return (
              <View key={item.key} className="flex-1 items-center justify-center">
                <Pressable
                  onPress={() => navigation.navigate(item.key as never)}
                  className="size-12 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25 dark:bg-primary-dark dark:shadow-primary-dark/20"
                >
                  <MaterialIcons name="add" size={26} color="#fff" />
                </Pressable>
              </View>
            );
          }
          return (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(item.key as never)}
              className={cn('min-w-0 flex-1 items-center gap-0.5 py-1')}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={focused ? '#259df4' : '#94a3b8'}
              />
              <Text
                className={cn(
                  'text-[10px] font-medium tracking-wide',
                  focused ? 'text-primary dark:text-primary-dark' : 'text-neutral-500 dark:text-neutral-400'
                )}
                numberOfLines={1}
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
