import { draftMode, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  draftMode().disable();
  return new NextResponse(null, {
    status: 200
  });
  
}
