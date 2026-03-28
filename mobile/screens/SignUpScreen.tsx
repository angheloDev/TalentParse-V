import { useAuth, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, ScrollView } from 'react-native';

import { PasswordField } from '@/components/PasswordField';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/store/useToastStore';
import { getAuthErrorMessage, isInvalidUsernameParam } from '@/utils/authError';
import { keyboardAvoidingBehavior } from '@/utils/keyboardAvoiding';

export function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'form' | 'verify'>('form');
  const [loading, setLoading] = useState(false);

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

  const activateIfComplete = useCallback(async () => {
    if (!signUp || !setActive) return false;
    if (signUp.status === 'complete' && signUp.createdSessionId) {
      await setActive({ session: signUp.createdSessionId });
      router.replace('/dashboard');
      return true;
    }
    return false;
  }, [signUp, setActive, router]);

  const onSubmitForm = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    const u = username.trim();
    const em = email.trim();
    if (!u || !em || !password) {
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
      try {
        await signUp.create({
          username: u,
          emailAddress: em,
          password,
        });
      } catch (e) {
        if (isInvalidUsernameParam(e)) {
          await signUp.create({
            emailAddress: em,
            password,
          });
        } else {
          throw e;
        }
      }

      if (await activateIfComplete()) {
        return;
      }

      try {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPhase('verify');
        useToastStore.getState().show({
          title: 'Check your email',
          message: 'Enter the verification code we sent you.',
          type: 'success',
        });
      } catch {
        if (await activateIfComplete()) {
          return;
        }
        showError('Email verification', new Error('Could not send a code. Check Clerk email settings or try again.'));
      }
    } catch (e) {
      showError('Sign up failed', e);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, username, email, password, confirm, showError, activateIfComplete]);

  const onVerifyCode = useCallback(async () => {
    if (!isLoaded || !signUp || !setActive) return;
    const c = code.trim();
    if (!c) {
      useToastStore.getState().show({ title: 'Enter the code', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      await signUp.attemptEmailAddressVerification({ code: c });
      if (await activateIfComplete()) {
        return;
      }
      showError('Verification incomplete', new Error(signUp.status ?? 'Try again or request a new code.'));
    } catch (e) {
      showError('Verification failed', e);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, setActive, code, showError, activateIfComplete]);

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
        <Text className="mb-8 text-center text-slate-600 dark:text-slate-400">
          {phase === 'form' ? 'Create your account' : 'Verify your email'}
        </Text>

        {phase === 'form' ? (
          <>
            <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Username</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              placeholder="jane_doe"
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
          </>
        ) : (
          <>
            <Text className="mb-4 text-center text-sm text-slate-600 dark:text-slate-400">
              Code sent to {email.trim()}
            </Text>
            <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Verification code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              autoCapitalize="none"
              className="mb-6 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <Button className="mb-4 dark:bg-primary-dark" onPress={onVerifyCode} loading={loading} disabled={loading}>
              Verify and continue
            </Button>
            <Pressable onPress={() => setPhase('form')} className="items-center py-2">
              <Text className="text-sm text-slate-500 dark:text-slate-400">Back to form</Text>
            </Pressable>
          </>
        )}

        {phase === 'form' ? (
          <Pressable onPress={() => router.push('/sign-in')} className="items-center py-2">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Already have an account? Sign in</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
