import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { LandingScreen } from '@/screens/LandingScreen';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return <View className="flex-1 bg-background-light dark:bg-background-dark" />;
  }
  if (isSignedIn) {
    return <Redirect href="/dashboard" />;
  }
  return <LandingScreen />;
}
