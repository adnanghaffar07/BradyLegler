/**
 * Parcel Pro Shipping Service
 *
 * Implements the full shipping flow:
 *   1. Authenticate (token cached in-memory, auto-refreshes on 401 or expiry)
 *   2. Create Quote  → POST /v2.0/quotes
 *   3. High Value    → POST /v2.0/highvalue  (only when IsHighValueShipment = true)
 *   4. Create Shipment → POST /v2.0/shipments/{QuoteID}
 *   5. Get Tracking  → GET  /v2.0/tracking-results
 *
 * All network calls include retry logic with exponential backoff.
 */

// ---------------------------------------------------------------------------
// Types — Parcel Pro API
// ---------------------------------------------------------------------------

interface ParcelProTokenCache {
  token: string;
  /** Unix epoch ms at which the token expires */
  expiresAt: number;
}

interface ParcelProAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ParcelProAddress {
  FirstName: string;
  LastName: string;
  CompanyName?: string;
  StreetAddress: string;
  ApartmentSuite?: string;
  City: string;
  /** Two-letter state/province code */
  State: string;
  Zip: string;
  /** Two-letter ISO country code, e.g. "US" */
  Country: string;
  TelephoneNo?: string;
  Email?: string;
}

export interface ParcelProPackage {
  /** Weight in pounds */
  Weight: number;
  /** Length in inches */
  Length: number;
  /** Width in inches */
  Width: number;
  /** Height in inches */
  Height: number;
  /** Declared insured value in USD */
  InsuredValue: number;
}

export interface ParcelProQuoteRequest {
  /** e.g. "UPS" or "FEDEX" */
  CarrierCode: string;
  /** Carrier service code, e.g. "03" = UPS Ground, "08" = UPS Worldwide Expedited */
  ServiceCode: string;
  /** Package type code, e.g. "02" = Customer-supplied package */
  PackageTypeCode: string;
  /** Ship date in YYYY-MM-DD format */
  ShipDate: string;
  ShipFromAddress: ParcelProAddress;
  ShipToAddress: ParcelProAddress;
  PackageInfo: ParcelProPackage;
  /** Order reference displayed on label */
  Reference?: string;
  /** Package contents description */
  Description?: string;
  /** 1 = residential address, 0 = commercial */
  ShipToResidential?: 0 | 1;
}

export interface ParcelProQuoteResponse {
  QuoteID: string;
  /** When true, must call /highvalue before creating the shipment */
  IsHighValueShipment: boolean;
  Estimator: {
    TotalCharges: number;
    InsuranceCost: number;
    ShippingCost: number;
  };
  ShipToResidential: boolean;
  IShipFromRestrictedZip: boolean;
  IShipToRestrictedZip: boolean;
  IsShipFromHasRestrictedWords: boolean;
  IsShipToHasRestrictedWords: boolean;
  /** Present when IShipFromRestrictedZip = true — use this as the printed origin */
  ShipFromRerouting?: ParcelProAddress;
  /** Present when IShipToRestrictedZip = true — use this as the printed destination */
  ShipToRerouting?: ParcelProAddress;
}

interface ParcelProHighValueResponse {
  Status?: string;
  Message?: string;
}

interface ParcelProQuoteDetailsResponse {
  QuoteID: string;
  Status?: string;
  ApprovalStatus?: string;
  [key: string]: unknown;
}

export interface ParcelProShipmentResponse {
  ShipmentID: string;
  TrackingNumber: string;
  /** Shipping label encoded as a base64 string (PDF or ZPL depending on account settings) */
  LabelImage: string;
  Estimator: {
    TotalCharges: number;
    InsuranceCost: number;
    ShippingCost: number;
  };
}

export interface ParcelProTrackingResponse {
  TrackingNumber: string;
  Status: string;
  Scans: Array<{
    Date: string;
    Time: string;
    Location: string;
    Description: string;
  }>;
}

// ---------------------------------------------------------------------------
// Types — Shopify Order (webhook payload)
// ---------------------------------------------------------------------------

export interface ShopifyOrderAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  /** Full province/state name */
  province: string;
  /** Two-letter province/state code, e.g. "CA" */
  province_code: string;
  zip: string;
  /** Full country name */
  country: string;
  /** Two-letter ISO country code, e.g. "US" */
  country_code: string;
  phone?: string;
  company?: string;
}

export interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  variant_title?: string;
  sku?: string;
  /** Weight in grams */
  grams: number;
  vendor?: string;
}

export interface ShopifyOrder {
  id: number;
  /** Human-readable order name, e.g. "#1001" */
  name: string;
  order_number: number;
  email: string;
  total_price: string;
  subtotal_price: string;
  /** Total order weight in grams */
  total_weight: number;
  shipping_address: ShopifyOrderAddress;
  billing_address?: ShopifyOrderAddress;
  line_items: ShopifyLineItem[];
  note?: string;
  tags?: string;
}

