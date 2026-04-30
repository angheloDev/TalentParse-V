import { ApolloProvider } from '@apollo/client/react';
import { useEffect, type ReactNode } from 'react';
import { Appearance, View, useColorScheme as useRNColorScheme } from 'react-native';

import { apolloClient } from '@/graphql/client';
import { AuthProvider } from '@/providers/AuthProvider';
import { useThemeStore } from '@/store/useThemeStore';
import { resolveAppearance } from '@/utils/theme';

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
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeRoot>{children}</ThemeRoot>
      </AuthProvider>
    </ApolloProvider>
  );
}
