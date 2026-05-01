import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/Button';
import { getEmbeddings, getSavedJobs, parseResume, rankCandidates, saveJobRankings, uploadResume } from '@/services/resumeApi';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import type { SavedJobAnalysis } from '@/types';

export function UploadScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [savedJobs, setSavedJobs] = useState<SavedJobAnalysis[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const uploadProgress = useAppStore((s) => s.uploadProgress);
  const parseProgress = useAppStore((s) => s.parseProgress);
  const lastFileName = useAppStore((s) => s.lastFileName);
  const setUploadProgress = useAppStore((s) => s.setUploadProgress);
  const setParseProgress = useAppStore((s) => s.setParseProgress);
  const setLastFileName = useAppStore((s) => s.setLastFileName);
  const setLatestParsed = useAppStore((s) => s.setLatestParsed);
  const addUploadedResume = useAppStore((s) => s.addUploadedResume);
  const setEmbeddingsReady = useAppStore((s) => s.setEmbeddingsReady);
  const setRankings = useAppStore((s) => s.setRankings);

  useFocusEffect(
    useCallback(() => {
      loadSavedJobs();
    }, []),
  );

  async function loadSavedJobs() {
    try {
      const rows = await getSavedJobs();
      setSavedJobs(rows);
      if (!rows.find((job) => job.id === selectedJobId)) {
        setSelectedJobId(rows[0]?.id ?? '');
      }
    } catch (e) {
      useToastStore.getState().show({
        title: 'Failed to load jobs',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    }
  }

  function buildJobPrompt(job: SavedJobAnalysis) {
    return [
      `Industry / Field: ${job.industry}`,
      `Job Role:\n${job.jobRole}`,
      `Required Skills: ${job.requiredSkills.length ? job.requiredSkills.join(', ') : 'Not specified'}`,
      `Years of Experience: ${job.yearsOfExperience || 'Not specified'}`,
      `Preferred Strengths: ${job.strengths || 'Not specified'}`,
      `Other Requirements: ${job.otherRequirements || 'Not specified'}`,
    ].join('\n\n');
  }

  async function onBrowse() {
    const selectedJob = savedJobs.find((job) => job.id === selectedJobId);
    if (!selectedJob) {
      useToastStore.getState().show({
        title: 'Select a job first',
        message: 'Choose an existing job before scanning a resume.',
        type: 'error',
      });
      return;
    }

    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const mime = asset.mimeType ?? 'application/octet-stream';
    let text = '';
    let pdfBase64: string | undefined;
    if (mime === 'text/plain') {
      try {
        text = await FileSystem.readAsStringAsync(asset.uri);
      } catch {
        text = '';
      }
    }
    if (mime === 'application/pdf') {
      try {
        pdfBase64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {
        pdfBase64 = undefined;
      }
    }
    const normalizedText = text.trim();
    const metadataFingerprint = `${asset.name}:${asset.size ?? 'na'}:${asset.lastModified ?? 'na'}:${mime}`;
    const hashPayload =
      mime === 'application/pdf'
        ? pdfBase64
          ? `pdf:${pdfBase64}`
          : `pdf-meta:${metadataFingerprint}`
        : normalizedText
          ? `txt:${normalizedText}`
          : `file-meta:${metadataFingerprint}`;
    const fileHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashPayload);
    setBusy(true);
    setIsParsing(false);
    setLastFileName(asset.name);
    setUploadProgress(0);
    setParseProgress(0);
    let prTimer: ReturnType<typeof setInterval> | undefined;
    const upTimer = setInterval(() => {
      setUploadProgress((p) => Math.min(90, p + 8));
    }, 180);
    try {
      const up = await uploadResume({ uri: asset.uri, name: asset.name, mimeType: mime, fileHash });
      clearInterval(upTimer);
      setUploadProgress(100);
      addUploadedResume({
        id: up.id,
        fileName: up.fileName,
        mimeType: up.mimeType,
        uri: asset.uri,
        uploadedAt: new Date().toISOString(),
      });
      setIsParsing(true);
      prTimer = setInterval(() => {
        setParseProgress((p) => Math.min(90, p + 10));
      }, 160);
      const parsed = await parseResume(text || '', asset.name, pdfBase64, mime);
      if (prTimer) clearInterval(prTimer);
      setParseProgress(100);
      setLatestParsed(parsed);
      await getEmbeddings(parsed as unknown as Record<string, unknown>);
      setEmbeddingsReady(true);
      const ranked = await rankCandidates(buildJobPrompt(selectedJob));
      setRankings(ranked);
      await saveJobRankings({
        jobId: selectedJob.id,
        rankings: ranked.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          title: candidate.title ?? null,
          location: candidate.location ?? null,
          skills: candidate.skills,
          experienceLevel: candidate.experienceLevel,
          matchScore: candidate.matchScore,
          summary: candidate.summary ?? null,
        })),
      });
      useToastStore.getState().show({
        title: 'Resume ranked and saved',
        message: `Rankings were saved to ${selectedJob.jobRole}.`,
        type: 'success',
      });
      router.push('/parse-result');
    } catch (e) {
      clearInterval(upTimer);
      if (prTimer) clearInterval(prTimer);
      useToastStore.getState().show({
        title: 'Upload failed',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setIsParsing(false);
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader showBack title="TalentParse Upload" />
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">Choose Job / Industry First</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Resume ranking will be saved under the selected job.
          </Text>
          {savedJobs.length === 0 ? (
            <View className="mt-3 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                No saved jobs found. Create a job first in the Jobs tab.
              </Text>
            </View>
          ) : (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {savedJobs.map((job) => {
                const selected = selectedJobId === job.id;
                return (
                  <Pressable
                    key={job.id}
                    onPress={() => setSelectedJobId(job.id)}
                    className={`rounded-full border px-3 py-2 ${
                      selected
                        ? 'border-primary bg-primary/10 dark:border-primary-dark dark:bg-primary-dark/20'
                        : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-xs ${selected ? 'font-semibold text-primary dark:text-primary-dark' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {job.industry} - {job.jobRole}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
        <View className="relative items-center gap-6 overflow-hidden rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 px-6 py-14 dark:border-primary-dark/50 dark:bg-primary-dark/10">
          <View className="pointer-events-none absolute inset-0 bg-primary/5 dark:bg-primary-dark/10" />
          <View className="relative z-10 items-center gap-3">
            <View className="mb-2 size-16 items-center justify-center rounded-full bg-primary/20 dark:bg-primary-dark/25">
              <MaterialIcons name="cloud-upload" size={36} color="#259df4" />
            </View>
            <Text className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Drag & Drop Resume
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400">Upload PDF or TXT</Text>
          </View>
          <Button
            className="relative z-10 min-w-[120px] rounded-lg px-6 py-2.5 dark:bg-primary-dark"
            onPress={onBrowse}
            loading={busy}
            disabled={busy || savedJobs.length === 0 || !selectedJobId}
          >
            Browse Files
          </Button>
        </View>
        {isParsing ? (
          <View className="mt-4 gap-3">
            <ProgressBar progress={parseProgress} label={lastFileName ? `Parsing ${lastFileName}` : 'Parsing Data'} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
