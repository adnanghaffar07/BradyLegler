import { NextResponse, type NextRequest } from 'next/server';
import { ensureMetaCookies } from '@/lib/meta/cookies';

/**
 * Ensures `_fbp`/`_fbc` are set as first-party cookies on every
 * server-rendered request, before any client-side JS (or the Meta Pixel
 * script) runs. This is what makes `_fbc` survive the very first landing
 * request from an ad click, redirects (see config/redirects.js), and
 * client-side navigation afterwards (the cookie persists independently of
 * the URL once it's set).
 */
export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  ensureMetaCookies(request, response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (server events read cookies directly, they don't need this)
     * - _next/static, _next/image (static assets)
     * - favicon.ico and other public files with an extension
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ]
};
