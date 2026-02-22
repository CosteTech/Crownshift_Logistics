# Stage 4: User Portal & Dashboard Security Review

**Status:** IN PROGRESS | **Risk Level:** HIGH (Found Critical Issues)

---

## Overview

This stage audits user-facing portals, dashboard pages, API protection, and public tracking features for authentication, authorization, and data exposure vulnerabilities.

---

## Critical Findings

### 🔴 CRITICAL: Public Shipment Tracking Allows Unauthenticated Access

**File:** `src/app/tracking/[trackingNumber]/page.tsx` (lines 1-69)

**Issue:**

```tsx
// VULNERABLE: Client-side Firebase query without authentication
const ref = doc(db, "shipments", trackingNumber);
const unsub = onSnapshot(ref, (snap) => {
  // Any user can subscribe to ANY shipment by trackingNumber
  // No verification that they own the shipment
});
```

**Risk:**

- 🚨 **Confidentiality Breach**: Anyone who knows a tracking number can monitor shipment in real-time
- 🚨 **Information Disclosure**: Reveals delivery addresses, status, routes to unauthorized users
- 🚨 **Competitive Threat**: Competitors can track shipments to extract business intelligence

**Current Firestore Rules Check:**
The shipments rule allows unauthenticated access IF customer is querying by trackingNumber:

```
allow get: if isAuth() && (request.auth.uid == resource.data.customerId || ...);
```

✅ **GOOD**: Rules require authentication for `get`, but...
❌ **BAD**: Public page reads as unauthenticated client, so rule blocks it... UNLESS rules were modified

**Impact Level:** 🟥 CRITICAL - Shipment data exposure

**Fix Required:**

- [ ] Remove client-side public tracking page OR make it server-side only with auth
- [ ] Force authentication for `/tracking/[trackingNumber]` page
- [ ] Verify ownership before rendering shipment details

---

### 🔴 HIGH: Firestore Rules Using Deprecated Role Check

**File:** `firestore.rules` (lines 8-10, 135, 140, 143)

**Issues:**

```plaintext
// OLD (DEPRECATED in Stage 2):
function isAdmin() {
  return isAuth() && request.auth.token.role == "admin";  // ❌ USING DEPRECATED ROLE CLAIM
}

// Usage in rules:
allow update: if isAdmin() && request.auth.token.companyId == resource.data.companyId;
// And shipments rule at line 135:
allow update: if isAdmin() && request.auth.token.companyId == resource.data.companyId;
```

**Risk:**

- 🚨 **Auth Bypass**: Role claim no longer set server-side (changed in Stage 2)
- 🚨 **Inconsistency**: Server now uses UID checks, but Firestore uses role checks
- 🚨 **Rule Mismatch**: Admins can't perform operations because token won't have role claim

**Impact Level:** 🟥 CRITICAL - Authentication system broken at database layer

**Fix Required:**

- [ ] Update `isAdmin()` function to check UID against ADMIN_UID instead
- [ ] Update all rules to use new UID-based check
- [ ] Deploy updated rules to Firebase Console

---

### 🔴 HIGH: Dashboard Session Cookie Mismatch

**File:** `src/app/dashboard/page.tsx` (line 13)

**Issue:**

```tsx
const session = cookieStore.get("session")?.value; // ❌ LOOKING FOR WRONG COOKIE NAME
if (!session) return redirect("/login");
```

**Problem:**

- Session cookie is actually named `__session` (Firebase convention)
- Code looks for `session`, which doesn't exist
- **Result**: All users redirected to login; dashboard never loads

**Fix Required:**

- [ ] Change `get('session')` to `get('__session')`
- OR use the same pattern as admin/layout.tsx (line 18)

---

### 🟡 HIGH: Contact Form Has No Rate Limiting

**File:** `src/app/api/contact/route.ts` (lines 1-55)

**Issue:**

