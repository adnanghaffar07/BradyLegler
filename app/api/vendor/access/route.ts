import { NextRequest, NextResponse } from 'next/server';
import {
  VENDOR_COOKIE,
  VENDOR_COOKIE_MAX_AGE,
  isCorrectPasscode,
  isVendorAccessConfigured,
  vendorAccessToken
} from '@/lib/vendor/access';

export const dynamic = 'force-dynamic';

const noIndex = { 'X-Robots-Tag': 'noindex, nofollow' };

// Sign in with the shared vendor passcode.
export async function POST(req: NextRequest) {
  if (!isVendorAccessConfigured()) {
    return NextResponse.json(
      { status: 'error', message: 'Vendor ordering is not open yet.' },
      { status: 503, headers: noIndex }
    );
  }

  let passcode = '';
  try {
    const body = await req.json();
    passcode = typeof body?.passcode === 'string' ? body.passcode : '';
  } catch {
    // Treated as a wrong passcode below.
  }

  if (!isCorrectPasscode(passcode)) {
    // A short pause makes guessing the passcode slow.
    await new Promise(resolve => setTimeout(resolve, 800));
    return NextResponse.json(
      { status: 'error', message: 'That passcode is not correct.' },
      { status: 401, headers: noIndex }
    );
  }

  const response = NextResponse.json({ status: 'success' }, { headers: noIndex });
  response.cookies.set(VENDOR_COOKIE, vendorAccessToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VENDOR_COOKIE_MAX_AGE
  });
  return response;
}

// Sign out.
export async function DELETE() {
  const response = NextResponse.json({ status: 'success' }, { headers: noIndex });
  response.cookies.delete(VENDOR_COOKIE);
  return response;
}
