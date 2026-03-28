import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { cn } from '@/utils/cn';

export function PasswordField(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  containerClassName?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View className={cn(props.containerClassName)}>
      <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{props.label}</Text>
      <View className="flex-row items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
        <TextInput
          secureTextEntry={!visible}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder ?? '••••••••'}
          placeholderTextColor="#94a3b8"
          className="min-h-[48px] flex-1 px-4 py-3 text-slate-900 dark:text-slate-100"
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          className="justify-center px-3 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={22} color="#64748b" />
        </Pressable>
      </View>
    </View>
  );
}
