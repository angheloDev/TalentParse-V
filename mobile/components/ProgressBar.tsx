import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export function ProgressBar(props: {
  progress: number;
  label?: string;
  sublabel?: string;
  className?: string;
  trackClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(props.progress)));
  return (
    <View className={cn('gap-2', props.className)}>
      {(props.label || props.sublabel) && (
        <View className="flex-row items-end justify-between">
          <View className="flex-1 pr-2">
            {props.label ? (
              <Text className="text-base font-medium text-slate-900 dark:text-slate-100">{props.label}</Text>
            ) : null}
            {props.sublabel ? (
              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{props.sublabel}</Text>
            ) : null}
          </View>
          <Text className="text-sm font-bold text-primary dark:text-primary-dark">{pct}%</Text>
        </View>
      )}
      <View
        className={cn(
          'h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-primary-dark/20',
          props.trackClassName
        )}
      >
        <View
          className="h-full rounded-full bg-primary dark:bg-primary-dark"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
