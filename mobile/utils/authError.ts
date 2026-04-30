type AuthErrorLike = {
  errors?: Array<{ message?: string; longMessage?: string; code?: string }>;
  message?: string;
  networkError?: { message?: string };
};

export function getAuthErrorMessage(error: unknown) {
  const e = error as AuthErrorLike;
  const raw = `${e?.message ?? ''} ${e?.networkError?.message ?? ''}`.toLowerCase();
  if (raw.includes('network request failed') || raw.includes('failed to fetch')) {
    return 'Cannot connect to local server. Make sure your API is running and EXPO_PUBLIC_GRAPHQL_URL points to your localhost GraphQL endpoint.';
  }
  const first = e?.errors?.[0];
  return first?.longMessage || first?.message || e?.message || 'Request failed';
}

