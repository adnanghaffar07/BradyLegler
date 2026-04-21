/**
 * Shopify Webhook Handler — orders/create
 *
 * Endpoint: POST /api/webhooks/order-created
 *
 * Register this URL in your Shopify Admin:
 *   Settings → Notifications → Webhooks → Create webhook
 *   Event: Order creation  |  Format: JSON  |  URL: https://<your-domain>/api/webhooks/order-created
 *
 * Flow:
 *   1. Verify the Shopify HMAC-SHA256 signature to prevent spoofed requests
 *   2. Parse the Shopify order payload
 *   3. Guard against orders with no shipping address (digital goods, etc.)
 *   4. Call processShipment() which:
 *        a) Creates a Parcel Pro quote
 *        b) Handles high-value approval if needed
 *        c) Books the shipment and returns tracking + label
 *   5. Return the shipment details in the response
 *
 * Note on timing:
 *   Shopify expects a 200 response within 5 seconds and will retry up to 19 times
 *   over 48 hours if it receives a non-2xx response or a timeout.
 *   For high-value shipments (which require manual approval and polling), consider
 *   offloading processShipment() to a background queue (e.g. Vercel Cron,
 *   BullMQ, or an external job runner) and responding with 200 immediately.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { processShipment } from '@/lib/parcelpro';
import type { ShopifyOrder } from '@/lib/parcelpro';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the X-Shopify-Hmac-Sha256 header against the raw request body.
 * Shopify signs every webhook using HMAC-SHA256 with the webhook secret.
 * Returns true when the signature is valid (or when the secret is not configured).
 */
function verifyShopifyHmac(rawBody: string, shopifyHmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    // No secret configured — allow the request through but emit a warning.
    // Set SHOPIFY_WEBHOOK_SECRET in production to prevent spoofed requests.
    console.warn(
      '[Webhook] SHOPIFY_WEBHOOK_SECRET is not set. ' +
        'Skipping signature verification — configure this in production!'
    );
    return true;
  }

  if (!shopifyHmac) {
    return false;
  }

  const computedDigest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  // Constant-time comparison prevents timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedDigest, 'base64'),
      Buffer.from(shopifyHmac, 'base64')
    );
  } catch {
    // Buffer sizes differ — signature is definitely invalid
    return false;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Read the raw body as text so we can verify the HMAC before parsing JSON.
  // req.json() would consume the body stream, making re-reading impossible.
  const rawBody = await request.text();

  const shopifyHmac = request.headers.get('x-shopify-hmac-sha256') ?? '';
  const shopDomain = request.headers.get('x-shopify-shop-domain') ?? 'unknown';
  const webhookTopic = request.headers.get('x-shopify-topic') ?? 'unknown';

  // Step 1: Verify the webhook signature
  if (!verifyShopifyHmac(rawBody, shopifyHmac)) {
    console.error(
      `[Webhook] Invalid HMAC signature from shop "${shopDomain}" on topic "${webhookTopic}"`
    );
    return NextResponse.json({ error: 'Unauthorized — invalid webhook signature' }, { status: 401 });
  }

  // Step 2: Parse the order JSON
  let order: ShopifyOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyOrder;
  } catch (parseErr) {
    console.error('[Webhook] Failed to parse Shopify order JSON:', parseErr);
    return NextResponse.json({ error: 'Bad Request — invalid JSON body' }, { status: 400 });
  }

  const orderLabel = order.name ?? `#${order.order_number}`;
  console.log(
    `[Webhook] Received "${webhookTopic}" from "${shopDomain}" — order ${orderLabel} (id: ${order.id})`
  );

  // Step 3: Skip orders without a physical shipping address (e.g. digital downloads)
  if (!order.shipping_address) {
    console.log(
      `[Webhook] Order ${orderLabel} has no shipping address — skipping Parcel Pro fulfillment`
    );
    return NextResponse.json({
      skipped: true,
      reason: 'Order has no shipping address',
      orderId: order.id,
      orderName: orderLabel,
    });
  }

  // Step 4: Run the full shipping flow
  try {
    const result = await processShipment(order);

    console.log(
      `[Webhook] Order ${orderLabel} fulfilled — ` +
        `ShipmentID: ${result.shipmentId} | ` +
        `Tracking: ${result.trackingNumber} | ` +
        `Charges: $${result.totalCharges}`
    );

    // Step 5: Return shipment details.
    // The labelBase64 field contains the raw base64-encoded shipping label (PDF/ZPL).
    // You can decode it in a subsequent step, upload to cloud storage (S3, Sanity Assets, etc.)
    // and return a URL instead — see the implementation notes below.
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderName: orderLabel,
      shipmentId: result.shipmentId,
      trackingNumber: result.trackingNumber,
      /**
       * Base64-encoded shipping label.
       * Decode with: Buffer.from(result.labelBase64, 'base64')
       * Then write to disk, upload to S3, or serve via a signed URL.
       */
      labelBase64: result.labelBase64,
      totalCharges: result.totalCharges,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error(`[Webhook] Failed to fulfill order ${orderLabel}:`, message);

    // Return 500 so Shopify retries this webhook delivery.
    // Shopify will retry up to 19 times with exponential backoff over 48 hours.
    return NextResponse.json(
      {
        success: false,
        orderId: order.id,
        orderName: orderLabel,
        error: message,
      },
      { status: 500 }
    );
  }
}

// Reject non-POST methods with a clear message
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
