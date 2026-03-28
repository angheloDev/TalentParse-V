import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/utils/cn';

export function Card(props: { children: ReactNode; className?: string }) {
  return (
    <View
      className={cn(
        'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
        props.className
      )}
    >
      {props.children}
    </View>
  );
}
