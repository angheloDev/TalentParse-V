import 'react-native-gesture-handler';
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Toaster } from '@/components/Toaster';
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <View className="flex-1">
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
          <Toaster />
        </View>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
