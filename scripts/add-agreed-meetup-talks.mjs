// Adds talks that organisers agreed with speakers outside the /speak form (an invited
// speaker, a talk arranged by email) to a general event, so they sit in the system like any
// accepted meetup talk: a meetup proposal (source "organiser"), a talk under the event and the
// speaker's profile. Nobody is emailed. The speakers are recorded as confirmed, since they
// have already agreed, and see the talk in the speaker portal when they sign in.
//
//   node scripts/add-agreed-meetup-talks.mjs <talks.json> --dry-run   # print what would be written
//   node scripts/add-agreed-meetup-talks.mjs <talks.json>             # write
//
// The JSON holds speakers' emails, so keep it out of the repo:
//
//   {
//     "eventId": "devfest-extended-android-for-the-agentic-era",
//     "talks": [
//       { "name": "...", "email": "...", "talkTitle": "...", "abstract": "...",
//         "format": "standard" | "workshop", "profileUrl": "...", "bio": "...",
//         "tagline": "..." }
//
// bio and tagline go on the speaker's profile (a reused one only where it has none yet); the
// bio is also kept on the proposal, as a /speak bio is.
//     ]
//   }
//
// Does what Accept on /admin/meetups does (acceptMeetupProposal), in the same order: the
// person is reused only when the email AND the name match (findOrCreatePerson, which also
// fills in only what a reused profile lacks), the talk's id is the proposal's id, and the
// proposal is marked accepted into the event. Re-runnable: a talk already filed for the same
// event, email and title is skipped.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
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
const dataPath = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
if (!dataPath) {
  console.error('Usage: node scripts/add-agreed-meetup-talks.mjs <talks.json> [--dry-run]');
  process.exit(1);
}

// Shown in the admin as who accepted it, and on the proposal's reviewer note.
const ADDED_BY = 'Organiser (added by script)';
const MEETUP_FORMATS = ['standard', 'workshop'];
const MEETUP_TO_TALK_FORMAT = { standard: 'talk', workshop: 'workshop' };
// The same limits /api/submit-meetup-proposal applies (src/lib/meetupProposalLabels.ts).
const LIMITS = { name: 120, email: 254, profileUrl: 300, talkTitle: 200, abstract: 2000, bio: 2000, tagline: 200 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// src/lib/speakers.ts normaliseProfileUrl.
function normaliseProfileUrl(rawUrl) {
  const trimmed = String(rawUrl ?? '').trim();
  if (!trimmed) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? withScheme : '';
  } catch {
    return '';
  }
}

// As acceptMeetupProposal: a LinkedIn address goes where the profile shows LinkedIn, anything
// else is their website.
function profileLinksFrom(profileUrl) {
  const url = normaliseProfileUrl(profileUrl);
  return /(^|\.)linkedin\.com\//i.test(url.replace(/^https?:\/\//, '')) ? { linkedinUrl: url, websiteUrl: '' } : { linkedinUrl: '', websiteUrl: url };
}

function sameName(first, second) {
  return String(first ?? '').trim().toLowerCase() === String(second ?? '').trim().toLowerCase();
}

function validate(talk, index) {
  const label = `Talk ${index + 1}${talk?.talkTitle ? ` ("${talk.talkTitle}")` : ''}`;
  const problems = [];
  for (const key of ['name', 'email', 'talkTitle', 'abstract']) {
    if (typeof talk?.[key] !== 'string' || !talk[key].trim()) problems.push(`${key} is missing`);
  }
  for (const [key, limit] of Object.entries(LIMITS)) {
    if (typeof talk?.[key] === 'string' && talk[key].trim().length > limit) problems.push(`${key} is over ${limit} characters`);
  }
  if (typeof talk?.email === 'string' && talk.email.trim() && !EMAIL_PATTERN.test(talk.email.trim())) problems.push('email is not an email address');
  if (!MEETUP_FORMATS.includes(talk?.format)) problems.push(`format must be ${MEETUP_FORMATS.join(' or ')}`);
  if (talk?.profileUrl && !normaliseProfileUrl(talk.profileUrl)) problems.push('profileUrl is not a web address');
  return problems.map((problem) => `${label}: ${problem}`);
}

