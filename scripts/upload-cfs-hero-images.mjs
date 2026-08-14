import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { resolve, dirname, extname } from 'path';
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

const db = getFirestore();
const bucket = getStorage().bucket();

// Re-run this whenever the Call for Speakers hero photo collage is updated.
// Expects the files at ~/Downloads/devfest/assets/cfs-1.jpg, cfs-2.jpg, cfs-3.JPG
const filenames = ['cfs-1.jpg', 'cfs-2.jpg', 'cfs-3.JPG'];

const urls = [];
for (const filename of filenames) {
  const localPath = resolve(process.env.HOME, 'Downloads/devfest/assets', filename);
  const ext = extname(filename).toLowerCase();
  const destination = `site-assets/${filename}`;
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  await bucket.upload(localPath, {
    destination,
    metadata: { contentType },
  });
  await bucket.file(destination).makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  urls.push(url);
  console.log('✓ Uploaded', filename, '→', destination);
}

await db.collection('settings').doc('site').set(
  { cfsHeroImageUrls: urls },
  { merge: true }
);

console.log('✓ Saved URLs to settings/site.cfsHeroImageUrls');
urls.forEach((url) => console.log(url));
