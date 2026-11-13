// Stage 4a of the One GDG Sydney Site plan in PM.md: creates DevFest Sydney 2026 as the first
// document in `events`, its private links in `eventPrivate`, and names it the current DevFest
// on settings/site. Until this has run, the app reads every form as closed and the ticket
// emails refuse to send, so run it before deploying the code that reads events.
//
//   node scripts/migrate-events.mjs --dry-run  # print what would be written
//   node scripts/migrate-events.mjs            # write
//   node scripts/migrate-events.mjs --force    # overwrite an existing devfest-2026
//
// The event's values are written out below rather than read from .env.local, because local
// development keeps its forms open and production's are closed: this records production's
// state as of 2026-11-13 (apphosting.yaml), with the historical dates kept.
//
// The four private links ARE read from .env.local: PM.md records that production holds the
// same value for each (SPEAKER_TICKET_URL, SHOWCASE_TICKET_URL, VOLUNTEER_TICKET_URL,
// VOLUNTEER_WHATSAPP_URL). They are never printed, only whether each is set. If production's
// ever differed, replace the link in /admin/events afterwards.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
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
const isForced = process.argv.includes('--force');

const EVENT_ID = 'devfest-2026';
const at = (iso) => Timestamp.fromDate(new Date(iso));

// Production's values. CFS_CLOSE_DATE and TICKETS_ON_SALE_DATE were both midnight starting
// 31 August (AEST, +10:00). The day itself is after the daylight-saving switch (+11:00).
// Every form is closed, as VOLUNTEER_OPEN and SHOWCASE_OPEN were set false on 2026-11-10;
// tickets close on their own now that the event has ended.
const EVENT = {
  type: 'devfest',
  name: 'DevFest Sydney 2026',
  timeZone: 'Australia/Sydney',
  startAt: at('2026-10-10T09:00:00+11:00'),
  endAt: at('2026-10-10T17:00:00+11:00'),
  venue: {
    name: 'Torrens University, Surry Hills',
    streetAddress: 'Shop 1/37 Foveaux St',
    locality: 'Surry Hills',
    region: 'NSW',
    postalCode: '2010',
    country: 'AU',
  },
  bevyUrl: '',
  humanitixUrl: 'https://events.humanitix.com/devfest-sydney',
  ticketLowestPrice: '40.00',
  ticketsOnSaleAt: at('2026-08-31T00:00:00+10:00'),
  cfs: { enabled: true, open: false, closesAt: at('2026-08-31T00:00:00+10:00') },
  showcase: { enabled: true, open: false, closesAt: null },
  volunteers: { enabled: true, open: false, closesAt: null },
};

const PRIVATE_LINK_ENV = {
  speakerTicketUrl: 'SPEAKER_TICKET_URL',
  showcaseTicketUrl: 'SHOWCASE_TICKET_URL',
  volunteerTicketUrl: 'VOLUNTEER_TICKET_URL',
  volunteerWhatsappUrl: 'VOLUNTEER_WHATSAPP_URL',
};

const privateLinks = {};
for (const [field, envName] of Object.entries(PRIVATE_LINK_ENV)) {
  const value = (env[envName] ?? '').trim();
  if (value && !value.startsWith('https://')) {
    console.error(`${envName} in .env.local is not an https:// link. Fix it before migrating.`);
    process.exit(1);
  }
  if (value) privateLinks[field] = value;
}

const STAMP = { updatedAt: FieldValue.serverTimestamp(), updatedBy: 'scripts/migrate-events.mjs' };

const eventRef = db.collection('events').doc(EVENT_ID);
const privateRef = db.collection('eventPrivate').doc(EVENT_ID);
const settingsRef = db.collection('settings').doc('site');

const [existingEvent, existingSettings] = await Promise.all([eventRef.get(), settingsRef.get()]);
const currentDevfest = existingSettings.data()?.currentDevfestEventId ?? null;

console.log(`events/${EVENT_ID}: ${existingEvent.exists ? 'EXISTS' : 'new'}`);
console.log(`settings/site.currentDevfestEventId: ${currentDevfest ?? '(unset)'} -> ${EVENT_ID}`);
console.log('\nEvent:');
console.log(
  JSON.stringify(
    EVENT,
    (key, value) => (value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value),
    2
  )
);
console.log('\nPrivate links (values not shown):');
for (const field of Object.keys(PRIVATE_LINK_ENV)) {
  console.log(`  ${field}: ${privateLinks[field] ? 'set' : 'NOT SET'}`);
}

if (existingEvent.exists && !isForced) {
  console.error(`\nevents/${EVENT_ID} already exists. Edit it in /admin/events, or rerun with --force to overwrite.`);
  process.exit(1);
}
if (currentDevfest && currentDevfest !== EVENT_ID && !isForced) {
  console.error(`\nThe current DevFest is already ${currentDevfest}. Rerun with --force to replace it.`);
  process.exit(1);
}

if (isDryRun) {
  console.log('\nDry run: nothing written.');
  process.exit(0);
}

const batch = db.batch();
batch.set(eventRef, { ...EVENT, ...STAMP, createdAt: FieldValue.serverTimestamp() });
batch.set(privateRef, { ...privateLinks, ...STAMP });
batch.set(
  settingsRef,
  {
    currentDevfestEventId: EVENT_ID,
    currentDevfestSetBy: 'scripts/migrate-events.mjs',
    currentDevfestSetAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);
await batch.commit();
console.log(`\nWrote events/${EVENT_ID}, eventPrivate/${EVENT_ID} and settings/site.currentDevfestEventId.`);
process.exit(0);
