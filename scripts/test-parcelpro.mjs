/**
 * Parcel Pro Integration Test Script
 *
 * Tests each step of the shipping flow against the beta API using your real credentials.
 * Run from the project root:
 *
 *   node scripts/test-parcelpro.mjs
 *
 * No build step needed — plain ESM, reads your .env file directly.
 */

import { request as httpsRequest } from 'node:https';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load .env manually (no dotenv dependency needed)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    // Strip surrounding quotes from value
    const raw = trimmed.slice(eqIdx + 1).trim();
    const value = raw.replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = value;
  }
  console.log('✅ Loaded .env\n');
} catch {
  console.error('❌ Could not read .env file — make sure it exists at the project root');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate required env vars before running
// ---------------------------------------------------------------------------
const required = ['PARCELPRO_USER', 'PARCELPRO_PASS', 'PARCELPRO_BASE_URL'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const BASE_URL = process.env.PARCELPRO_BASE_URL;
const TARGET_CARRIER = process.env.PARCELPRO_TEST_CARRIER || process.env.PARCELPRO_CARRIER_CODE || 'FEDEX';
console.log(`🌐 Base URL: ${BASE_URL}`);
console.log(`👤 User:     ${process.env.PARCELPRO_USER}\n`);

// ---------------------------------------------------------------------------
// Minimal inline implementations (mirrors lib/parcelpro.ts logic exactly)
// so this script runs with zero build step
// ---------------------------------------------------------------------------

let cachedToken = null;

function parseJwtExpiry(token) {
  try {
    const seg = token.split('.')[1];
    const json = Buffer.from(seg, 'base64').toString('utf-8');
    const { exp } = JSON.parse(json);
    return exp ? exp * 1000 : Date.now() + 30 * 60 * 1000;
  } catch {
    return Date.now() + 30 * 60 * 1000;
  }
}

// node:https wrapper — forces HTTP/1.1, avoids Parcel Pro's HTTP/2 crash
function ppHttps(url, { method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqHeaders = { 'Accept': '*/*', 'Connection': 'keep-alive', ...headers };
    if (body) reqHeaders['Content-Length'] = String(Buffer.byteLength(body));
    const req = httpsRequest(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method, headers: reqHeaders },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, text: data }));
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getToken() {
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) return cachedToken.token;

  const body = `password=${process.env.PARCELPRO_PASS}&grant_type=password&username=${process.env.PARCELPRO_USER}`;
  const res = await ppHttps(`${BASE_URL}/v2.0/auth?password=&grant_type=password&username=`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (res.status !== 200) throw new Error(`Auth failed (${res.status}): ${res.text}`);

  const data = JSON.parse(res.text);
  cachedToken = { token: data.access_token, expiresAt: parseJwtExpiry(data.access_token) };
  return cachedToken.token;
}

async function ppFetch(path, options = {}) {
  const token = await getToken();
  const res = await ppHttps(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    body: options.body,
  });

  let json;
  try { json = JSON.parse(res.text); } catch { json = res.text; }

  return { ok: res.status >= 200 && res.status < 300, status: res.status, body: json };
}

