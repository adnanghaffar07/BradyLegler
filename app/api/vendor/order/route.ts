import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { hasVendorAccess } from '@/lib/vendor/access';
import { getVendorCatalog, VendorCatalogProduct } from '@/tools/apis/shopify';
import {
  MAX_VENDOR_LINES,
  MAX_VENDOR_QUANTITY,
  REQUIRED_VENDOR_FIELDS,
  VendorOrderDetails,
  VendorOrderPayload
} from '@/lib/vendor/types';

export const dynamic = 'force-dynamic';

/**
 * A vendor order request. Nothing is charged and nothing is created in Shopify: the
 * order is emailed to the client (VENDOR_ORDER_EMAIL_RECIPIENT, else the enquiry
 * inbox), who confirms trade pricing with the vendor directly.
 */

const noIndex = { 'X-Robots-Tag': 'noindex, nofollow' };

const fail = (message: string, status = 400) =>
  NextResponse.json({ status: 'error', message }, { status, headers: noIndex });

const DETAIL_FIELDS: (keyof VendorOrderDetails)[] = [
  'company',
  'firstName',
  'lastName',
  'email',
  'phone',
  'address1',
  'address2',
  'city',
  'region',
  'postalCode',
  'country',
  'poNumber',
  'notes'
];

const clean = (value: unknown, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type ResolvedLine = { product: VendorCatalogProduct; options: [string, string][]; quantity: number };

const orderReference = () => {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `V-${date}-${randomBytes(2).toString('hex').toUpperCase()}`;
};

const buildEmail = (reference: string, details: VendorOrderDetails, lines: ResolvedLine[], siteUrl: string) => {
  const totalPieces = lines.reduce((sum, line) => sum + line.quantity, 0);
  const address = [
    details.address1,
    details.address2,
    [details.city, details.region, details.postalCode].filter(Boolean).join(', '),
    details.country
  ].filter(Boolean);

  const lineText = (line: ResolvedLine) => {
    const options = line.options.map(([name, value]) => `${name}: ${value}`).join(', ');
    return `${line.quantity} × ${line.product.title}${options ? ` (${options})` : ''}`;
  };

  const text = [
    `Vendor order request ${reference}`,
    '',
    `Company: ${details.company}`,
    `Contact: ${details.firstName} ${details.lastName}`,
    `Email: ${details.email}`,
    details.phone ? `Phone: ${details.phone}` : null,
    details.poNumber ? `PO number: ${details.poNumber}` : null,
    '',
    'Ship to:',
    ...address,
    '',
    `Items (${totalPieces} pieces):`,
    ...lines.map(line => `- ${lineText(line)} — ${siteUrl}/${line.product.handle}`),
    '',
    details.notes ? `Notes:\n${details.notes}` : null,
    '',
    'No payment was taken. Reply to this email to confirm pricing and lead time with the vendor.'
  ]
    .filter(line => line !== null)
    .join('\n');

  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
      : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#141420;font-size:14px;line-height:1.5">
      <h2 style="font-weight:400;letter-spacing:0.05em">Vendor order request ${escapeHtml(reference)}</h2>
      <table style="border-collapse:collapse;margin-bottom:24px">
        ${row('Company', details.company)}
        ${row('Contact', `${details.firstName} ${details.lastName}`)}
        ${row('Email', details.email)}
        ${row('Phone', details.phone)}
        ${row('PO number', details.poNumber)}
        <tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">Ship to</td><td style="padding:4px 0">${address
          .map(escapeHtml)
          .join('<br>')}</td></tr>
      </table>
      <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;border-bottom:1px solid #ccc;font-weight:400;color:#666">Piece</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;font-weight:400;color:#666">Options</th>
            <th style="text-align:right;padding:8px 0;border-bottom:1px solid #ccc;font-weight:400;color:#666">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${lines
            .map(
              line => `<tr>
                <td style="padding:8px 0;border-bottom:1px solid #eee"><a href="${escapeHtml(
                  `${siteUrl}/${line.product.handle}`
                )}" style="color:#141420">${escapeHtml(line.product.title)}</a></td>
                <td style="padding:8px;border-bottom:1px solid #eee">${line.options
                  .map(([name, value]) => `${escapeHtml(name)}: ${escapeHtml(value)}`)
                  .join('<br>')}</td>
                <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${line.quantity}</td>
              </tr>`
            )
            .join('')}
          <tr><td colspan="2" style="padding:8px 0;color:#666">Total pieces</td><td style="padding:8px 0;text-align:right">${totalPieces}</td></tr>
        </tbody>
      </table>
      ${
        details.notes
          ? `<p style="color:#666;margin-bottom:4px">Notes</p><p style="white-space:pre-wrap;margin-top:0">${escapeHtml(
              details.notes
            )}</p>`
          : ''
      }
      <p style="color:#666;font-size:12px;margin-top:32px">No payment was taken. Reply to this email to confirm pricing and lead time with the vendor.</p>
    </div>`;

  return { text, html };
};

export async function POST(req: NextRequest) {
  if (!hasVendorAccess()) return fail('Your vendor session has ended. Please enter the passcode again.', 401);

  let payload: VendorOrderPayload;
  try {
    payload = await req.json();
  } catch {
    return fail('The order could not be read.');
  }

  // Details
  const details = {} as VendorOrderDetails;
  DETAIL_FIELDS.forEach(field => {
    details[field] = clean(payload?.details?.[field], field === 'notes' ? 3000 : 200);
  });
  const missing = REQUIRED_VENDOR_FIELDS.filter(field => !details[field]);
  if (missing.length) return fail('Please fill in all required details.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return fail('Please enter a valid email address.');

  // Lines, checked against what Shopify is actually selling.
  const rawLines = Array.isArray(payload?.lines) ? payload.lines : [];
  if (!rawLines.length) return fail('Your order has no pieces in it.');
  if (rawLines.length > MAX_VENDOR_LINES) return fail(`Orders are limited to ${MAX_VENDOR_LINES} lines.`);

  let catalog: VendorCatalogProduct[];
  try {
    catalog = await getVendorCatalog();
  } catch (error) {
    console.error('Vendor order: could not load the catalogue', error);
    return fail('We could not check your order right now. Please try again.', 502);
  }
  const productsByHandle = new Map(catalog.map(product => [product.handle, product]));

  const lines: ResolvedLine[] = [];
  for (const raw of rawLines) {
    const product = productsByHandle.get(clean(raw?.handle));
    if (!product)
      return fail('One of the pieces in your order is no longer available. Please remove it and try again.');

    const quantity = Math.floor(Number(raw?.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_VENDOR_QUANTITY) {
      return fail(`Please check the quantity for ${product.title}.`);
    }

    const options: [string, string][] = [];
    for (const option of product.options) {
      const value = clean(raw?.options?.[option.name]);
      if (!option.values.includes(value))
        return fail(`Please choose a ${option.name.toLowerCase()} for ${product.title}.`);
      options.push([option.name, value]);
    }

    lines.push({ product, options, quantity });
  }

  const reference = orderReference();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '');
  const { text, html } = buildEmail(reference, details, lines, siteUrl);
  const subject = `Vendor order ${reference} — ${details.company}`;

  // For local testing: log the email instead of sending it.
  if (process.env.VENDOR_ORDER_EMAIL_DRY_RUN === 'true') {
    console.log(`[vendor order dry run] ${subject}\n${text}`);
    return NextResponse.json({ status: 'success', reference }, { headers: noIndex });
  }

  const recipient = process.env.VENDOR_ORDER_EMAIL_RECIPIENT || process.env.FORM_ENQUIRY_EMAIL_RECIPIENT;
  if (!process.env.RESEND_API_KEY || !recipient) {
    console.error('Vendor order: RESEND_API_KEY or a recipient email is not set');
    return fail('Orders cannot be sent right now. Please email us directly.', 503);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  // Resend's shared onboarding sender can only reach the account owner, so the
  // vendor's copy is sent only once a sender on a verified domain is configured.
  const from = process.env.VENDOR_ORDER_EMAIL_FROM;

  try {
    const sent = await resend.emails.send({
      from: from || 'Brady Legler <onboarding@resend.dev>',
      to: recipient.split(',').map(address => address.trim()),
      replyTo: details.email,
      subject,
      html,
      text
    });
    if (sent.error) throw new Error(sent.error.message);
  } catch (error) {
    console.error('Vendor order: email failed', error);
    return fail('Your order could not be sent. Please try again or email us directly.', 502);
  }

  if (from) {
    try {
      await resend.emails.send({
        from,
        to: [details.email],
        subject: `We received your order request ${reference}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;font-size:14px;color:#141420"><p>Thank you, ${escapeHtml(
          details.firstName
        )}. We received your order request and will be in touch to confirm pricing and timing. Here is a copy.</p></div>${html}`,
        text: `Thank you, ${details.firstName}. We received your order request and will be in touch to confirm pricing and timing.\n\n${text}`
      });
    } catch (error) {
      // The client already has the order, so a failed copy is not shown as an error.
      console.error('Vendor order: copy to vendor failed', error);
    }
  }

  return NextResponse.json({ status: 'success', reference }, { headers: noIndex });
}
