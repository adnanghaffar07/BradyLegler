// app/api/form/route.ts
import { NextRequest, NextResponse } from 'next/server';
import klaviyo from '@/tools/klaviyo';
import sendEmail from '@/tools/resend/sendEmail';

type Payload = {
  type: 'newsletter' | 'enquiry';
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  contactMethod?: string;
  message?: string;
  formName?: string;
};

export async function POST(req: NextRequest) {
  try {
    const data: Payload = await req.json();
    const { type } = data;

    let response = { status: 'error', message: 'Unknown error' };

    if (type === 'newsletter') {
      response = await klaviyo.addEmailToList(data);
    } else if (type === 'enquiry') {
      // Ensure message is always a string
      const payloadForKl = {
        ...data,
        message: data.message || ''
      };

      const klaviyoResp = await klaviyo.submitForm(payloadForKl);

      // Optionally send email notification (you can uncomment this)
      // const emailResp = await sendEmail(data);

      // Use the OR logic that was working before
      response =
        klaviyoResp.status === 'success'
          ? { status: 'success', message: 'Enquiry submitted successfully' }
          : {
              status: 'error',
              message: klaviyoResp.message || 'Failed to submit enquiry'
            };
    } else {
      return NextResponse.json({ status: 'error', message: 'Invalid form type' }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'error', message: 'Method not allowed' }, { status: 405 });
}
