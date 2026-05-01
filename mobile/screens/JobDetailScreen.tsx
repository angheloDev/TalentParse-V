import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/Card';
import { deleteSavedJob, getSavedJob } from '@/services/resumeApi';
import { useToastStore } from '@/store/useToastStore';
import type { SavedJobAnalysis } from '@/types';

export function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [job, setJob] = useState<SavedJobAnalysis | null>(null);

  useEffect(() => {
    if (!id) return;
    loadJob(id);
  }, [id]);

  async function loadJob(jobId: string) {
    setLoading(true);
    try {
      const data = await getSavedJob(jobId);
      setJob(data);
    } catch (e) {
      useToastStore.getState().show({
        title: 'Failed to load job',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!job) return;
    setDeleting(true);
    try {
      const ok = await deleteSavedJob(job.id);
      if (!ok) throw new Error('Could not delete saved job');
      useToastStore.getState().show({
        title: 'Saved job deleted',
        type: 'success',
      });
      router.back();
    } catch (e) {
      useToastStore.getState().show({
        title: 'Delete failed',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark">
        <AppHeader showBack title="Job Details" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-slate-500 dark:text-slate-400">Loading job details...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark">
        <AppHeader showBack title="Job Details" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-slate-500 dark:text-slate-400">Saved job not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <AppHeader showBack title="Job Details" />
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Card className="mb-4 p-4">
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{job.jobRole}</Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{job.industry}</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saved {new Date(job.createdAt).toLocaleString()}
          </Text>
          <Text className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Ranked candidates: {job.rankedCandidateCount}
          </Text>
          <Pressable
            onPress={() => setShowJobDetails((v) => !v)}
            className="mt-3 flex-row items-center self-start rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <MaterialIcons name={showJobDetails ? 'expand-less' : 'expand-more'} size={16} color="#64748b" />
            <Text className="ml-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {showJobDetails ? 'Hide Job Details' : 'Show Job Details'}
            </Text>
          </Pressable>
        </Card>

        <Card className="mb-4 p-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ranked Resumes</Text>
          {job.rankedResumes.length ? (
            <View className="gap-3">
              {job.rankedResumes.map((resume, index) => (
                <View
                  key={`${resume.id}-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">{resume.name}</Text>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {resume.title ?? 'Candidate'} {resume.location ? `- ${resume.location}` : ''}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                      {Math.round(resume.matchScore)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-slate-600 dark:text-slate-400">No ranked resumes saved yet for this job.</Text>
          )}
        </Card>

        {showJobDetails ? (
          <>
            <Card className="mb-4 p-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Required Skills</Text>
              {job.requiredSkills.length ? (
                <View className="flex-row flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <View
                      key={`${job.id}-${skill}`}
                      className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <Text className="text-xs text-slate-700 dark:text-slate-300">{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-slate-600 dark:text-slate-400">No required skills specified.</Text>
              )}
            </Card>

            <Card className="mb-4 p-4">
              <DetailRow label="Years of Experience" value={job.yearsOfExperience || 'Not specified'} />
              <DetailRow label="Preferred Strengths" value={job.strengths || 'Not specified'} />
              <DetailRow label="Other Requirements" value={job.otherRequirements || 'Not specified'} />
            </Card>
          </>
        ) : null}

        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className="h-12 flex-row items-center justify-center rounded-xl bg-rose-600 px-4 disabled:opacity-60"
        >
          <MaterialIcons name="delete-outline" size={18} color="#fff" />
          <Text className="ml-2 text-sm font-semibold text-white">{deleting ? 'Deleting...' : 'Delete Job'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DetailRow(props: { label: string; value: string }) {
  return (
    <View className="mb-3 last:mb-0">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{props.label}</Text>
      <Text className="text-sm text-slate-700 dark:text-slate-300">{props.value}</Text>
    </View>
  );
}
