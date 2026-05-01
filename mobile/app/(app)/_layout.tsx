import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useAppAuth } from '@/providers/AuthProvider';

export default function AppGroupLayout() {
  const { isLoaded, user } = useAppAuth();
  if (!isLoaded) {
    return <View className="flex-1 bg-background-light dark:bg-background-dark" />;
  }
  if (!user) {
    return <Redirect href="/sign-in" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="parse-result" />
      <Stack.Screen name="candidate/[id]" />
        <Stack.Screen name="job/[id]" />
      <Stack.Screen name="profile" options={{ presentation: 'card', animation: 'slide_from_right' }} />
    </Stack>
  );
}
