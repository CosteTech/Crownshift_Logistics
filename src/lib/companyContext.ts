import { verifyIdToken } from '@/firebase/server-init';

type HeaderLike = Headers | Record<string, string> | undefined;

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

export async function requireCompanyFromRequest(headers?: HeaderLike, bodyCompanyId?: string) {
  const h = headersToObj(headers);
  const auth = h['authorization'] || h['Authorization'] || h['cookie'] || '';
  let idToken = '';

  if (auth?.startsWith('Bearer ')) idToken = auth.split('Bearer ')[1].trim();
  if (!idToken && h['cookie']) {
    const match = h['cookie'].match(/(?:\b|^)token=([^;]+)/) || h['cookie'].match(/(?:\b|^)session=([^;]+)/);
    if (match) idToken = match[1];
  }

  if (!idToken) throw new Error('Missing authentication token');

  const decoded = await verifyIdToken(idToken);
  if (!decoded) throw new Error('Invalid token');

  const companyId = (decoded as any).companyId as string | undefined;
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
