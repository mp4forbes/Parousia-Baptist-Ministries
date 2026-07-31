import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_UI_COOKIE, adminUiCookieOptions } from '@/lib/admin-cookies';

const ADMIN_RETURN_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 8,
  path: '/',
};

function markReturnToSite(response: NextResponse) {
  response.cookies.set('admin_return_to', 'site', ADMIN_RETURN_COOKIE);
}

function syncAdminUiCookie(request: NextRequest, response: NextResponse) {
  const hasAdminSession = Boolean(request.cookies.get('admin_auth')?.value);

  if (hasAdminSession) {
    response.cookies.set(ADMIN_UI_COOKIE, '1', adminUiCookieOptions());
    return;
  }

  if (request.cookies.get(ADMIN_UI_COOKIE)) {
    response.cookies.delete(ADMIN_UI_COOKIE);
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAdminSession = Boolean(request.cookies.get('admin_auth')?.value);
  const response = NextResponse.next();

  syncAdminUiCookie(request, response);

  if (hasAdminSession && (pathname === '/' || pathname.startsWith('/admin'))) {
    markReturnToSite(response);
  }

  if (pathname === '/admin' && request.nextUrl.searchParams.get('from') === 'site') {
    markReturnToSite(response);
  }

  return response;
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*'],
};