// ---------------------------------------------------------------------------
// Final result returned to the webhook handler
// ---------------------------------------------------------------------------

export interface ShipmentResult {
  shipmentId: string;
  trackingNumber: string;
  /** Raw base64-encoded label — decode to PDF/ZPL for printing */
  labelBase64: string;
  totalCharges: number;
}

// ---------------------------------------------------------------------------
// Module-level config
// ---------------------------------------------------------------------------

const BASE_URL = (process.env.PARCELPRO_BASE_URL ?? 'https://apibeta.parcelpro.com').replace(/\/$/, '');

/** Refresh token this many ms before it actually expires */
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

/** Maximum retry attempts for transient network errors */
const MAX_RETRIES = 3;

/** Base delay (ms) for exponential backoff */
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * Ship-from address for Brady Legler LLC.
 * Populated from environment variables so the same code works in all environments.
 */
const SHIP_FROM_ADDRESS: ParcelProAddress = {
  FirstName: process.env.PARCELPRO_SHIP_FROM_FIRST_NAME ?? 'Brady',
  LastName: process.env.PARCELPRO_SHIP_FROM_LAST_NAME ?? 'Legler',
  CompanyName: process.env.PARCELPRO_SHIP_FROM_COMPANY ?? 'Brady Legler LLC',
  StreetAddress: process.env.PARCELPRO_SHIP_FROM_ADDRESS ?? '',
  ApartmentSuite: process.env.PARCELPRO_SHIP_FROM_ADDRESS2 ?? '',
  City: process.env.PARCELPRO_SHIP_FROM_CITY ?? '',
  State: process.env.PARCELPRO_SHIP_FROM_STATE ?? '',
  Zip: process.env.PARCELPRO_SHIP_FROM_ZIP ?? '',
  Country: 'US',
  TelephoneNo: process.env.PARCELPRO_SHIP_FROM_PHONE ?? '',
  Email: process.env.PARCELPRO_SHIP_FROM_EMAIL ?? '',
};

/** Default box dimensions (inches) — override via env for standard packaging */
const DEFAULT_BOX = {
  length: parseFloat(process.env.PARCELPRO_DEFAULT_LENGTH ?? '12'),
  width: parseFloat(process.env.PARCELPRO_DEFAULT_WIDTH ?? '10'),
  height: parseFloat(process.env.PARCELPRO_DEFAULT_HEIGHT ?? '4'),
};

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

/** In-memory token cache — persists for the lifetime of the server process */
let tokenCache: ParcelProTokenCache | null = null;

/**
 * Decode the `exp` claim from a JWT without an external library.
 * Returns expiry as Unix epoch milliseconds.
 */
function parseJwtExpiry(token: string): number {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) throw new Error('Malformed JWT');
    const jsonStr = Buffer.from(payloadSegment, 'base64').toString('utf-8');
    const payload = JSON.parse(jsonStr) as { exp?: number };
    if (payload.exp) return payload.exp * 1000;
  } catch {
    // Fallback: assume 30-minute validity
  }
  return Date.now() + 30 * 60 * 1000;
}

/** Force re-authentication on the next request */
function invalidateTokenCache(): void {
  tokenCache = null;
}

/**
 * Returns a valid bearer token.
 * Re-authenticates automatically when the cached token is absent or near expiry.
 */
export async function getParcelProToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - TOKEN_EXPIRY_BUFFER_MS > now) {
    return tokenCache.token;
  }

  const username = process.env.PARCELPRO_USER;
  const password = process.env.PARCELPRO_PASS;

  if (!username || !password) {
    throw new Error(
      'Missing Parcel Pro credentials. Set PARCELPRO_USER and PARCELPRO_PASS in your environment.'
    );
  }

  // Parcel Pro auth endpoint requires application/x-www-form-urlencoded
  const body = new URLSearchParams({ grant_type: 'password', username, password });

  const response = await fetch(`${BASE_URL}/v2.0/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Parcel Pro authentication failed (HTTP ${response.status}): ${text}`);
  }

  const data = (await response.json()) as ParcelProAuthResponse;
  tokenCache = {
    token: data.access_token,
    expiresAt: parseJwtExpiry(data.access_token),
  };

  console.log('[ParcelPro] Token refreshed successfully');
  return tokenCache.token;
}

// ---------------------------------------------------------------------------
// Core HTTP helper
// ---------------------------------------------------------------------------

/**
 * Execute an authenticated request against the Parcel Pro API.
 * Automatically retries authentication once on 401 Unauthorized.
 */
