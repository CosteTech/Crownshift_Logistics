import { getAdminAuth } from '@/firebase/server-init';

/**
 * Verify an ID token (from Authorization header or session cookie) and return decoded token
 */
export async function getUserFromToken(idToken?: string) {
  if (!idToken) return null;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Helper to extract token from Next.js server request headers/cookies
 */
export function extractTokenFromHeaders(headers: Headers | { get: (k: string) => string | null } ) {
  // Authorization: Bearer <token>
  const auth = headers.get('authorization') || headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.replace(/^Bearer\s+/i, '');
  return null;
}
