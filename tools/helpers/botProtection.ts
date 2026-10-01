/**
 * Shared bot-protection checks for public form endpoints.
 *
 * The React <Form> component already renders a hidden `_gotcha` honeypot and bails
 * if it is set, but that check only runs in the browser - anything POSTing straight
 * to the API route skips it. These helpers let the server re-run the same checks,
 * plus timing and rate limiting, so the endpoint is defended on its own.
 */

/** A human cannot read the field, type an address and submit faster than this. */
export const MIN_SUBMIT_MS = 1500;

export type BotSignals = {
  /** Hidden honeypot field value - only a bot fills it. */
  gotcha?: unknown;
  /** Milliseconds between the form rendering and being submitted. */
  elapsedMs?: number;
};

/**
 * Returns a reason string when the submission looks automated, otherwise null.
 * The reason is for server logs only - never surface it to the caller, or a bot
 * learns which signal tripped.
 */
export const detectAutomation = ({ gotcha, elapsedMs }: BotSignals): string | null => {
  if (gotcha !== undefined && gotcha !== null && gotcha !== '' && gotcha !== false) {
    return 'honeypot';
  }

  // Missing timing is tolerated: older clients and the server fallback may not send
  // it. Only an implausibly fast submission is rejected.
  if (typeof elapsedMs === 'number' && Number.isFinite(elapsedMs) && elapsedMs < MIN_SUBMIT_MS) {
    return 'too-fast';
  }

  return null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmailFormat = (email?: string): boolean =>
  Boolean(email && email.length <= 254 && EMAIL_PATTERN.test(email));

// Throwaway providers. Not exhaustive - it is a cheap first pass, not a guarantee.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc'
]);

export const isDisposableEmail = (email?: string): boolean => {
  const domain = email?.split('@')[1]?.toLowerCase();
  return Boolean(domain && DISPOSABLE_DOMAINS.has(domain));
};

type RateLimitBucket = { count: number; resetAt: number };

// Per-instance only. Serverless spreads traffic across instances and recycles them,
// so this blunts bursts rather than enforcing a global quota. Move to Vercel KV or
// Upstash if a hard limit is ever needed.
const buckets = new Map<string, RateLimitBucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export const rateLimit = (
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
};

/** Opportunistically drop expired buckets so the map cannot grow without bound. */
export const pruneRateLimitBuckets = () => {
  const now = Date.now();
  buckets.forEach((bucket, key) => {
    if (now >= bucket.resetAt) buckets.delete(key);
  });
};

/** Best-effort client IP behind Vercel's proxy. */
export const getClientIp = (headers: Headers): string =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim() || 'unknown';
