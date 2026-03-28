import { ApolloProvider } from '@apollo/client/react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useEffect, type ReactNode } from 'react';
import { Appearance, View, useColorScheme as useRNColorScheme } from 'react-native';

import { apolloClient } from '@/graphql/client';
import { useThemeStore } from '@/store/useThemeStore';
import { resolveAppearance } from '@/utils/theme';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

function normalizeClerkKey(raw: string | undefined) {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\$+$/g, '')
    .trim();
}

const publishableKey = normalizeClerkKey(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ThemeRoot({ children }: { children: ReactNode }) {
  const preference = useThemeStore((s) => s.preference);
  const system = useRNColorScheme();
  const dark = resolveAppearance(preference, system) === 'dark';

  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference]);

  return (
    <View className={`flex-1 ${dark ? 'dark' : ''}`} style={{ flex: 1 }}>
      {children}
    </View>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ApolloProvider client={apolloClient}>
        <ThemeRoot>{children}</ThemeRoot>
      </ApolloProvider>
    </ClerkProvider>
  );
}
