import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { rankCandidates } from '@/services/resumeApi';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import { keyboardAvoidingBehavior } from '@/utils/keyboardAvoiding';

export function JobsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const jobDescription = useAppStore((s) => s.jobDescription);
  const setJobDescription = useAppStore((s) => s.setJobDescription);
  const setRankings = useAppStore((s) => s.setRankings);

  async function onAnalyze() {
    setLoading(true);
    try {
      const ranked = await rankCandidates(jobDescription);
      setRankings(ranked);
      router.push('/candidates');
    } catch (e) {
      useToastStore.getState().show({
        title: 'Matching failed',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader
        title="TalentParse"
        right={
          <Pressable
            onPress={() => router.push('/profile')}
            className="size-10 items-center justify-center rounded-full bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
          >
            <MaterialIcons name="person" size={22} color="#64748b" />
          </Pressable>
        }
      />
      <KeyboardAvoidingView behavior={keyboardAvoidingBehavior} style={{ flex: 1 }} className="flex-1">
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
          <Text className="px-4 pb-2 pt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Job Analysis
          </Text>
          <Text className="px-4 pb-4 text-sm text-slate-500 dark:text-slate-400">
            Paste the job description below to extract key skills and requirements.
          </Text>
          <View className="min-h-[260px] flex-1 px-4 py-2">
            <TextInput
              multiline
              value={jobDescription}
              onChangeText={setJobDescription}
              placeholder="e.g. We are looking for a Senior Software Engineer with experience in React, Node.js, and AWS..."
              placeholderTextColor="#94a3b8"
              className="min-h-[240px] flex-1 rounded-xl border border-slate-300 bg-white p-4 text-base leading-relaxed text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              textAlignVertical="top"
            />
          </View>
          <View className="flex-row gap-2 px-4 py-4">
            <Pressable
              onPress={() => router.push('/upload')}
              className="h-10 flex-row items-center justify-center rounded-lg bg-slate-200 px-4 dark:bg-slate-700"
            >
              <MaterialIcons name="upload-file" size={18} color="#64748b" />
              <Text className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300">Upload PDF</Text>
            </Pressable>
            <Pressable className="h-10 flex-row items-center justify-center rounded-lg bg-slate-200 px-4 dark:bg-slate-700">
              <MaterialIcons name="link" size={18} color="#64748b" />
              <Text className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300">Paste URL</Text>
            </Pressable>
          </View>
          <View className="mt-auto px-4 py-6">
            <Button
              className="h-14 rounded-xl shadow-md dark:bg-primary-dark"
              onPress={onAnalyze}
              loading={loading}
              disabled={loading || !jobDescription.trim()}
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                <Text className="text-base font-bold tracking-wide text-white">Analyze Description</Text>
              </View>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
