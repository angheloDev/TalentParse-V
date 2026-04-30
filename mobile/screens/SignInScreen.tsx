import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, ScrollView } from 'react-native';

import { PasswordField } from '@/components/PasswordField';
import { Button } from '@/components/ui/Button';
import { useAppAuth } from '@/providers/AuthProvider';
import { useToastStore } from '@/store/useToastStore';
import { getAuthErrorMessage } from '@/utils/authError';
import { keyboardAvoidingBehavior } from '@/utils/keyboardAvoiding';

export function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded, signIn } = useAppAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const showError = useCallback((title: string, err: unknown) => {
    useToastStore.getState().show({
      title,
      message: getAuthErrorMessage(err),
      type: 'error',
    });
  }, []);

  const onEmailSignIn = useCallback(async () => {
    if (!isLoaded) return;
    const id = email.trim();
    if (!id || !password) {
      useToastStore.getState().show({ title: 'Enter email and password', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      await signIn({
        email: id,
        password,
      });
      router.replace('/dashboard');
    } catch (e) {
      showError('Sign in failed', e);
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded, signIn, router, showError]);

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
        <Pressable onPress={() => router.push('/sign-up')} className="mb-6 items-center py-2">
          <Text className="text-sm font-medium text-primary dark:text-primary-dark">Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
