/**
 * Meta Pixel + Conversions API Tracking Module
 *
 * This module provides unified tracking for Meta Pixel (browser) and Conversions API (server).
 * Each event is tracked with a matching event_id to prevent duplication.
 *
 * Browser events: fbq('track', eventName, data)
 * Server events: POST /api/meta/events with CAPI payload
 *
 * Shopify handles its own events through native Meta integration:
 * - InitiateCheckout (browser only)
 * - AddPaymentInfo
 * - Purchase
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Type definitions
export interface MetaEventData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
}

export interface MetaUserData {
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

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
 * Generate a UUID for event deduplication
 */
function generateEventId(): string {
  // Using a simple UUID v4 equivalent for browser compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create Meta FBP (Facebook Pixel ID) from cookies
 */
function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getFbpCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const name = '_fbp';
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      const value = cookie.substring(nameEQ.length).trim();
      return isNonEmptyString(value) ? value : undefined;
    }
  }

  return undefined;
}

/**
 * Get Meta FBC (First-Party Cookie) from cookies
 */
function getFbcCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const name = '_fbc';
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      const value = cookie.substring(nameEQ.length).trim();
      return isNonEmptyString(value) ? value : undefined;
    }
  }

  return undefined;
}

/**
 * Extract fbclid from the URL query string.
 */
function getFbclidParam(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const params = new URLSearchParams(window.location.search);
  return params.get('fbclid') || undefined;
}

/**
 * Build an _fbc value from fbclid and preserve it as a first-party cookie.
 */
function createFbcFromFbclid(): string | undefined {
  const fbclid = getFbclidParam();
  if (!fbclid || typeof document === 'undefined') return undefined;

  const timestamp = Math.floor(Date.now() / 1000);
  const fbc = `fb.1.${timestamp}.${fbclid}`;

  try {
    const secureFlag = window.location.protocol === 'https:' ? ' Secure; SameSite=None;' : '';
    document.cookie = `_fbc=${fbc}; path=/; max-age=${60 * 60 * 24 * 90};${secureFlag}`;
  } catch (error) {
    console.warn('[Meta] Failed to persist _fbc cookie from fbclid', error);
  }

  return fbc;
}

/**
 * Get or create Meta FBC for use in CAPI events.
 */
function getOrCreateFbc(): string | undefined {
  const fbc = getFbcCookie();
  if (fbc) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta] _fbc cookie found', fbc);
    }
    return fbc;
  }

  const createdFbc = createFbcFromFbclid();
  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta] _fbc created from fbclid', {
      fbclid: getFbclidParam(),
      fbc: createdFbc,
    });
  }
  return createdFbc;
}

/**
 * Get user data for CAPI events
 */
function getUserData(): MetaUserData {
  const userData: MetaUserData = {};
  const fbp = getFbpCookie();
  const fbc = getOrCreateFbc();

  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  // client_ip_address and client_user_agent are injected by the server-side API
  return userData;
}

/**
 * Send browser event via Facebook Pixel
 */
function sendPixelEvent(eventName: string, eventData: MetaEventData = {}, eventId?: string): void {
  if (typeof window === 'undefined' || !window.fbq) {
    console.warn(`[Meta] fbq not available for event: ${eventName}`);
    return;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta Pixel] Browser event: ${eventName}`, { eventData, eventId });
    }

    window.fbq('track', eventName, eventData, { eventID: eventId });
  } catch (error) {
    console.error(`[Meta] Error sending pixel event: ${eventName}`, error);
  }
}

/**
 * Send server event via Conversions API
 */
async function sendCAPIEvent(
  eventName: string,
  eventData: MetaEventData = {},
  userData: MetaUserData = {},
  eventId?: string
): Promise<void> {
  try {
    const url = '/api/meta/events';

    // Filter out empty user data fields
    const filteredUserData: Record<string, string> = {};
    if (userData.fbp) filteredUserData.fbp = userData.fbp;
    if (userData.fbc) filteredUserData.fbc = userData.fbc;
    if (userData.client_ip_address) filteredUserData.client_ip_address = userData.client_ip_address;
    if (userData.client_user_agent) filteredUserData.client_user_agent = userData.client_user_agent;

    const payload: MetaCAPIEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId || generateEventId(),
      event_source_url: typeof window !== 'undefined' ? window.location.href : '',
      action_source: 'website',
      user_data: Object.keys(filteredUserData).length ? filteredUserData : undefined,
      custom_data: {
        value: eventData.value,
        currency: eventData.currency,
        content_ids: eventData.content_ids,
        content_name: eventData.content_name,
        content_type: eventData.content_type || 'product',
      },
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta CAPI] Server event: ${eventName}`, payload);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Meta CAPI] Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[Meta CAPI] Error sending event: ${eventName}`, error);
  }
}

/**
 * Track PageView event (browser + server)
 */
export function trackPageView(): void {
  const eventId = generateEventId();
  const userData = getUserData();

  // Browser event
  sendPixelEvent('PageView', {}, eventId);

  // Server event
  sendCAPIEvent('PageView', {}, userData, eventId);
}

/**
 * Track ViewContent event (product page view)
 * Called when user views a product
 */
export function trackViewContent(data: MetaEventData): void {
  const eventId = generateEventId();
  const userData = getUserData();

  // Browser event
  sendPixelEvent('ViewContent', data, eventId);

  // Server event
  sendCAPIEvent('ViewContent', data, userData, eventId);
}

/**
 * Track AddToCart event
 * Called when user adds item to cart
 */
export function trackAddToCart(data: MetaEventData): void {
  // Guard: only track once per product per session
  if (typeof window !== 'undefined') {
    try {
      const trackedKey = '_meta_tracked_addtocart';
      const contentId = Array.isArray(data.content_ids) ? data.content_ids[0] : undefined;
      if (contentId) {
        const raw = sessionStorage.getItem(trackedKey) || '[]';
        const tracked: string[] = JSON.parse(raw);
        if (tracked.includes(contentId)) {
          if (process.env.NODE_ENV === 'development') console.log('[Meta] AddToCart already tracked for', contentId);
          return;
        }
        tracked.push(contentId);
        sessionStorage.setItem(trackedKey, JSON.stringify(tracked));
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  const eventId = generateEventId();
  const userData = getUserData();

  // Browser event
  sendPixelEvent('AddToCart', data, eventId);

  // Server event
  sendCAPIEvent('AddToCart', data, userData, eventId);
}

/**
 * Track InitiateCheckout event (browser only)
 * Shopify will handle checkout and purchase events through native Meta integration
 *
 * DO NOT send server-side because:
 * 1. Shopify owns checkout event tracking
 * 2. Shopify has Facebook & Instagram integration enabled
 * 3. Would create duplicate events
 */
export function trackInitiateCheckout(data: MetaEventData = {}): void {
  if (typeof window === 'undefined') {
    console.warn('[Meta] InitiateCheckout should only be called from browser');
    return;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta Pixel] Browser event: InitiateCheckout', { data });
    }

    window.fbq('track', 'InitiateCheckout', data);
  } catch (error) {
    console.error('[Meta] Error sending InitiateCheckout event', error);
  }
}

/**
 * Declare fbq function for TypeScript
 */
declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: any, options?: any) => void;
  }
}
