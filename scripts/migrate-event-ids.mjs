// Stage 4b of the One GDG Sydney Site plan in PM.md: files every existing record under the
// event it belongs to. Everything in these collections today is DevFest Sydney 2026, so each
// document without an eventId gets `devfest-2026`. Documents that already have one are left
// alone, so the script can be rerun safely, and should be once after the 4b deploy, to catch
// anything the previous code wrote in between (the feedback form has no closed state).
//
//   node scripts/migrate-event-ids.mjs --dry-run  # count what would change
//   node scripts/migrate-event-ids.mjs            # write
//
// Run it BEFORE deploying 4b: the new code lists only records with the selected event's id,
// so anything not yet stamped would vanish from the admin until this runs.
//
// Not stamped: meetupProposals (they get an event when accepted into a meetup, stage 4f),
// and creditRequests and speakerGifts (DevFest 2026 only, and due for deletion in stage 0).

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

// Parse .env.local manually (no dotenv dependency needed)
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
});

const db = getFirestore();
const isDryRun = process.argv.includes('--dry-run');

const EVENT_ID = 'devfest-2026';
const COLLECTIONS = ['submissions', 'showcase', 'volunteers', 'speakers', 'schedule', 'feedback'];
const BATCH_LIMIT = 400;

const eventSnapshot = await db.collection('events').doc(EVENT_ID).get();
if (!eventSnapshot.exists) {
  console.error(`events/${EVENT_ID} doesn't exist. Run scripts/migrate-events.mjs first.`);
  process.exit(1);
}

const toStamp = [];
for (const collectionName of COLLECTIONS) {
  const snapshot = await db.collection(collectionName).get();
  const missing = snapshot.docs.filter((doc) => !doc.data().eventId);
  const otherEvents = snapshot.docs.filter((doc) => doc.data().eventId && doc.data().eventId !== EVENT_ID);
  console.log(
    `${collectionName.padEnd(12)} ${String(snapshot.size).padStart(4)} documents, ${String(missing.length).padStart(4)} to stamp` +
      (otherEvents.length > 0 ? `, ${otherEvents.length} already filed under another event (left alone)` : '')
  );
  toStamp.push(...missing.map((doc) => doc.ref));
}

if (isDryRun || toStamp.length === 0) {
  console.log(isDryRun ? `\nDry run: ${toStamp.length} document(s) would be stamped.` : '\nNothing to stamp.');
  process.exit(0);
}

for (let start = 0; start < toStamp.length; start += BATCH_LIMIT) {
  const batch = db.batch();
  for (const ref of toStamp.slice(start, start + BATCH_LIMIT)) batch.update(ref, { eventId: EVENT_ID });
  await batch.commit();
}
console.log(`\nStamped ${toStamp.length} document(s) with eventId ${EVENT_ID}.`);
process.exit(0);
