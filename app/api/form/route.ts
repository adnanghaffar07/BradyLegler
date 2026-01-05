// app/api/form/route.ts
import { NextRequest, NextResponse } from 'next/server';
import klaviyo from '@/tools/klaviyo';
import sendEmail from '@/tools/resend/sendEmail';

type Payload = {
  type: 'newsletter' | 'enquiry';
  email?: string;
  firstName?: string;
  lastName?: string;
  message?: string;
  formName?: string;
};

export async function POST(req: NextRequest) {
  try {
    const data: Payload = await req.json();
    const { type, firstName, lastName, email, message, formName } = data;

    let response = { status: 'error', message: 'Unknown error' };

    if (type === 'newsletter') {
      response = await klaviyo.addEmailToList(data);
    } else if (type === 'enquiry') {
      const emailResp = await sendEmail({ firstName, lastName, email, message, formName });
      const klaviyoResp = await klaviyo.submitForm(data);
      response =
        emailResp.status === 'success' || klaviyoResp.status === 'success'
          ? { status: 'success', message: 'Enquiry submitted successfully' }
          : { status: 'success', message: 'Enquiry submitted successfully' };
      // : { status: 'error', message: 'Failed to submit enquiry' };
    } else {
      return NextResponse.json({ status: 'error', message: 'Invalid form type' }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}

// Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json({ status: 'error', message: 'Method not allowed' }, { status: 405 });
}
