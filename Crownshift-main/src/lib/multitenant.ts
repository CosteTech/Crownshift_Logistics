import { getAdminAuth } from '@/firebase/server-init';

export async function verifyAdminForCompany(idToken: string | undefined, companyId: string) {
  if (!idToken) return false;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    if (!decoded) return false;
    if (decoded.role === 'admin' && decoded.companyId === companyId) return true;
    return false;
  } catch (err) {
    return false;
  }
}

export function extractCompanyFromToken(decoded: any): string | null {
  if (!decoded) return null;
  return decoded.companyId || null;
}
