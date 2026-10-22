/**
 * Cloudflare Turnstile verification for public form endpoints.
 *
 * This sits on top of the local checks in `botProtection.ts` rather than replacing
 * them. Those are cheap and need no network call, so they stay as the floor - in
 * particular they are what still defends the forms when Cloudflare is unreachable.
 *
 * Two behaviours here are deliberate and easy to get wrong:
 *
 * 1. A rejected token and an unreachable Cloudflare are different events. The first
 *    is an attack; the second is someone else's outage. They must not share a code
 *    path - see `VerifyOutcome`.
 *
 * 2. Turnstile tokens are single-use. `siteverify` rejects a token it has already
 *    seen with `timeout-or-duplicate`. The newsletter form needs to verify before
 *    subscribing from the browser, and may then fall back to the server route - so
 *    it would spend the same token twice. `issueMarker`/`consumeMarker` give it a
 *    signed, short-lived stand-in to carry into that second call instead.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Beyond this, treat Cloudflare as unavailable rather than hanging the submission. */
const VERIFY_TIMEOUT_MS = 5_000;

/** How long a marker stands in for a spent token. */
export const MARKER_TTL_MS = 5 * 60_000;

export type VerifyOutcome =
  | { outcome: 'pass' }
  /** Cloudflare answered and rejected the token. */
  | { outcome: 'fail'; codes: string[] }
  /** We could not reach Cloudflare, or could not make sense of the reply. */
  | { outcome: 'unavailable'; reason: string };

const getSecret = (): string | undefined => process.env.TURNSTILE_SECRET_KEY?.trim() || undefined;

/**
 * Hostnames permitted to solve a challenge, from TURNSTILE_HOSTNAMES.
 *
 * Cloudflare already restricts which hostnames may render the widget, so this is
 * defence in depth: siteverify reports the hostname that actually solved the
 * challenge, and checking it here means a token minted elsewhere cannot be replayed
 * against this backend.
 *
 * Unset means "do not check" rather than "allow nothing" - local development has no
 * list, and a missing variable must not take the forms down. Production sets it.
 */
const getAllowedHostnames = (): string[] | null => {
  const raw = process.env.TURNSTILE_HOSTNAMES?.trim();
  if (!raw) return null;
  const list = raw
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : null;
};

/**
 * Enforcement kill switch. Defaults to on, so a missing variable fails safe towards
 * protection; set TURNSTILE_ENFORCE=false in Vercel to disable without a redeploy.
 */
export const isEnforcementEnabled = (): boolean =>
  (process.env.TURNSTILE_ENFORCE ?? 'true').trim().toLowerCase() !== 'false';

/**
 * Verify a token with Cloudflare. Never throws - failures come back as an outcome.
 *
 * `expectedAction` binds a token to the form it was minted on, so a token obtained
 * from the newsletter widget cannot be replayed against the enquiry endpoint.
 */
export const verifyTurnstileToken = async (
  token: string,
  ip?: string,
  expectedAction?: string
): Promise<VerifyOutcome> => {
  const secret = getSecret();

  if (!secret) {
    // A misconfigured deploy must not take the forms down.
    return { outcome: 'unavailable', reason: 'missing-secret' };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: 'no-store'
    });

    if (!response.ok) {
      return { outcome: 'unavailable', reason: `http-${response.status}` };
    }

    const result = (await response.json()) as {
      success?: boolean;
      'error-codes'?: string[];
      hostname?: string;
      action?: string;
    };

    if (typeof result?.success !== 'boolean') {
      return { outcome: 'unavailable', reason: 'malformed-response' };
    }

    if (!result.success) {
      return { outcome: 'fail', codes: result['error-codes'] ?? [] };
    }

    // Cloudflare accepted the token. Two further checks it does not make for us.

    const allowed = getAllowedHostnames();
    const solvedOn = result.hostname?.toLowerCase();

    if (allowed && solvedOn && !allowed.includes(solvedOn)) {
      return { outcome: 'fail', codes: [`hostname-not-allowed:${solvedOn}`] };
    }

    if (expectedAction && result.action && result.action !== expectedAction) {
      return { outcome: 'fail', codes: [`action-mismatch:${result.action}!=${expectedAction}`] };
    }

    return { outcome: 'pass' };
  } catch (error: any) {
    // Timeout, DNS failure, socket error, invalid JSON - all "we could not check".
    return { outcome: 'unavailable', reason: error?.name === 'TimeoutError' ? 'timeout' : 'network' };
  }
};

/*=============================================>>>>>
= MARKERS =
===============================================>>>>>*/

type MarkerPayload = { exp: number; nonce: string };

const b64url = (value: Buffer | string): string =>
  Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sign = (payload: string, secret: string): string => b64url(createHmac('sha256', secret).update(payload).digest());

/**
 * Nonces already redeemed. Per-instance only, exactly like the rate-limit buckets in
 * botProtection.ts - serverless spreads traffic across instances, so this blunts
 * replay rather than preventing it outright. The marker's five-minute expiry is the
 * real bound. Move to Vercel KV if a hard guarantee is ever needed.
 */
const spentNonces = new Map<string, number>();

/** Drop expired nonces so the map cannot grow without bound. */
export const pruneMarkers = () => {
  const now = Date.now();
  spentNonces.forEach((expiresAt, nonce) => {
    if (now >= expiresAt) spentNonces.delete(nonce);
  });
};

/**
 * Issue a short-lived signed stand-in for a token that has already been verified.
 * Returns null when there is no secret to sign with.
 */
export const issueMarker = (): string | null => {
  const secret = getSecret();
  if (!secret) return null;

  const payload: MarkerPayload = { exp: Date.now() + MARKER_TTL_MS, nonce: randomBytes(16).toString('hex') };
  const encoded = b64url(JSON.stringify(payload));

  return `${encoded}.${sign(encoded, secret)}`;
};

/**
 * Validate a marker and burn its nonce. Returns false for anything not signed by us,
 * expired, or already redeemed. Never throws on malformed input.
 */
export const consumeMarker = (marker: string): boolean => {
  const secret = getSecret();
  if (!secret || typeof marker !== 'string') return false;

  const [encoded, signature] = marker.split('.');
  if (!encoded || !signature) return false;

  const expected = sign(encoded, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  // Length check first: timingSafeEqual throws on a length mismatch.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  let payload: MarkerPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  } catch {
    return false;
  }

  if (typeof payload?.exp !== 'number' || typeof payload?.nonce !== 'string') return false;
  if (Date.now() >= payload.exp) return false;
  if (spentNonces.has(payload.nonce)) return false;

  spentNonces.set(payload.nonce, payload.exp);
  return true;
};
