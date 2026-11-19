// Restores a DevFest proposal whose acceptance was undone by mistake (Undo acceptance on
// /admin/devfest/proposals, `undoPromotion` in src/app/admin/actions.ts), from Firestore's
// point-in-time recovery, which keeps 7 days of history.
//
//   node scripts/restore-undone-acceptance.mjs --title "<talk title>" --at <ISO time> --dry-run
//   node scripts/restore-undone-acceptance.mjs --title "<talk title>" --at <ISO time>
//
// Or `--submission <id>` instead of `--title`. `--at` is a moment before the undo, on a whole
// minute (PITR only serves whole minutes past the last hour), e.g. 2026-11-19T07:55:00Z.
//
// Undo acceptance did three things, and this puts back each one as it was at `--at`:
//   1. deleted talks/<submissionId> (title, abstract, track, format, level, speakerIds, and
//      speakerState: calendar invite UID and sequence, ticket and thank-you marks)
//   2. set submissions/<submissionId>.status to 'pending'
//   3. deleted any presenter left giving no talk (speakers/<id>), and their photo under
//      speaker-photos/ in Storage
// Documents are written back exactly as they were, so the calendar invite UID survives and
// later invite updates still match what is in the speaker's calendar. Pressing Accept again
// would not do this: it creates a fresh talk.
//
// Refuses to write if the talk exists again, if the proposal wasn't accepted at `--at`, or if
// a document it would restore has been created again since. The photo is restored only if the
// bucket keeps noncurrent object versions; otherwise the script says so.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
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
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const bucket = getStorage().bucket();

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const isDryRun = process.argv.includes('--dry-run');
const titleArgument = argument('title');
const submissionArgument = argument('submission');
const atArgument = argument('at');

function fail(message) {
  console.error(`\nRefusing: ${message}`);
  process.exit(1);
}

if (!atArgument || (!titleArgument && !submissionArgument)) {
  fail('pass --at <ISO time> and either --title "<talk title>" or --submission <id>.');
}
const restoreAt = new Date(atArgument);
if (Number.isNaN(restoreAt.getTime())) fail(`--at "${atArgument}" is not a date.`);
if (restoreAt.getUTCSeconds() !== 0 || restoreAt.getUTCMilliseconds() !== 0) {
  fail('--at must be on a whole minute, e.g. 2026-11-19T07:55:00Z.');
}
if (Date.now() - restoreAt.getTime() > 7 * 24 * 60 * 60 * 1000) fail('--at is more than 7 days ago, past PITR.');

// Reads documents as they were at `restoreAt`, through a read-only transaction pinned to it.
async function readPast(paths) {
  return db.runTransaction(
    async (transaction) => Promise.all(paths.map((path) => transaction.get(db.doc(path)))),
    { readOnly: true, readTime: Timestamp.fromDate(restoreAt) },
  );
}

function describeValue(value) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value === undefined) return '(absent)';
  const text = JSON.stringify(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function printDifferences(label, before, now) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(now ?? {})])].sort();
  const changed = keys.filter((key) => describeValue(before?.[key]) !== describeValue(now?.[key]));
  if (changed.length === 0) {
    console.log(`  ${label}: unchanged`);
    return changed;
  }
  console.log(`  ${label}: ${changed.length} field(s) differ`);
  for (const key of changed) {
    console.log(`    ${key}: now ${describeValue(now?.[key])}  ->  restore ${describeValue(before?.[key])}`);
  }
  return changed;
}

// Speaker photos uploaded by this app live under speaker-photos/ (deleteManagedPhoto).
function managedPhotoPath(photoUrl) {
  const prefix = `https://storage.googleapis.com/${bucket.name}/`;
  if (!photoUrl?.startsWith(`${prefix}speaker-photos/`)) return null;
  return decodeURIComponent(photoUrl.slice(prefix.length));
}

