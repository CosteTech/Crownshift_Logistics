import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getFirestoreAdmin } from '@/firebase/server-init';

/**
 * POST /api/auth/session
 * 
 * Creates a server-side session cookie from a Firebase ID token.
 * This endpoint is called after client-side Firebase authentication.
 * 
 * Request body:
 * {
 *   idToken: string (Firebase ID token from client)
 * }
 * 
 * Response:
 * - Sets __session cookie (httpOnly, secure, 1 week expiry)
 * - Returns { success: true } on success
 * - Returns 401 with error message if token is invalid
 * - Returns 500 if internal error
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid idToken' },
        { status: 400 }
      );
    }

    // Verify the ID token with Firebase
    const auth = getAdminAuth();
    let decodedToken;
    
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Session: Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Create a session cookie with 7-day expiration
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    let sessionCookie;
    
    try {
      sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn,
      });
    } catch (error) {
      console.error('Session: Failed to create session cookie:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Create response
    const response = NextResponse.json(
      { success: true, uid: decodedToken.uid },
      { status: 200 }
    );

    // Set the session cookie (httpOnly, secure, sameSite=strict)
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * 
 * Clears the server-side session cookie (logout).
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );

    response.cookies.delete('__session');

    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
