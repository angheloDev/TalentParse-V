import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

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

/** Safe filename segment for cache paths (Android content:// must be copied before read — see expo filesystem-legacy URI table). */
function safeCacheFileSegment(name: string): string {
  const base = (name || 'file').replace(/[/\\?*:|"<>]/g, '_').replace(/\s+/g, '_');
  return base.slice(0, 96) || 'file';
}

/**
 * On Android, `content://` URIs cannot be read with `readAsStringAsync`; `copyAsync` supports them.
 * Try direct read first on `file://`, otherwise copy into cache and read from there.
 */
async function readUriAsBase64(
  uri: string,
  displayName: string,
): Promise<{ base64: string; localFileUri?: string } | undefined> {
  const cacheDir = FileSystem.cacheDirectory;
  const tryRead = async (u: string) => {
    try {
      const s = await FileSystem.readAsStringAsync(u, {
        encoding: FileSystem.EncodingType.Base64,
      });
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

  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    return copyThenRead();
  }

  const direct = await tryRead(uri);
  if (direct) return { base64: direct };

  return copyThenRead();
}

async function readUriAsUtf8Text(uri: string, displayName: string): Promise<{ text: string; localFileUri?: string }> {
  const cacheDir = FileSystem.cacheDirectory;
  const tryRead = async (u: string) => {
    try {
      return await FileSystem.readAsStringAsync(u);
    } catch {
      return '';
    }
  };

  const copyThenRead = async (): Promise<{ text: string; localFileUri: string } | undefined> => {
    if (!cacheDir) return undefined;
    const dest = `${cacheDir}tp-txt-${Date.now()}-${safeCacheFileSegment(displayName)}`;
    try {
      await FileSystem.copyAsync({ from: uri, to: dest });
      const t = await tryRead(dest);
      return { text: t, localFileUri: dest };
    } catch {
      return undefined;
    }
  };

  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    const copied = await copyThenRead();
    if (copied) return copied;
    return { text: '' };
  }

  const direct = await tryRead(uri);
  if (direct.trim()) return { text: direct };

  const fallback = await copyThenRead();
  if (fallback) return fallback;

  return { text: '' };
}

/**
 * Infer resume type from filename and MIME. Extension wins; MIME covers Android providers that omit extensions.
 * OS often sends application/octet-stream — then we rely on .pdf / .docx / .txt in the name.
 */
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
  ) {
    return 'docx';
  }
  if (m === 'text/plain' || m.startsWith('text/')) return 'txt';
  if (m.includes('pdf')) return 'pdf';
  if (m.includes('wordprocessingml') || m.includes('officedocument.wordprocessingml')) return 'docx';

  return 'unknown';
}

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
  const setLatestUploadJobContext = useAppStore((s) => s.setLatestUploadJobContext);

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

    // Android: strict MIME filters often prevent the picker from returning a selection when tapping a file.
    // Expo recommends '*/*' on Android; we validate PDF/DOCX/TXT after selection.
    let res: DocumentPicker.DocumentPickerResult;
    try {
      res = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === 'android' ? '*/*' : ['application/pdf', 'text/plain', DOCX_MIME, 'application/octet-stream'],
        copyToCacheDirectory: true,
      });
    } catch (e) {
      useToastStore.getState().show({
        title: 'Could not open file picker',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
      return;
    }
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) {
      useToastStore.getState().show({
        title: 'Could not read file',
        message: 'No file was returned from the picker. Try again.',
        type: 'error',
      });
      return;
    }
    const mime = asset.mimeType ?? 'application/octet-stream';
    const kind = inferResumeKind(asset.name, mime);
    if (kind === 'unknown') {
      useToastStore.getState().show({
        title: 'Unsupported file',
        message: 'Use a .pdf, .docx, or .txt resume.',
        type: 'error',
      });
      return;
    }

    let text = '';
    let pdfBase64: string | undefined;
    let uploadUri = asset.uri;

    if (kind === 'txt') {
      const t = await readUriAsUtf8Text(asset.uri, asset.name);
      text = t.text.trim();
      if (t.localFileUri) uploadUri = t.localFileUri;
    }
    if (kind === 'pdf' || kind === 'docx') {
      const bin = await readUriAsBase64(asset.uri, asset.name);
      pdfBase64 = bin?.base64;
      if (bin?.localFileUri) uploadUri = bin.localFileUri;
      if (!pdfBase64) {
        useToastStore.getState().show({
          title: 'Could not read file',
          message: 'Unable to load file contents from disk. Try copying the file to Downloads and pick again.',
          type: 'error',
        });
        return;
      }
    }

    const normalizedText = text.trim();
    const metadataFingerprint = `${asset.name}:${asset.size ?? 'na'}:${asset.lastModified ?? 'na'}:${mime}`;
    const hashPayload =
      kind === 'pdf'
        ? pdfBase64
          ? `pdf:${pdfBase64}`
          : `pdf-meta:${metadataFingerprint}`
        : kind === 'docx'
          ? pdfBase64
            ? `docx:${pdfBase64}`
            : `docx-meta:${metadataFingerprint}`
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
      const uploadMime =
        kind === 'pdf' ? 'application/pdf' : kind === 'docx' ? DOCX_MIME : kind === 'txt' ? 'text/plain' : mime;
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
      setIsParsing(true);
      prTimer = setInterval(() => {
        setParseProgress((p) => Math.min(90, p + 10));
      }, 160);
      let parsed: ParsedResume;
      if (kind === 'pdf' && pdfBase64) {
        const parsedFile = await parseResumeFile(pdfBase64, asset.name, 'application/pdf');
        const fallbackParsed = await parseResume('', asset.name, pdfBase64, 'application/pdf', up.id);
        const [firstName = 'Unknown', ...restName] = parsedFile.name.trim().split(/\s+/);
        parsed = {
          personalInfo: {
            firstName: parsedFile.name.trim() ? firstName : fallbackParsed.personalInfo.firstName,
            lastName: parsedFile.name.trim() ? restName.join(' ') || 'Candidate' : fallbackParsed.personalInfo.lastName,
            email: parsedFile.email || fallbackParsed.personalInfo.email,
            phone: fallbackParsed.personalInfo.phone,
            location: fallbackParsed.personalInfo.location,
          },
          skills: parsedFile.skills.length ? parsedFile.skills : fallbackParsed.skills,
          techStack: parsedFile.skills.length ? parsedFile.skills.slice(0, 6) : fallbackParsed.techStack,
          experienceLevel: parsedFile.experience || fallbackParsed.experienceLevel || 'Not specified',
          education: fallbackParsed.education,
          experience: [
            {
              company: fallbackParsed.experience[0]?.company || 'Not specified',
              title: parsedFile.experience || fallbackParsed.experience[0]?.title || 'Not specified',
            },
          ],
          achievements: fallbackParsed.achievements,
          projects: fallbackParsed.projects,
          meta: { confidenceScore: parsedFile.skills.length || fallbackParsed.skills.length ? 0.9 : 0.7 },
        };
      } else if (kind === 'docx' && pdfBase64) {
        parsed = await parseResume('', asset.name, pdfBase64, DOCX_MIME, up.id);
      } else {
        parsed = await parseResume(text || '', asset.name, pdfBase64, mime, up.id);
      }
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
      setLatestUploadJobContext({
        jobId: selectedJob.id,
        industry: selectedJob.industry,
        jobRole: selectedJob.jobRole,
        requiredSkills: selectedJob.requiredSkills,
        yearsOfExperience: selectedJob.yearsOfExperience,
        strengths: selectedJob.strengths,
        otherRequirements: selectedJob.otherRequirements,
        uploadedResumeId: up.id,
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
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400">Upload PDF, DOCX, or TXT</Text>
          </View>
          <Button
            className="relative z-10 min-w-[120px] rounded-lg px-6 py-2.5 dark:bg-primary-dark"
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
        {isParsing ? (
          <View className="mt-4 gap-3">
            <ProgressBar progress={parseProgress} label={lastFileName ? `Parsing ${lastFileName}` : 'Parsing Data'} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
