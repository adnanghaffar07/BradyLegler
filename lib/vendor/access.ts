import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Vendor access is one shared passcode (VENDOR_PASSCODE), checked on the server.
 * A correct passcode sets an httpOnly cookie holding a signature of the passcode,
 * so changing VENDOR_PASSCODE signs every vendor out. With no passcode set, the
 * vendor page stays locked.
 */
export const VENDOR_COOKIE = 'bl_vendor_access';
export const VENDOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const getPasscode = () => process.env.VENDOR_PASSCODE?.trim() || '';

export const isVendorAccessConfigured = () => getPasscode().length > 0;

const sign = (passcode: string) => createHmac('sha256', passcode).update('brady-legler-vendor-access-v1').digest('hex');

const safeEqual = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
};

export const isCorrectPasscode = (attempt: string) => {
  const passcode = getPasscode();
  return passcode.length > 0 && safeEqual(sign(attempt.trim()), sign(passcode));
};

export const vendorAccessToken = () => sign(getPasscode());

export const hasVendorAccess = () => {
  const passcode = getPasscode();
  const token = cookies().get(VENDOR_COOKIE)?.value;
  return Boolean(passcode && token && safeEqual(token, sign(passcode)));
};
