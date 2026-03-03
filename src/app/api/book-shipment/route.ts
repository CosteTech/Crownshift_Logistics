export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getFirestoreAdmin, getConfiguredAdminEmail } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteBreakdown {
  baseRate: number;
  distanceCharge: number;
  volumetricSurcharge: number;
  weightSurcharge: number;
  handlingFee: number;
  urgencySurcharge: number;
  insuranceFee: number;
}

interface BookShipmentRequest {
  clientDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  shipmentDetails: {
    origin: string;
    destination: string;
    dimensions: string; // e.g. "30x20x15 cm"
    weight: string;     // e.g. "5 kg"
    packageType?: string;
    urgency?: string;
  };
  quote: {
    quoteUSD: number;
    quoteKES: number;
    breakdown: QuoteBreakdown;
    estimatedDeliveryDays?: number;
    summary?: string;
    recommendations?: string;
  };
  trackingNumber: string;
}

// ─── Nodemailer Transport ─────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildClientEmailHtml(data: BookShipmentRequest) {
  const { clientDetails, shipmentDetails, quote, trackingNumber } = data;
  const bd = quote.breakdown;

  const breakdownRows = [
    ['Base Rate', bd.baseRate],
    ['Distance Charge', bd.distanceCharge],
    ['Volume Surcharge', bd.volumetricSurcharge],
    ['Weight Surcharge', bd.weightSurcharge],
    ['Handling Fee', bd.handlingFee],
    ['Urgency Surcharge', bd.urgencySurcharge],
    ['Insurance Fee', bd.insuranceFee],
  ]
    .map(
      ([label, val]) => `
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">${label}</td>
          <td style="padding:6px 0;text-align:right;font-size:14px;">$${(val as number).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#f97316;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Crownshift Logistics</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Your trusted shipping partner across Kenya</p>
          </td>
        </tr>

        <!-- Success Banner -->
        <tr>
          <td style="background:#dcfce7;padding:20px 40px;text-align:center;border-bottom:1px solid #bbf7d0;">
            <p style="margin:0;color:#166534;font-size:16px;font-weight:600;">✅ Shipment Booked Successfully!</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0;font-size:16px;color:#1e293b;">Dear <strong>${clientDetails.name}</strong>,</p>
            <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
              Thank you for choosing Crownshift Logistics. Your shipment has been confirmed. Below are your booking details and AI-generated quote summary.
            </p>
          </td>
        </tr>

        <!-- Tracking Number -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#f8fafc;border:2px dashed #f97316;border-radius:10px;padding:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
              <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#f97316;letter-spacing:2px;">${trackingNumber}</p>
              <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Use this to track your shipment on our website</p>
            </div>
          </td>
        </tr>

        <!-- Shipment Details -->
        <tr>
          <td style="padding:0 40px 24px;">
            <h3 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Shipment Details</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;width:45%;border-bottom:1px solid #e2e8f0;">From</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #e2e8f0;">${shipmentDetails.origin}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e2e8f0;">To</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #e2e8f0;">${shipmentDetails.destination}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e2e8f0;">Dimensions</td>
                <td style="padding:10px 16px;font-size:14px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${shipmentDetails.dimensions}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e2e8f0;">Weight</td>
                <td style="padding:10px 16px;font-size:14px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${shipmentDetails.weight}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e2e8f0;">Package Type</td>
                <td style="padding:10px 16px;font-size:14px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${shipmentDetails.packageType || 'Standard'}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;">Urgency</td>
                <td style="padding:10px 16px;font-size:14px;color:#1e293b;">${shipmentDetails.urgency || 'Standard'}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Quote Summary -->
        <tr>
          <td style="padding:0 40px 24px;">
            <h3 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">AI-Generated Quote</h3>
            <div style="background:#0f172a;border-radius:10px;padding:24px;text-align:center;margin-bottom:16px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Cost</p>
              <p style="margin:8px 0 4px;color:#f97316;font-size:36px;font-weight:800;">KSH ${quote.quoteKES.toFixed(2)}</p>
              <p style="margin:0;color:#64748b;font-size:16px;">$${quote.quoteUSD.toFixed(2)} USD</p>
              ${quote.estimatedDeliveryDays ? `<p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">🕐 Estimated Delivery: ${quote.estimatedDeliveryDays} day${quote.estimatedDeliveryDays > 1 ? 's' : ''}</p>` : ''}
            </div>

            <!-- Breakdown Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;padding:16px;">
              <tr><td colspan="2" style="padding:12px 16px 4px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Quote Breakdown</td></tr>
              <tr><td colspan="2" style="padding:0 16px 12px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${breakdownRows}
                  <tr><td colspan="2" style="border-top:2px solid #e2e8f0;padding-top:10px;"></td></tr>
                  <tr>
                    <td style="padding:6px 0;font-weight:700;font-size:15px;color:#0f172a;">Total</td>
                    <td style="padding:6px 0;text-align:right;font-weight:800;font-size:15px;color:#f97316;">$${quote.quoteUSD.toFixed(2)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        ${quote.summary ? `
        <!-- Summary -->
        <tr>
          <td style="padding:0 40px 20px;">
            <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#1e40af;font-weight:600;">Quote Summary</p>
              <p style="margin:6px 0 0;font-size:13px;color:#374151;">${quote.summary}</p>
            </div>
          </td>
        </tr>` : ''}

        ${quote.recommendations ? `
        <!-- Recommendations -->
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">💡 Recommendations</p>
              <p style="margin:6px 0 0;font-size:13px;color:#78350f;">${quote.recommendations}</p>
            </div>
          </td>
        </tr>` : ''}

        <!-- Next Steps -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#f8fafc;border-radius:10px;padding:20px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">What happens next?</p>
              <p style="margin:0 0 6px;font-size:13px;color:#475569;">1. Our team will review your booking and reach out to confirm pickup details.</p>
              <p style="margin:0 0 6px;font-size:13px;color:#475569;">2. You can track your shipment using your tracking number on our website.</p>
              <p style="margin:0;font-size:13px;color:#475569;">3. For any questions, contact us at <a href="mailto:${process.env.SMTP_USER}" style="color:#f97316;">${process.env.SMTP_USER}</a></p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 Crownshift Logistics. All rights reserved.</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">This is an automated confirmation email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminEmailHtml(data: BookShipmentRequest) {
  const { clientDetails, shipmentDetails, quote, trackingNumber } = data;
  const bd = quote.breakdown;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;padding:24px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">

        <tr>
          <td style="background:#f97316;padding:20px 32px;">
            <h1 style="margin:0;color:#0f172a;font-size:20px;font-weight:800;">🚚 New Shipment Booking — Admin Alert</h1>
            <p style="margin:6px 0 0;color:#431407;font-size:13px;">A client has booked a shipment via the website quote form.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 16px 20px 0;vertical-align:top;width:50%;">
                  <h3 style="margin:0 0 12px;color:#f97316;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Client Info</h3>
                  <p style="margin:0 0 6px;color:#cbd5e1;font-size:14px;"><strong style="color:#f1f5f9;">Name:</strong> ${clientDetails.name}</p>
                  <p style="margin:0 0 6px;color:#cbd5e1;font-size:14px;"><strong style="color:#f1f5f9;">Email:</strong> <a href="mailto:${clientDetails.email}" style="color:#60a5fa;">${clientDetails.email}</a></p>
                  <p style="margin:0;color:#cbd5e1;font-size:14px;"><strong style="color:#f1f5f9;">Phone:</strong> ${clientDetails.phone || 'Not provided'}</p>
                </td>
                <td style="padding:0 0 20px 16px;vertical-align:top;">
                  <h3 style="margin:0 0 12px;color:#f97316;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Tracking</h3>
                  <p style="margin:0;color:#f97316;font-size:22px;font-weight:800;letter-spacing:2px;">${trackingNumber}</p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #334155;margin:4px 0 20px;">

            <h3 style="margin:0 0 12px;color:#f97316;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Route & Package</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;width:140px;">Origin</td>
                <td style="color:#f1f5f9;font-size:14px;font-weight:600;padding:5px 0;">${shipmentDetails.origin}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Destination</td>
                <td style="color:#f1f5f9;font-size:14px;font-weight:600;padding:5px 0;">${shipmentDetails.destination}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Dimensions</td>
                <td style="color:#e2e8f0;font-size:14px;padding:5px 0;">${shipmentDetails.dimensions}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Weight</td>
                <td style="color:#e2e8f0;font-size:14px;padding:5px 0;">${shipmentDetails.weight}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Package Type</td>
                <td style="color:#e2e8f0;font-size:14px;padding:5px 0;">${shipmentDetails.packageType || 'Standard'}</td>
              </tr>
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Urgency</td>
                <td style="color:#e2e8f0;font-size:14px;padding:5px 0;">${shipmentDetails.urgency || 'Standard'}</td>
              </tr>
              ${quote.estimatedDeliveryDays ? `
              <tr>
                <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Est. Delivery</td>
                <td style="color:#e2e8f0;font-size:14px;padding:5px 0;">${quote.estimatedDeliveryDays} day${quote.estimatedDeliveryDays > 1 ? 's' : ''}</td>
              </tr>` : ''}
            </table>

            <hr style="border:none;border-top:1px solid #334155;margin:20px 0;">

            <h3 style="margin:0 0 12px;color:#f97316;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Quote</h3>
            <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:16px;">
              <span style="color:#f97316;font-size:28px;font-weight:800;">KSH ${quote.quoteKES.toFixed(2)}</span>
              <span style="color:#64748b;font-size:16px;margin-left:12px;">/ $${quote.quoteUSD.toFixed(2)} USD</span>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              ${[
                ['Base Rate', bd.baseRate],
                ['Distance', bd.distanceCharge],
                ['Volume', bd.volumetricSurcharge],
                ['Weight', bd.weightSurcharge],
                ['Handling', bd.handlingFee],
                ['Urgency', bd.urgencySurcharge],
                ['Insurance', bd.insuranceFee],
              ].map(([l, v]) => `
              <tr>
                <td style="color:#64748b;padding:4px 0;">${l}</td>
                <td style="color:#94a3b8;text-align:right;padding:4px 0;">$${(v as number).toFixed(2)}</td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#0f172a;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">Crownshift Logistics Admin Notification • ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: BookShipmentRequest = await request.json();
    const { clientDetails, shipmentDetails, quote, trackingNumber } = body;

    if (!clientDetails?.email || !clientDetails?.name || !trackingNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Save to Firestore
    const db = getFirestoreAdmin();
    const docRef = db.collection('shipments').doc();
    const estimatedDeliveryDate = new Date(
      Date.now() + (quote.estimatedDeliveryDays || 4) * 24 * 60 * 60 * 1000
    );

    await docRef.set({
      trackingNumber,
      clientId: `anon_${Date.now()}`,
      clientDetails: {
        name: clientDetails.name,
        email: clientDetails.email,
        phone: clientDetails.phone || null,
      },
      origin: shipmentDetails.origin,
      destination: shipmentDetails.destination,
      dimensions: shipmentDetails.dimensions,
      weight: shipmentDetails.weight,
      packageType: shipmentDetails.packageType || 'standard',
      urgency: shipmentDetails.urgency || 'standard',
      status: 'Order Confirmed',
      quote: quote.quoteUSD,
      quoteKES: quote.quoteKES,
      quoteBreakdown: quote.breakdown,
      estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
      estimatedDeliveryDays: quote.estimatedDeliveryDays || 4,
      summary: quote.summary || null,
      recommendations: quote.recommendations || null,
      creationDate: FieldValue.serverTimestamp(),
    });

    // 2. Send emails (in parallel, non-blocking on failure)
    const transport = createTransport();
    const adminEmail = getConfiguredAdminEmail();
    const fromAddress = `"Crownshift Logistics" <${process.env.SMTP_USER}>`;

    const emailPromises = [
      // Client confirmation email
      transport.sendMail({
        from: fromAddress,
        to: clientDetails.email,
        subject: `✅ Shipment Confirmed — Tracking: ${trackingNumber}`,
        html: buildClientEmailHtml(body),
      }).catch(err => console.error('[book-shipment] Client email failed:', err)),

      // Admin notification email
      adminEmail
        ? transport.sendMail({
            from: fromAddress,
            to: adminEmail,
            subject: `🚚 New Shipment Booking: ${trackingNumber} — ${clientDetails.name}`,
            html: buildAdminEmailHtml(body),
          }).catch(err => console.error('[book-shipment] Admin email failed:', err))
        : Promise.resolve(),
    ];

    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      trackingNumber,
      shipmentId: docRef.id,
    });

  } catch (err: unknown) {
    console.error('[book-shipment] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
