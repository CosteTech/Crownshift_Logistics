import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/server-init';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, role, companyId } = body as any;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      );
    }

    // Require authenticated token and ensure companyId matches token
    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      const res = await requireCompanyFromRequest(request.headers, companyId);
      // Only allow creating users within the caller's company
      if (!res || res.companyId !== companyId) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    const db = await getFirestoreAdmin();

    // Create or update user profile in Firestore (use companyId field)
    await db.collection('users').doc(userId).set(
      {
        email,
        fullName: fullName || '',
        role: role || 'client',
        companyId: companyId || null,
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
