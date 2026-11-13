// Stage 4c of the One GDG Sydney Site plan in PM.md: splits each `speakers` document into the
// person (which stays where it is, under the same id) and their talk (a new `talks` document).
//
//   node scripts/migrate-talks.mjs --dry-run  # print what would be written
//   node scripts/migrate-talks.mjs            # write
//
// Additive only: it creates `talks`, adds `emailNormalised` and `createdAt` to each speaker,
// and adds `talkIds` to each schedule slot. Nothing is removed, so the code running before 4c
// keeps working until 4c is deployed, and a rollback needs no data change. The talk fields
// left on the speaker documents are dropped by a later cleanup pass, once 4c has been live.
// Run it BEFORE deploying 4c: the new code reads talks only.
//
// Ids are never changed. A speaker id is signed into the /speaker/thanks links already sent
// and names the calendar invites (speaker-session-<id>), so the person keeps it. The talk id
// is the proposal id, so /speaker/confirm tokens (an HMAC of the submission id) still resolve.
//
// What moves onto the talk, from the speaker documents:
// - talk fields: talkTitle, abstract, format, track, experienceLevel, submissionId, eventId
// - speakerIds: the lead first, then their co-speakers (coSpeakerOf) by name
// - speakerState.<speakerId>: what was sent to each presenter for this talk (calendar invite,
//   thank-you, and a co-speaker's ticket). A lead's ticket stays on the submission, as today.
//   The calendar invite keeps its old UID, so an update still replaces the invite in the
//   speaker's calendar rather than adding a second one.
//
// No person is merged into another. Two documents can share an email (a co-speaker entered
// with the lead's address, as Yuting Mao was for Qasim Tariq's talk), so an address alone
// doesn't identify someone.

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

// The UID the pre-4c code gave every invite. Recorded on the state of anyone already sent
// one, so the next send updates that calendar entry instead of creating a new one.
const legacyInviteUid = (speakerId) => `speaker-session-${speakerId}@devfest.gdgsydney.com`;

const [speakerSnapshot, scheduleSnapshot, existingTalks] = await Promise.all([
  db.collection('speakers').get(),
  db.collection('schedule').get(),
  db.collection('talks').get(),
]);

if (existingTalks.size > 0) {
  console.error(`talks already has ${existingTalks.size} document(s). This migration has run; nothing was written.`);
  process.exit(1);
}

const speakers = speakerSnapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref, data: doc.data() }));
const leads = speakers.filter((speaker) => !speaker.data.coSpeakerOf);
const coSpeakers = speakers.filter((speaker) => speaker.data.coSpeakerOf);

const problems = [];
for (const lead of leads) {
  if (!lead.data.submissionId) problems.push(`${lead.id} (${lead.data.name}) has no submissionId`);
  if (!lead.data.eventId) problems.push(`${lead.id} (${lead.data.name}) has no eventId; run migrate-event-ids.mjs first`);
}
for (const coSpeaker of coSpeakers) {
  if (!leads.some((lead) => lead.id === coSpeaker.data.coSpeakerOf)) {
    problems.push(`co-speaker ${coSpeaker.id} (${coSpeaker.data.name}) points at a lead that doesn't exist`);
  }
}
if (problems.length > 0) {
  console.error(`Can't migrate:\n  ${problems.join('\n  ')}\nNothing was written.`);
  process.exit(1);
}

function presenterState(speaker, { includeTicket }) {
  const data = speaker.data;
  const state = {};
  if (includeTicket && data.speakerTicketEmailSentAt) {
    state.ticketEmailSentAt = data.speakerTicketEmailSentAt;
    state.ticketEmailSentBy = data.speakerTicketEmailSentBy ?? '';
  }
  if (data.calendarInviteSentAt) {
    state.calendarInviteSentAt = data.calendarInviteSentAt;
    state.calendarInviteSentBy = data.calendarInviteSentBy ?? '';
    state.calendarInviteSequence = typeof data.calendarInviteSequence === 'number' ? data.calendarInviteSequence : 0;
    state.calendarInviteUid = legacyInviteUid(speaker.id);
    if (data.calendarInviteSlot) state.calendarInviteSlot = data.calendarInviteSlot;
  }
  if (data.thanksEmailSentAt) {
    state.thanksEmailSentAt = data.thanksEmailSentAt;
    state.thanksEmailSentBy = data.thanksEmailSentBy ?? '';
  }
  return state;
}

