/**
 * Shared SHA-256 hashing utilities for Meta Conversions API `user_data` fields.
 * Uses the Web Crypto API, which is available in both the browser and the
 * Node/Edge server runtimes Next.js targets, so this module is safe to import
 * from client components, Route Handlers, and middleware alike.
 *
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */

const HASHED_HEX_64 = /^[a-f0-9]{64}$/i;

export type MetaHashableField = 'em' | 'ph' | 'external_id' | 'fn' | 'ln' | 'ct' | 'st' | 'zp' | 'country';

function getCrypto(): Crypto {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as { crypto?: Crypto }).crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto API is not available in this runtime');
  }
  return cryptoObj;
}

export async function sha256(text: string): Promise<string> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** True when the value already looks like a SHA-256 hex digest (avoid double-hashing). */
export function isLikelyHashed(value: string): boolean {
  return HASHED_HEX_64.test(value);
}

/**
 * Normalize a raw `user_data` value per Meta's Conversions API spec, then SHA-256 hash it.
 * Values that already look hashed are passed through unchanged.
 */
export async function normalizeAndHashUserField(
  value: string | undefined,
  fieldType: MetaHashableField
): Promise<string | undefined> {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (isLikelyHashed(trimmed)) return trimmed;

  let normalized = trimmed.toLowerCase();

  if (fieldType === 'em' || fieldType === 'ph') {
    normalized = normalized.replace(/\s/g, '');
  }

  if (fieldType === 'ph') {
    // Meta expects digits only, no country-code punctuation.
    normalized = normalized.replace(/[^\d]/g, '');
  }

  if (fieldType === 'zp') {
    // Meta only wants the primary 5-digit segment, not a ZIP+4 suffix.
    normalized = normalized.split('-')[0].replace(/\s/g, '');
  }

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
