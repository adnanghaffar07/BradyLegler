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
      return NextResponse.json(
        { status: 'error', message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    // ------------------------------------------------------------------------

    // Validate Klaviyo environment variables
    if (!process.env.KLAVIYO_PRIVATE_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Klaviyo API key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.KLAVIYO_LIST_ID) {
      return NextResponse.json(
        { status: 'error', message: 'Klaviyo List ID not configured' },
        { status: 500 }
      );
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
    return NextResponse.json(
      { status: 'error', message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'error', message: 'Method not allowed' }, { status: 405 });
}
