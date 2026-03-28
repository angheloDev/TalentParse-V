import { Tabs } from 'expo-router';

import { MainTabBar } from '@/components/MainTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen
        name="candidates"
        options={{ title: 'Candidates', tabBarStyle: { display: 'none', height: 0 } }}
      />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarLabel: () => '' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs', tabBarStyle: { display: 'none', height: 0 } }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
