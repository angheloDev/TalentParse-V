import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/Button';
import {
  getEmbeddings,
  getSavedJobs,
  parseResume,
  parseResumeFile,
  rankCandidates,
  saveJobRankings,
  uploadResume,
} from '@/services/resumeApi';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import type { ParsedResume, SavedJobAnalysis } from '@/types';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type FileStatus = {
  name: string;
  status: 'pending' | 'uploading' | 'parsing' | 'done' | 'skipped' | 'error';
  error?: string;
};

function safeCacheFileSegment(name: string): string {
  const base = (name || 'file').replace(/[/\\?*:|"<>]/g, '_').replace(/\s+/g, '_');
  return base.slice(0, 96) || 'file';
}

async function readUriAsBase64(
  uri: string,
  displayName: string,
): Promise<{ base64: string; localFileUri?: string } | undefined> {
  const cacheDir = FileSystem.cacheDirectory;
  const tryRead = async (u: string) => {
    try {
      const s = await FileSystem.readAsStringAsync(u, { encoding: FileSystem.EncodingType.Base64 });
      return s && s.length > 0 ? s : undefined;
    } catch {
      return undefined;
    }
  };
  const copyThenRead = async (): Promise<{ base64: string; localFileUri: string } | undefined> => {
    if (!cacheDir) return undefined;
    const dest = `${cacheDir}tp-resume-${Date.now()}-${safeCacheFileSegment(displayName)}`;
    try {
      await FileSystem.copyAsync({ from: uri, to: dest });
      const b64 = await tryRead(dest);
      if (!b64) return undefined;
      return { base64: b64, localFileUri: dest };
    } catch {
      return undefined;
    }
  };
  if (Platform.OS === 'android' && uri.startsWith('content://')) return copyThenRead();
  const direct = await tryRead(uri);
  if (direct) return { base64: direct };
  return copyThenRead();
}

async function readUriAsUtf8Text(uri: string, displayName: string): Promise<{ text: string; localFileUri?: string }> {
  const cacheDir = FileSystem.cacheDirectory;
  const tryRead = async (u: string) => {
    try { return await FileSystem.readAsStringAsync(u); } catch { return ''; }
  };
  const copyThenRead = async (): Promise<{ text: string; localFileUri: string } | undefined> => {
    if (!cacheDir) return undefined;
    const dest = `${cacheDir}tp-txt-${Date.now()}-${safeCacheFileSegment(displayName)}`;
    try {
      await FileSystem.copyAsync({ from: uri, to: dest });
      return { text: await tryRead(dest), localFileUri: dest };
    } catch { return undefined; }
  };
  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    return (await copyThenRead()) ?? { text: '' };
  }
  const direct = await tryRead(uri);
  if (direct.trim()) return { text: direct };
  return (await copyThenRead()) ?? { text: '' };
}

function inferResumeKind(fileName: string, mime: string): 'pdf' | 'docx' | 'txt' | 'unknown' {
  const name = (fileName || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt')) return 'txt';
  if (m === 'application/pdf' || m === 'application/x-pdf') return 'pdf';
  if (
    m.includes('wordprocessingml.document') ||
    m.includes('officedocument.wordprocessingml.document') ||
    m === 'application/msword' ||
    m === 'application/vnd.ms-word.document.macroenabled.12'
  ) return 'docx';
  if (m === 'text/plain' || m.startsWith('text/')) return 'txt';
  if (m.includes('pdf')) return 'pdf';
  if (m.includes('wordprocessingml') || m.includes('officedocument.wordprocessingml')) return 'docx';
  return 'unknown';
}

const STATUS_ICON: Record<FileStatus['status'], { name: React.ComponentProps<typeof MaterialIcons>['name']; color: string }> = {
  pending:   { name: 'radio-button-unchecked', color: '#94a3b8' },
  uploading: { name: 'cloud-upload',           color: '#259df4' },
  parsing:   { name: 'psychology',             color: '#a855f7' },
  done:      { name: 'check-circle',           color: '#16a34a' },
  skipped:   { name: 'skip-next',              color: '#d97706' },
  error:     { name: 'error',                  color: '#dc2626' },
};

export function UploadScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [savedJobs, setSavedJobs] = useState<SavedJobAnalysis[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);

  const uploadProgress = useAppStore((s) => s.uploadProgress);
  const parseProgress  = useAppStore((s) => s.parseProgress);
  const setUploadProgress = useAppStore((s) => s.setUploadProgress);
  const setParseProgress  = useAppStore((s) => s.setParseProgress);
  const setLastFileName   = useAppStore((s) => s.setLastFileName);
  const setLatestParsed   = useAppStore((s) => s.setLatestParsed);
  const addUploadedResume = useAppStore((s) => s.addUploadedResume);
  const setEmbeddingsReady = useAppStore((s) => s.setEmbeddingsReady);
  const setRankings        = useAppStore((s) => s.setRankings);
  const setLatestUploadJobContext = useAppStore((s) => s.setLatestUploadJobContext);

  useFocusEffect(useCallback(() => { loadSavedJobs(); }, []));

  async function loadSavedJobs() {
    try {
      const rows = await getSavedJobs();
      setSavedJobs(rows);
      if (!rows.find((j) => j.id === selectedJobId)) setSelectedJobId(rows[0]?.id ?? '');
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

  function updateStatus(index: number, patch: Partial<FileStatus>) {
    setFileStatuses((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function onBrowse() {
    const selectedJob = savedJobs.find((j) => j.id === selectedJobId);
    if (!selectedJob) {
      useToastStore.getState().show({
        title: 'Select a job first',
        message: 'Choose an existing job before scanning resumes.',
        type: 'error',
      });
      return;
    }

    let res: DocumentPicker.DocumentPickerResult;
    try {
      res = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === 'android' ? '*/*' : ['application/pdf', 'text/plain', DOCX_MIME, 'application/octet-stream'],
        copyToCacheDirectory: true,
        multiple: true,
      });
    } catch (e) {
      useToastStore.getState().show({
        title: 'Could not open file picker',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
      return;
    }
    if (res.canceled || !res.assets?.length) return;

    // Filter assets — skip unsupported formats silently
    const validAssets = res.assets.filter((a) => inferResumeKind(a.name, a.mimeType ?? '') !== 'unknown');
    const skippedCount = res.assets.length - validAssets.length;

    if (!validAssets.length) {
      useToastStore.getState().show({
        title: 'Unsupported files',
        message: 'Use .pdf, .docx, or .txt resumes.',
        type: 'error',
      });
      return;
    }

    if (skippedCount > 0) {
      useToastStore.getState().show({
        title: `${skippedCount} file${skippedCount > 1 ? 's' : ''} skipped`,
        message: 'Only PDF, DOCX, and TXT files are supported.',
        type: 'error',
      });
    }

    // Initialise per-file status list
    setFileStatuses(validAssets.map((a) => ({ name: a.name, status: 'pending' })));
    setCurrentFileIndex(-1);
    setBusy(true);
    setIsRanking(false);

    let lastParsed: ParsedResume | null = null;
    let lastUploadId = '';
    let successCount = 0;

    // -----------------------------------------------------------------------
    // Process files one by one
    // -----------------------------------------------------------------------
    for (let i = 0; i < validAssets.length; i++) {
      const asset = validAssets[i];
      const mime = asset.mimeType ?? 'application/octet-stream';
      const kind = inferResumeKind(asset.name, mime);

      setCurrentFileIndex(i);
      setLastFileName(asset.name);
      setUploadProgress(0);
      setParseProgress(0);
      updateStatus(i, { status: 'uploading' });

      let upTimer: ReturnType<typeof setInterval> | undefined;
      let prTimer: ReturnType<typeof setInterval> | undefined;

      try {
        // --- Read file content ---
        let text = '';
        let pdfBase64: string | undefined;
        let uploadUri = asset.uri;

        if (kind === 'txt') {
          const t = await readUriAsUtf8Text(asset.uri, asset.name);
          text = t.text.trim();
          if (t.localFileUri) uploadUri = t.localFileUri;
        } else {
          const bin = await readUriAsBase64(asset.uri, asset.name);
          pdfBase64 = bin?.base64;
          if (bin?.localFileUri) uploadUri = bin.localFileUri;
          if (!pdfBase64) throw new Error('Unable to read file contents from disk.');
        }

        // --- Build hash for deduplication ---
        const metaFp = `${asset.name}:${asset.size ?? 'na'}:${asset.lastModified ?? 'na'}:${mime}`;
        const normalizedText = text.trim();
        const hashPayload =
          kind === 'pdf'  ? (pdfBase64 ? `pdf:${pdfBase64}`   : `pdf-meta:${metaFp}`)
          : kind === 'docx' ? (pdfBase64 ? `docx:${pdfBase64}` : `docx-meta:${metaFp}`)
          : (normalizedText ? `txt:${normalizedText}` : `file-meta:${metaFp}`);
        const fileHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashPayload);

        // --- Upload ---
        upTimer = setInterval(() => setUploadProgress((p) => Math.min(90, p + 8)), 180);
        const uploadMime = kind === 'pdf' ? 'application/pdf' : kind === 'docx' ? DOCX_MIME : 'text/plain';
        const up = await uploadResume({ uri: uploadUri, name: asset.name, mimeType: uploadMime, fileHash });
        clearInterval(upTimer);
        setUploadProgress(100);

        addUploadedResume({
          id: up.id,
          fileName: up.fileName,
          mimeType: up.mimeType,
          uri: uploadUri,
          uploadedAt: new Date().toISOString(),
        });

        // --- Parse ---
        updateStatus(i, { status: 'parsing' });
        prTimer = setInterval(() => setParseProgress((p) => Math.min(90, p + 10)), 160);

        let parsed: ParsedResume;
        if (kind === 'pdf' && pdfBase64) {
          const parsedFile    = await parseResumeFile(pdfBase64, asset.name, 'application/pdf');
          const fallbackParsed = await parseResume('', asset.name, pdfBase64, 'application/pdf', up.id);
          const [firstName = 'Unknown', ...restName] = parsedFile.name.trim().split(/\s+/);
          const mergedSkills = parsedFile.skills.length ? parsedFile.skills : fallbackParsed.skills;
          parsed = {
            personalInfo: {
              firstName: parsedFile.name.trim() ? firstName : fallbackParsed.personalInfo.firstName,
              lastName:  parsedFile.name.trim() ? restName.join(' ') || 'Candidate' : fallbackParsed.personalInfo.lastName,
              email:     parsedFile.email    || fallbackParsed.personalInfo.email,
              phone:     parsedFile.phone    || fallbackParsed.personalInfo.phone,
              location:  fallbackParsed.personalInfo.location,
              linkedin:  parsedFile.linkedin || fallbackParsed.personalInfo.linkedin,
              github:    parsedFile.github   || fallbackParsed.personalInfo.github,
              portfolio: parsedFile.portfolio || fallbackParsed.personalInfo.portfolio,
            },
            skills:              mergedSkills,
            techStack:           mergedSkills.slice(0, 8),
            experienceLevel:     fallbackParsed.experienceLevel || 'Not specified',
            education:           fallbackParsed.education,
            experience:          fallbackParsed.experience.length
              ? fallbackParsed.experience
              : [{ company: 'Not specified', title: parsedFile.experience || 'Not specified' }],
            achievements:        fallbackParsed.achievements,
            projects:            fallbackParsed.projects,
            certifications:      parsedFile.certifications?.length ? parsedFile.certifications : (fallbackParsed.certifications ?? []),
            languages:           fallbackParsed.languages ?? [],
            totalYearsExperience: fallbackParsed.totalYearsExperience,
            meta: { confidenceScore: mergedSkills.length ? 0.9 : 0.7 },
          };
        } else if (kind === 'docx' && pdfBase64) {
          parsed = await parseResume('', asset.name, pdfBase64, DOCX_MIME, up.id);
        } else {
          parsed = await parseResume(text || '', asset.name, pdfBase64, mime, up.id);
        }

        clearInterval(prTimer);
        setParseProgress(100);

        lastParsed   = parsed;
        lastUploadId = up.id;
        successCount++;
        updateStatus(i, { status: 'done' });

      } catch (e) {
        if (upTimer) clearInterval(upTimer);
        if (prTimer) clearInterval(prTimer);
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (/already scanned/i.test(msg)) {
          updateStatus(i, { status: 'skipped' });
        } else {
          updateStatus(i, { status: 'error', error: msg });
        }
      }
    }

    // -----------------------------------------------------------------------
    // Nothing succeeded — bail out
    // -----------------------------------------------------------------------
    if (successCount === 0) {
      const allDups = fileStatuses.every((f) => f.status === 'skipped');
      useToastStore.getState().show({
        title: allDups ? 'Already scanned' : 'Upload failed',
        message: allDups
          ? 'All selected resumes have already been scanned.'
          : 'None of the selected files could be processed.',
        type: 'error',
      });
      setBusy(false);
      return;
    }

    // -----------------------------------------------------------------------
    // Rank ALL candidates for this job (one call covers every uploaded resume)
    // -----------------------------------------------------------------------
    setIsRanking(true);
    try {
      if (lastParsed) {
        setLatestParsed(lastParsed);
        await getEmbeddings(lastParsed as unknown as Record<string, unknown>);
        setEmbeddingsReady(true);
      }

      const cw = selectedJob.criteriaWeights;
      const ranked = await rankCandidates(
        buildJobPrompt(selectedJob),
        cw ? { skills: cw.skills, experience: cw.experience, education: cw.education, certifications: cw.certifications } : undefined,
      );
      setRankings(ranked);

      await saveJobRankings({
        jobId: selectedJob.id,
        rankings: ranked.map((c) => ({
          id: c.id,
          name: c.name,
          title: c.title ?? null,
          location: c.location ?? null,
          skills: c.skills,
          experienceLevel: c.experienceLevel,
          matchScore: c.matchScore,
          summary: c.summary ?? null,
        })),
      });

      const total = validAssets.length;
      const done  = fileStatuses.filter((f) => f.status === 'done').length || successCount;
      useToastStore.getState().show({
        title: `${done} of ${total} resume${total > 1 ? 's' : ''} scanned`,
        message: `Rankings saved to ${selectedJob.jobRole}.`,
        type: 'success',
      });

      setLatestUploadJobContext({
        jobId: selectedJob.id,
        industry: selectedJob.industry,
        jobRole: selectedJob.jobRole,
        requiredSkills: selectedJob.requiredSkills,
        yearsOfExperience: selectedJob.yearsOfExperience,
        strengths: selectedJob.strengths,
        otherRequirements: selectedJob.otherRequirements,
        uploadedResumeId: lastUploadId,
      });

      router.push('/parse-result');
    } catch (e) {
      useToastStore.getState().show({
        title: 'Ranking failed',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setIsRanking(false);
      setBusy(false);
    }
  }

  const showFileList = fileStatuses.length > 0;
  const activeFile   = currentFileIndex >= 0 ? fileStatuses[currentFileIndex] : null;

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader showBack title="TalentParse Upload" />
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Job selector */}
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
                    <Text className={`text-xs ${selected ? 'font-semibold text-primary dark:text-primary-dark' : 'text-slate-700 dark:text-slate-300'}`}>
                      {job.industry} - {job.jobRole}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Drop zone */}
        <View className="relative items-center gap-6 overflow-hidden rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 px-6 py-14 dark:border-primary-dark/50 dark:bg-primary-dark/10">
          <View className="pointer-events-none absolute inset-0 bg-primary/5 dark:bg-primary-dark/10" />
          <View className="relative z-10 items-center gap-3">
            <View className="mb-2 size-16 items-center justify-center rounded-full bg-primary/20 dark:bg-primary-dark/25">
              <MaterialIcons name="cloud-upload" size={36} color="#259df4" />
            </View>
            <Text className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Drag & Drop Resumes
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
              Select one or multiple PDF, DOCX, or TXT files
            </Text>
          </View>
          <Button
            className="relative z-10 min-w-[140px] rounded-lg px-6 py-2.5 dark:bg-primary-dark"
            onPress={onBrowse}
            loading={busy}
            disabled={busy || savedJobs.length === 0 || !selectedJobId}
          >
            Browse Files
          </Button>
          {savedJobs.length === 0 || !selectedJobId ? (
            <Text className="relative z-10 mt-2 max-w-xs text-center text-xs text-amber-600 dark:text-amber-400">
              {savedJobs.length === 0
                ? 'Add a job in the Jobs tab first, then return here to upload.'
                : 'Tap a job above so the app knows which role to match against.'}
            </Text>
          ) : null}
        </View>

        {/* Per-file status list */}
        {showFileList ? (
          <View className="mt-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <Text className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {fileStatuses.length} file{fileStatuses.length > 1 ? 's' : ''} selected
            </Text>
            {fileStatuses.map((f, idx) => {
              const icon = STATUS_ICON[f.status];
              const isActive = idx === currentFileIndex && (f.status === 'uploading' || f.status === 'parsing');
              return (
                <View
                  key={`${f.name}-${idx}`}
                  className={`mx-3 mb-2 rounded-lg px-3 py-2.5 ${isActive ? 'bg-primary/5 dark:bg-primary-dark/10' : 'bg-slate-50 dark:bg-slate-800'}`}
                >
                  <View className="flex-row items-center gap-3">
                    {f.status === 'uploading' || f.status === 'parsing' ? (
                      <ActivityIndicator size="small" color={icon.color} />
                    ) : (
                      <MaterialIcons name={icon.name} size={18} color={icon.color} />
                    )}
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-medium text-slate-800 dark:text-slate-100" numberOfLines={1}>
                        {f.name}
                      </Text>
                      {f.status === 'uploading' && (
                        <Text className="text-xs text-primary dark:text-primary-dark">Uploading…</Text>
                      )}
                      {f.status === 'parsing' && (
                        <Text className="text-xs text-purple-500">Parsing…</Text>
                      )}
                      {f.status === 'skipped' && (
                        <Text className="text-xs text-amber-600 dark:text-amber-400">Already scanned — skipped</Text>
                      )}
                      {f.status === 'error' && (
                        <Text className="text-xs text-red-500" numberOfLines={1}>{f.error ?? 'Failed'}</Text>
                      )}
                      {f.status === 'done' && (
                        <Text className="text-xs text-green-600 dark:text-green-400">Done</Text>
                      )}
                    </View>
                  </View>
                  {/* Progress bar for actively-processing file */}
                  {isActive && (
                    <View className="mt-2">
                      <ProgressBar
                        progress={f.status === 'uploading' ? uploadProgress : parseProgress}
                        label=""
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {/* Ranking row */}
            {isRanking && (
              <View className="mx-3 mb-3 flex-row items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 dark:bg-indigo-900/20">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Ranking all candidates…
                </Text>
              </View>
            )}

            <View className="h-1" />
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}
