import { Redirect } from 'expo-router';

export default function OAuthNativeCallbackScreen() {
  return <Redirect href="/sign-in" />;
}
