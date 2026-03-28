import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

export function AppHeader(props: {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  right?: React.ReactNode;
  centerTitle?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = () => {
    if (props.onBackPress) {
      props.onBackPress();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/dashboard');
  };
  const topPad = insets.top + 10;
  return (
    <View
      style={{ paddingTop: topPad }}
      className={cn(
        'flex-row items-center border-b border-neutral-200 bg-white px-2 pb-2 dark:border-neutral-800 dark:bg-background-dark',
        props.className
      )}
    >
      {props.showBack ? (
        <Pressable onPress={goBack} className="size-12 items-center justify-center rounded-full">
          <MaterialIcons name="arrow-back" size={24} color="#64748b" />
        </Pressable>
      ) : (
        <View className="size-12 items-center justify-center">
          <MaterialIcons name="menu" size={24} color="#64748b" />
        </View>
      )}
      <Text
        className={cn(
          'flex-1 text-lg font-bold text-neutral-900 dark:text-neutral-100',
          props.centerTitle && 'text-center pr-12'
        )}
        numberOfLines={1}
      >
        {props.title}
      </Text>
      <View className="min-w-12 items-end justify-center">{props.right}</View>
    </View>
  );
}
