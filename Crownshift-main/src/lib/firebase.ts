// src/lib/firebase.ts
// Re-export from the centralized Firebase config to avoid duplication
export {
  firebaseConfig,
  firebaseApp,
  auth,
  db,
  ADMIN_UID
} from '@/firebase/config';  