async function main() {
  console.log(isDryRun ? 'DRY RUN: nothing will be written.\n' : 'Restoring.\n');
  console.log(`Restoring to ${restoreAt.toISOString()}`);

  // 1. Find the proposal.
  let submissionId = submissionArgument;
  if (!submissionId) {
    const matches = await db.collection('submissions').where('talkTitle', '==', titleArgument).get();
    if (matches.size !== 1) fail(`${matches.size} proposals have the title "${titleArgument}"; pass --submission <id>.`);
    submissionId = matches.docs[0].id;
  }
  console.log(`Proposal: submissions/${submissionId}\n`);

  const talkPath = `talks/${submissionId}`;
  const submissionPath = `submissions/${submissionId}`;
  const [pastTalk, pastSubmission] = await readPast([talkPath, submissionPath]);
  const [nowTalk, nowSubmission] = await Promise.all([db.doc(talkPath).get(), db.doc(submissionPath).get()]);

  if (!pastSubmission.exists) fail(`${submissionPath} didn't exist at ${restoreAt.toISOString()}.`);
  if (!nowSubmission.exists) fail(`${submissionPath} doesn't exist now.`);
  if (pastSubmission.data().status !== 'accepted') {
    fail(`the proposal's status at ${restoreAt.toISOString()} was "${pastSubmission.data().status}", not accepted. Pick an earlier --at.`);
  }
  if (!pastTalk.exists) fail(`${talkPath} didn't exist at ${restoreAt.toISOString()}, so there's nothing to restore.`);
  if (nowTalk.exists) fail(`${talkPath} exists again (accepted again since?). Not overwriting it.`);

  const pastTalkData = pastTalk.data();
  const speakerIds = [...new Set(pastTalkData.speakerIds ?? [])];
  console.log(`Talk: "${pastTalkData.talkTitle ?? pastTalkData.title}", event ${pastTalkData.eventId}, speakers ${speakerIds.join(', ') || '(none)'}`);
  console.log(`  ${talkPath}: deleted now  ->  restore (${Object.keys(pastTalkData).length} fields)`);
  console.log(`    fields: ${Object.keys(pastTalkData).sort().join(', ')}`);

  printDifferences(submissionPath, pastSubmission.data(), nowSubmission.data());

  // 2. People deleted with it.
  const speakerPaths = speakerIds.map((speakerId) => `speakers/${speakerId}`);
  const pastSpeakers = speakerPaths.length ? await readPast(speakerPaths) : [];
  const nowSpeakers = await Promise.all(speakerPaths.map((path) => db.doc(path).get()));
  const speakersToRestore = [];
  const photosToCheck = [];
  for (let index = 0; index < speakerPaths.length; index += 1) {
    const path = speakerPaths[index];
    const past = pastSpeakers[index];
    const now = nowSpeakers[index];
    if (!past.exists) {
      console.log(`  ${path}: didn't exist at ${restoreAt.toISOString()} either; leaving it`);
      continue;
    }
    if (now.exists) {
      console.log(`  ${path}: still there (kept by another talk or a speaker gift); leaving it`);
      continue;
    }
    console.log(`  ${path}: deleted now  ->  restore "${past.data().name}"`);
    speakersToRestore.push({ path, data: past.data() });
    const photoPath = managedPhotoPath(past.data().photoUrl);
    if (photoPath) photosToCheck.push(photoPath);
  }

  // 3. Photos: present, recoverable from a noncurrent version, or gone.
  const [bucketMetadata] = await bucket.getMetadata();
  const isVersioned = Boolean(bucketMetadata.versioning?.enabled);
  const photosToRestore = [];
  for (const photoPath of photosToCheck) {
    const [exists] = await bucket.file(photoPath).exists();
    if (exists) {
      console.log(`  photo ${photoPath}: still in Storage`);
      continue;
    }
    if (!isVersioned) {
      console.log(`  photo ${photoPath}: DELETED, and the bucket keeps no old versions. Needs a new upload.`);
      continue;
    }
    const [versions] = await bucket.getFiles({ prefix: photoPath, versions: true });
    const latest = versions
      .filter((file) => file.name === photoPath)
      .sort((first, second) => Number(second.metadata.generation) - Number(first.metadata.generation))[0];
    if (!latest) {
      console.log(`  photo ${photoPath}: DELETED, and no old version was kept. Needs a new upload.`);
      continue;
    }
    console.log(`  photo ${photoPath}: deleted now  ->  restore generation ${latest.metadata.generation}`);
    photosToRestore.push({ photoPath, generation: latest.metadata.generation });
  }

  if (isDryRun) {
    console.log('\nDry run complete. Run again without --dry-run to restore the above.');
    return;
  }

  // Writes: one batch for Firestore, so the talk, the proposal and the people come back together.
  const batch = db.batch();
  batch.create(db.doc(talkPath), pastTalkData);
  batch.set(db.doc(submissionPath), pastSubmission.data());
  for (const { path, data } of speakersToRestore) batch.create(db.doc(path), data);
  await batch.commit();
  console.log(`\nRestored ${talkPath}, ${submissionPath}${speakersToRestore.map(({ path }) => `, ${path}`).join('')}.`);

  for (const { photoPath, generation } of photosToRestore) {
    await bucket.file(photoPath, { generation }).copy(bucket.file(photoPath));
    console.log(`Restored photo ${photoPath}.`);
  }
  console.log('Done. Check the card on /admin/devfest/proposals and the speaker on /admin/devfest/speakers.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
