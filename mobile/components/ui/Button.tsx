import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-primary dark:bg-primary-dark active:opacity-90',
  secondary: 'bg-neutral-200 dark:bg-neutral-800 active:opacity-80',
  outline: 'border border-slate-300 dark:border-slate-600 bg-transparent',
  ghost: 'bg-transparent',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-white font-bold',
  secondary: 'text-slate-800 dark:text-slate-100 font-semibold',
  outline: 'text-slate-900 dark:text-slate-100 font-semibold',
  ghost: 'text-slate-700 dark:text-slate-200 font-medium',
};

export function Button(props: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const v = props.variant ?? 'primary';
  return (
    <Pressable
      disabled={props.disabled || props.loading}
      onPress={props.onPress}
      className={cn(
        'flex-row items-center justify-center rounded-xl px-4 py-3',
        variants[v],
        (props.disabled || props.loading) && 'opacity-50',
        props.className
      )}
    >
      {props.loading ? (
        <ActivityIndicator color={v === 'primary' ? '#fff' : '#259df4'} />
      ) : typeof props.children === 'string' ? (
        <Text className={cn('text-base', textVariants[v], props.textClassName)}>{props.children}</Text>
      ) : (
        props.children
      )}
    </Pressable>
  );
}
