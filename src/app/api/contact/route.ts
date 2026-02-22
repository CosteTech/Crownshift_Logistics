import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // SECURITY FIX P1: Rate limit contact form
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitKey = getRateLimitKey('contact_form', clientIP);
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.CONTACT_FORM);
    
    if (!rateLimitResult.success) {
      logger.warn('Contact form rate limit exceeded', { ip: clientIP });
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { name, email, message } = await request.json();

    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email with HTML sanitization (SECURITY FIX P0 from Stage 7)
    // For now, use basic text escaping - apply DOMPurify on client side before sending
    const sanitizedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    await transporter.sendMail({
      from: `"Website Query" <${process.env.EMAIL_USER}>`,
      to: process.env.TARGET_MAILBOX,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
      `,
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Contact form submission error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { message: 'Failed to send email' },
      { status: 500 }
    );
  }
}
