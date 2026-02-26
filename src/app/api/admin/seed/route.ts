export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { seedDefaultServices, seedDefaultFAQs } from '@/lib/server/seed';
import { getFirestoreAdmin } from '@/firebase/admin';
import { requireAdminFromIdToken } from '@/lib/server/admin-auth';

// Protected seeder endpoint
// Authentication: Authorization: Bearer <Firebase ID Token> for user whose email matches ADMIN_EMAIL
// The endpoint enforces a one-time-run guard stored in Firestore at `adminOps/seed` unless `x-admin-force` is supplied.

export async function POST(req: Request) {
  try {
    const headers = req.headers;
    const authHeader = headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const forceFlag = headers.get('x-admin-force') === '1' || headers.get('x-admin-force') === 'true';

    if (!bearerToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await requireAdminFromIdToken(bearerToken);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getFirestoreAdmin();
    const guardRef = db.collection('adminOps').doc('seed');
    const guardSnap = await guardRef.get();
    if (guardSnap.exists && !forceFlag) {
      return NextResponse.json({ success: false, error: 'Seeder has already been run. Use x-admin-force to override.' }, { status: 409 });
    }

    // enforce company context and seed per-company defaults
    let companyId: string | undefined = undefined;
    try {
      const { requireCompanyFromRequest } = await import('@/lib/server/company-context');
      const res = await requireCompanyFromRequest(headers, (await (async () => {
        // Try to read companyId from body if provided
        try { const b = await req.json(); return b?.companyId; } catch { return undefined; }
      })()));
      companyId = res.companyId;
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing or invalid company context' }, { status: 401 });
    }

    const servicesResult = await seedDefaultServices(companyId);
    const faqsResult = await seedDefaultFAQs(companyId);

    // store guard record
    try {
      await guardRef.set({ runAt: new Date(), services: servicesResult.success, faqs: faqsResult.success });
    } catch (e) {
      console.warn('Failed to write seed guard record:', e);
    }

    return NextResponse.json({ success: true, services: servicesResult, faqs: faqsResult });
  } catch (error) {
    console.error('Seeder endpoint error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || String(error) }, { status: 500 });
  }
}


