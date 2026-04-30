import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { SubNavBar } from '@/components/SubNavBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';

export function ParseResultScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'visual' | 'json'>('visual');
  const latest = useAppStore((s) => s.latestParsed);
  const lastFileName = useAppStore((s) => s.lastFileName);
  const parseProgress = useAppStore((s) => s.parseProgress);

  const json = latest
    ? JSON.stringify(
        {
          candidate: {
            personal_info: {
              first_name: latest.personalInfo.firstName,
              last_name: latest.personalInfo.lastName,
              email: latest.personalInfo.email,
              phone: latest.personalInfo.phone,
              location: latest.personalInfo.location,
            },
            skills: latest.skills,
            tech_stack: latest.techStack,
            experience_level: latest.experienceLevel,
            experience: latest.experience,
            education: latest.education,
          },
          meta: latest.meta,
        },
        null,
        2
      )
    : '{}';

  if (!latest) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <Text className="text-slate-600 dark:text-slate-400">No parsed data. Upload a resume first.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <AppHeader showBack title="TalentParse" centerTitle />
      <ScrollView className="flex-1 pb-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-4">
          <ProgressBar
            progress={parseProgress}
            label={`Parsing ${lastFileName ?? 'resume'}...`}
          />
        </View>
        <View className="px-4 pb-2">
          <Card className="overflow-hidden border-slate-200">
            <View className="flex-row items-start gap-3 p-5">
              <MaterialIcons name="check-circle" size={22} color="#16a34a" />
              <View className="flex-1">
                <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">Success!</Text>
                <Text className="mt-1 pl-1 text-sm text-slate-700 dark:text-slate-300">
                  Resume parsed successfully. Data extracted and mapped.
                </Text>
              </View>
            </View>
          </Card>
        </View>
        <View className="border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row px-4">
            <Pressable onPress={() => setTab('visual')} className="mr-8 pb-3 pt-4">
              <Text
                className={`text-sm font-bold ${
                  tab === 'visual' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Extracted Data
              </Text>
              {tab === 'visual' ? <View className="mt-2 h-[3px] rounded-full bg-primary dark:bg-primary-dark" /> : null}
            </Pressable>
            <Pressable onPress={() => setTab('json')} className="pb-3 pt-4">
              <Text
                className={`text-sm font-bold ${
                  tab === 'json' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Raw JSON
              </Text>
              {tab === 'json' ? <View className="mt-2 h-[3px] rounded-full bg-primary dark:bg-primary-dark" /> : null}
            </Pressable>
          </View>
        </View>
        {tab === 'visual' ? (
          <View className="gap-4 p-4">
            <Section title="Skills" pills={latest.skills} />
            <Section title="Tech stack" pills={latest.techStack} />
            <Card className="p-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Experience level</Text>
              <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">{latest.experienceLevel}</Text>
            </Card>
            <Card className="p-4">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Education</Text>
              {latest.education.map((e, i) => (
                <View key={i} className="mb-3 border-b border-slate-100 pb-3 last:mb-0 last:border-0 dark:border-slate-800">
                  <Text className="font-semibold text-slate-900 dark:text-slate-100">{e.institution}</Text>
                  <Text className="text-sm text-slate-600 dark:text-slate-400">{e.degree}</Text>
                  {e.year != null ? <Text className="text-xs text-slate-500">{e.year}</Text> : null}
                </View>
              ))}
            </Card>
          </View>
        ) : (
          <View className="p-4">
            <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <Text className="font-mono text-xs text-slate-500">candidate_profile.json</Text>
                <View className="flex-row gap-1">
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(json);
                      useToastStore.getState().show({ title: 'Copied', type: 'success' });
                    }}
                    className="rounded-md p-1.5"
                  >
                    <MaterialIcons name="content-copy" size={18} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>
              <ScrollView horizontal className="max-h-96">
                <Text className="p-4 font-mono text-xs text-slate-800 dark:text-slate-200">{json}</Text>
              </ScrollView>
            </Card>
          </View>
        )}
        <View className="px-4 pt-2">
          <Button
            className="flex-row gap-2 rounded-xl py-3 dark:bg-primary-dark"
            onPress={() => {
              useToastStore.getState().show({ title: 'Candidate profile saved', type: 'success' });
              router.push('/jobs');
            }}
          >
            <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
            <Text className="text-base font-semibold text-white">Save Candidate Profile</Text>
          </Button>
        </View>
      </ScrollView>
      <SubNavBar active="upload" />
    </View>
  );
}

function Section(props: { title: string; pills: string[] }) {
  return (
    <Card className="p-4">
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{props.title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {props.pills.map((p) => (
          <View key={p} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-slate-700 dark:bg-slate-800">
            <Text className="text-sm text-slate-800 dark:text-slate-200">{p}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
