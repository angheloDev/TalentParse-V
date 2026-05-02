import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/Card';
import { deleteSavedJob, getSavedJob } from '@/services/resumeApi';
import { useToastStore } from '@/store/useToastStore';
import type { SavedJobAnalysis, SavedRankedResume } from '@/types';

export function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [job, setJob] = useState<SavedJobAnalysis | null>(null);
  const [detailResume, setDetailResume] = useState<SavedRankedResume | null>(null);

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
                <Pressable
                  key={`${resume.id}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Ranking details for ${resume.name}`}
                  onPress={() => setDetailResume(resume)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 active:opacity-80 dark:border-slate-700 dark:bg-slate-900"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">{resume.name}</Text>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {resume.title ?? 'Candidate'} {resume.location ? `- ${resume.location}` : ''}
                      </Text>
                      <Text className="mt-1 text-[11px] text-primary dark:text-primary-dark">Tap for ranking summary</Text>
                    </View>
                    <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                      {Math.round(resume.matchScore)}%
                    </Text>
                  </View>
                </Pressable>
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

      <RankingDetailModal job={job} resume={detailResume} onClose={() => setDetailResume(null)} />
    </View>
  );
}

function RankingDetailModal(props: {
  job: SavedJobAnalysis;
  resume: SavedRankedResume | null;
  onClose: () => void;
}) {
  const { job, resume, onClose } = props;

  if (!resume) return null;

  const matchedReq = job.requiredSkills.filter((req) => resumeMatchesRequiredSkill(resume.skills, req));
  const missingReq = job.requiredSkills.filter((req) => !resumeMatchesRequiredSkill(resume.skills, req));

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/55">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Dismiss" />
        <View className="max-h-[88%] rounded-t-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">{resume.name}</Text>
              <Text className="mt-0.5 text-sm font-semibold text-primary dark:text-primary-dark">
                {Math.round(resume.matchScore)}% role match
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>
          <ScrollView className="px-4 pb-8 pt-2" contentContainerStyle={{ paddingBottom: 32 }}>
            <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Why this score</Text>
            <Text className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              {resume.summary?.trim()
                ? resume.summary
                : 'No detailed summary was stored for this ranking (saved before summaries were added). The percentage reflects how the resume overlapped the job text and parsed skills at ranking time.'}
            </Text>

            <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Job vs this resume
            </Text>
            <Text className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Saved job role and requirements you entered are compared to skills extracted from the candidate file when
              they were ranked.
            </Text>

            {job.requiredSkills.length > 0 ? (
              <View className="gap-2">
                {matchedReq.map((req) => (
                  <View
                    key={`ok-${req}`}
                    className="flex-row items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40"
                  >
                    <MaterialIcons name="check-circle" size={18} color="#059669" />
                    <Text className="ml-2 flex-1 text-sm text-emerald-900 dark:text-emerald-100">{req}</Text>
                    <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Match</Text>
                  </View>
                ))}
                {missingReq.map((req) => (
                  <View
                    key={`gap-${req}`}
                    className="flex-row items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
                  >
                    <MaterialIcons name="remove-circle-outline" size={18} color="#d97706" />
                    <Text className="ml-2 flex-1 text-sm text-amber-950 dark:text-amber-100">{req}</Text>
                    <Text className="text-xs font-semibold text-amber-800 dark:text-amber-300">Gap</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-slate-600 dark:text-slate-400">
                No explicit required skills were saved for this job; ranking used the full job description text only.
              </Text>
            )}

            <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Candidate snapshot (from resume)
            </Text>
            <View className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <DetailMini label="Title" value={resume.title ?? '—'} />
              <DetailMini label="Location" value={resume.location ?? '—'} />
              <DetailMini label="Experience level (parsed)" value={resume.experienceLevel} />
              {resume.skills.length ? (
                <View className="mt-2">
                  <Text className="mb-1 text-xs font-semibold text-slate-500">Skills extracted</Text>
                  <Text className="text-sm leading-5 text-slate-800 dark:text-slate-200">
                    {resume.skills.slice(0, 24).join(', ')}
                    {resume.skills.length > 24 ? '…' : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            {(job.yearsOfExperience || job.strengths) ? (
              <>
                <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your job criteria
                </Text>
                <View className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  {job.yearsOfExperience ? <DetailMini label="Years of experience" value={job.yearsOfExperience} /> : null}
                  {job.strengths ? <DetailMini label="Preferred strengths" value={job.strengths} /> : null}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function resumeMatchesRequiredSkill(candidateSkills: string[], required: string): boolean {
  const r = required.trim().toLowerCase();
  if (!r) return false;
  return candidateSkills.some((c) => {
    const n = c.trim().toLowerCase();
    return n === r || n.includes(r) || r.includes(n);
  });
}

function DetailMini(props: { label: string; value: string }) {
  return (
    <View className="mb-2 last:mb-0">
      <Text className="text-xs text-slate-500 dark:text-slate-400">{props.label}</Text>
      <Text className="text-sm text-slate-800 dark:text-slate-200">{props.value}</Text>
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
