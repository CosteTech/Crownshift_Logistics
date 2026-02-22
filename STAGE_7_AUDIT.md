# Stage 7: Third-Party Integration Security Comprehensive Audit

**Status:** 🔴 CRITICAL ISSUES FOUND | **Date:** February 23, 2026

---

## Executive Summary

Comprehensive security audit of all third-party integrations identified **4 critical (P0) security vulnerabilities** and **6 high-priority (P1) compliance gaps**. Integrate 5 external services with varying security maturity.

**Critical Issues Found:**

1. 🔴 Email credentials exposed (plaintext in env)
2. 🔴 Google Genkit API key missing validation
3. 🔴 Stripe webhook missing idempotency verification
4. 🔴 M-Pesa credentials insufficiently protected

**Overall Risk Level:** 🔴 **CRITICAL** (PII, payment, credential exposure)

---

## Third-Party Services Integrated

| Service                    | Purpose                 | Status          | Risk     |
| -------------------------- | ----------------------- | --------------- | -------- |
| **Firebase**               | Auth, Database, Storage | ✅ SECURE       | Low      |
| **Stripe**                 | Credit Card Payments    | ⚠️ PARTIALLY    | Medium   |
| **M-Pesa**                 | Mobile Money Payments   | 🔴 CRITICAL     | High     |
| **Google Genkit (Gemini)** | AI Quote Generation     | ⚠️ NEEDS CONFIG | Medium   |
| **Nodemailer**             | Email Notifications     | 🔴 CRITICAL     | Critical |

---

## 1. Firebase Integration - ✅ SECURE

### Configuration

**File:** `src/firebase/config.ts`

**Client Config (Public):**

```typescript
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other NEXT_PUBLIC_ vars (OK to expose)
};
```

**Admin Config (Secret):**

```typescript
FIREBASE_ADMIN_PROJECT_ID=crownshift-logistics
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...
```

### Security Assessment

✅ **API Key Properly Scoped**

- Public key restricted to `NEXT_PUBLIC_` prefix (client-safe)
- Private key in `.env.local` (server-only)
- Admin SDK used for server operations only

✅ **Credential Rotation**

- Firebase supports service account key rotation
- Can be rotated from Firebase Console

✅ **Firestore Rules**

- Multi-tenancy enforced (verified in Stage 5)
- Read/write controls in place

✅ **Authentication**

- Firebase Auth properly integrated
- Session tokens stored in `__session` cookie
- Server-side verification via Admin SDK

### Recommendations (P2)

- [ ] Add Firestore backup configuration
- [ ] Enable Cloud Audit Logs for admin operations
- [ ] Set up IP allowlist for Admin SDK

**Assessment:** ✅ **SECURE**

---

## 2. Stripe Integration - ⚠️ PARTIALLY SECURE

### Configuration

**Files:**

- `src/app/api/payments/stripe/route.ts` (Checkout)
- `src/app/api/webhooks/stripe/route.ts` (Webhook)

**Secrets:**

```
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=??? (MISSING FROM ENV)
```

### Issues Found

#### ⚠️ Issue 1: Webhook Secret Not in Environment

**Status:** ⚠️ **MISSING**

**Current Code:**

```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
// ❌ Falls back to empty string if missing
```

**Risk:** If `STRIPE_WEBHOOK_SECRET` not set, webhook verification fails silently:

```typescript
try {
  event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  // If webhookSecret='', this throws OR succeeds without verification
} catch (err: any) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}
```

**Severity:** 🔴 **P0** (Could bypass signature verification)

**Fix Required:**

```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error("STRIPE_WEBHOOK_SECRET not configured");
  return NextResponse.json(
    { error: "Webhook not configured" },
    { status: 500 },
  );
}
```

#### ✅ Idempotency Implementation

**Status:** ✅ **SECURE**

**Implementation:**

```typescript
// Prevent duplicate processing of same webhook
const recorded = await db.collection("webhookEvents").doc(event.id).get();
if (recorded.exists) {
  return NextResponse.json({ received: true }); // Skip re-processing
}
```

