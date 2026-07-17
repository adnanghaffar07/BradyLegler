/**
 * Meta Conversions API Event Handler
 *
 * This endpoint receives events from the browser (built by lib/meta.ts via the
 * shared lib/meta/buildEvent.ts helper) and forwards them to Meta's Conversions API.
 *
 * Events include: PageView, ViewContent, AddToCart, Lead, InitiateCheckout.
 *
 * Shopify is only used for inventory and its checkout/payment pages, so it
 * handles AddPaymentInfo and Purchase through its own native Meta Sales
 * Channel integration; those are rejected here to prevent double-counted
 * conversions. InitiateCheckout happens on this site (the "start checkout"
 * click), so this app owns it end-to-end.
 *
 * IMPORTANT: This API must be publicly accessible and cannot require authentication
 * because browser-based events need to reach it directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizeAndHashUserField } from '@/lib/meta/hash';
import { getServerMetaCookies } from '@/lib/meta/cookies';
import { validateCapiEvent } from '@/lib/meta/validate';
import type { MetaCapiEvent } from '@/lib/meta/buildEvent';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = process.env.META_API_VERSION || 'v18.0';

const BLOCKED_EVENT_NAMES = new Set(['AddPaymentInfo', 'Purchase']);

const RAW_USER_DATA_KEY_MAP: Record<string, string> = {
  email: 'em',
  phone: 'ph',
  externalid: 'external_id',
  external_id: 'external_id',
  firstname: 'fn',
  first_name: 'fn',
  lastname: 'ln',
  last_name: 'ln',
  city: 'ct',
  state: 'st',
  zip: 'zp',
  postal_code: 'zp',
  country: 'country'
};
const HASHABLE_KEYS = new Set(['em', 'ph', 'external_id', 'fn', 'ln', 'ct', 'st', 'zp', 'country']);

function validateConfig(): { valid: boolean; error?: string } {
  if (!PIXEL_ID) return { valid: false, error: 'NEXT_PUBLIC_META_PIXEL_ID is not configured' };
  if (!ACCESS_TOKEN) return { valid: false, error: 'META_ACCESS_TOKEN is not configured' };
  return { valid: true };
}

async function sendToMetaAPI(event: MetaCapiEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

    const dataItem: Record<string, any> = {
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      event_source_url: event.event_source_url,
      action_source: event.action_source
    };

    if (event.user_data && Object.keys(event.user_data).length) {
      dataItem.user_data = event.user_data;
    }
    if (event.custom_data && Object.keys(event.custom_data).length) {
      dataItem.custom_data = event.custom_data;
    }

    const payload: Record<string, any> = {
      data: [dataItem],
      access_token: ACCESS_TOKEN
    };

    const testCode = process.env.META_TEST_EVENT_CODE;
    if (testCode) {
      payload.test_event_code = testCode;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as Record<string, any>;

    if (!response.ok) {
      console.error('[Meta CAPI] API Error:', {
        status: response.status,
        error: data.error || 'Unknown error',
        event: event.event_name
      });
      return { success: false, error: data.error?.message || 'Failed to send event' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Meta CAPI] Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * POST /api/meta/events
 * Receives an event from the browser and forwards it to Meta Conversions API.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = validateConfig();
  if (!config.valid) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  let body: MetaCapiEvent;
  try {
    body = (await request.json()) as MetaCapiEvent;
  } catch (error) {
    console.error('[Meta CAPI] Request parsing error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.event_name || !body.event_id) {
    return NextResponse.json({ error: 'Missing required fields: event_name, event_id' }, { status: 400 });
  }

  if (BLOCKED_EVENT_NAMES.has(body.event_name)) {
    return NextResponse.json(
      { error: `${body.event_name} must be sent only as a browser event; Shopify sends this event server-side` },
      { status: 400 }
    );
  }

  // Extract client IP and user agent from headers for Advanced Matching.
  const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Fall back to first-party cookies set by middleware when the browser
  // payload didn't already include fbp/fbc (e.g. cookies were blocked when
  // the page rendered but became available afterwards).
  const serverCookies = getServerMetaCookies(request);

  const mergedUserData: Record<string, string> = {};

  if (body.user_data) {
    for (const [key, value] of Object.entries(body.user_data)) {
      if (!value || typeof value !== 'string') continue;

      const normalizedKey = key.toLowerCase();
      if (normalizedKey === 'fbp' || normalizedKey === 'fbc') {
        mergedUserData[normalizedKey] = value;
        continue;
      }

      const mappedKey = RAW_USER_DATA_KEY_MAP[normalizedKey] || normalizedKey;
      if (HASHABLE_KEYS.has(mappedKey)) {
        const hashedValue = await normalizeAndHashUserField(value, mappedKey as any);
        if (hashedValue) mergedUserData[mappedKey] = hashedValue;
      } else {
        mergedUserData[key] = value;
      }
    }
  }

  if (!mergedUserData.fbp && serverCookies.fbp) mergedUserData.fbp = serverCookies.fbp;
  if (!mergedUserData.fbc && serverCookies.fbc) mergedUserData.fbc = serverCookies.fbc;
  if (clientIp) mergedUserData.client_ip_address = clientIp;
  if (userAgent) mergedUserData.client_user_agent = userAgent;

  const eventToSend: MetaCapiEvent = {
    ...body,
    user_data: Object.keys(mergedUserData).length ? mergedUserData : undefined
  };

  const validation = validateCapiEvent(eventToSend);
  if (!validation.valid) {
    console.error('[Meta CAPI] Payload failed validation:', validation.error, { event: body.event_name });
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Meta CAPI] Sending event: ${eventToSend.event_name}`, {
      event_id: eventToSend.event_id,
      fbp: !!mergedUserData.fbp,
      fbc: !!mergedUserData.fbc,
      external_id: !!mergedUserData.external_id,
      user_data_fields: Object.keys(mergedUserData),
      warning: validation.warning
    });
  }

  const result = await sendToMetaAPI(eventToSend);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, eventId: body.event_id }, { status: 200 });
}

/**
 * OPTIONS endpoint for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