async function parcelProFetch<T>(
  path: string,
  options: RequestInit = {},
  _retryAuth = false
): Promise<T> {
  const token = await getParcelProToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Token expired mid-session — invalidate and retry once
  if (response.status === 401 && !_retryAuth) {
    console.warn('[ParcelPro] Received 401 — refreshing token and retrying');
    invalidateTokenCache();
    return parcelProFetch<T>(path, options, true);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Parcel Pro API error [${options.method ?? 'GET'} ${path}] HTTP ${response.status}: ${body}`
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

/**
 * Wraps an async function with retry logic and exponential backoff.
 * Transient network errors (5xx, ECONNRESET, timeouts) are retried automatically.
 */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxAttempts = MAX_RETRIES
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[ParcelPro] ${label} — attempt ${attempt}/${maxAttempts} failed. Retrying in ${delayMs}ms.`,
        err instanceof Error ? err.message : err
      );
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

/** Convert grams (Shopify) to pounds (Parcel Pro), minimum 0.1 lb */
function gramsToPounds(grams: number): number {
  const lbs = grams / 453.592;
  return Math.max(0.1, Math.round(lbs * 100) / 100);
}

// ---------------------------------------------------------------------------
// Step 1 — Create Quote
// ---------------------------------------------------------------------------

/**
 * Transforms a Shopify order into a Parcel Pro QuoteRequest payload.
 * Uses UPS Ground for domestic shipments and UPS Worldwide Expedited for international.
 */
export function buildQuotePayload(order: ShopifyOrder): ParcelProQuoteRequest {
  const dest = order.shipping_address;

  // Calculate total weight — prefer the order-level total_weight, fall back to summing line items
  const totalGrams =
    order.total_weight > 0
      ? order.total_weight
      : order.line_items.reduce((sum, item) => sum + item.grams * item.quantity, 0);
  const weightLbs = gramsToPounds(totalGrams);

  const isInternational = dest.country_code !== 'US';

  // Insured value = declared order total (USD)
  const insuredValue = parseFloat(order.total_price) || 0;

  // Build a short description from line item titles (max 100 chars for the API)
  const description = order.line_items
    .map((item) => item.title)
    .join(', ')
    .substring(0, 100);

  return {
    CarrierCode: 'UPS',
    // 03 = UPS Ground (domestic), 08 = UPS Worldwide Expedited (international)
    ServiceCode: isInternational ? '08' : '03',
    // 02 = Customer-supplied package
    PackageTypeCode: '02',
    // Ship today
    ShipDate: new Date().toISOString().split('T')[0] as string,
    ShipFromAddress: SHIP_FROM_ADDRESS,
    ShipToAddress: {
      FirstName: dest.first_name,
      LastName: dest.last_name,
      CompanyName: dest.company ?? '',
      StreetAddress: dest.address1,
      ApartmentSuite: dest.address2 ?? '',
      City: dest.city,
      // province_code is the 2-letter state code expected by the API
      State: dest.province_code || dest.province,
      Zip: dest.zip,
      Country: dest.country_code || 'US',
      // Strip non-numeric characters from phone number
      TelephoneNo: dest.phone?.replace(/\D/g, '') ?? '',
      Email: order.email,
    },
    PackageInfo: {
      Weight: weightLbs,
      Length: DEFAULT_BOX.length,
      Width: DEFAULT_BOX.width,
      Height: DEFAULT_BOX.height,
      InsuredValue: insuredValue,
    },
    // Print the Shopify order name (e.g. "#1001") on the label for easy cross-referencing
    Reference: order.name,
    Description: description,
    // Assume residential delivery by default; Parcel Pro may override this after address validation
    ShipToResidential: 1,
  };
}

/**
 * Step 1: Submit a shipping quote for a Shopify order.
 * Returns the QuoteID and the IsHighValueShipment flag.
 */
export async function createQuote(order: ShopifyOrder): Promise<ParcelProQuoteResponse> {
  const payload = buildQuotePayload(order);

  console.log(`[ParcelPro] Creating quote for order ${order.name} (${order.email})`);

  return withRetry('createQuote', () =>
    parcelProFetch<ParcelProQuoteResponse>('/v2.0/quotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Handle High Value Shipment (conditional)
// ---------------------------------------------------------------------------

/**
 * Step 2 (only when IsHighValueShipment = true):
 *   a) POST the quoteId to the high-value queue for manual approval
 *   b) Poll GET /quotes/{QuoteID} every 10 s until Status = "Approved" or timeout
 *
 * Parcel Pro requires this approval before the shipment can be booked.
 * In production, consider off-loading the polling to a background job / queue
 * to avoid blocking the webhook response.
 */
export async function handleHighValueShipment(quoteId: string): Promise<void> {
  console.log(`[ParcelPro] Submitting quote ${quoteId} to high-value approval queue`);

  // a) Submit to high-value queue
  await withRetry('highvalue:submit', () =>
    parcelProFetch<ParcelProHighValueResponse>(
      `/v2.0/highvalue?quoteid=${encodeURIComponent(quoteId)}`,
      { method: 'POST' }
    )
  );

  console.log(`[ParcelPro] Quote ${quoteId} submitted. Polling for approval...`);

  // b) Poll for approval — max 10 minutes, 10-second intervals
  const POLL_INTERVAL_MS = 10_000;
  const MAX_WAIT_MS = 10 * 60 * 1000;
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    let quoteDetails: ParcelProQuoteDetailsResponse;
    try {
      quoteDetails = await parcelProFetch<ParcelProQuoteDetailsResponse>(
        `/v2.0/quotes/${encodeURIComponent(quoteId)}`
      );
    } catch (err) {
      // Transient fetch errors during polling should not abort — just log and continue
      console.warn(`[ParcelPro] Polling error for quote ${quoteId}:`, err);
      continue;
    }

    const rawStatus = (quoteDetails.Status ?? quoteDetails.ApprovalStatus ?? '').toLowerCase();
    console.log(`[ParcelPro] High-value quote ${quoteId} approval status: "${rawStatus}"`);

    if (rawStatus === 'approved') {
      console.log(`[ParcelPro] Quote ${quoteId} approved — proceeding to shipment`);
      return;
    }

    if (rawStatus === 'denied' || rawStatus === 'rejected') {
      throw new Error(
        `Parcel Pro rejected the high-value shipment for quote ${quoteId} (status: ${rawStatus})`
      );
    }
    // Any other status (pending, in review, etc.) — keep polling
  }

  throw new Error(
    `High-value approval timed out for quote ${quoteId} after ${MAX_WAIT_MS / 60_000} minutes`
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Create Shipment
// ---------------------------------------------------------------------------

/**
 * Step 3: Convert an approved quote into a booked shipment.
 * Returns the ShipmentID, TrackingNumber, and base64-encoded label.
 */
export async function createShipment(quoteId: string): Promise<ParcelProShipmentResponse> {
  console.log(`[ParcelPro] Booking shipment for quote ${quoteId}`);

  return withRetry('createShipment', () =>
    parcelProFetch<ParcelProShipmentResponse>(
      `/v2.0/shipments/${encodeURIComponent(quoteId)}`,
      { method: 'POST' }
    )
  );
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/**
 * Retrieve all tracking scans for a booked shipment.
 *
 * @param shipmentId - The ShipmentID returned by createShipment
 * @param shipmentType - 1 = standard (default), 2 = reported shipment
 */
export async function getTrackingDetails(
  shipmentId: string,
  shipmentType = 1
): Promise<ParcelProTrackingResponse> {
  return parcelProFetch<ParcelProTrackingResponse>(
    `/v2.0/tracking-results?shipmentid=${encodeURIComponent(shipmentId)}&shipmenttype=${shipmentType}`
  );
}

// ---------------------------------------------------------------------------
// Orchestrator — full shipping flow
// ---------------------------------------------------------------------------

/**
 * Full shipping flow for a Shopify order:
 *   1. Create quote
 *   2. Handle high-value approval (if required)
 *   3. Book shipment
 *
 * Returns shipmentId, trackingNumber, base64 label, and total charges.
 */
export async function processShipment(order: ShopifyOrder): Promise<ShipmentResult> {
  // Step 1: Get a quote
  const quote = await createQuote(order);
  console.log(
    `[ParcelPro] Quote ${quote.QuoteID} received | ` +
      `IsHighValue: ${quote.IsHighValueShipment} | ` +
      `Total: $${quote.Estimator?.TotalCharges ?? 'N/A'}`
  );

  // Log address rerouting warnings — the actual label will use the rerouted address
  if (quote.IShipFromRestrictedZip) {
    console.warn(
      `[ParcelPro] Ship-from zip is restricted. Label origin updated to:`,
      quote.ShipFromRerouting
    );
  }
  if (quote.IShipToRestrictedZip) {
    console.warn(
      `[ParcelPro] Ship-to zip is restricted. Label destination updated to:`,
      quote.ShipToRerouting
    );
  }

  // Step 2 (conditional): High-value approval
  if (quote.IsHighValueShipment) {
    await handleHighValueShipment(quote.QuoteID);
  }

  // Step 3: Book the shipment
  const shipment = await createShipment(quote.QuoteID);
  console.log(
    `[ParcelPro] Shipment booked | ID: ${shipment.ShipmentID} | Tracking: ${shipment.TrackingNumber}`
  );

  return {
    shipmentId: shipment.ShipmentID,
    trackingNumber: shipment.TrackingNumber,
    labelBase64: shipment.LabelImage,
    totalCharges: shipment.Estimator?.TotalCharges ?? 0,
  };
}
