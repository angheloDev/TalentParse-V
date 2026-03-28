type ClerkErrorLike = {
  errors?: Array<{ message?: string; longMessage?: string; code?: string }>;
  message?: string;
};

export function getAuthErrorMessage(error: unknown) {
  const e = error as ClerkErrorLike;
  const first = e?.errors?.[0];
  return first?.longMessage || first?.message || e?.message || 'Request failed';
}

export function isInvalidUsernameParam(error: unknown) {
  const e = error as ClerkErrorLike;
  const first = e?.errors?.[0];
  const msg = `${first?.longMessage ?? ''} ${first?.message ?? ''} ${e?.message ?? ''}`.toLowerCase();
  return msg.includes('username is not a valid parameter');
}

