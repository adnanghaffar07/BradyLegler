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
  em?: string; // email (hashed)
  ph?: string; // phone (hashed)
  external_id?: string; // external ID (hashed)
  fn?: string; // first name (hashed)
  ln?: string; // last name (hashed)
  ct?: string; // city (hashed)
  st?: string; // state (hashed)
  zp?: string; // zip (hashed)
  country?: string; // country (hashed)
}

export interface MetaUserIdentityData {
  email?: string;
  phone?: string;
  externalId?: string;
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
 * Hash sensitive user data using SHA256
 * Used for CAPI user_data parameters
 */
async function sha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for SSR or environments without crypto
  return text;
}

/**
 * Normalize and hash user data field
 * Normalization: lowercase, trim whitespace, remove special characters for some fields
 */
function isLikelyHashed(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

async function normalizeAndHashUserField(value: string | undefined, fieldType: string): Promise<string | undefined> {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (isLikelyHashed(trimmed)) return trimmed;

  let normalized = trimmed.toLowerCase();

  // For email and phone, remove whitespace
  if (fieldType === 'em' || fieldType === 'ph') {
    normalized = normalized.replace(/\s/g, '');
  }

  // For phone, remove special characters
  if (fieldType === 'ph') {
    normalized = normalized.replace(/[^\d]/g, '');
  }

  // For names and locations, keep only alphanumeric
  if (['fn', 'ln', 'ct', 'st', 'country'].includes(fieldType)) {
    normalized = normalized
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!normalized) return undefined;

  try {
    return await sha256(normalized);
  } catch (error) {
    console.warn(`[Meta] Failed to hash ${fieldType}:`, error);
    return undefined;
  }
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

const META_IDENTITY_STORAGE_KEY = 'bradylegler_meta_identity';

function normalizeMetaIdentityValue(value: string | undefined): string | undefined {
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
      email: normalizeMetaIdentityValue(parsed.email),
      phone: normalizeMetaIdentityValue(parsed.phone),
      externalId: normalizeMetaIdentityValue(parsed.externalId)
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
      ...data
    };

    const normalized = {
      email: normalizeMetaIdentityValue(merged.email),
      phone: normalizeMetaIdentityValue(merged.phone),
      externalId: normalizeMetaIdentityValue(merged.externalId)
    };

    if (normalized.email || normalized.phone || normalized.externalId) {
      window.localStorage.setItem(META_IDENTITY_STORAGE_KEY, JSON.stringify(normalized));
    } else {
      window.localStorage.removeItem(META_IDENTITY_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[Meta] Failed to persist identity data', error);
  }
}

function readCandidateValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return normalizeMetaIdentityValue(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    const maybeRecord = value as Record<string, unknown>;
    const direct =
      maybeRecord.email ||
      maybeRecord.phone ||
      maybeRecord.externalId ||
      maybeRecord.external_id ||
      maybeRecord.customerId ||
      maybeRecord.customer_id;
    if (typeof direct === 'string' || typeof direct === 'number') {
      return readCandidateValue(direct);
    }
  }

  return undefined;
}

function resolveMetaIdentityFromBrowser(): MetaUserIdentityData {
  if (typeof window === 'undefined') return {};

  const result: MetaUserIdentityData = {};
  const searchParams = new URLSearchParams(window.location.search);
  const queryCandidates = [['customerId', 'customer_id', 'customer', 'externalId', 'external_id', 'cid', 'customerID']];

  for (const group of queryCandidates) {
    for (const key of group) {
      const fromQuery = searchParams.get(key);
      if (fromQuery) {
        const normalized = normalizeMetaIdentityValue(fromQuery);
        if (normalized) {
          if (key === 'email' || key === 'customerEmail' || key === 'emailAddress') {
            result.email = normalized;
          } else if (key === 'phone' || key === 'phoneNumber') {
            result.phone = normalized;
          } else {
            result.externalId = normalized;
          }
          break;
        }
      }
    }
  }

  const storageKeys = [
    'customerId',
    'customer_id',
    'shopifyCustomerId',
    'shopify_customer_id',
    'customerEmail',
    'customer_email',
    'email',
    'phone',
    'phoneNumber',
    'externalId',
    'external_id'
  ];

  for (const storageKey of storageKeys) {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) continue;

      if (raw.startsWith('{') || raw.startsWith('[')) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const direct = readCandidateValue(parsed);
        if (direct) {
          if (storageKey.includes('email')) {
            result.email = direct;
          } else if (storageKey.includes('phone')) {
            result.phone = direct;
          } else if (storageKey.includes('customer') || storageKey.includes('external')) {
            result.externalId = direct;
          }
          continue;
        }
      }

      const direct = readCandidateValue(raw);
      if (direct) {
        if (storageKey.includes('email')) {
          result.email = direct;
        } else if (storageKey.includes('phone')) {
          result.phone = direct;
        } else if (storageKey.includes('customer') || storageKey.includes('external')) {
          result.externalId = direct;
        }
      }
    } catch {
      // ignore malformed storage values
    }
  }

  const cookieCandidates = [
    'customerId',
    'customer_id',
    'customerEmail',
    'customer_email',
    'externalId',
    'external_id'
  ];
  for (const cookieKey of cookieCandidates) {
    const cookieValue = document.cookie.split('; ').find(cookie => cookie.startsWith(`${cookieKey}=`));
    if (!cookieValue) continue;
    const value = cookieValue.split('=').slice(1).join('=');
    const normalized = normalizeMetaIdentityValue(value);
    if (normalized) {
      if (cookieKey.includes('email')) {
        result.email = normalized;
      } else if (cookieKey.includes('phone')) {
        result.phone = normalized;
      } else {
        result.externalId = normalized;
      }
      break;
    }
  }

  const globalScope = window as Window & Record<string, unknown>;
  const globalCandidates = [
    globalScope.__metaCustomerData,
    globalScope.__customerData,
    globalScope.__shopifyCustomer,
    globalScope.__shopifyCustomerData
  ];

  for (const candidate of globalCandidates) {
    const direct = readCandidateValue(candidate);
    if (direct) {
      if (!result.externalId) result.externalId = direct;
      break;
    }
  }

  return result;
}

