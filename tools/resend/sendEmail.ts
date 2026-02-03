import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FORM_ENQUIRY_EMAIL_RECIPIENT = process.env.FORM_ENQUIRY_EMAIL_RECIPIENT!;

type SendEmailProps = {
  message: string;
  recipient?: string;
  subject?: string;
  email: string;
  firstName: string;
  lastName: string;
};

const sendEmail = async (values: SendEmailProps) => {
  // Check if required environment variables are set
  if (!process.env.RESEND_API_KEY) {
    return false;
  }

  if (!process.env.FORM_ENQUIRY_EMAIL_RECIPIENT) {
    return false;
  }

  const {
    recipient = FORM_ENQUIRY_EMAIL_RECIPIENT,
    email = 'N/A',
    firstName = 'N/A',
    lastName = 'N/A',
    message = 'N/A',
    subject = 'New enquiry from your website'
  } = values;

  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Consider making this configurable too
      to: [recipient],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Website Enquiry</h2>
          <ul style="list-style: none; padding: 0; margin: 0; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <li style="margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #eee;">
              <strong style="color: #555;">First Name:</strong> ${firstName}
            </li>
            <li style="margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #eee;">
              <strong style="color: #555;">Last Name:</strong> ${lastName}
            </li>
            <li style="margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #eee;">
              <strong style="color: #555;">Email Address:</strong> 
              <a href="mailto:${email}" style="color: #0070f3; text-decoration: none;">${email}</a>
            </li>
            <li style="padding: 8px;">
              <strong style="color: #555;">Message:</strong> 
              <div style="margin-top: 8px; padding: 12px; background: white; border-radius: 4px; border-left: 4px solid #0070f3;">
                ${message}
              </div>
            </li>
          </ul>
        </div>`
    });

    if (data?.error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export default sendEmail;
