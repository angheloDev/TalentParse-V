import { useUser } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/useToastStore';
import { getAuthErrorMessage } from '@/utils/authError';
import { keyboardAvoidingBehavior } from '@/utils/keyboardAvoiding';

export function ProfileScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEditing(true);
  }, [user]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({ firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined });
      await user.reload();
      setEditing(false);
      useToastStore.getState().show({ title: 'Profile updated', type: 'success' });
    } catch (e) {
      useToastStore.getState().show({
        title: 'Could not update profile',
        message: getAuthErrorMessage(e),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [user, firstName, lastName]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color="#259df4" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <Text className="text-slate-500">No profile</Text>
      </View>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? '';

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <AppHeader showBack title="Profile" onBackPress={() => router.back()} />
      <KeyboardAvoidingView behavior={keyboardAvoidingBehavior} style={{ flex: 1 }} className="flex-1">
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
        <View className="mb-6 items-center">
          {user.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="size-28 rounded-full" />
          ) : (
            <View className="size-28 items-center justify-center rounded-full bg-primary/15 dark:bg-primary-dark/20">
              <Text className="text-3xl font-bold text-primary dark:text-primary-dark">
                {(user.firstName?.[0] ?? '?').toUpperCase()}
                {(user.lastName?.[0] ?? '').toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">
            {user.fullName || 'Your account'}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{primaryEmail}</Text>
        </View>

        {!editing ? (
          <Card className="gap-4 p-4">
            <Row label="First name" value={user.firstName || '—'} />
            <Row label="Last name" value={user.lastName || '—'} />
            <Row label="User ID" value={user.id} mono />
            <Button className="mt-2 dark:bg-primary-dark" onPress={startEdit}>
              Edit profile
            </Button>
          </Card>
        ) : (
          <Card className="gap-4 p-4">
            <View>
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">First name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </View>
            <View className="mt-2 flex-row gap-3">
              <Pressable
                onPress={cancelEdit}
                disabled={saving}
                className="h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-600"
              >
                <Text className="font-semibold text-slate-700 dark:text-slate-300">Cancel</Text>
              </Pressable>
              <View className="h-12 flex-1">
                <Button className="h-12 dark:bg-primary-dark" onPress={save} loading={saving} disabled={saving}>
                  Save
                </Button>
              </View>
            </View>
          </Card>
        )}

        <Text className="mx-2 mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Email and sign-in methods are managed in your Clerk account security settings.
        </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Row(props: { label: string; value: string; mono?: boolean }) {
  return (
    <View>
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{props.label}</Text>
      <Text
        className={`text-base text-slate-900 dark:text-slate-100 ${props.mono ? 'font-mono text-xs' : ''}`}
        selectable
      >
        {props.value}
      </Text>
    </View>
  );
}
