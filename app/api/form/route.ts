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

    // Validate Klaviyo environment variables
    if (!process.env.KLAVIYO_PRIVATE_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Klaviyo API key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.KLAVIYO_LIST_ID) {
      return NextResponse.json(
        { status: 'error', message: 'Klaviyo List ID not configured' },
        { status: 500 }
      );
    }

    let response = { status: 'error', message: 'Unknown error' };

    if (type === 'newsletter') {
      if (!data.email) {
        return NextResponse.json({ status: 'error', message: 'Email is required' }, { status: 400 });
      }
      response = await klaviyo.addEmailToList(data);
    } else if (type === 'enquiry') {
      // Validate required fields for enquiry
      if (!data.email || !data.firstName || !data.lastName || !data.formName) {
        return NextResponse.json(
          { status: 'error', message: 'Missing required fields (email, firstName, lastName, formName)' },
          { status: 400 }
        );
      }

      // Determine which list to use based on form name
      let listId = process.env.KLAVIYO_LIST_ID; // Default: Website Contact Form
      
      if (data.formName === 'Artwork Enquiry Form') {
        listId = process.env.KLAVIYO_ARTWORK_LIST_ID || process.env.KLAVIYO_LIST_ID;
      }

      // Ensure message is always a string
      const payloadForKl = {
        ...data,
        message: data.message || '',
        listId: listId // Pass custom list ID
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
    return NextResponse.json(
      { status: 'error', message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'error', message: 'Method not allowed' }, { status: 405 });
}