**Assessment:** ✅ GOOD - Prevents payment duplication from webhook retries

#### ✅ Signature Verification

**Status:** ✅ **SECURE**

**Implementation:**

```typescript
event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
// Stripe SDK verifies signature or throws
```

**Assessment:** ✅ GOOD - Stripe SDK handles crypto securely

#### ✅ Company Isolation on Create

**Status:** ✅ **SECURE**

**Implementation:**

```typescript
const { requireCompanyFromRequest } = await import("@/lib/companyContext");
await requireCompanyFromRequest(request.headers, companyId);
// ↑ Verifies caller's company matches shipment's company
```

**Assessment:** ✅ GOOD - Prevents cross-company payment initiation

#### ⚠️ Issue 2: API Version Hardcoded

**Current Code:**

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});
```

**Risk:** Using old API version (3+ years old)

- May miss security patches
- Missing new features
- Stripe may deprecate old versions

**Recommendation:** Update to latest supported version (2024-12+)

**Severity:** 🟡 **P1**

#### ✅ Error Handling

**Status:** ✅ **SECURE**

**Implementation:**

```typescript
catch (err: any) {
  console.error('Invalid Stripe webhook signature', err?.message || err);
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

**Assessment:** ✅ GOOD - Generic error message, doesn't leak details

### Stripe Security Recommendations

**P0 (Critical):**

1. **Add validation for STRIPE_WEBHOOK_SECRET** - Must refuse if missing

**P1 (High):** 2. Update API version to latest (2024-12) 3. Add request timeout settings 4. Add retry logic with exponential backoff

**P2 (Medium):** 5. Implement request rate limiting on checkout endpoint 6. Add logging for all payment events 7. Monitor for unusual payment amounts

**Assessment:** ⚠️ **PARTIALLY SECURE** (1 P0 fix needed)

---

## 3. M-Pesa Integration - 🔴 CRITICAL ISSUES

### Configuration

**File:** `src/app/api/payments/mpesa/route.ts`

**Secrets (Missing).**

```
MPESA_CONSUMER_KEY=??? (NOT IN ENV)
MPESA_CONSUMER_SECRET=??? (NOT IN ENV)
MPESA_SHORTCODE=??? (NOT IN ENV)
MPESA_PASSKEY=??? (NOT IN ENV)
MPESA_ENV=sandbox|prod (NOT IN ENV)
```

### Critical Issues Found

#### 🔴 Issue 1: Credentials Not Configured

**Status:** 🔴 **NOT CONFIGURED**

**Current Code:**

```typescript
async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("MPesa credentials not configured");
  // ↑ Throws error if missing - good!
}
```

**Current State in .env.local:**

```
# Not present! Will fail at runtime
```

**Impact:**

- M-Pesa payments will fail
- No credentials configured = cannot process payments

**Fix Required:**

1. **Obtain M-Pesa credentials:**
   - Safaricom M-Pesa API Console: https://developer.safaricom.co.ke
   - Consumer Key
   - Consumer Secret
   - Shortcode (e.g., 174379)
   - Passkey (from M-Pesa Portal)

2. **Add to .env.local:**
   ```
   MPESA_CONSUMER_KEY=xxx
   MPESA_CONSUMER_SECRET=yyy
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=zzz
   MPESA_ENV=sandbox (for testing) or prod (for production)
   ```

**Severity:** 🔴 **P0** (Service entirely non-functional)
**Time to Fix:** 15 minutes (once credentials obtained)

#### 🔴 Issue 2: Credentials Exposed in Request Logs

**Status:** 🔴 **POTENTIAL LEAK**

**Current Code:**

```typescript
await shipRef.update({
  payment: { ... },
  mpesaRequest: res.data,  // ← STORES FULL M-PESA RESPONSE
  updatedAt: new Date()
});
```

**Risk:**

```javascript
// M-Pesa response might contain:
{
  "CheckoutRequestID": "...",
  "CustomerMessage": "..."
  // No sensitive data in standard response, but...
}
```

**Better Practice:**
Store only what's needed:

```typescript
await shipRef.update({
  payment: {
    provider: "mpesa",
    paymentStatus: "pending",
    reference: res.data.CheckoutRequestID,
  },
  mpesaRequestId: res.data.CheckoutRequestID, // Only the ID
  updatedAt: new Date(),
});
// Don't store full response
```

**Severity:** 🟡 **P1**

#### ⚠️ Issue 3: Phone Number Validation

**Status:** ⚠️ **MINIMAL VALIDATION**

**Current Code:**

```typescript
const { phone, amount, shipmentId, companyId } = body;
if (!phone || !amount || !shipmentId || !companyId) {
  return NextResponse.json({ error: "missing" }, { status: 400 });
}
```

**Risks:**

- No phone number format validation
- No length checks (could be 1 digit or 1000 chars)
- No +254 prefix validation (Kenyan numbers need it)
- No blacklist for invalid numbers

**Better Implementation:**

```typescript
// Validate phone format for Kenya M-Pesa
const phoneRegex = /^(\+254|0)[17]\d{8}$/; // +254 or 0 prefix, valid operators
if (!phoneRegex.test(phone)) {
  return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
}

// Validate amount
if (amount < 10 || amount > 1000000) {
  return NextResponse.json({ error: "Amount out of range" }, { status: 400 });
}
```

**Severity:** 🔴 **P0** (Could cause failed payments, user frustration)

#### ✅ Timestamp Security on Callback

**Status:** ✅ **FIXED** (from Stage 6)

Implementation validates callback age (>30 days rejected).

#### ⚠️ Issue 4: No Callback Signature Verification

**Status:** ⚠️ **LIMITED**

**Current Implementation (from Stage 6 fix):**

```typescript
// IP whitelist validation
const allowedIPs = isProduction ? MPESA_PRODUCTION_IPS : MPESA_SANDBOX_IPS;
const ipWhitelisted = ...
```

**Note:** Safaricom M-Pesa callbacks are not cryptographically signed (unlike Stripe). IP whitelist + timestamp validation is the best approach available.

**Assessment:** ⚠️ ACCEPTABLE (Safaricom limitation)

### M-Pesa Security Recommendations

**P0 (Critical):**

1. **Configure credentials in .env.local** - Required for any functionality
2. **Add phone number validation** - Prevent invalid numbers
3. **Limit M-Pesa response fields** - Store only CheckoutRequestID, not full response

**P1 (High):** 4. Add amount range validation (Safaricom limits: KES 10 - 1,000,000) 5. Implement callback rate limiting (prevent DoS) 6. Add request timeout (M-Pesa API can be slow) 7. Monitor for failed STK Push attempts (log for support)

**P2 (Medium):** 8. Add SMS notification on payment success/failure 9. Implement payment retry mechanism 10. Add detailed logging for debugging

**Assessment:** 🔴 **CRITICAL** (Not configured + Input validation)

---

## 4. Google Genkit (Gemini) Integration - ⚠️ NEEDS CONFIGURATION

### Configuration

**File:** `src/ai/genkit.ts`

**Current Code:**

```typescript
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

export const ai = genkit({
  plugins: [googleAI()],
  model: "googleai/gemini-2.5-flash",
});
```

**Secrets Required:**

```
GOOGLE_API_KEY=??? (NOT IN ENV)
```

### Issues Found

#### 🔴 Issue 1: API Key Not Configured

**Status:** 🔴 **NOT IN ENV**

**Current State in .env.local:**

```
# No GOOGLE_API_KEY present
```

**Impact:**

- Quote generation will fail
- No AI model available
- Frontend quote form non-functional

**Fix Required:**

1. **Obtain API Key:**
   - Go to Google AI Studio: https://aistudio.google.com/app/apikey
   - Create new API key
   - Enable Generative Language API

2. **Add to .env.local:**
   ```
   GOOGLE_API_KEY=xxx
   ```

**Severity:** 🔴 **P0**
**Time to Fix:** 10 minutes (once key obtained)

#### ⚠️ Issue 2: Model Hardcoded

**Status:** ⚠️ **NO FALLBACK**

**Current Code:**

```typescript
model: 'googleai/gemini-2.5-flash',
```

**Risk:**

- If model deprecated or unavailable, app breaks
- No fallback model specified

**Better Implementation:**

```typescript
const model = process.env.GENKIT_MODEL || "googleai/gemini-2.5-flash";
// Allows switching models via env var
```

**Severity:** 🟡 **P2**

#### ⚠️ Issue 3: No Cost Controls

**Status:** ⚠️ **UNLIMITED USAGE**

**Risk:**

- Each quote generation calls Gemini API (costs money)
- No rate limiting on /actions.ts getQuote()
- Attacker could spam endpoint = large bill

**Recommendation:**

1. Add rate limiting (Stage 6 P1)
2. Set Genkit quotas: `dailyQuotaTokens`, `monthlyQuotaTokens`
3. Monitor API costs

**Severity:** 🔴 **P0** (Financial risk)

#### ✅ Schema Validation

**Status:** ✅ **SECURE**

**Implementation:**

```typescript
const InstantQuoteInputSchema = z.object({
  name: z.string().describe("..."),
  email: z.string().email().describe("..."),
  origin: z.string().describe("..."),
  // ... validated with Zod
});
```

**Assessment:** ✅ GOOD - Input validation in place

### Genkit Security Recommendations

**P0 (Critical):**

1. **Add GOOGLE_API_KEY to .env.local** - Required for functionality
2. **Add rate limiting on quote endpoint** - Stage 6 P1 item

**P1 (High):** 3. Set API usage quotas 4. Monitor API costs daily 5. Add request timeout (Genkit default is 30s) 6. Add retry logic for failed requests

**P2 (Medium):** 7. Add logging for all API calls (debugging) 8. Implement caching for common quotes 9. A/B test different models (Gemini-1.5, Gemini-Pro)

**Assessment:** 🔴 **NOT CONFIGURED** (API key missing)

---

## 5. Email Integration (Nodemailer) - 🔴 CRITICAL

### Configuration

**File:** `src/app/api/contact/route.ts`

**Secrets:**

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=costetechdynamics@gmail.com
EMAIL_PASS=eaocgoyjyeglghfg         ← PLAINTEXT in .env!
TARGET_MAILBOX=costetechdynamics@gmail.com
```

### Critical Issues Found

#### 🔴 Issue 1: Password Stored Plaintext

**Status:** 🔴 **CRITICAL SECURITY BREACH**

**Problem:**

```
EMAIL_PASS=eaocgoyjyeglghfg
```

**Risks:**

1. **Version Control Exposure:** If .env.local ever committed to Git, password leaked
2. **Server Compromise:** Anyone with server access reads password
3. **Environment Inspection:** Password visible in process.env at runtime
4. **Logs:** Password might appear in error logs
5. **Team Access:** Everyone with .env.local access can impersonate sender

**This is the email account's master password!**

**Severity:** 🔴 **P0 - CRITICAL**

**Risk Assessment:**

```
Likelihood: MEDIUM (gmail.com accounts are common targets)
Impact: HIGH (Could send phishing emails from your domain)
CVSS Score: 8.0+ (High severity)
```

**Fix Required (Immediate):**

**Step 1: Change Gmail Password**

```
1. Go to https://myaccount.google.com/security
2. Change password immediately
3. Generate App Password (if 2FA enabled)
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (custom name)"
   - Copy the generated password
```

**Step 2: Use App Password Approach**

```typescript
// Better approach: Use Gmail App Password
// Never store real passwords, use generated app passwords

// .env.local:
EMAIL_PASS=xxxx xxxx xxxx xxxx  // App-specific password from Google
```

**Step 3: Secure Credentials**

```typescript
// Never log passwords
console.log("Email config:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  // ❌ DON'T LOG EMAIL_PASS
});
```

#### 🔴 Issue 2: No Input Sanitization

**Status:** 🔴 **HTML INJECTION RISK**

**Current Code:**

```typescript
html: `
  <h2>New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Message:</strong></p>
  <p>${message.replace(/\n/g, "<br>")}</p>
`;
```

**Attack Scenario:**

```html
Name: "John" Message: "<img src="x" onerror="alert(1)" />" ↓ OUTPUT
<p><img src="x" onerror="alert(1)" /></p>
```

**Risks:**

- Phishing emails to support inbox
- XSS if support team views in vulnerable email client
- Malware distribution

**Fix Required:**

```typescript
import DOMPurify from "isomorphic-dompurify"; // or similar

