import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/firebase/server-init';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName, role, company } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      );
    }

    const db = await getFirestoreAdmin();

    // Create or update user profile in Firestore
    await db.collection('users').doc(userId).set(
      {
        email,
        fullName: fullName || '',
        role: role || 'client',
        company: company || '',
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
