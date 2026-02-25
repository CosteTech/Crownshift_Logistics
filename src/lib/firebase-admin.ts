import { getFirestoreAdmin, getAdminAuth } from '@/firebase/admin';

// Initialize admin DB and auth on module load (server-only)
export const adminDb = getFirestoreAdmin();
export const adminAuth = getAdminAuth();

export default adminDb;

