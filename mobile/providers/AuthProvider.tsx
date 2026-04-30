import { useApolloClient } from '@apollo/client/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apolloClient } from '@/graphql/client';
import { LOGIN, LOGOUT, ME, REGISTER, UPDATE_PROFILE } from '@/graphql/operations';
import { clearAuthToken, loadAuthToken, saveAuthToken } from '@/services/authSession';

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: { email: string; firstName: string; lastName: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthPayload = { token: string; user: AuthUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const hydrate = useCallback(async () => {
    const token = await loadAuthToken();
    if (!token) {
      setUser(null);
      setIsLoaded(true);
      return;
    }
    try {
      const { data } = await client.query<{ me: AuthUser | null }>({
        query: ME,
        fetchPolicy: 'network-only',
      });
      setUser(data?.me ?? null);
      if (!data?.me) await clearAuthToken();
    } catch {
      await clearAuthToken();
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, [client]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const { data } = await client.mutate<{ login: AuthPayload }>({
      mutation: LOGIN,
      variables: { input },
    });
    if (!data?.login) throw new Error('Sign in failed');
    await saveAuthToken(data.login.token);
    setUser(data.login.user);
  }, [client]);

  const signUp = useCallback(
    async (input: { email: string; password: string; firstName: string; lastName: string }) => {
      const { data } = await client.mutate<{ register: AuthPayload }>({
        mutation: REGISTER,
        variables: { input },
      });
      if (!data?.register) throw new Error('Sign up failed');
      await saveAuthToken(data.register.token);
      setUser(data.register.user);
    },
    [client],
  );

  const signOut = useCallback(async () => {
    try {
      await client.mutate({ mutation: LOGOUT });
    } finally {
      await clearAuthToken();
      setUser(null);
      await apolloClient.clearStore();
    }
  }, [client]);

  const updateProfile = useCallback(
    async (input: { email: string; firstName: string; lastName: string }) => {
      const { data } = await client.mutate<{ updateProfile: AuthUser }>({
        mutation: UPDATE_PROFILE,
        variables: { input },
      });
      if (!data?.updateProfile) throw new Error('Profile update failed');
      setUser(data.updateProfile);
    },
    [client],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      isSignedIn: Boolean(user),
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, isLoaded, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAppAuth must be used within AuthProvider');
  return value;
}
