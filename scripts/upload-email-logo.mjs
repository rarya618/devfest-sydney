import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { resolve, dirname } from 'path';
import { readFileSync } from 'fs';
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

const bucket = getStorage().bucket();

// Hosts the wordmark logo for use in transactional emails (Resend), which
// can't reference localhost or the not-yet-live production domain.
const localPath = resolve(__dirname, '../public/logo-wordmark.png');
const destination = 'site-assets/logo-wordmark.png';

await bucket.upload(localPath, {
  destination,
  metadata: { contentType: 'image/png' },
});
await bucket.file(destination).makePublic();

const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
console.log('✓ Uploaded logo-wordmark.png →', destination);
console.log(url);
