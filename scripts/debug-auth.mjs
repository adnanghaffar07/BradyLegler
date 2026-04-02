/**
 * Minimal Parcel Pro auth debug script.
 * Run:  node scripts/debug-auth.mjs
 * Tests both the beta and production auth endpoints with your credentials.
 */

import { request as httpsRequest } from 'node:https';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

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

const user = process.env.PARCELPRO_USER;
const pass = process.env.PARCELPRO_PASS;

console.log('═'.repeat(55));
console.log('  Parcel Pro Auth Debug');
console.log('═'.repeat(55));
console.log(`Username: "${user}"`);
console.log(`Password: "${pass?.slice(0, 3)}${'*'.repeat((pass?.length ?? 3) - 3)}"`);
console.log('');

const BASE = 'https://apibeta.parcelpro.com';

// Exact URL from Postman collection: grant_type has value in URL, username/password are empty in URL
const AUTH_URL = `${BASE}/v2.0/auth?password=&grant_type=password&username=`;
// Credentials go in the body as raw string (not URLSearchParams — avoids %21 encoding of !)
const bodyStr = `password=${pass}&grant_type=password&username=${user}`;

async function attempt(label, url, options) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🧪 ${label}`);
  console.log(`   Method:  ${options.method}`);
  console.log(`   URL:     ${url.replace(pass, '***')}`);
  console.log(`   Headers: ${JSON.stringify(options.headers ?? {})}`);
  console.log(`   Body:    ${options.body ? options.body.replace(pass, '***') : '(none)'}`);
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    console.log(`   Status:  HTTP ${res.status}`);
    if (res.ok) {
      const json = JSON.parse(text);
      console.log('   ✅ SUCCESS');
      const seg = json.access_token.split('.')[1];
      const pl = JSON.parse(Buffer.from(seg, 'base64').toString('utf-8'));
      console.log(`   Customer ID: ${pl.customerid}  User ID: ${pl.userid ?? pl.sub}`);
      return json.access_token;
    } else {
      console.log(`   ❌ Response: ${text.substring(0, 120)}`);
      return null;
    }
  } catch (err) {
    console.log(`   💥 ${err.message}`);
    return null;
  }
}

// Exact match of Postman collection:
// URL has ?password=&grant_type=password&username= (grant_type present, credentials empty in URL)
// Body has actual credentials as raw urlencoded string (no percent-encoding of special chars)
let token = await attempt(
  'Postman-exact: empty URL params + credentials in body',
  AUTH_URL,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyStr,
  }
);
if (token) process.exit(0);

// Fallback A: body only, no URL params
token = await attempt(
  'Fallback A: body only, no URL params',
  `${BASE}/v2.0/auth`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyStr,
  }
);
if (token) process.exit(0);

// Fallback B: Postman-exact + Postman headers
token = await attempt(
  'Fallback B: Postman-exact + User-Agent header',
  AUTH_URL,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'User-Agent': 'PostmanRuntime/7.43.0',
    },
    body: bodyStr,
  }
);
if (token) process.exit(0);

// ── Final attempt: force HTTP/1.1 using node:https directly ──────────────
// Node.js fetch (undici) may negotiate HTTP/2 which Parcel Pro's server crashes on.
// node:https always uses HTTP/1.1, exactly like Postman.
console.log(`\n${'─'.repeat(50)}`);
console.log('🧪 Fallback C: force HTTP/1.1 via node:https (bypasses undici/HTTP2)');
console.log(`   URL:  https://apibeta.parcelpro.com/v2.0/auth?password=&grant_type=password&username=`);
console.log(`   Body: password=***&grant_type=password&username=${user}`);

const http1Result = await new Promise((resolve) => {
  const body = bodyStr;
  const req = httpsRequest(
    {
      hostname: 'apibeta.parcelpro.com',
      path: '/v2.0/auth?password=&grant_type=password&username=',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }
  );
  req.on('error', (err) => resolve({ status: 0, body: err.message }));
  req.write(body);
  req.end();
});

console.log(`   Status: HTTP ${http1Result.status}`);
if (http1Result.status === 200) {
  const json = JSON.parse(http1Result.body);
  console.log('   ✅ SUCCESS — HTTP/1.1 works! The issue was HTTP/2 negotiation.');
  const seg = json.access_token.split('.')[1];
  const pl = JSON.parse(Buffer.from(seg, 'base64').toString('utf-8'));
  console.log(`   Customer ID: ${pl.customerid}  User ID: ${pl.userid ?? pl.sub}`);
  console.log('\n   → Fix: set dispatcher in fetch to disable HTTP/2, or switch to node:https in lib/parcelpro.ts');
} else {
  console.log(`   ❌ Response: ${http1Result.body.substring(0, 120)}`);
  console.log('\n' + '═'.repeat(50));
  console.log('All attempts failed including HTTP/1.1.');
  console.log('The credentials lramirez/UpscPp!2024 may not be active on apibeta.parcelpro.com.');
  console.log('Try logging in at https://www.parcelpro.com with these credentials to verify.');
  console.log('═'.repeat(50));
}

console.log('\n' + '═'.repeat(55));
console.log('  What to do based on results:');
console.log('═'.repeat(55));
console.log('  Beta ✅  Prod ❌  → Set PARCELPRO_BASE_URL=https://apibeta.parcelpro.com');
console.log('  Beta ❌  Prod ✅  → Set PARCELPRO_BASE_URL=https://api.parcelpro.com');
console.log('  Both ❌  HTTP 401 → Wrong username or password — check with Parcel Pro');
console.log('  Both ❌  HTTP 500 → Account not found on that server — contact apihelp@parcelpro.com');
console.log('');
