// Loads the day's schedule into the `schedule` collection, from the "Schedule" tab of the
// DevFest Sydney 2026 task sheet. Re-runnable: each slot has a fixed id ("1050-auditorium"),
// so a second run overwrites rather than duplicates, and any slot no longer listed here is
// deleted. Edit SLOTS below and run again whenever the sheet changes.
//
//   node scripts/seed-schedule.mjs            # write
//   node scripts/seed-schedule.mjs --dry-run  # print what would be written
//
// Sessions name their speaker, which is matched (case-insensitively) against the `speakers`
// collection and stored as an id. The run stops if any name fails to match, rather than
// writing a session with nobody in it.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
      // Strip surrounding quotes (single or double)
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

// Saturday 10 October 2026 is after the daylight-saving switch, so Sydney is on AEDT.
const EVENT_DATE = '2026-10-10';
const EVENT_OFFSET = '+11:00';

// start / end are Sydney wall-clock times. room: auditorium | developer | builder |
// workshops | all. A plenary names the room it is held in and still spans the whole grid,
// since nothing runs against it; 'all' is for breaks that happen everywhere at once.
// speakers: names as they appear in the `speakers` collection.
const SLOTS = [
  { start: '09:00', end: '10:00', room: 'all', kind: 'break', title: 'Registration' },
  { start: '10:00', end: '10:50', room: 'auditorium', kind: 'plenary', title: 'Welcome keynote', isTentative: true },

  { start: '10:50', end: '11:35', room: 'auditorium', kind: 'session', title: 'Talk', speakers: ['Brett Morgan'] },
  { start: '10:50', end: '11:35', room: 'developer', kind: 'session', title: 'Talk', speakers: ['Michael Dausmann'] },
  { start: '10:50', end: '11:35', room: 'builder', kind: 'session', title: 'Talk', speakers: ['Suesi Tran'] },
  { start: '10:50', end: '12:20', room: 'workshops', kind: 'session', title: 'Workshop', speakers: ['Kartik Arora'] },

  { start: '11:35', end: '12:20', room: 'auditorium', kind: 'session', title: 'Talk', speakers: ['Derrick Qin'] },
  { start: '11:35', end: '12:20', room: 'developer', kind: 'session', title: 'Talk', speakers: ['Katie Barnett'] },
  { start: '11:35', end: '12:20', room: 'builder', kind: 'session', title: 'Talk', speakers: ['Nathaniel Butterworth'] },

  { start: '12:20', end: '13:00', room: 'auditorium', kind: 'session', title: 'Talk', speakers: ['Jess Lowe'] },
  { start: '12:20', end: '13:00', room: 'developer', kind: 'session', title: 'Talk', speakers: ['Stefan Avgoustakis'] },
  { start: '12:20', end: '13:00', room: 'builder', kind: 'session', title: 'Talk', speakers: ['Sharat Madanapalli'] },
  { start: '12:20', end: '13:00', room: 'workshops', kind: 'session', title: 'Talk', speakers: ['Aditya Dattatreya'] },

  { start: '13:00', end: '14:00', room: 'all', kind: 'break', title: 'Lunch' },

  { start: '14:00', end: '14:45', room: 'auditorium', kind: 'session', title: 'Talk', speakers: ['Derek Kim'] },
  { start: '14:00', end: '14:45', room: 'developer', kind: 'session', title: 'Talk', speakers: ['Olga Mirensky'] },
  { start: '14:00', end: '14:45', room: 'builder', kind: 'session', title: 'Talk', speakers: ['Finn Middleton'] },
  // Held but not yet programmed: no speaker assigned.
  { start: '14:00', end: '15:30', room: 'workshops', kind: 'session', title: 'To be announced' },

  { start: '14:45', end: '15:30', room: 'auditorium', kind: 'session', title: 'Talk', speakers: ['Phil Nash'] },
  { start: '14:45', end: '15:30', room: 'developer', kind: 'session', title: 'Talk', speakers: ['Isaac Udy'] },
  { start: '14:45', end: '15:30', room: 'builder', kind: 'session', title: 'Talk', speakers: ['Katie McLaughlin'] },

  { start: '15:30', end: '16:00', room: 'all', kind: 'break', title: 'Afternoon tea' },
  { start: '16:00', end: '16:30', room: 'auditorium', kind: 'plenary', title: 'Builder Showcase' },
  { start: '16:30', end: '17:15', room: 'auditorium', kind: 'plenary', title: 'Closing keynote', isTentative: true },
];

function toDate(wallClock) {
  return new Date(`${EVENT_DATE}T${wallClock}:00${EVENT_OFFSET}`);
}

const speakerSnapshot = await db.collection('speakers').get();
const speakerIdsByName = new Map(
  speakerSnapshot.docs.map((doc) => [String(doc.data().name ?? '').trim().toLowerCase(), doc.id])
);

const unmatchedNames = [];
const documents = SLOTS.map((slot) => {
  const startDate = toDate(slot.start);
  const durationMinutes = (toDate(slot.end).getTime() - startDate.getTime()) / 60_000;
  if (!(durationMinutes > 0)) throw new Error(`${slot.start}-${slot.end} in ${slot.room} ends before it starts`);

  const speakerIds = (slot.speakers ?? []).map((name) => {
    const speakerId = speakerIdsByName.get(name.toLowerCase());
    if (!speakerId) unmatchedNames.push(name);
    return speakerId;
  });

  return {
    id: `${slot.start.replace(':', '')}-${slot.room}`,
    speakerNames: slot.speakers ?? [],
    data: {
      kind: slot.kind,
      title: slot.title,
      speakerIds,
      startTime: Timestamp.fromDate(startDate),
      durationMinutes,
      room: slot.room,
      isTentative: Boolean(slot.isTentative),
    },
  };
});

if (unmatchedNames.length > 0) {
  console.error(`No speaker record matches: ${unmatchedNames.join(', ')}. Nothing was written.`);
  process.exit(1);
}

const duplicateIds = documents.map((doc) => doc.id).filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  console.error(`Two slots share a start time and room: ${duplicateIds.join(', ')}. Nothing was written.`);
  process.exit(1);
}

const existingSnapshot = await db.collection('schedule').get();
const keptIds = new Set(documents.map((doc) => doc.id));
const staleIds = existingSnapshot.docs.map((doc) => doc.id).filter((id) => !keptIds.has(id));

for (const doc of documents) {
  const who = doc.speakerNames.length > 0 ? ` (${doc.speakerNames.join(', ')})` : '';
  console.log(`${doc.id.padEnd(16)} ${doc.data.kind.padEnd(8)} ${String(doc.data.durationMinutes).padStart(3)} min  ${doc.data.title}${who}`);
}
if (staleIds.length > 0) console.log(`\nDeleting ${staleIds.length} slot(s) no longer listed: ${staleIds.join(', ')}`);

if (isDryRun) {
  console.log(`\nDry run: ${documents.length} slot(s) would be written.`);
  process.exit(0);
}

const batch = db.batch();
for (const doc of documents) batch.set(db.collection('schedule').doc(doc.id), doc.data);
for (const staleId of staleIds) batch.delete(db.collection('schedule').doc(staleId));
await batch.commit();

console.log(`\nWrote ${documents.length} slot(s) to schedule.`);
