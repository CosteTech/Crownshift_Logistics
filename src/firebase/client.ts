import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
<<<<<<< HEAD
  apiKey: "AIzaSyCOzss89iGqGt8OSIo3E6G5QaCzdMnFixQ", //NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "crownshift-logistics.firebaseapp.com",//NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: "crownshift-logistics",//NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "crownshift-logistics.firebasestorage.app",//NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "845576626823",//NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: "1:845576626823:web:c8f8a6933835588060ce22",//NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-VGHVQJQYY1",//NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
=======
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing: NEXT_PUBLIC_FIREBASE_API_KEY");
}

if (!firebaseConfig.projectId) {
  console.error("Firebase Project ID is missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID");
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export { firebaseApp };
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