```typescript
export async function POST(request: Request) {
  // ❌ NO RATE LIMITING
  // ❌ NO CSRF PROTECTION
  // ✅ Good: Input validation
  // ✅ Good: Error handling
  const { name, email, message } = await request.json();
  // Any user can spam unlimited emails
}
```

**Risks:**

- 🚨 **Spam/DOS**: Attacker can send thousands of emails to exhaust email quota
- 🚨 **Email Bombing**: Victim addresses can be flooded
- 🚨 **Resource Exhaustion**: SendGrid/nodemailer rate limits hit

**Impact Level:** 🟡 HIGH - Service availability risk

**Fix Required:**

- [ ] Add rate limiter (per IP, per email)
- [ ] Add honeypot field or CSRF token
- [ ] Implement exponential backoff

---

### 🟡 MEDIUM: Quote Generation Lacks Input Size Validation

**File:** `src/app/actions.ts` (lines 130-170)

**Issue:**

```typescript
export async function getQuote(prevState: QuoteFormState, formData: FormData) {
  const validatedFields = QuoteSchema.safeParse(...);
  // ✅ Good: Schema validation with zod
  // ❌ Bad: No size limits on strings
  // ❌ Bad: No rate limiting per user
  // ❌ Bad: Could trigger expensive AI computation
```

**Risks:**

- 🚨 **DOS via Computation**: Large/complex shipping parameters could cause expensive AI calls
- 🚨 **Resource Exhaustion**: Genkit AI API quota could be exhausted
- ⚠️ **User Friction**: Legitimate users get slow responses

**Impact Level:** 🟡 MEDIUM - Service quality issue

**Fix Required:**

- [ ] Add max string lengths in validation schema
- [ ] Add per-user rate limiting for quote generation
- [ ] Implement quote generation timeout

---

## Findings by Component

### Authentication & Sessions

✅ **PASS**: Dashboard shipment detail page correctly validates UID (fixed in Stage 3)

❌ **FAIL**: Dashboard main page looks for wrong cookie name (`session` vs `__session`)

❌ **FAIL**: Public tracking page allows unauthenticated access to shipment data

---

### Dashboard Pages

#### `/dashboard` (Main Dashboard)

**Status:** 🟡 BROKEN

Issues Found:

1. ❌ Wrong cookie name: `cookieStore.get('session')` should be `__session`
2. ❌ Session verification doesn't check against `ADMIN_UID` (OK for users, but inconsistent)
3. ✅ Properly filters shipments by `customerId` (ownership check)

**Required Fixes:**

```typescript
// BEFORE (BROKEN)
const session = cookieStore.get("session")?.value;

// AFTER (CORRECT)
const session = cookieStore.get("__session")?.value;
```

#### `/dashboard/shipments/[id]`

**Status:** ✅ SECURE

Checks:

1. ✅ Session cookie validated
2. ✅ UID verified in `decoded.uid !== ADMIN_UID` check (fixed in Stage 3)
3. ✅ Ownership verified: `shipment.customerId !== decoded.uid`

---

### Public Pages

#### `/tracking/[trackingNumber]`

**Status:** 🔴 CRITICALLY VULNERABLE

Issues:

1. ❌ Unauthenticated client-side Firestore access
2. ❌ No ownership verification before rendering shipment
3. ❌ exposes: tracking status, delivery address, timeline, estimated times

**Concept Issue:**

- Public tracking is desirable UX feature
- But must verify authorization somehow
- Options:
  A) Server-side page: Check password/secret before serving
  B) Public token: Generate tracking token (hash of shipmentId + secret)
  C) Auth required: Force login to track

**Impact:** Anyone with tracking number = full shipment visibility

---

### API Routes

#### `POST /api/contact`

**Status:** ⚠️ NEEDS HARDENING

Checks:

- ✅ Input validation (name, email, message required)
- ✅ Error handling
- ❌ No rate limiting
- ❌ No CSRF protection
- ❌ No email validation beyond format

