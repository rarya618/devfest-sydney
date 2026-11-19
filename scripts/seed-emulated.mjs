// Fills the Firestore and Auth emulators with made-up data for emulated local dev, so the
// admin can be clicked freely: every send goes to the mail catcher, every write to the emulator.
//
//   npm run emulators        # terminal 1 (needs Java 21: JAVA_HOME=/opt/homebrew/opt/openjdk@21)
//   npm run mail:emulated    # terminal 2
//   npm run seed:emulated    # once the emulators are up; wipes and reseeds them
//   npm run dev:emulated     # terminal 3, then open http://127.0.0.1:3001/admin
//
// Signing in: the seed creates admin@example.com and writes a ready admin session cookie to
// .emulator-mail/admin-session-cookie.txt. In the browser at http://127.0.0.1:3001, run
// document.cookie = "__session=<that value>; path=/" and reload. (Or sign in with the Auth
// emulator's fake Google popup as admin@example.com.) 127.0.0.1, not localhost, so it never
// shares cookies with `next dev` on localhost:3000.
//
// Every person is invented and every address is @example.com. Refuses to run unless both
// emulator hosts are set, so it can never write to the real project.

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ID = 'demo-gdg-sydney';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!firestoreHost || !authHost) {
  console.error('Refusing: set FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST (npm run seed:emulated does).');
  process.exit(1);
}

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();
const auth = getAuth();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'emulated-admin';
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const at = (offsetDays, hour = 10) => {
  const date = new Date(now + offsetDays * DAY);
  date.setUTCHours(hour, 0, 0, 0);
  return Timestamp.fromDate(date);
};
const fixed = (iso) => Timestamp.fromDate(new Date(iso));
const note = (text, authorName = 'Alex Organiser', offsetDays = -5) => ({ text, authorName, createdAt: at(offsetDays) });
const noTracking = { utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '', utmTerm: '', ref: '' };

