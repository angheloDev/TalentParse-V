import { Platform } from 'react-native';

/** iOS: shift layout. Android: use `softwareKeyboardLayoutMode: "resize"` in app.json; avoid double offset. */
export const keyboardAvoidingBehavior = Platform.OS === 'ios' ? ('padding' as const) : undefined;