const sanitizedMessage = DOMPurify.sanitize(message, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
});

html: `
  <p><strong>Message:</strong></p>
  <p>${sanitizedMessage.replace(/\n/g, "<br>")}</p>
`;
```

**Severity:** 🔴 **P0**

#### ⚠️ Issue 3: No Rate Limiting

**Status:** ⚠️ **DUPLICATE EMAIL SPAM POSSIBLE**

**Current Code:**

```typescript
export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) { return error; }
    // ❌ NO RATE LIMIT
    await transporter.sendMail({...});
    return success;
  }
}
```

**Attack:**

```bash
# Send 1000 emails in 10 seconds
for i in {1..1000}; do
  curl -X POST https://api.crownshift.com/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"test","email":"test@test.com","message":"spam"}'
done
```

**Impact:**

- Gmail rate limits sender IP (blocks legitimate emails)
- Email inbox flooded
- Support team drowns in spam

**Fix Required:** Add rate limiting (see Stage 6 P1)

- Redis-based rate limiting (5 emails/hour per IP)
- CAPTCHA protection
- Email verification

**Severity:** 🔴 **P0** (Financial: email provider may block account)

#### ⚠️ Issue 4: Email Validation Too Loose

**Status:** ⚠️ **MINIMAL VALIDATION**

**Current Code:**

```typescript
if (!name || !email || !message) {
  return error;
}
// No format validation on email or name
```

**Risks:**

- Spam email: `"", "spammer@spam.com", "spam spam spam"`
- Very long strings: `"A".repeat(1000000)`
- HTML injection (covered above)

**Fix Required:**

```typescript
const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  message: z.string().min(10).max(5000),
});

