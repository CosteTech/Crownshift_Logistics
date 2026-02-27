import "server-only";

import { getAdminAuth, getFirestoreAdmin } from '@/firebase/admin';

type HeaderLike = Headers | Record<string, string> | undefined;
type DecodedToken = { uid: string; companyId?: string };

function headersToObj(headers?: HeaderLike) {
  if (!headers) return {} as Record<string, string>;
  if (typeof (headers as any).get === 'function') {
    const h = headers as Headers;
    const obj: Record<string, string> = {};
    h.forEach((v, k) => (obj[k] = v));
    return obj;
  }
  return headers as Record<string, string>;
}

function extractTokenFromHeaders(headers?: HeaderLike) {
  const h = headersToObj(headers);
  const auth = h['authorization'] || h['Authorization'] || h['cookie'] || '';
  const cookieHeader = h['cookie'] || h['Cookie'] || '';
  let token = '';

  if (auth?.startsWith('Bearer ')) token = auth.split('Bearer ')[1].trim();

  // Accept the Firebase session cookie and legacy cookie names.
  if (!token && cookieHeader) {
    const match =
      cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/) ||
      cookieHeader.match(/(?:^|;\s*)token=([^;]+)/) ||
      cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  return token;
}

async function verifyAnyAuthToken(token: string): Promise<DecodedToken> {
  const auth = getAdminAuth();
  try {
    // Primary path for httpOnly Firebase session cookies.
    return (await auth.verifySessionCookie(token, true)) as DecodedToken;
  } catch {
    // Fallback for Bearer ID tokens.
    return (await auth.verifyIdToken(token)) as DecodedToken;
  }
}

async function resolveCompanyId(decoded: DecodedToken): Promise<string | undefined> {
  if (decoded.companyId) return decoded.companyId;

  // Fallback: derive company from user profile when token custom claims are absent.
  try {
    const db = getFirestoreAdmin();
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const companyId = (userSnap.data() as any)?.companyId;
    if (companyId) return String(companyId);
  } catch {
    // Ignore and continue to final fallback.
  }

  const envDefault = process.env.DEFAULT_COMPANY_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return envDefault || undefined;
}

export async function getAuthFromRequest(headers?: HeaderLike) {
  const token = extractTokenFromHeaders(headers);
  if (!token) throw new Error('Missing authentication token');

  const decoded = await verifyAnyAuthToken(token);
  if (!decoded) throw new Error('Invalid token');
  return { decoded, token };
}

export async function requireCompanyFromRequest(headers?: HeaderLike, bodyCompanyId?: string) {
  const { decoded } = await getAuthFromRequest(headers);
  const companyId = await resolveCompanyId(decoded as DecodedToken);

  if (!companyId) throw new Error('Token missing companyId claim');

  if (bodyCompanyId && bodyCompanyId !== companyId) throw new Error('companyId mismatch');

  return { companyId, decoded };
}

export async function extractCompanyFromRequest(headers?: HeaderLike) {
  try {
    const { companyId } = await requireCompanyFromRequest(headers);
    return companyId;
  } catch (err) {
    return null;
  }
}

export default requireCompanyFromRequest;

