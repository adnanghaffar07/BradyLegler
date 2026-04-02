/**
 * Shopify Webhook Local Test Script
 *
 * Sends a fake Shopify "orders/create" webhook payload to your local dev server,
 * signed with the correct HMAC so the handler accepts it as a real Shopify request.
 *
 * Usage:
 *   node scripts/test-webhook.mjs
 *
 * Options (env vars):
 *   WEBHOOK_URL   Override the target URL (default: http://localhost:3000/api/webhooks/order-created)
 *   HIGH_VALUE=1  Send a high-value order ($10,000) to test the high-value flow
 */

import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = resolve(__dirname, '../.env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const value = raw.replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = value;
  }
} catch {
  console.error('❌ Could not read .env — make sure it exists at the project root');
  process.exit(1);
}

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
const TARGET_URL = process.env.WEBHOOK_URL ?? 'http://localhost:3000/api/webhooks/order-created';
const IS_HIGH_VALUE = process.env.HIGH_VALUE === '1';

if (!WEBHOOK_SECRET) {
  console.error('❌ SHOPIFY_WEBHOOK_SECRET is not set in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Sample Shopify orders/create payload
// ---------------------------------------------------------------------------
const orderPrice = IS_HIGH_VALUE ? '10000.00' : '250.00';

const sampleOrder = {
  id: Date.now(),                         // unique per run
  name: `#TEST-${Date.now().toString().slice(-5)}`,
  order_number: 9999,
  email: 'test@bradylegler.com',
  total_price: orderPrice,
  subtotal_price: orderPrice,
  total_weight: 500,                       // grams
  created_at: new Date().toISOString(),
  shipping_address: {
    first_name: 'Jane',
    last_name: 'Smith',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    city: 'New York',
    province: 'New York',
    province_code: 'NY',
    zip: '10001',
    country: 'United States',
    country_code: 'US',
    phone: '2125550100',
    company: '',
  },
  billing_address: {
    first_name: 'Jane',
    last_name: 'Smith',
    address1: '123 Main Street',
    city: 'New York',
    province: 'New York',
    province_code: 'NY',
    zip: '10001',
    country: 'United States',
    country_code: 'US',
  },
  line_items: [
    {
      id: 1,
      title: 'Brady Legler Original Artwork',
      quantity: 1,
      price: orderPrice,
      grams: 500,
      sku: 'ART-001',
      vendor: 'Brady Legler LLC',
    },
  ],
};

// ---------------------------------------------------------------------------
// Sign the payload (same algorithm Shopify uses)
// ---------------------------------------------------------------------------
const body = JSON.stringify(sampleOrder);
const hmac = createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('base64');

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------
console.log('═'.repeat(60));
console.log('  Shopify Webhook Local Test');
console.log('═'.repeat(60));
console.log(`🎯 Target:      ${TARGET_URL}`);
console.log(`📦 Order:       ${sampleOrder.name} ($${orderPrice})`);
console.log(`💰 High Value:  ${IS_HIGH_VALUE ? 'YES' : 'no'}`);
console.log(`🔐 HMAC:        ${hmac.substring(0, 20)}...`);
console.log('');

try {
  const res = await fetch(TARGET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Hmac-Sha256': hmac,
      'X-Shopify-Shop-Domain': 'bradylegler.myshopify.com',
      'X-Shopify-Topic': 'orders/create',
      'X-Shopify-API-Version': '2024-07',
    },
    body,
  });

  const responseText = await res.text();
  let responseJson;
  try { responseJson = JSON.parse(responseText); } catch { responseJson = responseText; }

  console.log(`📬 HTTP Status: ${res.status} ${res.statusText}`);
  console.log('📄 Response:');
  console.log(JSON.stringify(responseJson, null, 2));

  if (res.ok && responseJson?.success) {
    console.log('\n✅ Webhook processed successfully!');
    console.log(`   Shipment ID:     ${responseJson.shipmentId}`);
    console.log(`   Tracking Number: ${responseJson.trackingNumber}`);
    console.log(`   Total Charges:   $${responseJson.totalCharges}`);
    console.log(`   Label included:  ${responseJson.labelBase64 ? 'Yes ✅' : 'No ❌'}`);
  } else if (res.status === 401) {
    console.log('\n❌ HMAC verification failed — check SHOPIFY_WEBHOOK_SECRET in .env');
  } else if (!res.ok) {
    console.log(`\n❌ Request failed with status ${res.status}`);
    console.log('   Check the terminal where your dev server is running for error details.');
  } else if (responseJson?.skipped) {
    console.log(`\n⏭️  Order skipped: ${responseJson.reason}`);
  }
} catch (err) {
  if (err.code === 'ECONNREFUSED') {
    console.error('\n❌ Connection refused — is your Next.js dev server running?');
    console.error('   Run this in another terminal first:  npm run dev');
  } else {
    console.error('\n💥 Unexpected error:', err.message);
  }
  process.exit(1);
}
