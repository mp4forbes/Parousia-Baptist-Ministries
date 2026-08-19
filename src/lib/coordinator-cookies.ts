export const COORDINATOR_UI_COOKIE = 'coordinator_ui';
export const COORDINATOR_UI_STORAGE_KEY = 'parousia_coordinator_ui';

export function coordinatorUiCookieOptions(maxAgeSeconds = 60 * 60 * 8) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
  };
}

export function setCoordinatorUiClient(maxAgeSeconds = 60 * 60 * 8): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COORDINATOR_UI_COOKIE}=1; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  try {
    localStorage.setItem(COORDINATOR_UI_STORAGE_KEY, '1');
  } catch {
    // Ignore storage failures in private browsing.
  }
}

export function clearCoordinatorUiClient(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COORDINATOR_UI_COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    localStorage.removeItem(COORDINATOR_UI_STORAGE_KEY);
  } catch {
    // Ignore storage failures in private browsing.
  }
}
