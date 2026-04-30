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

export function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded, signUp } = useAppAuth();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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

  const onSubmitForm = useCallback(async () => {
    if (!isLoaded) return;
    const em = email.trim();
    if (!em || !firstName.trim() || !lastName.trim() || !password) {
      useToastStore.getState().show({ title: 'Fill in all fields', type: 'info' });
      return;
    }
    if (password !== confirm) {
      useToastStore.getState().show({ title: 'Passwords do not match', type: 'error' });
      return;
    }
    if (password.length < 8) {
      useToastStore.getState().show({ title: 'Password too short', message: 'Use at least 8 characters.', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: em,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.replace('/dashboard');
    } catch (e) {
      showError('Sign up failed', e);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, email, firstName, lastName, password, confirm, showError, router]);

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
          justifyContent: 'flex-start',
          padding: 24,
          paddingTop: 56,
          paddingBottom: 160,
        }}
      >
        <Text className="mb-1 text-center text-3xl font-black text-slate-900 dark:text-white">TalentParse</Text>
        <Text className="mb-8 text-center text-slate-600 dark:text-slate-400">Create your account</Text>
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">First name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Jane"
          placeholderTextColor="#94a3b8"
          className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Last name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Doe"
          placeholderTextColor="#94a3b8"
          className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
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
        <PasswordField label="Password" value={password} onChangeText={setPassword} containerClassName="mb-4" />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          containerClassName="mb-6"
        />
        <Button className="mb-4 dark:bg-primary-dark" onPress={onSubmitForm} loading={loading} disabled={loading}>
          Sign up
        </Button>
        <Pressable onPress={() => router.push('/sign-in')} className="items-center py-2">
          <Text className="text-sm text-slate-500 dark:text-slate-400">Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
