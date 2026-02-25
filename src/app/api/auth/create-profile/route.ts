export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, companyId } = body as any;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      );
    }

    // Require auth and only allow creating/updating your own profile.
    let decoded: any;
    try {
      const { getAuthFromRequest } = await import('@/lib/companyContext');
      const authRes = await getAuthFromRequest(request.headers);
      decoded = authRes.decoded;

      if (!decoded || decoded.uid !== userId) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    const db = getFirestoreAdmin();
    const existingUser = await db.collection('users').doc(userId).get();
    const existingCompanyId = (existingUser.data() as any)?.companyId;
    const resolvedCompanyId =
      companyId ||
      decoded?.companyId ||
      existingCompanyId ||
      process.env.DEFAULT_COMPANY_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      null;

    await db.collection('users').doc(userId).set(
      {
        email,
        fullName: fullName || '',
        role: 'user',
        companyId: resolvedCompanyId,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json(
      { success: true, message: 'User profile created successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


