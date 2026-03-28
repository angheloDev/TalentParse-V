import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/Button';
import { getEmbeddings, parseResume, uploadResume } from '@/services/resumeApi';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';

export function UploadScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const uploadProgress = useAppStore((s) => s.uploadProgress);
  const parseProgress = useAppStore((s) => s.parseProgress);
  const lastFileName = useAppStore((s) => s.lastFileName);
  const setUploadProgress = useAppStore((s) => s.setUploadProgress);
  const setParseProgress = useAppStore((s) => s.setParseProgress);
  const setLastFileName = useAppStore((s) => s.setLastFileName);
  const setLatestParsed = useAppStore((s) => s.setLatestParsed);
  const addUploadedResume = useAppStore((s) => s.addUploadedResume);
  const setEmbeddingsReady = useAppStore((s) => s.setEmbeddingsReady);

  async function onBrowse() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const mime = asset.mimeType ?? 'application/octet-stream';
    setBusy(true);
    setLastFileName(asset.name);
    setUploadProgress(0);
    setParseProgress(0);
    const upTimer = setInterval(() => {
      setUploadProgress((p) => Math.min(90, p + 8));
    }, 180);
    try {
      const up = await uploadResume({ uri: asset.uri, name: asset.name, mimeType: mime });
      clearInterval(upTimer);
      setUploadProgress(100);
      addUploadedResume({
        id: up.id,
        fileName: up.fileName,
        mimeType: up.mimeType,
        uri: asset.uri,
        uploadedAt: new Date().toISOString(),
      });
      let text = '';
      if (mime === 'text/plain') {
        try {
          text = await FileSystem.readAsStringAsync(asset.uri);
        } catch {
          text = '';
        }
      }
      const prTimer = setInterval(() => {
        setParseProgress((p) => Math.min(90, p + 10));
      }, 160);
      const parsed = await parseResume(text || ' ', asset.name);
      clearInterval(prTimer);
      setParseProgress(100);
      setLatestParsed(parsed);
      await getEmbeddings(parsed as unknown as Record<string, unknown>);
      setEmbeddingsReady(true);
      router.push('/parse-result');
    } catch (e) {
      clearInterval(upTimer);
      useToastStore.getState().show({
        title: 'Upload failed',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-background-light pb-24 dark:bg-background-dark">
      <AppHeader showBack title="TalentParse Upload" />
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>
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
            disabled={busy}
          >
            Browse Files
          </Button>
        </View>
        <View className="mt-4 gap-3">
          <ProgressBar
            progress={busy || lastFileName ? (uploadProgress >= 100 ? parseProgress : uploadProgress) : 0}
            label={lastFileName ? `Parsing ${lastFileName}` : 'Parsing Data'}
            sublabel={lastFileName ? undefined : 'Select a file to begin'}
          />
        </View>
      </ScrollView>
    </View>
  );
}
