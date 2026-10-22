// app/api/form/route.ts
import { NextRequest, NextResponse } from 'next/server';
import klaviyo from '@/tools/klaviyo';
import sendEmail from '@/tools/resend/sendEmail';
import {
  detectAutomation,
  isValidEmailFormat,
  isDisposableEmail,
  rateLimit,
  pruneRateLimitBuckets,
  getClientIp
} from '@/tools/helpers/botProtection';
import { consumeMarker, isEnforcementEnabled, pruneMarkers, verifyTurnstileToken } from '@/tools/helpers/turnstile';

type Payload = {
  type: 'newsletter' | 'enquiry';
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  contactMethod?: string;
  message?: string;
  formName?: string;
  /** Hidden honeypot rendered by <Form>. Only a bot fills it. */
  _gotcha?: unknown;
  /** Milliseconds the form was on screen before submission. */
  _elapsedMs?: number;
  /** Fresh Turnstile token from the widget. */
  _turnstileToken?: unknown;
  /** Signed stand-in from /api/verify-turnstile, for the newsletter fallback. */
  _turnstileMarker?: unknown;
  /** Set when the widget could not run at all - usually an ad-blocker. */
  _turnstileUnavailable?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const data: Payload = await req.json();
    const { type } = data;

    // --- Bot protection -----------------------------------------------------
    // The <Form> component runs the honeypot check in the browser, but anything
    // POSTing straight here skips it - so re-run it, plus timing and rate limits.
    pruneRateLimitBuckets();

    const ip = getClientIp(req.headers);
    const { allowed, retryAfterSeconds } = rateLimit(`form:${ip}`, { limit: 5, windowMs: 60_000 });

    if (!allowed) {
      return NextResponse.json(
        { status: 'error', message: 'Too many submissions. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const automationReason = detectAutomation({ gotcha: data._gotcha, elapsedMs: data._elapsedMs });

    if (automationReason) {
      // Answer as though it worked. Telling a bot which signal caught it just helps
      // it tune; a real user who somehow trips this loses nothing visible.
      console.warn(`[form] rejected automated submission (${automationReason}) from ${ip}`);
      return NextResponse.json({ status: 'success', message: 'Submitted' });
    }

    if (data.email && (!isValidEmailFormat(data.email) || isDisposableEmail(data.email))) {
      return NextResponse.json({ status: 'error', message: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Turnstile last: everything above is local and free, this costs a network call.
    //
    // Verification ALWAYS runs, whatever TURNSTILE_ENFORCE says. The flag decides only
    // whether a failure blocks the submission. That way the observation period produces
    // real siteverify data in Cloudflare's analytics and real outcomes in these logs,
    // so turning enforcement on is a decision backed by evidence rather than a leap -
    // and Cloudflare stops reporting the widget as unvalidated.
    const enforcing = isEnforcementEnabled();
    pruneMarkers();

    const marker = typeof data._turnstileMarker === 'string' ? data._turnstileMarker : null;
    const token = typeof data._turnstileToken === 'string' ? data._turnstileToken : null;

    /** 'allow' proceeds; 'quiet' looks like success to a bot; 'challenge' asks for a reload. */
    let rejection: 'allow' | 'quiet' | 'challenge' = 'allow';
    let reason = '';

    if (marker) {
      // The newsletter already verified a token and spent it; this is its receipt.
      if (!consumeMarker(marker)) {
        rejection = 'quiet';
        reason = 'invalid or replayed marker';
      }
    } else if (token) {
      // Expected action is derived from the request type, never taken from the
      // client - a bot could simply send whichever value it wanted. Cloudflare bakes
      // the real action into the token at render time and reports it back.
      const expectedAction = type === 'newsletter' ? 'newsletter' : 'enquiry';
      const result = await verifyTurnstileToken(token, expectedAction);

      if (result.outcome === 'fail') {
        rejection = 'quiet';
        reason = `token rejected (${result.codes.join(', ') || 'no codes'})`;
      } else if (result.outcome === 'unavailable') {
        // Cloudflare is unreachable, not the visitor's fault. Let it through - the
        // honeypot, timing and rate limits above still applied.
        console.error(`[form] Turnstile unavailable (${result.reason}) - allowing submission from ${ip}`);
      }
    } else if (data._turnstileUnavailable) {
      // Widget blocked or failed to load, commonly an ad-blocker. Allowing this only
      // returns us to the pre-Turnstile position, which the checks above already
      // cover. Watch the rate - a spike means a bot found the flag.
      console.warn(`[form] Turnstile widget unavailable client-side - allowing submission from ${ip}`);
    } else {
      // Nothing at all: no token, no marker, no explanation. Not a real browser.
      rejection = 'challenge';
      reason = 'no token or marker supplied';
    }

    if (rejection !== 'allow') {
      if (!enforcing) {
        console.warn(
          `[form] MONITOR MODE - would have rejected (${reason}) from ${ip}; allowing because TURNSTILE_ENFORCE=false`
        );
      } else if (rejection === 'quiet') {
        // Same reasoning as the honeypot: answer as though it worked so a bot learns
        // nothing about which signal caught it.
        console.warn(`[form] rejected submission (${reason}) from ${ip}`);
        return NextResponse.json({ status: 'success', message: 'Submitted' });
      } else {
        console.warn(`[form] rejected submission (${reason}) from ${ip}`);
        return NextResponse.json(
          { status: 'error', message: 'Verification required. Please reload and try again.' },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------------------

    // Validate Klaviyo environment variables
    if (!process.env.KLAVIYO_PRIVATE_API_KEY) {
      return NextResponse.json({ status: 'error', message: 'Klaviyo API key not configured' }, { status: 500 });
    }

    if (!process.env.KLAVIYO_LIST_ID) {
      return NextResponse.json({ status: 'error', message: 'Klaviyo List ID not configured' }, { status: 500 });
    }

    let response = { status: 'error', message: 'Unknown error' };

    if (type === 'newsletter') {
      if (!data.email) {
        return NextResponse.json({ status: 'error', message: 'Email is required' }, { status: 400 });
      }
      response = await klaviyo.addEmailToList(data);
    } else if (type === 'enquiry') {
      // Validate required fields for enquiry
      if (!data.email || !data.firstName || !data.lastName || !data.formName) {
        return NextResponse.json(
          { status: 'error', message: 'Missing required fields (email, firstName, lastName, formName)' },
          { status: 400 }
        );
      }

      // Determine which list to use based on form name
      let listId = process.env.KLAVIYO_LIST_ID; // Default: Website Contact Form

      if (data.formName === 'Artwork Enquiry Form') {
        listId = process.env.KLAVIYO_ARTWORK_LIST_ID || process.env.KLAVIYO_LIST_ID;
      }

      // Ensure message is always a string
      const payloadForKl = {
        ...data,
        message: data.message || '',
        listId: listId // Pass custom list ID
      };

      const klaviyoResp = await klaviyo.submitForm(payloadForKl);

      // Optionally send email notification (you can uncomment this)
      // const emailResp = await sendEmail(data);

      // Use the OR logic that was working before
      response =
        klaviyoResp.status === 'success'
          ? { status: 'success', message: 'Enquiry submitted successfully' }
          : {
              status: 'error',
              message: klaviyoResp.message || 'Failed to submit enquiry'
            };
    } else {
      return NextResponse.json({ status: 'error', message: 'Invalid form type' }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'error', message: 'Method not allowed' }, { status: 405 });
}