export function setMetaUserData(data: MetaUserIdentityData): void {
  if (typeof window === 'undefined') return;

  const email = normalizeMetaIdentityValue(data.email);
  const phone = normalizeMetaIdentityValue(data.phone);
  const externalId = normalizeMetaIdentityValue(data.externalId);

  if (!email && !phone && !externalId) return;

  const merged: MetaUserIdentityData = {
    ...getStoredMetaIdentity(),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(externalId ? { externalId } : {})
  };

  persistMetaIdentity(merged);
}

export function setMetaCustomerIdentity(data: MetaUserIdentityData): void {
  setMetaUserData(data);
}

/**
 * Get or create Meta FBP (Facebook Pixel ID) from cookies
 */
function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function generateFbp(): string {
  // Format: fb.1.{timestamp}.{random}
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 1000000000);
  return `fb.1.${timestamp}.${random}`;
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
 * Get or create Meta FBP - if cookie doesn't exist, create and persist it
 */
function getOrCreateFbp(): string {
  if (typeof document === 'undefined') return generateFbp();

  let fbp = getFbpCookie();
  if (fbp) {
    return fbp;
  }

  // Generate new FBP if not found
  fbp = generateFbp();
  try {
    const secureFlag = window.location.protocol === 'https:' ? ' Secure; SameSite=None;' : '';
    // FBP expires in 90 days
    document.cookie = `_fbp=${fbp}; path=/; max-age=${60 * 60 * 24 * 90};${secureFlag}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta] Generated new _fbp cookie:', fbp);
    }
  } catch (error) {
    console.warn('[Meta] Failed to persist _fbp cookie', error);
  }

  return fbp;
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
      fbc: createdFbc
    });
  }
  return createdFbc;
}

/**
 * Get user data for CAPI events
 */
async function getUserData(inputData: MetaUserData = {}): Promise<MetaUserData> {
  const userData: MetaUserData = {};
  const fbp = getOrCreateFbp();
  const fbc = getOrCreateFbc();
  const persistedIdentity = getStoredMetaIdentity();

  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const browserIdentity = resolveMetaIdentityFromBrowser();
  const email = inputData.em || persistedIdentity.email || browserIdentity.email;
  const phone = inputData.ph || persistedIdentity.phone || browserIdentity.phone;
  const externalId = inputData.external_id || persistedIdentity.externalId || browserIdentity.externalId;

  if (email) {
    userData.em = await normalizeAndHashUserField(email, 'em');
  }
  if (phone) {
    userData.ph = await normalizeAndHashUserField(phone, 'ph');
  }
  if (externalId) {
    userData.external_id = await normalizeAndHashUserField(externalId, 'external_id');
  }

  if (email || phone || externalId) {
    persistMetaIdentity({ email, phone, externalId });
  }

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
    const resolvedUserData = await getUserData(userData);

    // Ensure FBP and FBC are always included
    if (!resolvedUserData.fbp) {
      resolvedUserData.fbp = getOrCreateFbp();
    }
    if (!resolvedUserData.fbc) {
      resolvedUserData.fbc = getOrCreateFbc();
    }

    // Filter out empty user data fields
    const filteredUserData: Record<string, string> = {};
    if (resolvedUserData.fbp) filteredUserData.fbp = resolvedUserData.fbp;
    if (resolvedUserData.fbc) filteredUserData.fbc = resolvedUserData.fbc;
    if (resolvedUserData.client_ip_address) filteredUserData.client_ip_address = resolvedUserData.client_ip_address;
    if (resolvedUserData.client_user_agent) filteredUserData.client_user_agent = resolvedUserData.client_user_agent;
    if (resolvedUserData.em) filteredUserData.em = resolvedUserData.em;
    if (resolvedUserData.ph) filteredUserData.ph = resolvedUserData.ph;
    if (resolvedUserData.external_id) filteredUserData.external_id = resolvedUserData.external_id;
    if (resolvedUserData.fn) filteredUserData.fn = resolvedUserData.fn;
    if (resolvedUserData.ln) filteredUserData.ln = resolvedUserData.ln;
    if (resolvedUserData.ct) filteredUserData.ct = resolvedUserData.ct;
    if (resolvedUserData.st) filteredUserData.st = resolvedUserData.st;
    if (resolvedUserData.zp) filteredUserData.zp = resolvedUserData.zp;
    if (resolvedUserData.country) filteredUserData.country = resolvedUserData.country;

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
        content_type: eventData.content_type || 'product'
      }
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Meta CAPI] Server event: ${eventName}`, {
        eventId: payload.event_id,
        fbp: !!payload.user_data?.fbp,
        fbc: !!payload.user_data?.fbc,
        userDataFields: payload.user_data ? Object.keys(payload.user_data).length : 0,
        customData: payload.custom_data
      });
    }

    const url = '/api/meta/events';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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

  // Browser event
  sendPixelEvent('PageView', {}, eventId);

  // Server event
  void sendCAPIEvent('PageView', {}, {}, eventId);
}

/**
 * Track ViewContent event (product page view)
 * Called when user views a product
 */
export function trackViewContent(data: MetaEventData): void {
  const eventId = generateEventId();

  // Browser event
  sendPixelEvent('ViewContent', data, eventId);

  // Server event
  void sendCAPIEvent('ViewContent', data, {}, eventId);
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

  // Browser event
  sendPixelEvent('AddToCart', data, eventId);

  // Server event
  void sendCAPIEvent('AddToCart', data, {}, eventId);
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
    __metaCustomerData?: unknown;
    __customerData?: unknown;
    __shopifyCustomer?: unknown;
    __shopifyCustomerData?: unknown;
    __setMetaCustomerIdentity?: (data: MetaUserIdentityData) => void;
  }
}

if (typeof window !== 'undefined') {
  window.__setMetaCustomerIdentity = (data: MetaUserIdentityData) => {
    setMetaCustomerIdentity(data);
  };
}
