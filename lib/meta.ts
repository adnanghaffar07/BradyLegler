/**
 * Meta Pixel + Conversions API Tracking Module
 *
 * This module provides unified tracking for Meta Pixel (browser) and Conversions API (server).
 * Every event goes through `dispatchMetaEvent`, which shares a single `event_id` between the
 * browser Pixel call and the server CAPI call so Meta can deduplicate them.
 *
 * Browser events: fbq('track', eventName, data, { eventID })
 * Server events: POST /api/meta/events with a CAPI payload built by lib/meta/buildEvent.ts
 *
 * Shopify handles InitiateCheckout, AddPaymentInfo, and Purchase through its own native Meta
 * Sales Channel integration once checkout redirects off this app's domain, so those are
 * intentionally NOT sent server-side here to avoid double-counting conversions.
 */
import { getOrCreateFbp, getOrCreateFbc, getOrCreateClientId } from '@/lib/meta/cookies';
import { buildMetaEvent, generateEventId, type MetaCustomData, type MetaEventName } from '@/lib/meta/buildEvent';

export type MetaEventData = MetaCustomData;

export interface MetaUserIdentityData {
  email?: string;
  phone?: string;
  externalId?: string;
}

const META_IDENTITY_STORAGE_KEY = 'bradylegler_meta_identity';

function normalizeIdentityValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function getStoredMetaIdentity(): MetaUserIdentityData {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(META_IDENTITY_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as MetaUserIdentityData;
    return {
      email: normalizeIdentityValue(parsed.email),
      phone: normalizeIdentityValue(parsed.phone),
      externalId: normalizeIdentityValue(parsed.externalId)
    };
  } catch (error) {
    console.warn('[Meta] Failed to read persisted identity data', error);
    return {};
  }
}

function persistMetaIdentity(data: MetaUserIdentityData): void {
  if (typeof window === 'undefined') return;

  try {
    const merged: MetaUserIdentityData = {
      ...getStoredMetaIdentity(),
      ...(normalizeIdentityValue(data.email) ? { email: normalizeIdentityValue(data.email) } : {}),
      ...(normalizeIdentityValue(data.phone) ? { phone: normalizeIdentityValue(data.phone) } : {}),
      ...(normalizeIdentityValue(data.externalId) ? { externalId: normalizeIdentityValue(data.externalId) } : {})
    };

    if (merged.email || merged.phone || merged.externalId) {
      window.localStorage.setItem(META_IDENTITY_STORAGE_KEY, JSON.stringify(merged));
    } else {
      window.localStorage.removeItem(META_IDENTITY_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[Meta] Failed to persist identity data', error);
  }
}

/**
 * Store customer identity (email/phone/externalId) collected from a form or account.
 * Persisted so subsequent events (ViewContent, AddToCart, etc.) in this browser include it,
 * enabling Advanced Matching / higher Event Match Quality.
 */
export function setMetaUserData(data: MetaUserIdentityData): void {
  if (typeof window === 'undefined') return;

  const email = normalizeIdentityValue(data.email);
  const phone = normalizeIdentityValue(data.phone);
  const externalId = normalizeIdentityValue(data.externalId);
  if (!email && !phone && !externalId) return;

  persistMetaIdentity({ email, phone, externalId });
}

export function setMetaCustomerIdentity(data: MetaUserIdentityData): void {
  setMetaUserData(data);
}

/**
 * Send the browser-side Meta Pixel event.
 */
function sendPixelEvent(eventName: MetaEventName, customData: MetaEventData, eventId: string): void {
  if (typeof window === 'undefined' || !window.fbq) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Meta] fbq not available for event: ${eventName}`);
    }
    return;
  }

  try {
    window.fbq('track', eventName, customData, { eventID: eventId });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta Pixel] Browser event: ${eventName}`, { eventId, customData });
    }
  } catch (error) {
    console.error(`[Meta] Error sending pixel event: ${eventName}`, error);
  }
}

/**
 * Build and send the server-side Conversions API event for the same event_id.
 */
