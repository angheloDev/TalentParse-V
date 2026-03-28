import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/useToastStore';
import { cn } from '@/utils/cn';

const TAB_BAR_CLEARANCE = 88;

function ToastCard(props: {
  title: string;
  message?: string;
  type: 'error' | 'success' | 'info';
  onDismiss: () => void;
  index: number;
}) {
  const slide = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slide, opacity]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [24 + props.index * 8, 0] });

  const accent =
    props.type === 'error'
      ? 'bg-red-500'
      : props.type === 'success'
        ? 'bg-emerald-500'
        : 'bg-primary dark:bg-primary-dark';

  const icon =
    props.type === 'error' ? 'error-outline' : props.type === 'success' ? 'check-circle' : 'info-outline';

  const iconColor =
    props.type === 'error' ? '#dc2626' : props.type === 'success' ? '#059669' : '#259df4';

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
      className="mb-3 overflow-hidden rounded-2xl shadow-xl"
    >
      <View
        className={cn(
          'flex-row overflow-hidden rounded-2xl border bg-white dark:bg-slate-900',
          props.type === 'error'
            ? 'border-red-100 dark:border-red-900/60'
            : props.type === 'success'
              ? 'border-emerald-100 dark:border-emerald-900/50'
              : 'border-slate-200 dark:border-slate-700'
        )}
      >
        <View className={cn('w-1.5 self-stretch', accent)} />
        <View className="flex-1 flex-row items-start gap-3 px-3 py-3.5">
          <View
            className={cn(
              'size-10 items-center justify-center rounded-full',
              props.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/80'
                : props.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80'
                  : 'bg-sky-50 dark:bg-sky-950/50'
            )}
          >
            <MaterialIcons name={icon} size={22} color={iconColor} />
          </View>
          <View className="min-w-0 flex-1 pt-0.5">
            <Text className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-50">
              {props.title}
            </Text>
            {props.message ? (
              <Text className="mt-1 text-sm leading-snug text-slate-600 dark:text-slate-400">{props.message}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={props.onDismiss}
            hitSlop={12}
            className="size-9 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
          >
            <MaterialIcons name="close" size={20} color="#94a3b8" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  if (!items.length) return null;

  const topAnchored = keyboardVisible;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-[200] px-4"
      style={
        topAnchored
          ? { top: insets.top + 8, bottom: undefined }
          : { bottom: insets.bottom + TAB_BAR_CLEARANCE, top: undefined }
      }
    >
      {items.map((t, i) => (
        <ToastCard
          key={t.id}
          index={i}
          title={t.title}
          message={t.message}
          type={t.type ?? 'info'}
          onDismiss={() => remove(t.id)}
        />
      ))}
    </View>
  );
}
