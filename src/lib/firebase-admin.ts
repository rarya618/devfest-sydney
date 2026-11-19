import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Emulated local dev (`npm run dev:emulated`, PM.md): the Admin SDK talks to the Firestore and
// Auth emulators under a `demo-` project, which Firebase never connects to a real one, and with
// no credentials, so anything not emulated (Storage) fails instead of reaching production.
// Refuses a half-configured mix, which is how a "local" click could write to production.
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const isEmulated = Boolean(firestoreEmulatorHost || authEmulatorHost);
if (isEmulated) {
  if (!firestoreEmulatorHost || !authEmulatorHost) {
    throw new Error('Emulated mode needs both FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST.');
  }
  if (!process.env.FIREBASE_PROJECT_ID?.startsWith('demo-')) {
    throw new Error('Emulated mode needs a demo- FIREBASE_PROJECT_ID, so it can never reach the real project.');
  }
}

const adminApp =
  getApps().length === 0
    ? initializeApp(
        isEmulated
          ? { projectId: process.env.FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }
          : {
              credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
              }),
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            }
      )
    : getApps()[0];

const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);
const adminStorage = getStorage(adminApp);

export { adminDb, adminAuth, adminStorage };