const talkIdByLeadId = new Map();
const talks = leads.map((lead) => {
  const ownCoSpeakers = coSpeakers
    .filter((coSpeaker) => coSpeaker.data.coSpeakerOf === lead.id)
    .sort((first, second) => String(first.data.name).localeCompare(String(second.data.name)));
  const talkId = lead.data.submissionId;
  talkIdByLeadId.set(lead.id, talkId);
  const speakerState = { [lead.id]: presenterState(lead, { includeTicket: false }) };
  for (const coSpeaker of ownCoSpeakers) speakerState[coSpeaker.id] = presenterState(coSpeaker, { includeTicket: true });
  return {
    id: talkId,
    leadName: lead.data.name,
    coSpeakerNames: ownCoSpeakers.map((coSpeaker) => coSpeaker.data.name),
    data: {
      eventId: lead.data.eventId,
      talkTitle: lead.data.talkTitle ?? '',
      abstract: lead.data.abstract ?? '',
      format: lead.data.format ?? 'talk',
      track: lead.data.track ?? 'developer',
      experienceLevel: lead.data.experienceLevel ?? 'beginner',
      speakerIds: [lead.id, ...ownCoSpeakers.map((coSpeaker) => coSpeaker.id)],
      submissionId: lead.data.submissionId,
      promotedAt: lead.data.promotedAt ?? null,
      speakerState,
    },
  };
});

const slotUpdates = scheduleSnapshot.docs.map((doc) => {
  const speakerIds = Array.isArray(doc.data().speakerIds) ? doc.data().speakerIds : [];
  const talkIds = speakerIds.map((speakerId) => talkIdByLeadId.get(speakerId)).filter(Boolean);
  return { ref: doc.ref, id: doc.id, speakerIds, talkIds };
});
const unresolvedSlots = slotUpdates.filter((slot) => slot.talkIds.length !== slot.speakerIds.length);
if (unresolvedSlots.length > 0) {
  console.error(`Slots naming someone who isn't a lead speaker: ${unresolvedSlots.map((slot) => slot.id).join(', ')}. Nothing was written.`);
  process.exit(1);
}

for (const talk of talks) {
  const states = Object.entries(talk.data.speakerState)
    .map(([, state]) => [state.calendarInviteSentAt ? 'invite' : null, state.thanksEmailSentAt ? 'thanks' : null, state.ticketEmailSentAt ? 'ticket' : null].filter(Boolean).join('+') || '-')
    .join(' / ');
  const withCo = talk.coSpeakerNames.length > 0 ? ` with ${talk.coSpeakerNames.join(', ')}` : '';
  console.log(`talks/${talk.id}  ${talk.leadName}${withCo}: "${talk.data.talkTitle}"  [${states}]`);
}
const sharedEmails = Object.values(
  speakers.reduce((groups, speaker) => {
    const email = String(speaker.data.email ?? '').trim().toLowerCase();
    (groups[email] ??= []).push(speaker.data.name);
    return groups;
  }, {})
).filter((names) => names.length > 1);
console.log(`\n${talks.length} talk(s) from ${leads.length} lead(s) and ${coSpeakers.length} co-speaker(s).`);
console.log(`${speakers.length} speaker(s) gain emailNormalised and createdAt.`);
console.log(`${slotUpdates.filter((slot) => slot.talkIds.length > 0).length} of ${slotUpdates.length} schedule slot(s) gain talkIds.`);
if (sharedEmails.length > 0) {
  console.log(`Sharing an email, kept as separate people: ${sharedEmails.map((names) => names.join(' + ')).join('; ')}`);
}

if (isDryRun) {
  console.log('\nDry run: nothing written.');
  process.exit(0);
}

const writes = [
  ...talks.map((talk) => (batch) => batch.create(db.collection('talks').doc(talk.id), talk.data)),
  ...speakers.map((speaker) => (batch) =>
    batch.update(speaker.ref, {
      emailNormalised: String(speaker.data.email ?? '').trim().toLowerCase(),
      createdAt: speaker.data.promotedAt ?? null,
    })
  ),
  ...slotUpdates.map((slot) => (batch) => batch.update(slot.ref, { talkIds: slot.talkIds })),
];
for (let start = 0; start < writes.length; start += 400) {
  const batch = db.batch();
  writes.slice(start, start + 400).forEach((write) => write(batch));
  await batch.commit();
}
console.log(`\nWrote ${talks.length} talk(s), updated ${speakers.length} speaker(s) and ${slotUpdates.length} slot(s).`);
process.exit(0);
