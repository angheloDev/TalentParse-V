import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

const HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqogotkSrqDWT3omJgts6XwxQKNLHRM5Eq7cSnmo04DEp4bSbwZPwfGfljjPYKxBjbB1_nXiWOYGneSyEVGH9xHfIparOGsTss5OaDSqHB5I6k3kmPw9LF3VrE1O-Fat2VmiNjSTAR-77cYNm6bf2UAHQZ7NUPGxgP0o1-h0cvM3ZDZXzJhXLdbnUAj4zFriW6mZRPVRbnJ2KS8FecWco-vkJEXF0ZmNHdGacJVAzOq_9aQNLXd4ZpWc1SHHbZYIn3cBY6dkdeQVdf';

const PRICING_ROW_BREAKPOINT = 560;

export function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const pricingSideBySide = windowWidth >= PRICING_ROW_BREAKPOINT;
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between border-b border-gray-200 bg-background-light/90 px-4 pb-2 dark:border-gray-800 dark:bg-background-dark/90"
      >
        <Text className="flex-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          TalentParse
        </Text>
        <Pressable className="size-10 items-center justify-center rounded-lg">
          <MaterialIcons name="menu" size={22} color="#64748b" />
        </Pressable>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="relative min-h-[420px] justify-end overflow-hidden px-4 pb-10">
          <ImageBackground source={{ uri: HERO }} className="absolute inset-0" resizeMode="cover">
            <View className="absolute inset-0 bg-black/50" />
          </ImageBackground>
          <View className="relative z-10 gap-3">
            <Text className="text-4xl font-black leading-tight tracking-tight text-white">
              AI-Powered Resume Skill Extraction
            </Text>
            <Text className="max-w-xl text-base leading-relaxed text-gray-200">
              Automatically parse resumes, extract key skills, and rank candidates instantly with TalentParse.
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-3">
              <Button
                className="rounded-lg px-6 py-3 shadow-lg"
                onPress={() => router.push('/sign-in')}
                textClassName="text-base"
              >
                Get Started
              </Button>
              <Pressable className="items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 py-3">
                <Text className="text-base font-bold text-white">View Demo</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => router.push('/sign-up')} className="mt-4 self-start">
              <Text className="text-base font-semibold text-white/90 underline">Create an account</Text>
            </Pressable>
          </View>
        </View>
        <View className="gap-8 px-4 py-12">
          <View className="gap-3">
            <Text className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Smarter Candidate Screening
            </Text>
            <Text className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Our minimalist platform simplifies the hiring process.
            </Text>
          </View>
          <View className="gap-6">
            <Feature
              title="Skill Extraction"
              body="Instantly parse resumes and extract technical and soft skills with AI."
            />
            <Feature
              title="Candidate Ranking"
              body="Automatically rank candidates based on role requirements."
            />
            <Feature title="Seamless Integration" body="Integrate easily with your existing ATS or workflow." />
          </View>
        </View>
        <View className="border-y border-gray-100 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-900">
          <View className="mb-8 w-full items-center gap-3 px-1">
            <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Simple Pricing</Text>
            <Text className="text-center text-base text-slate-600 dark:text-slate-400">
              Choose the plan that fits your team.
            </Text>
          </View>
          <View
            className={cn('w-full', pricingSideBySide ? 'flex-row items-stretch gap-4' : 'flex-col gap-5')}
          >
            <Card
              className={cn(
                'min-h-0 flex-col gap-6 border-gray-200 p-5 dark:border-gray-700 dark:bg-background-dark',
                pricingSideBySide ? 'flex-1' : 'w-full'
              )}
            >
              <View className="flex-1 gap-5">
                <View className="gap-2">
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">Starter</Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">$49</Text>
                    <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">/mo</Text>
                  </View>
                </View>
                <View className="gap-3">
                  <PricingRow text="Up to 500 resumes/mo" />
                  <PricingRow text="Basic Skill Extraction" />
                  <PricingRow text="Email Support" />
                </View>
              </View>
              <Pressable className="h-12 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">Start Free Trial</Text>
              </Pressable>
            </Card>
            <Card
              className={cn(
                'relative min-h-0 flex-col gap-6 border-2 border-primary p-5 dark:bg-gray-900',
                pricingSideBySide ? 'flex-1' : 'w-full'
              )}
            >
              <View className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 dark:bg-primary-dark">
                <Text className="text-xs font-bold uppercase tracking-wider text-white">Most Popular</Text>
              </View>
              <View className="flex-1 gap-5">
                <View className="gap-2">
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">Pro</Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">$149</Text>
                    <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">/mo</Text>
                  </View>
                </View>
                <View className="gap-3">
                  <PricingRow text="Unlimited resumes" />
                  <PricingRow text="Advanced Skill Extraction & Ranking" />
                  <PricingRow text="Priority Support" />
                  <PricingRow text="ATS Integration" />
                </View>
              </View>
              <Pressable className="h-12 w-full items-center justify-center rounded-lg bg-primary dark:bg-primary-dark">
                <Text className="text-sm font-bold text-white">Get Pro</Text>
              </Pressable>
            </Card>
          </View>
        </View>
        <View className="items-center gap-6 border-t border-gray-200 bg-background-light px-5 py-8 dark:border-gray-800 dark:bg-background-dark">
          <View className="flex-row flex-wrap items-center justify-center gap-6">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Privacy Policy</Text>
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Terms of Service</Text>
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Contact Us</Text>
          </View>
          <Text className="text-sm text-slate-400 dark:text-slate-500">© 2026 TalentParse. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Feature(props: { title: string; body: string }) {
  return (
    <View className="gap-4">
      <View className="aspect-video w-full rounded-xl border border-gray-100 bg-slate-100 dark:border-gray-800 dark:bg-slate-800" />
      <View>
        <Text className="mb-1 text-lg font-bold text-slate-900 dark:text-white">{props.title}</Text>
        <Text className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{props.body}</Text>
      </View>
    </View>
  );
}

function PricingRow(props: { text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <MaterialIcons name="check-circle" size={20} color="#259df4" />
      <Text className="flex-1 text-sm text-slate-700 dark:text-slate-300">{props.text}</Text>
    </View>
  );
}