// ---------------------------------------------------------------------------
// Sample Shopify order — mirrors a real orders/create webhook payload
// ---------------------------------------------------------------------------
const SAMPLE_ORDER = {
  id: 9999000001,
  name: '#TEST-001',
  order_number: 9999,
  email: 'test@bradylegler.com',
  total_price: '250.00',
  subtotal_price: '250.00',
  total_weight: 500, // 500 grams ≈ 1.1 lbs
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
  line_items: [
    {
      id: 1,
      title: 'Brady Legler Original Artwork',
      quantity: 1,
      price: '250.00',
      grams: 500,
      sku: 'ART-001',
    },
  ],
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const section = (title) => console.log(`\n${'─'.repeat(60)}\n🔧 ${title}\n${'─'.repeat(60)}`);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testAuth() {
  section('Step 1 — Authentication');
  try {
    const token = await getToken();
    pass(`Token obtained (${token.substring(0, 40)}...)`);

    // Decode and show expiry
    const seg = token.split('.')[1];
    const payload = JSON.parse(Buffer.from(seg, 'base64').toString('utf-8'));
    const expiry = new Date(payload.exp * 1000).toLocaleString();
    info(`Token expires: ${expiry}`);
    info(`Customer ID:   ${payload.customerid ?? 'N/A'}`);
    info(`User ID:       ${payload.userid ?? payload.sub ?? 'N/A'}`);
    return true;
  } catch (err) {
    fail(`Authentication error: ${err.message}`);
    return false;
  }
}

async function fetchCarrierServices() {
  section(`Step 1b — Carrier Services (${TARGET_CARRIER} authorization check)`);
  try {
    const attempts = [
      `/v2.0/carriers/services?isDomestic=true&shipFromCountryCode=US&carrierCode=${encodeURIComponent(TARGET_CARRIER)}`,
    ];

    let services = [];
    for (const path of attempts) {
      const { ok, status, body } = await ppFetch(path);
      if (!ok) {
        fail(`Carrier services failed (${status}): ${JSON.stringify(body)}`);
        continue;
      }
      const rows = Array.isArray(body) ? body : [body];
      services = rows.filter((row) => String(row?.CarrierCode || '').toUpperCase() === TARGET_CARRIER.toUpperCase());
      info(`Lookup path: ${path}`);
      pass(`Got ${services.length} ${TARGET_CARRIER} carrier service(s)`);
      if (services.length > 0) break;
    }

    services.slice(0, 5).forEach((svc, i) => {
      info(`[${i}] ${svc.ServiceCode}: ${svc.ServiceCodeDesc ?? svc.ServiceName ?? 'Unknown service'}`);
    });
    return services;
  } catch (err) {
    fail(`Carrier services error: ${err.message}`);
    return [];
  }
}

async function fetchPackageTypes(carrierCode, serviceCode) {
  section(`Step 1c — Package Types (${carrierCode} / ${serviceCode})`);
  try {
    const path = `/v2.0/carriers/package-types?carrierservicecode=${encodeURIComponent(serviceCode)}&carriercode=${encodeURIComponent(carrierCode)}`;
    const { ok, status, body } = await ppFetch(path);
    if (!ok) {
      fail(`Package types failed (${status}): ${JSON.stringify(body)}`);
      return [];
    }
    const packageTypes = Array.isArray(body) ? body : [];
    pass(`Got ${packageTypes.length} package type(s)`);
    packageTypes.slice(0, 8).forEach((pkg, i) => {
      info(`[${i}] ${pkg.PackageCode}: ${pkg.PackageCodeDesc ?? pkg.PackageName ?? 'Unknown package'}`);
    });
    return packageTypes;
  } catch (err) {
    fail(`Package types error: ${err.message}`);
    return [];
  }
}

async function fetchLocationDetail(contactId) {
  try {
    const { ok, body } = await ppFetch(`/v2.0/locations/${contactId}`);
    if (!ok) return;
    pass(`Location ${contactId} full detail:`);
    info(JSON.stringify(body, null, 2).substring(0, 600));
  } catch (err) { fail(err.message); }
}

// Fetch the default ship-from ContactId from saved locations
async function getDefaultLocationId() {
  try {
    const { ok, body } = await ppFetch('/v2.0/locations');
    if (!ok || !Array.isArray(body) || body.length === 0) return null;
    const def = body.find(l => l.IsUserDefault) ?? body[0];
    info(`Using location ContactId: ${def.ContactId} (${def.CompanyName || def.FirstName + ' ' + def.LastName})`);
    return def.ContactId;
  } catch { return null; }
}

async function testCreateQuote(carrierCode, serviceCode, packageCode) {
  section('Step 2 — Create Quote');

  const locationId = await getDefaultLocationId();

  const payload = {
    CarrierCode: carrierCode,
    ServiceCode: serviceCode,
    PackageCode: packageCode,
    ShipDate: new Date().toISOString().split('T')[0],
    
    // ⭐ REMOVE ShipperNumber entirely - don't include this field
    // ShipperNumber: '891259',
    
    RateShopping: false,
    
    ShipFrom: {
      ContactType: 2,
      ContactId: locationId,
      FirstName: process.env.PARCELPRO_SHIP_FROM_FIRST_NAME || 'Brady',
      LastName: process.env.PARCELPRO_SHIP_FROM_LAST_NAME || 'Legler',
      CompanyName: process.env.PARCELPRO_SHIP_FROM_COMPANY || 'Brady Legler LLC',
      StreetAddress: process.env.PARCELPRO_SHIP_FROM_ADDRESS || '',
      City: process.env.PARCELPRO_SHIP_FROM_CITY || '',
      State: process.env.PARCELPRO_SHIP_FROM_STATE || '',
      Zip: process.env.PARCELPRO_SHIP_FROM_ZIP || '',
      Country: 'US',
      TelephoneNo: process.env.PARCELPRO_SHIP_FROM_PHONE || '',
      Email: process.env.PARCELPRO_SHIP_FROM_EMAIL || '',
    },
    ShipTo: {
      ContactType: 1,
      FirstName: SAMPLE_ORDER.shipping_address.first_name,
      LastName: SAMPLE_ORDER.shipping_address.last_name,
      CompanyName: SAMPLE_ORDER.shipping_address.company || '',
      StreetAddress: SAMPLE_ORDER.shipping_address.address1,
      ApartmentSuite: SAMPLE_ORDER.shipping_address.address2 || '',
      City: SAMPLE_ORDER.shipping_address.city,
      State: SAMPLE_ORDER.shipping_address.province_code,
      Zip: SAMPLE_ORDER.shipping_address.zip,
      Country: SAMPLE_ORDER.shipping_address.country_code,
      TelephoneNo: SAMPLE_ORDER.shipping_address.phone || '',
      Email: SAMPLE_ORDER.email || '',
      IsResidential: true,
    },
    Weight: 1.10,
    WeightUnit: 'LB',
    Length: 12,
    Width: 10,
    Height: 4,
    DimensionUnit: 'IN',
    InsuredValue: 250.00,
    Reference: SAMPLE_ORDER.name,
    Description: 'Brady Legler Original Artwork',
    ShipToResidential: 1,
  };

  console.log('  📦 Quote payload:');
  console.log(`     From: ${payload.ShipFrom.City}, ${payload.ShipFrom.State} ${payload.ShipFrom.Zip}`);
  console.log(`     To:   ${payload.ShipTo.City}, ${payload.ShipTo.State} ${payload.ShipTo.Zip}`);
  console.log(`     Weight: ${payload.Weight} lbs | Value: $${payload.InsuredValue}`);
  console.log(`     Carrier: ${payload.CarrierCode} | Service: ${payload.ServiceCode}`);

  try {
    const { ok, status, body } = await ppFetch('/v2.0/quotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!ok) {
      fail(`Quote creation failed (${status}): ${JSON.stringify(body, null, 2)}`);
      
      // Special handling for carrier authorization errors
      const msg = JSON.stringify(body).toLowerCase();
      if (status === 400 && msg.includes('not authorized')) {
        console.log(`\n   💡 TIP: ${carrierCode} is not enabled for domestic shipments on this Parcel Pro account.`);
        console.log(`   Ask Parcel Pro support to enable ${carrierCode} domestic for customer/user in this environment.\n`);
      }
      return null;
    }

    const quoteId =
      body?.QuoteID ??
      body?.QuoteId ??
      body?.quoteId ??
      body?.quoteID ??
      body?.Data?.QuoteID ??
      body?.Data?.QuoteId ??
      body?.data?.QuoteID ??
      body?.data?.QuoteId ??
      null;

    const estimator = body?.Estimator ?? body?.Data?.Estimator ?? body?.data?.Estimator ?? {};
    const isHighValue =
      body?.IsHighValueShipment ??
      body?.Data?.IsHighValueShipment ??
      body?.data?.IsHighValueShipment ??
      false;

    pass(`Quote created!`);
    info(`Quote ID:            ${quoteId ?? 'N/A'}`);
    info(`Is High Value:       ${isHighValue}`);
    info(`Shipping Cost:       $${estimator?.ShippingCost ?? 'N/A'}`);
    info(`Total Charges:       $${estimator?.TotalCharges ?? 'N/A'}`);
    if (!quoteId) {
      info(`Quote response keys: ${Object.keys(body || {}).join(', ') || '(none)'}`);
      info(`Raw quote response:  ${JSON.stringify(body).substring(0, 500)}`);
    }

    return {
      ...body,
      QuoteID: quoteId,
      IsHighValueShipment: isHighValue,
      Estimator: estimator,
    };
  } catch (err) {
    fail(`Network error: ${err.message}`);
    return null;
  }
}

async function testCreateShipment(quoteId) {
  section('Step 3 — Create Shipment');
  info(`Booking shipment for quote: ${quoteId}`);

  try {
    const { ok, status, body } = await ppFetch(`/v2.0/shipments/${encodeURIComponent(quoteId)}`, {
      method: 'POST',
    });

    if (!ok) {
      fail(`Shipment creation failed (${status}): ${JSON.stringify(body, null, 2)}`);
      return null;
    }

    const shipmentId =
      body?.ShipmentID ??
      body?.ShipmentId ??
      body?.shipmentId ??
      body?.Data?.ShipmentID ??
      body?.Data?.ShipmentId ??
      body?.data?.ShipmentID ??
      body?.data?.ShipmentId ??
      null;
    const trackingNumber =
      body?.TrackingNumber ??
      body?.trackingNumber ??
      body?.Data?.TrackingNumber ??
      body?.data?.TrackingNumber ??
      null;
    const estimator = body?.Estimator ?? body?.Data?.Estimator ?? body?.data?.Estimator ?? {};
    const labelImage = body?.LabelImage ?? body?.Data?.LabelImage ?? body?.data?.LabelImage ?? '';

    pass(`Shipment booked!`);
    info(`Shipment ID:     ${shipmentId ?? 'N/A'}`);
    info(`Tracking Number: ${trackingNumber ?? 'N/A'}`);
    info(`Total Charges:   $${estimator?.TotalCharges ?? 'N/A'}`);
    info(`Label included:  ${labelImage ? `Yes (${Math.round(labelImage.length / 1024)} KB base64)` : 'No'}`);
    if (!shipmentId) {
      info(`Shipment response keys: ${Object.keys(body || {}).join(', ') || '(none)'}`);
      info(`Raw shipment response:  ${JSON.stringify(body).substring(0, 500)}`);
    }

    return {
      ...body,
      ShipmentID: shipmentId,
      TrackingNumber: trackingNumber,
      LabelImage: labelImage,
      Estimator: estimator,
    };
  } catch (err) {
    fail(`Network error: ${err.message}`);
    return null;
  }
}

async function testTracking(shipmentId) {
  section('Step 4 — Get Tracking Details');
  info(`Fetching tracking for shipment: ${shipmentId}`);

  try {
    const { ok, status, body } = await ppFetch(
      `/v2.0/tracking-results?shipmentid=${encodeURIComponent(shipmentId)}&shipmenttype=1`
    );

    if (!ok) {
      fail(`Tracking failed (${status}): ${JSON.stringify(body, null, 2)}`);
      return false;
    }

    pass('Tracking response received');
    info(`Status:          ${body.Status ?? 'N/A'}`);
    info(`Tracking Number: ${body.TrackingNumber ?? 'N/A'}`);
    info(`Scans:           ${body.Scans?.length ?? 0} event(s)`);
    return true;
  } catch (err) {
    fail(`Network error: ${err.message}`);
    return false;
  }
}

async function testSaveLabelToDisk(labelBase64, trackingNumber) {
  section('Bonus — Save Label to Disk');
  if (!labelBase64) {
    info('No label to save — skipping');
    return;
  }

  try {
    const { writeFileSync } = await import('fs');
    const filename = resolve(__dirname, `../label-${trackingNumber ?? 'test'}.pdf`);
    writeFileSync(filename, Buffer.from(labelBase64, 'base64'));
    pass(`Label saved to: ${filename}`);
    info('Open the PDF to verify the label looks correct');
  } catch (err) {
    fail(`Could not save label: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
async function run() {
  console.log('═'.repeat(60));
  console.log('  Parcel Pro Integration Test');
  console.log('═'.repeat(60));

  // Step 1: Auth
  const authOk = await testAuth();
  if (!authOk) {
    console.log('\n❌ Auth failed — fix credentials before continuing\n');
    process.exit(1);
  }

  // Step 1b: Confirm target carrier services are available on this account
  const services = await fetchCarrierServices();
  if (!services.length) {
    console.log(`\n❌ No ${TARGET_CARRIER} services returned for this account/environment.`);
    console.log(`   This account is not configured for ${TARGET_CARRIER} in the selected Parcel Pro environment.`);
    console.log(`   Contact Parcel Pro support and ask them to enable ${TARGET_CARRIER} domestic services.\n`);
    process.exit(1);
  }

  const preferredService = process.env.PARCELPRO_DOMESTIC_SERVICE_CODE
    ? services.find((s) => s.ServiceCode === process.env.PARCELPRO_DOMESTIC_SERVICE_CODE)
    : services.find((s) => s.ServiceCode === '03');
  const selectedServiceCode = preferredService?.ServiceCode ?? services[0].ServiceCode;
  info(`Using ${TARGET_CARRIER} service code: ${selectedServiceCode}`);

  const packageTypes = await fetchPackageTypes(TARGET_CARRIER, selectedServiceCode);
  const preferredPackage = process.env.PARCELPRO_PACKAGE_CODE
    ? packageTypes.find((p) => p.PackageCode === process.env.PARCELPRO_PACKAGE_CODE)
    : packageTypes.find((p) => p.PackageCode === '02');
  const selectedPackageCode = preferredPackage?.PackageCode ?? packageTypes[0]?.PackageCode ?? '02';
  info(`Using ${TARGET_CARRIER} package code: ${selectedPackageCode}`);

  // Step 2: Quote
  const quote = await testCreateQuote(TARGET_CARRIER, selectedServiceCode, selectedPackageCode);
  if (!quote) {
    console.log('\n❌ Quote failed — check ship-from address and carrier settings\n');
    process.exit(1);
  }

  // High-value check (informational — we don't actually poll in the test)
  if (quote.IsHighValueShipment) {
    console.log('\n⚠️  NOTE: This would be a HIGH VALUE shipment in production.');
    console.log('    The webhook handler will POST to /highvalue and poll for approval.');
    console.log('    Skipping high-value flow in this test to avoid manual approval queue.\n');
    console.log('═'.repeat(60));
    console.log('✅ Auth + Quote working. Deploy and test high-value with a real order.');
    console.log('═'.repeat(60));
    return;
  }

  // Step 3: Shipment
  const shipment = await testCreateShipment(quote.QuoteID);
  if (!shipment) {
    console.log('\n❌ Shipment creation failed\n');
    process.exit(1);
  }

  // Step 4: Tracking
  const trackingOk = shipment.ShipmentID ? await testTracking(shipment.ShipmentID) : false;
  if (!trackingOk) {
    console.log('\n⚠️  Shipment booked, but tracking check failed in this run.');
  }

  // Bonus: Save label to disk
  await testSaveLabelToDisk(shipment.LabelImage, shipment.TrackingNumber);

  console.log('\n' + '═'.repeat(60));
  if (trackingOk) {
    console.log('  ✅ All steps passed! Parcel Pro integration is working.');
  } else {
    console.log('  ✅ Auth + Quote + Shipment passed. Tracking needs follow-up.');
  }
  console.log('═'.repeat(60) + '\n');
}

run().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
