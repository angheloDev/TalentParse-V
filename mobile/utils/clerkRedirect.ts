import * as AuthSession from 'expo-auth-session';

export function clerkOAuthRedirectUri() {
  return AuthSession.makeRedirectUri({
    path: 'oauth-native-callback',
  });
}