const data = JSON.parse(readFileSync(resolve(process.cwd(), dataPath), 'utf8'));
const talks = Array.isArray(data.talks) ? data.talks : [];
const problems = [
  ...(typeof data.eventId === 'string' && data.eventId ? [] : ['eventId is missing']),
  ...(talks.length ? [] : ['talks is empty']),
  ...talks.flatMap(validate),
];
if (problems.length) {
  console.error(`Nothing written. Fix these first:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

// As acceptMeetupProposal: a general event that hasn't ended.
const eventSnapshot = await db.collection('events').doc(data.eventId).get();
const event = eventSnapshot.data();
if (!event) {
  console.error(`No event with id ${data.eventId}.`);
  process.exit(1);
}
if (event.type !== 'general') {
  console.error(`${event.name} is a ${event.type} event; agreed meetup talks go under a general event.`);
  process.exit(1);
}
if (event.endAt?.toDate && event.endAt.toDate() <= new Date()) {
  console.error(`${event.name} has already happened.`);
  process.exit(1);
}

console.log(`${isDryRun ? '[dry run] ' : ''}Adding ${talks.length} talk(s) to ${event.name} (${data.eventId}). Nobody is emailed.\n`);

const existingForEvent = await db.collection('meetupProposals').where('eventId', '==', data.eventId).get();
let added = 0;
let skipped = 0;

for (const talk of talks) {
  const name = talk.name.trim();
  const email = talk.email.trim();
  const emailNormalised = email.toLowerCase();
  const talkTitle = talk.talkTitle.trim();
  const profileUrl = normaliseProfileUrl(talk.profileUrl ?? '');
  const bio = String(talk.bio ?? '').trim();
  const tagline = String(talk.tagline ?? '').trim();

  const duplicate = existingForEvent.docs.find(
    (doc) => doc.data().email === emailNormalised && sameName(doc.data().talkTitle, talkTitle)
  );
  if (duplicate) {
    console.log(`SKIP  "${talkTitle}" (${name}): already filed for this event as meetupProposals/${duplicate.id}`);
    skipped += 1;
    continue;
  }

  // findOrCreatePerson (src/lib/people.ts).
  const sameEmail = await db.collection('speakers').where('emailNormalised', '==', emailNormalised).get();
  const match = sameEmail.docs.find((doc) => sameName(doc.data().name, name));
  const profile = { ...profileLinksFrom(profileUrl), bio, tagline };
  const fillIns = {};
  if (match) {
    for (const key of ['linkedinUrl', 'websiteUrl', 'bio', 'tagline']) {
      if (!match.data()[key] && profile[key]) fillIns[key] = profile[key];
    }
  } else if (sameEmail.size > 0) {
    console.log(`NOTE  ${email} already belongs to ${sameEmail.docs.map((doc) => doc.data().name).join(', ')}; ${name} gets a profile of their own on it.`);
  }

  const proposalRef = db.collection('meetupProposals').doc();
  const talkRef = db.collection('talks').doc(proposalRef.id);
  const personRef = match ? match.ref : db.collection('speakers').doc();

  console.log(`ADD   "${talkTitle}"`);
  console.log(`      speaker: ${name} <${email}>, ${match ? `existing profile speakers/${match.id}${Object.keys(fillIns).length ? `, filling in ${Object.keys(fillIns).join(', ')}` : ''}` : `new profile speakers/${personRef.id}`}`);
  console.log(`      format: ${talk.format}, link: ${profileUrl || '(none)'}, bio: ${bio ? `${bio.length} characters` : '(none)'}, tagline: ${tagline || '(none)'}`);
  console.log(`      proposal and talk id: ${proposalRef.id}`);

  if (isDryRun) {
    added += 1;
    continue;
  }

  const batch = db.batch();
  if (!match) {
    batch.create(personRef, {
      name,
      email,
      emailNormalised,
      ...profile,
      githubUrl: '',
      photoUrl: '',
      previousSlugs: [],
      createdAt: FieldValue.serverTimestamp(),
    });
  } else if (Object.keys(fillIns).length) {
    batch.update(personRef, fillIns);
  }
  // The shape fileMeetupProposal stores, already accepted into the event and confirmed.
  batch.create(proposalRef, {
    name,
    email: emailNormalised,
    profileUrl,
    talkTitle,
    format: talk.format,
    abstract: talk.abstract.trim(),
    audience: String(talk.audience ?? '').trim(),
    bio,
    speakingExperience: '',
    notes: '',
    source: 'organiser',
    status: 'accepted',
    eventId: data.eventId,
    submittedAt: FieldValue.serverTimestamp(),
    statusChangedAt: FieldValue.serverTimestamp(),
    statusChangedBy: ADDED_BY,
    speakerConfirmedAt: FieldValue.serverTimestamp(),
    reviewerNotes: [
      {
        text: 'Agreed with the speaker outside the /speak form and added by scripts/add-agreed-meetup-talks.mjs. Recorded as confirmed; no acceptance email was sent.',
        authorName: ADDED_BY,
        createdAt: Timestamp.now(),
      },
    ],
  });
  // The talk acceptMeetupProposal creates.
  batch.create(talkRef, {
    eventId: data.eventId,
    talkTitle,
    abstract: talk.abstract.trim(),
    format: MEETUP_TO_TALK_FORMAT[talk.format],
    track: 'developer',
    experienceLevel: 'intermediate',
    speakerIds: [personRef.id],
    meetupProposalId: proposalRef.id,
    submissionId: '',
    promotedAt: FieldValue.serverTimestamp(),
    speakerState: {},
  });
  await batch.commit();
  added += 1;
}

console.log(`\n${isDryRun ? '[dry run] Would add' : 'Added'} ${added}, skipped ${skipped}.`);
