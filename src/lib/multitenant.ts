import { getAdminAuth } from '@/firebase/server-init';

export async function verifyAdminForCompany(idToken: string | undefined, companyId: string) {
  if (!idToken) return false;
  try {
    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    if (!decoded) return false;
    // Admin verification uses UID only, not role claim
    if (decoded.uid === ADMIN_UID && decoded.companyId === companyId) return true;
    return false;
  } catch (err) {
    return false;
  }
}

export function extractCompanyFromToken(decoded: any): string | null {
  if (!decoded) return null;
  return decoded.companyId || null;
}
