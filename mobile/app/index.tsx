import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useAppAuth } from '@/providers/AuthProvider';
import { LandingScreen } from '@/screens/LandingScreen';

export default function Index() {
  const { isSignedIn, isLoaded } = useAppAuth();
  if (!isLoaded) {
    return <View className="flex-1 bg-background-light dark:bg-background-dark" />;
  }
  if (isSignedIn) {
    return <Redirect href="/dashboard" />;
  }
  return <LandingScreen />;
}
