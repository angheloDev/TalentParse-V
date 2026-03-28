import { useAuth, useSSO, useSignIn } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, ScrollView } from 'react-native';

import { PasswordField } from '@/components/PasswordField';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/store/useToastStore';
import { clerkOAuthRedirectUri } from '@/utils/clerkRedirect';
import { getAuthErrorMessage } from '@/utils/authError';
import { keyboardAvoidingBehavior } from '@/utils/keyboardAvoiding';

WebBrowser.maybeCompleteAuthSession();

export function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [authLoaded, isSignedIn, router]);

  const showError = useCallback((title: string, err: unknown) => {
    useToastStore.getState().show({
      title,
      message: getAuthErrorMessage(err),
      type: 'error',
    });
  }, []);

  const onEmailSignIn = useCallback(async () => {
    if (!isLoaded || !signIn || !setActive) return;
    const id = email.trim();
    if (!id || !password) {
      useToastStore.getState().show({ title: 'Enter email and password', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      let result = await signIn.create({
        strategy: 'password',
        identifier: id,
        password,
      });

      const activate = async (sessionId: string) => {
        await setActive({ session: sessionId });
        router.replace('/dashboard');
      };

      if (result.status === 'complete' && result.createdSessionId) {
        try {
          await activate(result.createdSessionId);
        } catch (e) {
          showError('Could not start session', e);
        }
        return;
      }

      if (result.status === 'needs_first_factor') {
        result = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });
      }

      if (result.status === 'complete' && result.createdSessionId) {
        try {
          await activate(result.createdSessionId);
        } catch (e) {
          showError('Could not start session', e);
        }
        return;
      }

      if (result.status === 'needs_second_factor') {
        showError(
          'Additional verification required',
          new Error('Complete sign-in in the Clerk dashboard or enable a second factor you support in-app.')
        );
        return;
      }

      showError('Sign-in incomplete', new Error(`Status: ${result.status ?? 'unknown'}. Try again or use Google.`));
    } catch (e) {
      showError('Sign in failed', e);
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded, signIn, setActive, router, showError]);

  const onGoogle = useCallback(async () => {
    const redirectUrl = clerkOAuthRedirectUri();
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: sa, authSessionResult } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      if (authSessionResult?.type === 'cancel' || authSessionResult?.type === 'dismiss') {
        return;
      }

      await WebBrowser.coolDownAsync().catch(() => {});

      const sid = createdSessionId ?? undefined;
      if (sid && sa) {
        await sa({ session: sid });
        router.replace('/dashboard');
        return;
      }

      showError(
        'Sign-in did not finish',
        new Error(
          'No session was created. In Clerk Dashboard → Native applications, add this redirect URL exactly: ' +
            redirectUrl
        )
      );
    } catch (e) {
      showError('Google sign-in failed', e);
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router, showError]);

  return (
    <KeyboardAvoidingView
      behavior={keyboardAvoidingBehavior}
      style={{ flex: 1 }}
      className="flex-1 bg-background-light dark:bg-background-dark"
    >
      <Pressable
        onPress={() => router.back()}
        style={{ position: 'absolute', top: Math.max(insets.top, 8), left: 16, zIndex: 10 }}
        className="size-12 items-center justify-center rounded-full active:opacity-70"
        hitSlop={12}
      >
        <MaterialIcons name="arrow-back" size={24} color="#64748b" />
      </Pressable>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          paddingBottom: 120,
        }}
      >
        <Text className="mb-1 text-center text-3xl font-black text-slate-900 dark:text-white">TalentParse</Text>
        <Text className="mb-8 text-center text-slate-600 dark:text-slate-400">Sign in to continue</Text>
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          placeholderTextColor="#94a3b8"
          className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <PasswordField
          label="Password"
          value={password}
          onChangeText={setPassword}
          containerClassName="mb-6"
        />
        <Button className="mb-4 dark:bg-primary-dark" onPress={onEmailSignIn} loading={loading} disabled={loading}>
          Sign in
        </Button>
        <View className="mb-6 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <Text className="text-xs text-slate-500">or</Text>
          <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </View>
        <Button
          variant="outline"
          className="mb-4 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
          onPress={onGoogle}
          loading={googleLoading}
          disabled={!authLoaded || !isLoaded || googleLoading || loading}
        >
          <Text className="font-semibold text-slate-800 dark:text-slate-100">Continue with Google</Text>
        </Button>
        <Pressable onPress={() => router.push('/sign-up')} className="mb-6 items-center py-2">
          <Text className="text-sm font-medium text-primary dark:text-primary-dark">Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
