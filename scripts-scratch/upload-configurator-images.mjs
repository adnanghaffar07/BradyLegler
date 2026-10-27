/**
 * Throwaway: seeds the staging product document's `configuratorImages` from the
 * 30 files in `public/subway/`. Not shipped - once the client authors imagery in
 * the Studio this script has no further use.
 *
 * Idempotent in both halves. Sanity deduplicates image uploads by content hash,
 * so re-uploading the same file returns the same asset id; and the document patch
 * SETS the whole array rather than appending, with a stable `_key` per row. A
 * half-finished run can simply be repeated.
 *
 * Usage: node scripts-scratch/upload-configurator-images.mjs [--dry-run]
 */
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The option vocabulary comes from the configurator's own options.ts rather than
// being retyped here, so a finish renamed in one place cannot silently mismatch the
// other. It is TypeScript, so bundle it to a temp file and import that - cheaper
// than adding a loader, and it leaves no generated artifact in the repo.
const OPTIONS_TS = 'templates/ProductTemplate/components/SubwayRingCustomizer/options.ts';
const bundled = join(mkdtempSync(join(tmpdir(), 'cfgimg-')), 'options.mjs');
execFileSync('npx', ['esbuild', OPTIONS_TS, '--bundle', '--platform=node', '--format=esm',
  '--log-level=warning', `--outfile=${bundled}`], { stdio: 'inherit', shell: true });
const { METALS, FINISHES } = await import(pathToFileURL(bundled).href);

const DOC_ID = 'shopifyProduct-10355682017590'; // subway-double-band-ring-yellow-gold
const DRY = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);
const pid = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
const ver = env.NEXT_PUBLIC_SANITY_API_VERSION.replace(/^v/, '');
const token = env.SANITY_WRITE_TOKEN;

if (dataset !== 'staging') throw new Error(`refusing to run against dataset "${dataset}" - staging only`);
if (!token) throw new Error('SANITY_WRITE_TOKEN missing from .env');

const api = `https://${pid}.api.sanity.io/v${ver}`;

/** The same rule the configurator used when these filenames were authored. */
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Inverting slug() beats parsing filenames: a name like "white-gold-black-diamond"
// splits ambiguously, but generating the expected name per combination cannot.
// Platinum is absent on purpose - it has no photography and borrows white gold.
const PHOTOGRAPHED_METALS = METALS.filter(m => m !== 'Platinum');

const rows = [];
const missing = [];
for (const metal of PHOTOGRAPHED_METALS) {
  for (const finish of FINISHES) {
    const key = `${slug(metal)}-${slug(finish)}`;
    const path = `public/subway/${key}.jpg`;
    if (existsSync(path)) rows.push({ key, metal, finish, path });
    else missing.push(path);
  }
}

console.log(`dataset=${dataset}  doc=${DOC_ID}`);
console.log(`${rows.length} files matched, ${missing.length} expected-but-absent`);
if (missing.length) missing.forEach(m => console.log(`  absent: ${m}`));
if (rows.length !== 30) throw new Error(`expected 30 files, matched ${rows.length}`);

if (DRY) {
  rows.forEach(r => console.log(`  ${r.metal} / ${r.finish}  <- ${r.path}`));
  process.exit(0);
}

const uploadAsset = async row => {
  const res = await fetch(`${api}/assets/images/${dataset}?filename=${row.key}.jpg`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
    body: readFileSync(row.path)
  });
  if (!res.ok) throw new Error(`upload ${row.key}: ${res.status} ${await res.text()}`);
  return (await res.json()).document._id;
};

const assetIds = new Map();
for (const row of rows) {
  const id = await uploadAsset(row);
  assetIds.set(row.key, id);
  console.log(`  uploaded ${row.metal} / ${row.finish} -> ${id}`);
}

const patch = rows.map(row => ({
  _key: row.key,
  _type: 'configuratorImage',
  metal: row.metal,
  finish: row.finish,
  image: { _type: 'image', asset: { _type: 'reference', _ref: assetIds.get(row.key) } }
}));

const res = await fetch(`${api}/data/mutate/${dataset}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ mutations: [{ patch: { id: DOC_ID, set: { configuratorImages: patch } } }] })
});
if (!res.ok) throw new Error(`patch: ${res.status} ${await res.text()}`);

console.log(`\npatched ${patch.length} rows onto ${DOC_ID}`);
console.log(JSON.stringify(await res.json()));