async function sendCapiEvent(
  eventName: MetaEventName,
  customData: MetaEventData,
  eventId: string,
  identityOverride?: MetaUserIdentityData
): Promise<void> {
  try {
    if (identityOverride) {
      persistMetaIdentity(identityOverride);
    }

    const identity = { ...getStoredMetaIdentity(), ...identityOverride };
    const fbp = getOrCreateFbp();
    const fbc = getOrCreateFbc();
    // Fall back to the persistent anonymous client id when no logged-in/form
    // identity is known yet, so external_id is populated on every event.
    const externalId = identity.externalId || getOrCreateClientId();

    const payload = await buildMetaEvent({
      eventName,
      customData,
      rawUserData: {
        email: identity.email,
        phone: identity.phone,
        externalId
      },
      fbp,
      fbc,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
      eventId
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta CAPI] Dispatching ${eventName}`, {
        event_id: payload.event_id,
        fbp: !!payload.user_data?.fbp,
        fbc: !!payload.user_data?.fbc,
        external_id: !!payload.user_data?.external_id,
        user_data_fields: payload.user_data ? Object.keys(payload.user_data) : []
      });
    }

    const response = await fetch('/api/meta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Let the browser finish delivering the event even if the user
      // navigates away right after it fires (e.g. clicking a link
      // immediately after a PageView/ViewContent dispatch).
      keepalive: true
    });

    if (!response.ok) {
      console.error(`[Meta CAPI] Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[Meta CAPI] Error sending event: ${eventName}`, error);
  }
}

/**
 * Fire an event on both the browser Pixel and the server CAPI with a shared event_id.
 */
function dispatchMetaEvent(
  eventName: MetaEventName,
  customData: MetaEventData = {},
  identityOverride?: MetaUserIdentityData
): void {
  const eventId = generateEventId();
  sendPixelEvent(eventName, customData, eventId);
  void sendCapiEvent(eventName, customData, eventId, identityOverride);
}

/**
 * Track PageView event (browser + server). Call once per real page view
 * (initial load and every client-side route change).
 */
export function trackPageView(): void {
  dispatchMetaEvent('PageView', {});
}

/**
 * Track ViewContent event (product page view).
 */
export function trackViewContent(data: MetaEventData): void {
  dispatchMetaEvent('ViewContent', data);
}

const ADD_TO_CART_DEDUPE_WINDOW_MS = 3000;

/**
 * Track AddToCart event. Debounced per product so a double-click or a rapid
 * double-fire from the same action doesn't send two events, but genuinely
 * separate add actions later in the session (re-adding after removing,
 * bumping quantity from the cart drawer) are still tracked. A previous
 * "once per product per session" guard suppressed all of those legitimate
 * repeat adds — which, if Meta's Pixel independently auto-detects the same
 * button click, leaves an orphan browser-only event with no CAPI partner and
 * directly hurts event coverage.
 */
export function trackAddToCart(data: MetaEventData): void {
  if (typeof window !== 'undefined') {
    try {
      const trackedKey = '_meta_tracked_addtocart';
      const contentId = Array.isArray(data.content_ids) ? data.content_ids[0] : undefined;
      if (contentId) {
        const tracked: Record<string, number> = JSON.parse(sessionStorage.getItem(trackedKey) || '{}');
        const lastTrackedAt = tracked[contentId];
        const now = Date.now();
        if (lastTrackedAt && now - lastTrackedAt < ADD_TO_CART_DEDUPE_WINDOW_MS) {
          if (process.env.NODE_ENV === 'development') console.log('[Meta] AddToCart debounced for', contentId);
          return;
        }
        tracked[contentId] = now;
        sessionStorage.setItem(trackedKey, JSON.stringify(tracked));
      }
    } catch {
      // ignore storage errors
    }
  }

  dispatchMetaEvent('AddToCart', data);
}

/**
 * Track a Lead event (e.g. newsletter signup, contact/inquiry form submission).
 * Pass the identity fields the form just collected so this specific event —
 * not just future ones — gets the benefit of them for Advanced Matching.
 */
export function trackLead(data: MetaEventData = {}, identity?: MetaUserIdentityData): void {
  dispatchMetaEvent('Lead', data, identity);
}

/**
 * Track InitiateCheckout event (browser + CAPI, deduplicated via event_id).
 *
 * This app owns InitiateCheckout end-to-end: Shopify is only used for
 * inventory and the checkout/payment pages themselves (AddPaymentInfo,
 * Purchase), which is why those two remain Shopify's native CAPI
 * integration. The "start checkout" moment happens on this site, so it's
 * tracked the same way as every other event here.
 */
export function trackInitiateCheckout(data: MetaEventData = {}): void {
  dispatchMetaEvent('InitiateCheckout', data);
}

declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: any, options?: any) => void;
  }
}
