import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// Re-run this whenever the CfS callout image on the landing page is updated.
// Expects the file at ~/Downloads/devfest/assets/landing-cfs-image.png
const localPath = resolve(process.env.HOME, 'Downloads/devfest/assets/landing-cfs-image.png');
const destination = 'site-assets/landing-cfs-image.png';

await bucket.upload(localPath, {
  destination,
  metadata: { contentType: 'image/png' },
});
await bucket.file(destination).makePublic();

const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;

await db.collection('settings').doc('site').set(
  { landingCfsImageUrl: url },
  { merge: true }
);

console.log('✓ Uploaded CfS callout image to Storage:', destination);
console.log('✓ Saved URL to settings/site.landingCfsImageUrl');
console.log(url);
