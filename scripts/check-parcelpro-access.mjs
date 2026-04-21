/**
 * Parcel Pro Access Check
 *
 * Fast preflight for account permissions/config:
 *   1) Auth
 *   2) GET /v2.0/carriers/services
 *   3) GET /v2.0/carriers/package-types
 *   4) Optional: POST /v2.0/quotes (dry quote probe)
 *
 * Run:
 *   node scripts/check-parcelpro-access.mjs
 */

import { request as httpsRequest } from 'node:https';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnvFile(path) {
  const envFile = readFileSync(path, 'utf-8');
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
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function httpsCall(url, { method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqHeaders = { Accept: '*/*', Connection: 'keep-alive', ...headers };
    if (body) reqHeaders['Content-Length'] = String(Buffer.byteLength(body));

    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk.toString()));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            text: data,
            body: parseJson(data),
          })
        );
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const section = (title) => console.log(`\n${'─'.repeat(64)}\n🔎 ${title}\n${'─'.repeat(64)}`);

loadEnvFile(envPath);

const BASE_URL = (process.env.PARCELPRO_BASE_URL ?? '').replace(/\/$/, '');
const USER = process.env.PARCELPRO_USER;
const PASS = process.env.PARCELPRO_PASS;
const CARRIER_CODE = process.env.PARCELPRO_CHECK_CARRIER || process.env.PARCELPRO_CARRIER_CODE || 'FEDEX';

if (!BASE_URL || !USER || !PASS) {
  console.error('Missing required env vars: PARCELPRO_BASE_URL, PARCELPRO_USER, PARCELPRO_PASS');
  process.exit(1);
}

let token = '';

