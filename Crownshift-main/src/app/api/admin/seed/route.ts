import { NextResponse } from 'next/server';
import { seedDefaultServices, seedDefaultFAQs } from '@/lib/seed';
import { getAdminAuth, getFirestoreAdmin } from '@/firebase/server-init';

// Protected seeder endpoint
// Authentication options (either):
// 1) Header `x-admin-token: <SEED_ADMIN_TOKEN>` where `SEED_ADMIN_TOKEN` is set in env
// 2) Authorization: Bearer <Firebase ID Token> for a user whose uid matches ADMIN_UID or NEXT_PUBLIC_ADMIN_UID
// The endpoint enforces a one-time-run guard stored in Firestore at `adminOps/seed` unless `x-admin-force` is supplied.

export async function POST(req: Request) {
  try {
    const adminSecret = process.env.SEED_ADMIN_TOKEN;
    const adminUid = process.env.ADMIN_UID || process.env.NEXT_PUBLIC_ADMIN_UID;

    const headers = req.headers;
    const providedSecret = headers.get('x-admin-token');
    const authHeader = headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const forceFlag = headers.get('x-admin-force') === '1' || headers.get('x-admin-force') === 'true';

    let authorized = false;

    if (adminSecret && providedSecret && providedSecret === adminSecret) {
      authorized = true;
    }

    if (!authorized && bearerToken && adminUid) {
      try {
        const adminAuth = getAdminAuth();
        const decoded = await adminAuth.verifyIdToken(bearerToken);
        if (decoded && decoded.uid === adminUid) {
          authorized = true;
        }
      } catch (e) {
        // fall through to unauthorized
      }
    }

    if (!authorized) {
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
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
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
