import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      const raw = rest.join('=').trim();
      const value = raw.match(/^(['"])([\s\S]*)\1$/) ? raw.slice(1, -1) : raw;
      return [key.trim(), value];
    })
);

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const bucket = getStorage().bucket();

// Re-run this whenever the sponsorship prospectus PDF is updated.
// Expects the file at ~/Downloads/DevFest Sydney Sponsorship Prospectus.pdf
const localPath = resolve(process.env.HOME, 'Downloads/DevFest Sydney Sponsorship Prospectus.pdf');
const destination = 'sponsorship/DevFest-Sydney-Sponsorship-Prospectus.pdf';
const downloadToken = randomUUID();

await bucket.upload(localPath, {
  destination,
  metadata: {
    contentType: 'application/pdf',
    metadata: { firebaseStorageDownloadTokens: downloadToken },
  },
});

const encodedPath = encodeURIComponent(destination);
const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

await db.collection('settings').doc('site').set(
  { sponsorshipProspectusUrl: url },
  { merge: true }
);

console.log('✓ Uploaded prospectus to Storage:', destination);
console.log('✓ Saved URL to settings/site.sponsorshipProspectusUrl');
console.log(url);
