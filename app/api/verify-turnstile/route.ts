// app/api/verify-turnstile/route.ts
//
// Verify-once endpoint for the newsletter form.
//
// FormNewsletter subscribes to Klaviyo straight from the browser, so Klaviyo sees
// the subscriber's real session rather than a datacentre IP - server-side signups
// were getting auto-suppressed. That path never touches /api/form, so verifying
// only there would leave the newsletter ungated.
//
// Tokens are single-use, so the newsletter cannot verify here and then send the same
// token on to /api/form if the browser path fails. On success this hands back a
// short-lived signed marker to carry into that fallback instead.

import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, pruneRateLimitBuckets, rateLimit } from '@/tools/helpers/botProtection';
import { isEnforcementEnabled, issueMarker, pruneMarkers, verifyTurnstileToken } from '@/tools/helpers/turnstile';

type Payload = { token?: unknown };

export async function POST(req: NextRequest) {
  try {
    pruneRateLimitBuckets();
    pruneMarkers();

    const ip = getClientIp(req.headers);

    // Slightly looser than /api/form: a user may legitimately retry a challenge.
    const { allowed, retryAfterSeconds } = rateLimit(`turnstile:${ip}`, { limit: 10, windowMs: 60_000 });

    if (!allowed) {
      return NextResponse.json(
        { status: 'rejected' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    // Verification always runs; TURNSTILE_ENFORCE decides only whether a failure
    // stops the signup. See the note in /api/form - monitor mode has to produce real
    // siteverify data, otherwise the observation period proves nothing.
    const enforcing = isEnforcementEnabled();

    const { token }: Payload = await req.json().catch(() => ({}));

    if (typeof token !== 'string' || !token) {
      // No token at all. The caller should report this as unavailable instead, so
      // this is either a bug or something poking the endpoint directly.
      return NextResponse.json({ status: 'rejected' }, { status: 400 });
    }

    const result = await verifyTurnstileToken(token, ip);

    if (result.outcome === 'unavailable') {
      // Could not reach Cloudflare. Tell the caller to carry on without a marker -
      // the local checks in /api/form still apply if it falls back.
      console.error(`[turnstile] verification unavailable (${result.reason}) for ${ip}`);
      return NextResponse.json({ status: 'unavailable' });
    }

    if (result.outcome === 'fail') {
      const codes = result.codes.join(', ') || 'no codes';

      if (!enforcing) {
        console.warn(
          `[turnstile] MONITOR MODE - would have rejected token (${codes}) from ${ip}; allowing because TURNSTILE_ENFORCE=false`
        );
        return NextResponse.json({ status: 'verified', marker: issueMarker() });
      }

      console.warn(`[turnstile] rejected token (${codes}) from ${ip}`);
      return NextResponse.json({ status: 'rejected' }, { status: 403 });
    }

    return NextResponse.json({ status: 'verified', marker: issueMarker() });
  } catch (error: any) {
    // Never let this endpoint take the newsletter down - the caller treats an error
    // as "unavailable" and proceeds under the local checks.
    console.error('[turnstile] verify endpoint error', error?.message || error);
    return NextResponse.json({ status: 'unavailable' });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'error', message: 'Method not allowed' }, { status: 405 });
}
