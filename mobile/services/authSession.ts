import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
let authToken: string | null = null;

export async function loadAuthToken() {
  authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return authToken;
}

export function getAuthToken() {
  return authToken;
}

export async function saveAuthToken(token: string) {
  authToken = token;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  authToken = null;
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