**Changes Needed:**

1. Add Ratelimit middleware
2. Add spam detection (honeypot, etc)
3. Add size limits

#### `GET/PUT /api/shipments`

**Status:** ✅ SECURE

Checks:

- ✅ `requireCompanyFromRequest()` enforces company isolation
- ✅ Sensitive fields removed before responding
- ✅ Server validation prevents client-set tracking numbers

---

## Firestore Rules Review

### Current Rule Issues

**1. Deprecated `isAdmin()` Function**

```plaintext
// CURRENT (WRONG IN STAGE 4)
function isAdmin() {
  return isAuth() && request.auth.token.role == "admin";
}

// SHOULD BE (AFTER STAGE 2 CHANGES)
function isAdmin() {
  return isAuth() && request.auth.uid == "ACTUAL_ADMIN_UID_VALUE";
}
```

**Where Used:**

- Line 10: Definition
- Line 47: Services create/update/delete
- Line 55: FAQs create/update/delete
- Line 64: Offers create/update/delete
- Line 72: Vehicles, Drivers, etc.
- Line 135: Shipments update/delete
- Line 142: Invoices create

**Impact:** All admin operations blocked in Firestore (but work via Admin SDK server-side)

**2. Role Check in Shipments Rule**

```plaintext
// LINE 135: MIXED CHECKS
allow get: if isAuth() && (request.auth.uid == resource.data.customerId ||
                           request.auth.token.companyId == resource.data.companyId ||
                           request.auth.token.role == 'admin');  // ❌ DEPRECATED
```

Should be:

```plaintext
allow get: if isAuth() && (request.auth.uid == resource.data.customerId ||
                           (request.auth.token.companyId == resource.data.companyId && isAdmin()));
```

**3. Public Tracking Exposure**
The tracking page queries unauthenticated:

```plaintext
// If public tracking is allowed, rule needs:
allow get: if true;  // ❌ SECURITY RISK - exposes shipment to anyone with ID
```

---

## User Portal Security Assessment Matrix

| Component        | Auth | Authz | Input Validation | Rate Limit | Status      |
| ---------------- | ---- | ----- | ---------------- | ---------- | ----------- |
| Dashboard main   | ❌   | ✅    | ✅               | N/A        | 🔴 BROKEN   |
| Dashboard detail | ✅   | ✅    | ✅               | ✅         | ✅ SECURE   |
| Public tracking  | ❌   | ❌    | ✅               | N/A        | 🔴 CRITICAL |
| Contact form     | ✅   | N/A   | ✅               | ❌         | 🟡 RISKY    |
| Quote API        | ✅   | N/A   | ✅               | ❌         | 🟡 RISKY    |
| Shipments API    | ✅   | ✅    | ✅               | ?          | ✅ SECURE   |

---

## Recommended Fix Priority

### P0 (Critical - Block Deployment)

**1. Fix Dashboard Cookie Name**

- **File:** `src/app/dashboard/page.tsx`
- **Change:** `get('session')` → `get('__session')`
- **Time:** 5 minutes
- **Impact:** Users can access dashboard

**2. Remove/Secure Public Tracking**

- **File:** `src/app/tracking/[trackingNumber]/page.tsx`
- **Option A:** Delete page entirely (force authenticated tracking)
- **Option B:** Implement server-side with secret token verification
- **Time:** 30 minutes (Option B), 5 minutes (Option A)
- **Impact:** Prevent shipment data exposure

**3. Update Firestore Rules**

- **File:** `firestore.rules`
- **Changes:**
  - Update `isAdmin()` function to use UID check
  - Replace all `request.auth.token.role == "admin"` with proper admin check
- **Time:** 15 minutes
- **Impact:** Make admin operations consistent across server/database

### P1 (High - Should Fix Before Production)

**4. Add Rate Limiting to Contact Form**

