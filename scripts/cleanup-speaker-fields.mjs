// Stage 4c cleanup pass (PM.md): removes what migrate-talks.mjs copied onto `talks` and left
// behind, now that every read goes through the talk.
//
//   node scripts/cleanup-speaker-fields.mjs --dry-run  # print what would be removed
//   node scripts/cleanup-speaker-fields.mjs            # remove
//
// From each `speakers` document: the talk fields (talkTitle, abstract, format, track,
// experienceLevel), where it came from (submissionId, promotedAt, eventId, coSpeakerOf), and
// the per-speaker sends (calendar invite, thank-you, co-speaker ticket), all of which now
// live on the talk or its proposal. The person fields stay. From each `schedule` slot:
// `speakerIds`, replaced by `talkIds`.
//
// Ids are never changed. Refuses to run if any speaker is on no talk, or any slot that had
// speakers has no talks, since that would mean the field being removed is the only record.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

const LEGACY_SPEAKER_FIELDS = [
  'talkTitle',
  'abstract',
  'format',
  'track',
  'experienceLevel',
  'submissionId',
  'promotedAt',
  'eventId',
  'coSpeakerOf',
  'calendarInviteSentAt',
  'calendarInviteSentBy',
  'calendarInviteSequence',
  'calendarInviteSlot',
  'thanksEmailSentAt',
  'thanksEmailSentBy',
  'speakerTicketEmailSentAt',
  'speakerTicketEmailSentBy',
];

const [speakerSnapshot, talkSnapshot, scheduleSnapshot] = await Promise.all([
  db.collection('speakers').get(),
  db.collection('talks').get(),
  db.collection('schedule').get(),
]);

const presentingIds = new Set(talkSnapshot.docs.flatMap((doc) => doc.data().speakerIds ?? []));
const problems = [];

const speakerUpdates = speakerSnapshot.docs.flatMap((doc) => {
  const data = doc.data();
  const present = LEGACY_SPEAKER_FIELDS.filter((field) => field in data);
  if (present.length === 0) return [];
  if (!presentingIds.has(doc.id)) problems.push(`speaker ${doc.id} (${data.name}) is on no talk`);
  return [{ ref: doc.ref, label: `${doc.id} (${data.name})`, fields: present }];
});

const slotUpdates = scheduleSnapshot.docs.flatMap((doc) => {
  const data = doc.data();
  if (!('speakerIds' in data)) return [];
  const speakerIds = Array.isArray(data.speakerIds) ? data.speakerIds : [];
  const talkIds = Array.isArray(data.talkIds) ? data.talkIds : [];
  if (speakerIds.length > 0 && talkIds.length === 0) problems.push(`slot ${doc.id} has speakers but no talkIds`);
  return [{ ref: doc.ref, label: doc.id, fields: ['speakerIds'] }];
});

if (problems.length > 0) {
  console.error(`Can't clean up:\n  ${problems.join('\n  ')}\nNothing was written.`);
  process.exit(1);
}

for (const update of speakerUpdates) console.log(`speakers/${update.label}: ${update.fields.join(', ')}`);
for (const update of slotUpdates) console.log(`schedule/${update.label}: speakerIds`);
console.log(`\n${speakerUpdates.length} of ${speakerSnapshot.size} speaker(s) and ${slotUpdates.length} of ${scheduleSnapshot.size} slot(s) to clean.`);

if (isDryRun) {
  console.log('Dry run: nothing was written.');
  process.exit(0);
}

const updates = [...speakerUpdates, ...slotUpdates];
for (let start = 0; start < updates.length; start += 400) {
  const batch = db.batch();
  for (const update of updates.slice(start, start + 400)) {
    batch.update(update.ref, Object.fromEntries(update.fields.map((field) => [field, FieldValue.delete()])));
  }
  await batch.commit();
}
console.log('Done.');