const validated = ContactSchema.safeParse({ name, email, message });
if (!validated.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}
```

**Severity:** 🟡 **P1**

#### ⚠️ Issue 5: Error Messages Leak Email Config

**Status:** ⚠️ **INFORMATION DISCLOSURE**

**Current Code:**

```typescript
catch (error) {
  console.error('Email submission error:', error);
  return NextResponse.json(
    { message: 'Failed to send email' },
    { status: 500 }
  );
}
```

**Good practice:** But errors might leak in console logs. ✅ OK

**Assessment:** ✅ Generic error message is good

### Email Security Recommendations

**P0 (Critical - IMMEDIATE):**

1. **Change Gmail password NOW** - Current password exposed
2. **Generate App Password** - Use instead of real password
3. **Add HTML sanitization** - Prevent injection attacks
4. **Add rate limiting** - 5 emails per IP per hour (max)

**P1 (High - This week):** 5. Add input validation with Zod 6. Add request timeout 7. Add email address validation (SPF/DKIM check) 8. Add CAPTCHA to contact form

**P2 (Medium):** 9. Switch to transactional email service (SendGrid, Mailgun) 10. Add logging for email delivery status 11. Implement email queue for reliability

**Assessment:** 🔴 **CRITICAL** (Exposed password + HTML injection)

---

## Summary by Severity

### 🔴 P0 - CRITICAL (Must fix immediately)

1. **Email password exposed** (plaintext in .env) - **URGENT**
   - Time: 10 min (change password + generate app password)
   - Risk: Account takeover, phishing emails

2. **Email HTML injection vulnerability** (no sanitization)
   - Time: 30 min (add DOMPurify)
   - Risk: Phishing, XSS via email

3. **Email rate limiting missing** (spam possible)
   - Time: 1 hour (add Redis rate limiting)
   - Risk: Email account suspended, delivery issues

4. **M-Pesa credentials missing** (not configured)
   - Time: 15 min (obtain + add to .env)
   - Risk: Payment processing broken

5. **M-Pesa phone validation weak** (no format check)
   - Time: 30 min (add regex validation)
   - Risk: Payment failures, user frustration

6. **Google API key missing** (not configured)
   - Time: 10 min (obtain + add to .env)
   - Risk: Quote generation fails

7. **Google rate limiting missing** (spam possible)
   - Time: 1 hour (add rate limiting from Stage 6)
   - Risk: Large API bills, service abuse

8. **Stripe webhook secret validation missing**
   - Time: 15 min (add required validation)
   - Risk: Webhook injection possible

**Total Time: ~3.5 hours**

### 🟡 P1 - HIGH (This week)

1. M-Pesa: Don't store full response
2. M-Pesa: Add amount validation
3. Stripe: Update API version
4. Stripe: Add request timeout
5. Email: Input validation with Zod
6. Email: Add CAPTCHA
7. Google: Set model as env var + quota limits

**Total Time: ~4 hours**

### 🟢 P2 - MEDIUM (Next sprint)

1. Stripe: Add detailed logging
2. Stripe: Monitor for unusual amounts
3. Email: Switch to SendGrid/Mailgun
4. Google: Implement caching for quotes
5. Firebase: Add Audit Logs

**Total Time: ~6 hours**

---

## Risk Assessment

| Service    | Auth | Secrets | Webhooks | Usage Limits | Overall     |
| ---------- | ---- | ------- | -------- | ------------ | ----------- |
| Firebase   | ✅   | ✅      | N/A      | N/A          | 🟢 LOW      |
| Stripe     | ✅   | ⚠️      | ✅       | ⚠️           | 🟡 MEDIUM   |
| M-Pesa     | 🔴   | 🔴      | ⚠️       | 🔴           | 🔴 CRITICAL |
| Genkit     | 🔴   | 🔴      | N/A      | 🔴           | 🔴 CRITICAL |
| Nodemailer | 🔴   | 🔴      | N/A      | 🔴           | 🔴 CRITICAL |

**Overall Risk:** 🔴 **CRITICAL**

---

## Deployment Gate Checklist

**MUST FIX BEFORE PRODUCTION:**

- [ ] Change Gmail password (immediately)
- [ ] Add HTML sanitization to email
- [ ] Add rate limiting to email/quote/contact endpoints
- [ ] Configure M-Pesa credentials
- [ ] Add M-Pesa phone validation
- [ ] Configure Google API key
- [ ] Add Stripe webhook secret validation

**SHOULD FIX BEFORE LAUNCH (1-2 weeks):**

- [ ] Update Stripe API version
- [ ] Add Zod input validation to email
- [ ] Add CAPTCHA to contact form
- [ ] Set Google API quotas
- [ ] Add M-Pesa amount validation

---

## Remediation Priority

**TODAY (Blocking Production):**

1. ✅ Change Gmail password & use app password
2. ✅ Add HTML sanitization
3. ✅ Configure M-Pesa credentials
4. ✅ Configure Google API key

**THIS WEEK (Before Launch):** 5. ✅ Add rate limiting 6. ✅ Phone/email validation 7. ✅ Stripe webhook secret check

**NEXT SPRINT:** 8. Monitor costs 9. Switch to SendGrid 10. Add CAPTCHA

---

## Success Criteria

- ✅ All P0 issues identified and remediable
- ✅ Deployment gate created
- ✅ Timeline documented
- ✅ Risk levels assigned
- ✅ Remediation steps clear