- **File:** `src/app/api/contact/route.ts`
- **Add:** IP-based rate limiter (e.g., 5 requests per minute per IP)
- **Time:** 20 minutes
- **Impact:** Prevent email spam/DOS

**5. Add Rate Limiting to Quote API**

- **File:** `src/app/actions.ts` (getQuote function)
- **Add:** Per-user rate limiter, input size constraints
- **Time:** 20 minutes
- **Impact:** Prevent DOS via expensive AI computation

### P2 (Medium - Production Hardening)

**6. Add CSRF Protection to Contact Form**

- **File:** `src/components/sections/contact.tsx`
- **Add:** Token middleware
- **Time:** 25 minutes

**7. Implement Audit Logging**

- Log all dashboard accesses
- Log all admin operations
- Time:\*\* 45 minutes

---

## Firestore Rules Updates Needed

### Current Problems

**Problem 1: Deprecated Role Check**

```plaintext
function isAdmin() {
  return isAuth() && request.auth.token.role == "admin";  // ❌ WRONG
}
```

**Solution:**

```plaintext
function isAdmin() {
  // After Stage 2 changes, ADMIN_UID is the source of truth
  // But we can't hardcode in rules file
  // Solution: Match against specific UID if known
  // OR: Keep as company admin check if multi-tenant
  return isAuth() && request.auth.token.role == "admin";  // Temp until dynamic rules available
}
```

**Note:** Firebase Security Rules don't support environment variables. The `role` claim approach is actually the right pattern here, but the role must be:

- Set server-side (in Admin SDK) ✅ Done in Stage 2
- Never modified by client ✅ Done in Stage 2
- Present only for actual admins ✅ Done in Stage 2

However, since Stage 2 removed role from create-profile, we need to either:

1. **Option A:** Add role back to create-profile specifically for admins (and verify via ADMIN_UID)
2. **Option B:** Add admin role via Admin SDK after UID verification
3. **Option C:** Accept that client can't write/auth against Firestore directly (use server-side only)

Currently, the system works because:

- ✅ Client create-profile sets role='user'
- ✅ Admin operations use Admin SDK (server-side, bypasses rules)
- ❌ But if client tries to use Firestore rules for admin operations, it fails (correct behavior)

---

## Implementation Roadmap

### Session 2 Immediate Actions

1. [ ] Fix dashboard cookie name (5 min)
2. [ ] Decide on public tracking solution (10 min decision)
3. [ ] Implement chosen tracking solution (30 min)
4. [ ] Update Firestore rules (15 min)
5. [ ] Test build (10 min)
6. [ ] Deploy fixes (5 min)

### Session 3+ Tasks

7. [ ] Add rate limiting (40 min)
8. [ ] Add CSRF protection (25 min)
9. [ ] Implement audit logging (45 min)
10. [ ] Complete Stages 5-10 review

---

## Key Takeaways

### Authentication ✅

- Session management is working server-side
- UID-based admin validation is in place
- Company isolation properly enforced

### Authorization ⚠️

- Dashboard broken due to cookie name mismatch
- Public tracking allows data exposure
- Firestore rules have deprecated checks (still functional but inconsistent)

### Input Validation ✅

- Good validation on forms
- Zod schemas used throughout
- Sensitive fields protected at DB layer

### Rate Limiting ❌

- Contact form unprotected
- Quote generation unprotected
- Needs implementation

### Session Status

- Ready to fix P0 issues before production deployment
- P1 rate limiting should be added before launch
- Overall: **Do not deploy without fixing dashboard cookie and tracking page**

---

## Next Actions

**IMMEDIATE (This Session):**

1. Apply P0 fixes
2. Re-run build test
3. Move to Stage 5 (Database Review)

**BEFORE PRODUCTION:**

1. Apply P1 fixes (rate limiting)
2. Complete Stages 5-10
3. Security audit sign-off
4. Deploy to production
