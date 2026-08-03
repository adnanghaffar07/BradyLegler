/**
 * Shared `_fbp` / `_fbc` cookie helpers.
 *
 * Browser helpers read/write `document.cookie` directly. Server helpers read
 * from the `NextRequest` cookie jar (Route Handlers) or set cookies on a
 * `NextResponse` (middleware), so both sides of the app agree on the same
 * cookie names, format, and TTL.
 */
import type { NextRequest, NextResponse } from 'next/server';

const FBP_COOKIE = '_fbp';
const FBC_COOKIE = '_fbc';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // matches Meta's own _fbp/_fbc TTL

// Same cookie tools/analytics/hooks/useAnalytics.ts uses for GA/GTM's client_id.
// Reusing it as Meta's `external_id` gives every event a stable per-visitor
// identifier (Meta allows any persistent ID here, not just a logged-in
// customer id) without introducing a second redundant cookie.
const CLIENT_ID_COOKIE = 'bl_client_id';
const CLIENT_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 730;

export function generateFbp(): string {
  // Meta's fb.subdomainIndex.creationTime.value format requires creationTime
  // in milliseconds. Using Unix seconds here makes Meta parse it as a date in
  // 1970, which is exactly the "creationTime before click ID was created" CAPI error.
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1_000_000_000);
  return `fb.1.${timestamp}.${random}`;
}

export function buildFbcFromFbclid(fbclid: string): string {
  const timestamp = Date.now();
  return `fb.1.${timestamp}.${fbclid}`;
}

/** Extract the fbclid segment from an existing `_fbc` cookie value, if present. */
function extractFbclid(fbc: string | undefined): string | undefined {
  if (!fbc) return undefined;
  const parts = fbc.split('.');
  return parts.length >= 4 ? parts.slice(3).join('.') : undefined;
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
  if (!match) return undefined;
  const value = match.slice(name.length + 1).trim();
  return value.length ? value : undefined;
}

function writeBrowserCookie(name: string, value: string, maxAgeSeconds: number = COOKIE_MAX_AGE_SECONDS): void {
  if (typeof document === 'undefined') return;
  try {
    const secureFlag = window.location.protocol === 'https:' ? ' Secure; SameSite=None;' : '';
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds};${secureFlag}`;
  } catch (error) {
    console.warn(`[Meta] Failed to persist ${name} cookie`, error);
  }
}

export function getFbpCookie(): string | undefined {
  return readBrowserCookie(FBP_COOKIE);
}

export function getFbcCookie(): string | undefined {
  return readBrowserCookie(FBC_COOKIE);
}

/**
 * Read the existing `bl_client_id` cookie (set by useAnalytics' GA/GTM
 * tracking), or create + persist one. Used as Meta's `external_id` so every
 * event carries a stable per-visitor identifier, not just the rare event
 * where a form has already collected an email/phone.
 */
export function getOrCreateClientId(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const existing = readBrowserCookie(CLIENT_ID_COOKIE);
  if (existing) return existing;

  const id = `${Math.floor(Math.random() * 1_000_000_000)}-${Date.now()}`;
  writeBrowserCookie(CLIENT_ID_COOKIE, id, CLIENT_ID_MAX_AGE_SECONDS);
  return id;
}

export function getFbclidFromLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return new URLSearchParams(window.location.search).get('fbclid') || undefined;
}

/** Read the existing `_fbp` cookie, or generate + persist a new one. */
export function getOrCreateFbp(): string {
  const existing = getFbpCookie();
  if (existing) return existing;

  const fbp = generateFbp();
  writeBrowserCookie(FBP_COOKIE, fbp);
  return fbp;
}

/**
 * Read the existing `_fbc` cookie, or derive + persist one from `?fbclid=`.
 * Middleware already sets `_fbc` on the very first server-rendered request, so
 * this is mainly a fallback for cases where middleware didn't run (e.g. a
 * static export or a cached page) or cookies were blocked on first load.
 */
export function getOrCreateFbc(): string | undefined {
  const existing = getFbcCookie();
  if (existing) return existing;

  const fbclid = getFbclidFromLocation();
  if (!fbclid) return undefined;

  const fbc = buildFbcFromFbclid(fbclid);
  writeBrowserCookie(FBC_COOKIE, fbc);
  return fbc;
}

// ---------------------------------------------------------------------------
// Server (Route Handlers)
// ---------------------------------------------------------------------------

/** Read `_fbp`/`_fbc` cookies from an incoming Route Handler request. */
export function getServerMetaCookies(request: NextRequest): { fbp?: string; fbc?: string } {
  return {
    fbp: request.cookies.get(FBP_COOKIE)?.value || undefined,
    fbc: request.cookies.get(FBC_COOKIE)?.value || undefined
  };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Ensure `_fbp`/`_fbc` exist as first-party cookies on the response, deriving
 * `_fbc` from a `?fbclid=` query param when present. Runs on every
 * server-rendered request, so the cookies exist before any client-side JS
 * (or the Meta Pixel script itself) has a chance to run.
 */
export function ensureMetaCookies(request: NextRequest, response: NextResponse): void {
  const isHttps = request.nextUrl.protocol === 'https:';
  const cookieOptions = {
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    secure: isHttps
  };

  if (!request.cookies.get(FBP_COOKIE)?.value) {
    response.cookies.set(FBP_COOKIE, generateFbp(), cookieOptions);
  }

  const fbclid = request.nextUrl.searchParams.get('fbclid');
  if (fbclid) {
    const existingFbclid = extractFbclid(request.cookies.get(FBC_COOKIE)?.value);
    // Only (re)generate _fbc when this is a new click id. Meta's guidance is to
    // never modify the creationTime once set, so re-stamping it on every request
    // that happens to still carry the same ?fbclid= (e.g. a shared/bookmarked
    // URL) would send a creationTime that no longer matches when the click
    // actually happened.
    if (existingFbclid !== fbclid) {
      response.cookies.set(FBC_COOKIE, buildFbcFromFbclid(fbclid), cookieOptions);
    }
  }
}
