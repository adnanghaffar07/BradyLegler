import fs from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const ICONS = ['/favicon.svg', '/apple-touch-icon.png'];

const toPublicPath = iconPath => {
  return path.join(PUBLIC_DIR, iconPath.replace(/^\//, ''));
};

const checkLocalFile = async iconPath => {
  const fullPath = toPublicPath(iconPath);
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      return { ok: false, message: `${iconPath} exists but is not a file` };
    }
    return { ok: true, message: `${iconPath} exists (${stats.size} bytes)` };
  } catch {
    return { ok: false, message: `${iconPath} is missing in public folder` };
  }
};

const checkRemoteFile = async (baseUrl, iconPath) => {
  const url = `${baseUrl}${iconPath}`;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return {
      ok: response.ok,
      message: `${url} -> ${response.status} ${response.statusText}`
    };
  } catch (error) {
    return {
      ok: false,
      message: `${url} -> request failed (${error instanceof Error ? error.message : 'unknown error'})`
    };
  }
};

const main = async () => {
  console.log('\nIcon check (local public folder)\n');
  let hasLocalFailure = false;

  for (const iconPath of ICONS) {
    const result = await checkLocalFile(iconPath);
    hasLocalFailure = hasLocalFailure || !result.ok;
    console.log(result.ok ? `PASS: ${result.message}` : `FAIL: ${result.message}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!siteUrl) {
    console.log('\nSkip remote check: NEXT_PUBLIC_SITE_URL is not set.\n');
    process.exit(hasLocalFailure ? 1 : 0);
  }

  console.log(`\nIcon check (remote): ${siteUrl}\n`);
  let hasRemoteFailure = false;
  for (const iconPath of ICONS) {
    const result = await checkRemoteFile(siteUrl, iconPath);
    hasRemoteFailure = hasRemoteFailure || !result.ok;
    console.log(result.ok ? `PASS: ${result.message}` : `FAIL: ${result.message}`);
  }

  const hasFailure = hasLocalFailure || hasRemoteFailure;
  console.log(hasFailure ? '\nIcon check completed with failures.\n' : '\nIcon check passed.\n');
  process.exit(hasFailure ? 1 : 0);
};

main();
