/**
 * Meta Conversions API Event Handler
 *
 * This endpoint receives events from the browser and forwards them to Meta's Conversions API.
 * Events include:
 * - PageView
 * - ViewContent (product view)
 * - AddToCart
 *
 * Shopify handles its own checkout and purchase events through native Meta integration.
 */

import { NextRequest, NextResponse } from 'next/server';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

interface MetaCAPIEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: string;
  user_data?: Record<string, string>;
  custom_data?: Record<string, any>;
}

/**
 * Validate required environment variables
 */
function validateConfig(): { valid: boolean; error?: string } {
  if (!PIXEL_ID) {
    return { valid: false, error: 'NEXT_PUBLIC_META_PIXEL_ID is not configured' };
  }
  if (!ACCESS_TOKEN) {
    return { valid: false, error: 'META_ACCESS_TOKEN is not configured' };
  }
  return { valid: true };
}

/**
 * Send event to Meta Conversions API
 */
async function sendToMetaAPI(event: MetaCAPIEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

    // Build payload and include test_event_code when present
    const dataItem: Record<string, any> = {
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      event_source_url: event.event_source_url,
      action_source: event.action_source,
    };

    if (event.user_data && Object.keys(event.user_data).length) dataItem.user_data = event.user_data;
    if (event.custom_data && Object.keys(event.custom_data).length) dataItem.custom_data = event.custom_data;

    const payload: Record<string, any> = {
      data: [dataItem],
      access_token: ACCESS_TOKEN,
    };

    const testCode = process.env.META_TEST_EVENT_CODE;
    if (testCode) {
      payload.test_event_code = testCode;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta CAPI] Sending event to Meta API:', {
        url,
        event: event.event_name,
        eventId: event.event_id,
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as Record<string, any>;

    if (!response.ok) {
      console.error('[Meta CAPI] API Error:', {
        status: response.status,
        error: data.error || 'Unknown error',
      });
      return { success: false, error: data.error?.message || 'Failed to send event' };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta CAPI] Event sent successfully:', data);
    }

    return { success: true };
  } catch (error) {
    console.error('[Meta CAPI] Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * POST /api/meta/events
 * Receives event from browser and forwards to Meta Conversions API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate configuration
  const config = validateConfig();
  if (!config.valid) {
    return NextResponse.json(
      { error: config.error },
      { status: 500 }
    );
  }

  try {
    const body = await request.json() as MetaCAPIEvent;

    // Validate required event fields
    if (!body.event_name || !body.event_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_name, event_id' },
        { status: 400 }
      );
    }

    // Prevent server-side InitiateCheckout or Purchase events - Shopify owns checkout tracking
    if (body.event_name === 'InitiateCheckout') {
      return NextResponse.json(
        { error: 'InitiateCheckout must be sent only as a browser event; do not send server-side' },
        { status: 400 }
      );
    }

    // Extract client IP and user agent from headers and merge with provided user_data
    const forwardedFor = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').toString();
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
    const userAgent = (request.headers.get('user-agent') || '').toString() || undefined;

    const mergedUserData: Record<string, string> = {};
    if (body.user_data) {
      for (const [k, v] of Object.entries(body.user_data)) {
        if (v) mergedUserData[k] = v;
      }
    }
    if (clientIp) mergedUserData.client_ip_address = clientIp;
    if (userAgent) mergedUserData.client_user_agent = userAgent;

    const eventToSend: MetaCAPIEvent = {
      ...body,
      user_data: Object.keys(mergedUserData).length ? mergedUserData : undefined,
    };

    // Send to Meta API
    const result = await sendToMetaAPI(eventToSend);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, eventId: body.event_id },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Meta CAPI] Request parsing error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * OPTIONS endpoint for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