async function clearEmulators() {
  const firestoreClear = await fetch(`http://${firestoreHost}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' });
  const authClear = await fetch(`http://${authHost}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
  if (!firestoreClear.ok || !authClear.ok) throw new Error('Could not clear the emulators. Are they running (npm run emulators)?');
}

// ---------- Events ----------
const DEVFEST_CURRENT = 'devfest-2027';
const DEVFEST_PAST = 'devfest-2026';
const MEETUP = 'meetup-2027-02';
const venue = { name: 'Example Hall', streetAddress: '1 Example St', locality: 'Surry Hills', region: 'NSW', postalCode: '2010', country: 'AU' };
const flow = (enabled, open, closesAt = null) => ({ enabled, open, closesAt });

const events = {
  [DEVFEST_CURRENT]: {
    type: 'devfest', name: 'DevFest Sydney 2027', startAt: fixed('2027-10-09T22:00:00Z'), endAt: fixed('2027-10-10T08:00:00Z'),
    timeZone: 'Australia/Sydney', venue, bevyUrl: '', humanitixUrl: 'https://example.com/tickets', ticketLowestPrice: '40.00', ticketsOnSaleAt: null,
    cfs: flow(true, true, fixed('2027-08-30T13:59:00Z')), showcase: flow(true, true, fixed('2027-09-20T13:59:00Z')), volunteers: flow(true, true, fixed('2027-09-25T13:59:00Z')),
    updatedAt: at(-2), updatedBy: ADMIN_EMAIL,
  },
  [DEVFEST_PAST]: {
    type: 'devfest', name: 'DevFest Sydney 2026', startAt: fixed('2026-10-09T22:00:00Z'), endAt: fixed('2026-10-10T08:00:00Z'),
    timeZone: 'Australia/Sydney', venue, bevyUrl: '', humanitixUrl: '', ticketLowestPrice: '', ticketsOnSaleAt: null,
    cfs: flow(true, false), showcase: flow(true, false), volunteers: flow(true, false), updatedAt: at(-60), updatedBy: ADMIN_EMAIL,
  },
  [MEETUP]: {
    type: 'general', name: 'February meetup: Agents in production', startAt: at(40, 8), endAt: at(40, 11),
    timeZone: 'Australia/Sydney', venue, bevyUrl: 'https://example.com/bevy', humanitixUrl: '', ticketLowestPrice: '', ticketsOnSaleAt: null,
    cfs: flow(false, false), showcase: flow(false, false), volunteers: flow(true, true), updatedAt: at(-3), updatedBy: ADMIN_EMAIL,
  },
};
const privateLinks = { speakerTicketUrl: 'https://example.com/speaker-ticket', showcaseTicketUrl: 'https://example.com/showcase-ticket', volunteerTicketUrl: 'https://example.com/volunteer-ticket', volunteerWhatsappUrl: 'https://example.com/whatsapp' };

// ---------- DevFest proposals, talks and speakers ----------
const ABSTRACT = 'A practical walk through what changed when our team moved from writing code to reviewing what agents write.\n\n- What we measured\n- What broke first\n- What we would do again';
const BIO = 'Builds developer tools and speaks at community events around Sydney.';

function submission(overrides) {
  return {
    eventId: DEVFEST_CURRENT, abstract: ABSTRACT, format: 'talk', track: 'developer', experienceLevel: 'intermediate',
    linkedinUrl: '', githubUrl: '', websiteUrl: '', speakerTagline: 'Engineer at Example Co', speakerBio: BIO, previousTalkLink: '',
    howDidYouHear: 'Meetup', coSpeakerEmails: '', tracking: noTracking, accessibilityNeeds: '', requiresTravelSupport: false, travelSupportLocation: '',
    isGoogleDeveloperExpert: false, isFirstTimeSpeaker: false, wantsMentoring: false, hasSpokenAtGdgSydneyBefore: false,
    isOpenToAudienceQuestions: true, optOutOfRecording: false, submittedAt: at(-30), status: 'pending', reviewerNotes: [],
    acceptanceEmailSentAt: null, acceptanceEmailFirstSentAt: null, acceptanceEmailSentBy: '', confirmByDate: null, speakerConfirmedAt: null,
    speakerTicketEmailSentAt: null, speakerTicketEmailSentBy: '', rejectionEmailSentAt: null, rejectionEmailSentBy: '', editedAt: null,
    ...overrides,
  };
}

// [id, person name, overrides, accepted state: null | 'unsent' | 'awaiting' | 'confirmed' | 'ticketed']
const proposals = [
  ['sub-pending-ada', 'Ada Example', { talkTitle: 'Agents that review their own pull requests', track: 'developer', isGoogleDeveloperExpert: true, submittedAt: at(-3) }, null],
  ['sub-pending-ben', 'Ben Sample', { talkTitle: 'Prototyping a product in a weekend with Gemini', track: 'builder', isFirstTimeSpeaker: true, wantsMentoring: true, submittedAt: at(-2) }, null],
  ['sub-pending-cleo', 'Cleo Placeholder', { talkTitle: 'Hands-on: Firebase Genkit from zero to deployed', track: 'workshop', format: 'workshop', submittedAt: at(-1), requiresTravelSupport: true, travelSupportLocation: 'Melbourne, Australia' }, null],
  ['sub-pending-dev', 'Dev Testperson', { talkTitle: 'Why our Flutter app got faster when we deleted half of it', track: 'developer', format: 'lightning-talk', experienceLevel: 'advanced', submittedAt: at(-6), editedAt: at(-1) }, null],
  ['sub-accepted-unsent', 'Eli Fixture', { talkTitle: 'Security reviews for code nobody wrote', track: 'spotlight', isGoogleDeveloperExpert: true }, 'unsent'],
  ['sub-accepted-awaiting', 'Fay Dummy', { talkTitle: 'Scaling a Cloud Run service from 10 to 10,000 users', track: 'developer' }, 'awaiting'],
  ['sub-accepted-confirmed', 'Gus Mockingbird', { talkTitle: 'No-code automations that survived contact with finance', track: 'builder' }, 'confirmed'],
  ['sub-accepted-confirmed-2', 'Hana Sampleton', { talkTitle: 'Designing with AI without losing the plot', track: 'builder' }, 'confirmed'],
  ['sub-accepted-ticketed', 'Ivo Example', { talkTitle: 'Keynote: Build, secure, scale', track: 'keynote' }, 'ticketed'],
  ['sub-rejected-unsent', 'Jo Notpicked', { talkTitle: 'A history of JavaScript frameworks', track: 'developer', status: 'rejected' }, null],
  ['sub-rejected-sent', 'Kit Declined', { talkTitle: 'Blockchain for event ticketing', track: 'builder', status: 'rejected', rejectionEmailSentAt: at(-4), rejectionEmailSentBy: ADMIN_EMAIL, reviewerNotes: [note('Rejection email sent')] }, null],
  ['sub-archived', 'Lu Duplicate', { talkTitle: 'Agents that review their own pull requests (duplicate)', track: 'developer', status: 'archived' }, null],
];

const ACCEPTED_FIELDS = {
  unsent: {},
  awaiting: { acceptanceEmailSentAt: at(-3), acceptanceEmailFirstSentAt: at(-3), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(3), reviewerNotes: [note('Acceptance email sent', 'Alex Organiser', -3)] },
  confirmed: { acceptanceEmailSentAt: at(-10), acceptanceEmailFirstSentAt: at(-10), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(-4), speakerConfirmedAt: at(-8) },
  ticketed: { acceptanceEmailSentAt: at(-20), acceptanceEmailFirstSentAt: at(-20), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(-14), speakerConfirmedAt: at(-18), speakerTicketEmailSentAt: at(-15), speakerTicketEmailSentBy: ADMIN_EMAIL },
};

const presenterState = (overrides = {}) => ({
  ticketEmailSentAt: null, ticketEmailSentBy: null, calendarInviteSentAt: null, calendarInviteSentBy: null,
  calendarInviteSequence: null, calendarInviteUid: null, calendarInviteSlot: null, thanksEmailSentAt: null, thanksEmailSentBy: null,
  ...overrides,
});

function slugEmail(name) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.com`;
}

// ---------- Meetup proposals ----------
function meetupProposal(overrides) {
  return {
    profileUrl: '', format: 'standard', abstract: ABSTRACT, audience: 'Developers who have shipped one agent and want a second.',
    bio: BIO, speakingExperience: 'Two meetup talks.', notes: '', submittedAt: at(-10), status: 'pending', reviewerNotes: [], eventId: '',
    acceptanceEmailSentAt: null, acceptanceEmailFirstSentAt: null, acceptanceEmailSentBy: '', confirmByDate: null, speakerConfirmedAt: null, editedAt: null, source: '',
    ...overrides,
  };
}

// ---------- Volunteers ----------
const volunteerPeople = [
  ['vol-mia', 'Mia Helper', { status: 'pending', areasOfInterest: ['registration', 'photography'] }],
  ['vol-noah', 'Noah Assist', { status: 'pending', areasOfInterest: ['av-tech'] }],
  ['vol-oli', 'Oli Crew', { status: 'accepted', areasOfInterest: ['speaker-support'] }],
  ['vol-pia', 'Pia Volunteer', { status: 'accepted', areasOfInterest: ['mc'], acceptanceEmailSentAt: at(-2), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(1) }],
  ['vol-quinn', 'Quinn Roster', { status: 'accepted', areasOfInterest: ['registration'], assignedArea: 'registration', assignedShift: 'morning', acceptanceEmailSentAt: at(-9), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(-7), volunteerConfirmedAt: at(-8) }],
  ['vol-rae', 'Rae Shifts', { status: 'accepted', areasOfInterest: ['photography', 'social-media'], acceptanceEmailSentAt: at(-9), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(-7), volunteerConfirmedAt: at(-8), ticketSentAt: at(-6), ticketSentBy: ADMIN_EMAIL }],
  ['vol-sam', 'Sam Organiser', { status: 'accepted', isOrganiser: true, organiserRole: 'Lead organiser', assignedArea: 'lead-volunteer', assignedShift: 'full-day' }],
];

function volunteerSignup(profileId, overrides) {
  return {
    eventId: DEVFEST_CURRENT, profileId, motivation: 'I want to help the community I learnt from.', areasOfInterest: [], tracking: noTracking,
    submittedAt: at(-12), status: 'pending', reviewerNotes: [], assignedArea: '', assignedShift: '', showOnCrewPage: false,
    acceptanceEmailSentAt: null, acceptanceEmailSentBy: '', confirmByDate: null, volunteerConfirmedAt: null, ticketSentAt: null, ticketSentBy: '',
    isOrganiser: false, organiserRole: '',
    ...overrides,
  };
}

// ---------- Showcase ----------
function showcaseEntry(overrides) {
  return {
    eventId: DEVFEST_CURRENT, pitch: 'Turns meeting notes into a tested pull request.', description: 'A small agent that reads notes and drafts code.',
    stage: 'prototype', demoUrl: 'https://example.com/demo', repoUrl: '', linkedinUrl: '', builtWith: 'Gemini, Firebase', coPresenters: [],
    demoRequirements: '', isFirstTimePresenter: false, tracking: noTracking, submittedAt: at(-8), status: 'pending', reviewerNotes: [],
    acceptanceEmailSentAt: null, acceptanceEmailSentBy: '', confirmByDate: null, showcaseConfirmedAt: null, showcaseTicketEmailSentAt: null, showcaseTicketEmailSentBy: '',
    ...overrides,
  };
}

async function main() {
  await clearEmulators();
  const batch = db.batch();
  const set = (path, data) => batch.set(db.doc(path), data);

  set(`admins/${ADMIN_EMAIL}`, { email: ADMIN_EMAIL, name: 'Alex Organiser', addedBy: 'seed', addedAt: at(-90) });
  for (const [id, data] of Object.entries(events)) {
    set(`events/${id}`, data);
    set(`eventPrivate/${id}`, privateLinks);
  }
  set('settings/site', { currentDevfestEventId: DEVFEST_CURRENT, speakerPhotosUrl: 'https://example.com/photos' });

  // DevFest proposals, with a talk and a person for each accepted one.
  const scheduledTalkIds = [];
  for (const [id, name, overrides, acceptedState] of proposals) {
    const email = slugEmail(name);
    const status = acceptedState ? 'accepted' : (overrides.status ?? 'pending');
    set(`submissions/${id}`, submission({ name, email, ...overrides, status, ...(acceptedState ? ACCEPTED_FIELDS[acceptedState] : {}) }));
    if (!acceptedState) continue;
    const speakerId = `person-${id}`;
    set(`speakers/${speakerId}`, {
      name, email, emailNormalised: email, linkedinUrl: '', githubUrl: '', websiteUrl: '', bio: BIO, tagline: 'Engineer at Example Co',
      photoUrl: '', previousSlugs: [], createdAt: at(-20),
    });
    const isScheduled = acceptedState === 'confirmed' || acceptedState === 'ticketed';
    set(`talks/${id}`, {
      eventId: DEVFEST_CURRENT, talkTitle: overrides.talkTitle, abstract: ABSTRACT, format: overrides.format ?? 'talk', track: overrides.track,
      experienceLevel: 'intermediate', speakerIds: [speakerId], submissionId: id, promotedAt: at(-15),
      speakerState: { [speakerId]: presenterState() },
    });
    if (isScheduled) scheduledTalkIds.push(id);
  }
  // A co-speaker on the confirmed builder talk.
  set('speakers/person-co-speaker', { name: 'Zed Cospeaker', email: 'zed.cospeaker@example.com', emailNormalised: 'zed.cospeaker@example.com', linkedinUrl: '', githubUrl: '', websiteUrl: '', bio: '', tagline: '', photoUrl: '', previousSlugs: [], createdAt: at(-14) });

  // Schedule: the confirmed talks get slots on the day.
  const rooms = ['auditorium', 'developer', 'builder'];
  scheduledTalkIds.forEach((talkId, index) => {
    set(`schedule/${DEVFEST_CURRENT}-slot-${index + 1}`, {
      eventId: DEVFEST_CURRENT, kind: 'session', title: 'Session', talkIds: [talkId], startTime: Timestamp.fromMillis(Date.UTC(2027, 9, 9, 23) + index * 45 * 60 * 1000),
      durationMinutes: 30, room: rooms[index % rooms.length], isTentative: false,
    });
  });
  set(`schedule/${DEVFEST_CURRENT}-lunch`, { eventId: DEVFEST_CURRENT, kind: 'break', title: 'Lunch', talkIds: [], startTime: fixed('2027-10-10T02:00:00Z'), durationMinutes: 60, room: 'all', isTentative: false });

  // Meetup proposals.
  set('meetupProposals/meetup-pending', meetupProposal({ name: 'Tess Meetup', email: 'tess.meetup@example.com', talkTitle: 'Evaluating agents with real users', submittedAt: at(-4) }));
  set('meetupProposals/meetup-agent', meetupProposal({ name: 'Uma Viaagent', email: 'uma.viaagent@example.com', talkTitle: 'What my coding agent taught me about tests', source: 'api', submittedAt: at(-1) }));
  set('meetupProposals/meetup-accepted', meetupProposal({ name: 'Vic Accepted', email: 'vic.accepted@example.com', talkTitle: 'On-device Gemini Nano in an Android app', status: 'accepted', eventId: MEETUP, acceptanceEmailSentAt: at(-2), acceptanceEmailFirstSentAt: at(-2), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(4) }));
  set('speakers/person-meetup-accepted', { name: 'Vic Accepted', email: 'vic.accepted@example.com', emailNormalised: 'vic.accepted@example.com', linkedinUrl: '', githubUrl: '', websiteUrl: '', bio: BIO, tagline: 'Android engineer', photoUrl: '', previousSlugs: [], createdAt: at(-3) });
  set('talks/meetup-accepted', { eventId: MEETUP, talkTitle: 'On-device Gemini Nano in an Android app', abstract: ABSTRACT, format: 'standard', track: 'developer', experienceLevel: 'intermediate', speakerIds: ['person-meetup-accepted'], meetupProposalId: 'meetup-accepted', promotedAt: at(-3), speakerState: { 'person-meetup-accepted': presenterState() } });
  set('meetupProposals/meetup-rejected', meetupProposal({ name: 'Wes Notnow', email: 'wes.notnow@example.com', talkTitle: 'Rewriting everything in Rust', status: 'rejected' }));

  // Volunteers: a GDG-wide profile and a signup for the current DevFest each.
  for (const [id, name, overrides] of volunteerPeople) {
    const email = slugEmail(name);
    set(`volunteerProfiles/profile-${id}`, {
      name, email, emailNormalised: email, phone: '0400 000 000', priorExperience: 'Helped at two meetups.', googleTechExperience: 'Firebase',
      isTorrensStudentOrStaff: false, hasBeenGdgOnCampusExec: false, gdgOnCampusChapter: '', dietaryRequirements: '', photoUrl: '', linkedinUrl: '',
      inPool: id === 'vol-quinn' || id === 'vol-rae', isOrganiser: Boolean(overrides.isOrganiser), organiserRole: overrides.organiserRole ?? '',
      volunteerInvites: {}, inviteOptOut: false, createdAt: at(-12),
    });
    set(`volunteers/${id}`, volunteerSignup(`profile-${id}`, overrides));
  }
  // A past volunteer from 2026, in the pool, for the invite flows.
  set('volunteerProfiles/profile-past', { name: 'Xan Pastcrew', email: 'xan.pastcrew@example.com', emailNormalised: 'xan.pastcrew@example.com', phone: '', priorExperience: '', googleTechExperience: '', isTorrensStudentOrStaff: false, hasBeenGdgOnCampusExec: false, gdgOnCampusChapter: '', dietaryRequirements: '', photoUrl: '', linkedinUrl: '', inPool: true, inPoolAt: at(-40), inPoolBy: ADMIN_EMAIL, isOrganiser: false, organiserRole: '', volunteerInvites: {}, inviteOptOut: false, createdAt: at(-400) });
  set('volunteers/vol-past', volunteerSignup('profile-past', { eventId: DEVFEST_PAST, status: 'accepted', submittedAt: at(-400), assignedArea: 'registration', assignedShift: 'full-day', acceptanceEmailSentAt: at(-390), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(-388), volunteerConfirmedAt: at(-389) }));

  // Builder Showcase.
  set('showcase/show-pending', showcaseEntry({ name: 'Yara Builder', email: 'yara.builder@example.com', projectName: 'NoteToPR' }));
  set('showcase/show-accepted', showcaseEntry({ name: 'Zoe Maker', email: 'zoe.maker@example.com', projectName: 'Queue Buddy', status: 'accepted', demoRequirements: 'Needs a second screen.' }));
  set('showcase/show-confirmed', showcaseEntry({ name: 'Abe Shipper', email: 'abe.shipper@example.com', projectName: 'Pantry Agent', status: 'accepted', stage: 'live', acceptanceEmailSentAt: at(-6), acceptanceEmailSentBy: ADMIN_EMAIL, confirmByDate: at(-4), showcaseConfirmedAt: at(-5) }));
  set('showcase/show-rejected', showcaseEntry({ name: 'Bea Later', email: 'bea.later@example.com', projectName: 'Crypto Coupons', status: 'rejected', stage: 'idea' }));

  // DevFest 2026 feedback, for the pinned survey page.
  set('feedback/feedback-1', { eventId: DEVFEST_PAST, role: 'developer', overallRating: 5, aspectRatings: { talks: 5, workshops: 4, venue: 4, food: 3, organisation: 5, networking: 5 }, activities: ['keynotes', 'developer'], favouriteSessionId: '', enjoyedMost: 'The agent security talk.', improveNextTime: 'More coffee.', returnIntent: 'yes', submittedAt: at(-38) });

  await batch.commit();
  // The co-speaker joins the confirmed builder talk.
  await db.doc('talks/sub-accepted-confirmed').update({
    speakerIds: ['person-sub-accepted-confirmed', 'person-co-speaker'],
    'speakerState.person-co-speaker': presenterState(),
  });

  // The admin's sign-in, and a ready session cookie.
  await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, displayName: 'Alex Organiser', emailVerified: true });
  const signIn = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulated`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
  });
  const { idToken } = await signIn.json();
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: 5 * DAY });
  const outputDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../.emulator-mail');
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, 'admin-session-cookie.txt'), sessionCookie);

  console.log(`Seeded ${PROJECT_ID}: 3 events, ${proposals.length} DevFest proposals, 4 meetup proposals, ${volunteerPeople.length + 1} volunteers, 4 showcase entries.`);
  console.log(`Admin: ${ADMIN_EMAIL}. Session cookie in .emulator-mail/admin-session-cookie.txt`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
