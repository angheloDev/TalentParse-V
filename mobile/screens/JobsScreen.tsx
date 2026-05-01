import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { getSavedJobs, rankCandidates, saveJobAnalysis } from '@/services/resumeApi';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import type { SavedJobAnalysis } from '@/types';
import { keyboardAvoidingBehavior } from '@/utils/keyboardAvoiding';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Sales',
  'Human Resources',
  'Operations',
  'Manufacturing',
  'Other',
] as const;

export function JobsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(false);
  const [savedJobs, setSavedJobs] = useState<SavedJobAnalysis[]>([]);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<(typeof INDUSTRY_OPTIONS)[number] | ''>('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [strengths, setStrengths] = useState('');
  const [otherRequirements, setOtherRequirements] = useState('');
  const jobRole = useAppStore((s) => s.jobRole);
  const setJobRole = useAppStore((s) => s.setJobRole);
  const setRankings = useAppStore((s) => s.setRankings);

  const industry = selectedIndustry === 'Other' ? customIndustry.trim() : selectedIndustry;
  const canAnalyze = Boolean(jobRole.trim() && industry.trim());
  const savedJobsByIndustry = savedJobs.reduce<Record<string, typeof savedJobs>>((acc, job) => {
    const key = job.industry || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});
  const industries = Object.keys(savedJobsByIndustry).sort((a, b) => a.localeCompare(b));

  useFocusEffect(
    useCallback(() => {
      loadSavedJobs();
    }, []),
  );

  async function loadSavedJobs() {
    setLoadingSavedJobs(true);
    try {
      const rows = await getSavedJobs();
      setSavedJobs(rows);
    } catch (e) {
      useToastStore.getState().show({
        title: 'Failed to load saved jobs',
        message: e instanceof Error ? e.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setLoadingSavedJobs(false);
    }
  }

  function buildAnalysisPrompt() {
    const sections = [
      `Industry / Field: ${industry.trim()}`,
      `Job Role:\n${jobRole.trim()}`,
      `Required Skills: ${requiredSkills.length ? requiredSkills.join(', ') : 'Not specified'}`,
      `Years of Experience: ${yearsOfExperience.trim() || 'Not specified'}`,
      `Preferred Strengths: ${strengths.trim() || 'Not specified'}`,
      `Other Requirements: ${otherRequirements.trim() || 'Not specified'}`,
    ];
    return sections.join('\n\n');
  }

  function addRequiredSkill() {
    const value = skillInput.trim();
    if (!value) return;
    const exists = requiredSkills.some((skill) => skill.toLowerCase() === value.toLowerCase());
    if (exists) {
      setSkillInput('');
      return;
    }
    setRequiredSkills((skills) => [...skills, value]);
    setSkillInput('');
  }

  function removeRequiredSkill(skillToRemove: string) {
    setRequiredSkills((skills) => skills.filter((skill) => skill !== skillToRemove));
  }

  async function onAnalyze() {
    if (!industry.trim()) {
      useToastStore.getState().show({
        title: 'Industry is required',
        message: 'Select an industry/field before analyzing.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const analysisPrompt = buildAnalysisPrompt();
      const ranked = await rankCandidates(analysisPrompt);
      setRankings(ranked);
      const saved = await saveJobAnalysis({
        industry: industry.trim(),
        jobRole: jobRole.trim(),
        requiredSkills,
        yearsOfExperience: yearsOfExperience.trim(),
        strengths: strengths.trim(),
        otherRequirements: otherRequirements.trim(),
        rankedCandidateCount: ranked.length,
      });
      setSavedJobs((jobs) => [saved, ...jobs]);
      useToastStore.getState().show({
        title: 'Job role analysis saved',
        message: `Saved ${ranked.length} ranked candidate${ranked.length === 1 ? '' : 's'}.`,
        type: 'success',
      });
      setShowAnalysisForm(false);
      setSelectedIndustry('');
      setCustomIndustry('');
      setRequiredSkills([]);
      setSkillInput('');
      setYearsOfExperience('');
      setStrengths('');
      setOtherRequirements('');
      setJobRole('');
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
            Jobs
          </Text>
          <View className="px-4 pb-4 pt-2">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              View your saved job analyses by industry, or create a new one.
            </Text>
          </View>
          <View className="px-4 pb-8">
            {!showAnalysisForm ? (
              <View className="mb-4">
                <Button className="h-12 rounded-xl dark:bg-primary-dark" onPress={() => setShowAnalysisForm(true)}>
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text className="text-base font-semibold text-white">New Job Analysis</Text>
                  </View>
                </Button>
              </View>
            ) : (
              <View className="mb-4">
                <Pressable
                  onPress={() => setShowAnalysisForm(false)}
                  className="h-11 flex-row items-center justify-center rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                >
                  <MaterialIcons name="arrow-back" size={18} color="#64748b" />
                  <Text className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Back to Saved Jobs</Text>
                </Pressable>
              </View>
            )}

            {showAnalysisForm ? (
              <View className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <Text className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Create Job Analysis</Text>
                <View className="pb-2">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">1) Industry / Field</Text>
                  <View className="mb-2 flex-row flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map((option) => {
                      const isSelected = selectedIndustry === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setSelectedIndustry(option)}
                          className={`rounded-full border px-3 py-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10 dark:border-primary-dark dark:bg-primary-dark/20'
                              : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              isSelected ? 'font-semibold text-primary dark:text-primary-dark' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {selectedIndustry === 'Other' ? (
                    <TextInput
                      value={customIndustry}
                      onChangeText={setCustomIndustry}
                      placeholder="Type your target industry or field"
                      placeholderTextColor="#94a3b8"
                      className="rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  ) : null}
                </View>
                <View className="py-2">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">2) Job Role</Text>
                  <TextInput
                    value={jobRole}
                    onChangeText={setJobRole}
                    placeholder="e.g. Senior Software Engineer"
                    placeholderTextColor="#94a3b8"
                    className="rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </View>
                <View className="py-2">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">3) Required Skills</Text>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      value={skillInput}
                      onChangeText={setSkillInput}
                      onSubmitEditing={addRequiredSkill}
                      placeholder="Type a skill then tap Add"
                      placeholderTextColor="#94a3b8"
                      className="flex-1 rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      returnKeyType="done"
                    />
                    <Pressable
                      onPress={addRequiredSkill}
                      className="h-11 items-center justify-center rounded-lg bg-primary px-4 dark:bg-primary-dark"
                    >
                      <Text className="text-sm font-semibold text-white">Add</Text>
                    </Pressable>
                  </View>
                  {requiredSkills.length > 0 ? (
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {requiredSkills.map((skill) => (
                        <Pressable
                          key={skill}
                          onPress={() => removeRequiredSkill(skill)}
                          className="flex-row items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                        >
                          <Text className="text-sm text-slate-800 dark:text-slate-200">{skill}</Text>
                          <MaterialIcons name="close" size={14} color="#64748b" />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View className="py-2">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">4) Years of Experience</Text>
                  <TextInput
                    value={yearsOfExperience}
                    onChangeText={setYearsOfExperience}
                    placeholder="e.g. 3+ years"
                    placeholderTextColor="#94a3b8"
                    className="rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </View>
                <View className="py-2">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">5) Preferred Strengths</Text>
                  <TextInput
                    multiline
                    value={strengths}
                    onChangeText={setStrengths}
                    placeholder="e.g. leadership, communication, problem solving"
                    placeholderTextColor="#94a3b8"
                    className="min-h-[90px] rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    textAlignVertical="top"
                  />
                </View>
                <View className="py-2">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">6) Other Requirements</Text>
                  <TextInput
                    multiline
                    value={otherRequirements}
                    onChangeText={setOtherRequirements}
                    placeholder="Any certifications, tools, or domain requirements"
                    placeholderTextColor="#94a3b8"
                    className="min-h-[90px] rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    textAlignVertical="top"
                  />
                </View>
                <View className="pt-3">
                  <Button
                    className="h-14 rounded-xl shadow-md dark:bg-primary-dark"
                    onPress={onAnalyze}
                    loading={loading}
                    disabled={loading || !canAnalyze}
                  >
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                      <Text className="text-base font-bold tracking-wide text-white">Analyze Job Role</Text>
                    </View>
                  </Button>
                </View>
              </View>
            ) : loadingSavedJobs ? (
              <View className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <Text className="text-sm text-slate-500 dark:text-slate-400">Loading saved jobs...</Text>
              </View>
            ) : savedJobs.length === 0 ? (
              <View className="rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  No saved jobs yet. Create your first job analysis to get started.
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {industries.map((industryName) => (
                  <View key={industryName}>
                    <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {industryName}
                    </Text>
                    <View className="gap-3">
                      {savedJobsByIndustry[industryName]!.map((job) => (
                        <Pressable
                          key={job.id}
                          onPress={() => router.push(`/job/${job.id}`)}
                          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                        >
                          <View className="flex-row items-center justify-between gap-3">
                            <View className="flex-1">
                              <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{job.jobRole}</Text>
                              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {new Date(job.createdAt).toLocaleDateString()} · {job.rankedCandidateCount} ranked
                              </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className="h-4" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
