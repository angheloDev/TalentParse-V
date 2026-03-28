import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function AppGroupLayout() {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) {
    return <View className="flex-1 bg-background-light dark:bg-background-dark" />;
  }
  if (!userId) {
    return <Redirect href="/sign-in" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="parse-result" />
      <Stack.Screen name="candidate/[id]" />
      <Stack.Screen name="profile" options={{ presentation: 'card', animation: 'slide_from_right' }} />
    </Stack>
  );
}
