export const ADMIN_UI_COOKIE = 'admin_ui';
export const ADMIN_UI_STORAGE_KEY = 'parousia_admin_ui';

export function adminUiCookieOptions(maxAgeSeconds = 60 * 60 * 8) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
  };
}

export function hasAdminUiCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => part.trim() === `${ADMIN_UI_COOKIE}=1`);
}

export function setAdminUiClient(maxAgeSeconds = 60 * 60 * 8): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_UI_COOKIE}=1; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  try {
    localStorage.setItem(ADMIN_UI_STORAGE_KEY, '1');
  } catch {
    // Ignore storage failures in private browsing.
  }
}

export function clearAdminUiClient(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_UI_COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    localStorage.removeItem(ADMIN_UI_STORAGE_KEY);
  } catch {
    // Ignore storage failures in private browsing.
  }
}

export function hasAdminUiClient(): boolean {
  if (typeof document === 'undefined') return false;
  if (hasAdminUiCookie(document.cookie)) return true;
  try {
    return localStorage.getItem(ADMIN_UI_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