async function auth() {
  section('Step 1: Authenticate');
  const body = `password=${PASS}&grant_type=password&username=${USER}`;
  const res = await httpsCall(`${BASE_URL}/v2.0/auth?password=&grant_type=password&username=`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (res.status !== 200) {
    fail(`Auth failed (${res.status}): ${JSON.stringify(res.body)}`);
    return false;
  }

  token = res.body?.access_token ?? '';
  if (!token) {
    fail('Auth succeeded but access_token missing');
    return false;
  }

  const payloadSeg = token.split('.')[1];
  const payload = parseJson(Buffer.from(payloadSeg, 'base64').toString('utf-8'));
  pass('Authentication successful');
  info(`Base URL: ${BASE_URL}`);
  info(`Customer ID: ${payload?.customerid ?? 'N/A'}`);
  info(`User ID: ${payload?.userid ?? payload?.sub ?? 'N/A'}`);
  return true;
}

async function api(path, options = {}) {
  return httpsCall(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

async function getCarrierServices() {
  section(`Step 2: Carrier Services (${CARRIER_CODE} domestic)`);
  const path = `/v2.0/carriers/services?isDomestic=true&shipFromCountryCode=US&carrierCode=${encodeURIComponent(CARRIER_CODE)}`;
  const res = await api(path);

  if (res.status < 200 || res.status >= 300) {
    fail(`Request failed (${res.status}): ${JSON.stringify(res.body)}`);
    return [];
  }

  const services = Array.isArray(res.body) ? res.body : [];
  pass(`${CARRIER_CODE} services returned: ${services.length}`);
  for (const svc of services.slice(0, 5)) {
    info(`${svc.ServiceCode}: ${svc.ServiceCodeDesc ?? svc.ServiceName ?? 'Unknown'}`);
  }

  if (!services.length) {
    fail(`${CARRIER_CODE} is not authorized/enabled for domestic API on this account/environment`);
  }

  return services;
}

async function getPackageTypes(serviceCode) {
  section(`Step 3: Package Types (${CARRIER_CODE})`);
  const path = `/v2.0/carriers/package-types?carrierservicecode=${encodeURIComponent(serviceCode)}&carriercode=${encodeURIComponent(CARRIER_CODE)}`;
  const res = await api(path);

  if (res.status < 200 || res.status >= 300) {
    fail(`Request failed (${res.status}): ${JSON.stringify(res.body)}`);
    return [];
  }

  const packages = Array.isArray(res.body) ? res.body : [];
  pass(`Package types returned: ${packages.length}`);
  for (const pkg of packages.slice(0, 8)) {
    const code = pkg.PackageCode ?? pkg.PackageTypeCode ?? pkg.Code ?? 'N/A';
    const desc = pkg.PackageCodeDesc ?? pkg.PackageTypeDesc ?? pkg.PackageName ?? pkg.Description ?? 'Unknown';
    info(`${code}: ${desc}`);
  }
  if (packages.length > 0) {
    const sample = packages[0];
    info(`Package response keys: ${Object.keys(sample).join(', ')}`);
  }
  return packages;
}

async function quoteProbe(serviceCode, packageCode) {
  section('Step 4: Quote Probe (optional authorization check)');

  const locationsRes = await api('/v2.0/locations');
  if (locationsRes.status < 200 || locationsRes.status >= 300 || !Array.isArray(locationsRes.body) || !locationsRes.body.length) {
    fail(`Could not load locations (${locationsRes.status}): ${JSON.stringify(locationsRes.body)}`);
    return;
  }
  const loc = locationsRes.body.find((l) => l.IsUserDefault) ?? locationsRes.body[0];
  info(`Using ShipFrom ContactId: ${loc.ContactId} (${loc.CompanyName || `${loc.FirstName} ${loc.LastName}`})`);

  const payload = {
    CarrierCode: CARRIER_CODE,
    ServiceCode: serviceCode,
    PackageCode: packageCode,
    ShipDate: new Date().toISOString().split('T')[0],
    ShipFrom: {
      ContactType: 2,
      ContactId: loc.ContactId,
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
      FirstName: 'Jane',
      LastName: 'Smith',
      StreetAddress: '123 Main Street',
      ApartmentSuite: 'Apt 4B',
      City: 'New York',
      State: 'NY',
      Zip: '10001',
      Country: 'US',
      TelephoneNo: '2125550100',
      Email: 'test@bradylegler.com',
    },
    Weight: 1.1,
    Length: 12,
    Width: 10,
    Height: 4,
    InsuredValue: 250.0,
    Reference: '#ACCESS-CHECK',
    Description: 'Access check quote',
    ShipToResidential: 1,
  };

  const res = await api('/v2.0/quotes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status >= 200 && res.status < 300) {
    const quoteId =
      res.body?.QuoteID ??
      res.body?.QuoteId ??
      res.body?.quoteId ??
      res.body?.quoteID ??
      res.body?.Data?.QuoteID ??
      res.body?.Data?.QuoteId ??
      res.body?.data?.QuoteID ??
      res.body?.data?.QuoteId ??
      'N/A';
    pass(`Quote probe succeeded (QuoteID: ${quoteId})`);
    return;
  }

  fail(`Quote probe failed (${res.status}): ${JSON.stringify(res.body)}`);
  const msg = JSON.stringify(res.body).toLowerCase();
  if (msg.includes('not authorized') && msg.includes(CARRIER_CODE.toLowerCase())) {
    info(`Diagnosis: ${CARRIER_CODE} domestic API permission is missing for this account/environment.`);
  }
}

async function main() {
  console.log('═'.repeat(64));
  console.log('Parcel Pro Access Check');
  console.log('═'.repeat(64));

  const ok = await auth();
  if (!ok) process.exit(1);

  const services = await getCarrierServices();
  if (!services.length) {
    console.log(`\nAction: contact apihelp@parcelpro.com and request ${CARRIER_CODE} domestic API enablement.`);
    process.exit(1);
  }

  const preferredService =
    process.env.PARCELPRO_DOMESTIC_SERVICE_CODE ||
    (CARRIER_CODE.toUpperCase() === 'FEDEX' ? '03-DOM' : '03');
  const serviceCode = services.find((s) => s.ServiceCode === preferredService)?.ServiceCode ?? services[0].ServiceCode;
  const packages = await getPackageTypes(serviceCode);
  const packageCode =
    packages.find((p) => (p.PackageCode ?? p.PackageTypeCode ?? p.Code) === '02')?.PackageCode ??
    packages.find((p) => (p.PackageCode ?? p.PackageTypeCode ?? p.Code) === '02')?.PackageTypeCode ??
    packages[0]?.PackageCode ??
    packages[0]?.PackageTypeCode ??
    packages[0]?.Code ??
    '02';

  await quoteProbe(serviceCode, packageCode);
}

main().catch((err) => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});

