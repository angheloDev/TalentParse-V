export type ThemePreference = 'light' | 'dark' | 'system';

export function resolveAppearance(
  preference: ThemePreference,
  system: 'light' | 'dark' | null | undefined
): 'light' | 'dark' {
  const sys = system === 'dark' ? 'dark' : 'light';
  if (preference === 'system') return sys;
  return preference;
}
