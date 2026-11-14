import type { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { toGdgEvent } from '@/lib/events';
import { normaliseProfileUrl } from '@/lib/speakers';
import { confirmUrl } from '@/lib/speakerConfirm';
import {
  DEVFEST_EDITABLE_FIELDS,
  MEETUP_EDITABLE_FIELDS,
  type DevfestProposalPayload,
  type MeetupProposalFields,
} from '@/lib/proposalFiling';
import type { GdgEvent, GdgEventType } from '@/lib/types';

// What the speaker portal shows a signed-in address (see portalAuth.ts): the people in
// `speakers` with that email, each with their talks, and every proposal filed under it.
// More than one person can share an address (two 2026 speakers do), so profiles are a list.
// Server only; nothing here returns another person's email.

export interface PortalTalk {
  talkId: string;
  talkTitle: string;
  eventName: string;
  eventType: GdgEventType;
  startAt: string | null; // ISO
  timeZone: string;
  isUpcoming: boolean;
  // Everyone else on the talk, by name only.
  coSpeakerNames: string[];
}

export interface PortalProfile {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  photoUrl: string;
  talks: PortalTalk[]; // upcoming first, then newest past
}

// Only what the speaker has been told. A decision made in the admin stays "under review"
// here until its email has gone, the same as in their inbox: accepting or rejecting a
// proposal and telling the speaker are deliberately separate steps (see types.ts).
export type PortalProposalStatus = 'under-review' | 'accepted' | 'confirmed' | 'not-selected' | 'closed';

export interface PortalProposal {
  id: string;
  kind: 'devfest' | 'meetup';
  talkTitle: string;
  // The event it was filed under (DevFest) or accepted into (meetup); null for a meetup
  // proposal still waiting for one.
  eventName: string | null;
  submittedAt: string | null; // ISO
  status: PortalProposalStatus;
  // The signed /speaker/confirm link, for an accepted proposal not yet confirmed. The portal
  // session already proves the address, so handing it over shows nothing new.
  confirmUrl: string | null;
  // The saved talk it was proposed from (src/lib/portalSavedTalks.ts), if any.
  savedTalkId: string | null;
  // What the edit form starts from, while the speaker can still change it: only a proposal
  // nobody has decided on yet (pending), at an event that hasn't passed. Null otherwise.
  editable: PortalEditableProposal | null;
}

export type DevfestEditableFields = Pick<DevfestProposalPayload, (typeof DEVFEST_EDITABLE_FIELDS)[number]>;
export type MeetupEditableFields = Pick<MeetupProposalFields, (typeof MEETUP_EDITABLE_FIELDS)[number]>;

export type PortalEditableProposal =
  | { kind: 'devfest'; name: string; fields: DevfestEditableFields }
  | { kind: 'meetup'; name: string; fields: MeetupEditableFields };

const DEVFEST_BOOLEAN_FIELDS: ReadonlySet<string> = new Set([
  'requiresTravelSupport',
  'isGoogleDeveloperExpert',
  'isFirstTimeSpeaker',
  'wantsMentoring',
  'hasSpokenAtGdgSydneyBefore',
  'isOpenToAudienceQuestions',
  'optOutOfRecording',
]);

// The stored values of the fields a speaker may edit. Choices that are missing or unknown come
// through as text the form doesn't recognise, so the speaker picks again.
function toEditableProposal(kind: 'devfest' | 'meetup', proposal: FirebaseFirestore.DocumentData): PortalEditableProposal {
  const name = text(proposal.name);
  if (kind === 'devfest') {
    const fields = Object.fromEntries(
      DEVFEST_EDITABLE_FIELDS.map((key) => [key, DEVFEST_BOOLEAN_FIELDS.has(key) ? proposal[key] === true : text(proposal[key])])
    ) as DevfestEditableFields;
    return { kind, name, fields };
  }
  const fields = Object.fromEntries(MEETUP_EDITABLE_FIELDS.map((key) => [key, text(proposal[key])])) as MeetupEditableFields;
  return { kind, name, fields };
}

export interface PortalOverview {
  profiles: PortalProfile[];
  proposals: PortalProposal[];
}

function isoOrNull(value: unknown): string | null {
  return value && typeof (value as Timestamp).toDate === 'function' ? (value as Timestamp).toDate().toISOString() : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toProfileFields(id: string, person: FirebaseFirestore.DocumentData): Omit<PortalProfile, 'talks'> {
  return {
    id,
    name: text(person.name),
    tagline: text(person.tagline),
    bio: text(person.bio),
    linkedinUrl: normaliseProfileUrl(text(person.linkedinUrl)),
    githubUrl: normaliseProfileUrl(text(person.githubUrl)),
    websiteUrl: normaliseProfileUrl(text(person.websiteUrl)),
    photoUrl: text(person.photoUrl),
  };
}

async function loadEventsById(eventIds: string[]): Promise<Map<string, GdgEvent>> {
  const uniqueIds = [...new Set(eventIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const snapshots = await adminDb.getAll(...uniqueIds.map((id) => adminDb.collection('events').doc(id)));
  return new Map(snapshots.filter((snapshot) => snapshot.exists).map((snapshot) => [snapshot.id, toGdgEvent(snapshot.id, snapshot.data()!)]));
}

function proposalStatus(proposal: FirebaseFirestore.DocumentData, event: GdgEvent | undefined, now: Date): PortalProposalStatus {
  // A talk agreed with the speaker outside the form is confirmed without an acceptance email
  // (scripts/add-agreed-meetup-talks.mjs): they already know, since they agreed to it.
  if (proposal.status === 'accepted' && proposal.speakerConfirmedAt) return 'confirmed';
  if (proposal.status === 'accepted' && proposal.acceptanceEmailSentAt) return 'accepted';
  if (proposal.status === 'rejected' && proposal.rejectionEmailSentAt) return 'not-selected';
  if (event && now.getTime() >= Date.parse(event.endAt)) return 'closed';
  return 'under-review';
}

export async function loadPortalOverview(email: string): Promise<PortalOverview> {
  const [peopleSnapshot, submissionsSnapshot, meetupSnapshot] = await Promise.all([
    adminDb.collection('speakers').where('emailNormalised', '==', email).get(),
    adminDb.collection('submissions').where('email', '==', email).get(),
    adminDb.collection('meetupProposals').where('email', '==', email).get(),
  ]);

  const profileIds = peopleSnapshot.docs.map((doc) => doc.id);
  // array-contains-any takes up to 30 values; nobody shares an address with that many people.
  const talksSnapshot = profileIds.length
    ? await adminDb.collection('talks').where('speakerIds', 'array-contains-any', profileIds.slice(0, 30)).get()
    : null;
  const talkDocs = talksSnapshot?.docs ?? [];

  const coSpeakerIds = [...new Set(talkDocs.flatMap((talk) => (talk.data().speakerIds ?? []) as string[]))].filter(
    (speakerId) => !profileIds.includes(speakerId)
  );
  const [coSpeakerSnapshots, eventsById] = await Promise.all([
    coSpeakerIds.length ? adminDb.getAll(...coSpeakerIds.map((id) => adminDb.collection('speakers').doc(id))) : Promise.resolve([]),
    loadEventsById([
      ...talkDocs.map((talk) => text(talk.data().eventId)),
      ...submissionsSnapshot.docs.map((doc) => text(doc.data().eventId)),
      ...meetupSnapshot.docs.map((doc) => text(doc.data().eventId)),
    ]),
  ]);
  const namesById = new Map<string, string>([
    ...peopleSnapshot.docs.map((doc) => [doc.id, text(doc.data().name)] as [string, string]),
    ...coSpeakerSnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => [snapshot.id, text(snapshot.data()?.name)] as [string, string]),
  ]);

  const now = new Date();
  const profiles = peopleSnapshot.docs
    .map((doc) => {
      const talks: PortalTalk[] = talkDocs
        .filter((talk) => ((talk.data().speakerIds ?? []) as string[]).includes(doc.id))
        .map((talk) => {
          const talkData = talk.data();
          const event = eventsById.get(text(talkData.eventId));
          return {
            talkId: talk.id,
            talkTitle: text(talkData.talkTitle),
            eventName: event?.name ?? 'A GDG Sydney event',
            eventType: event?.type ?? 'general',
            startAt: event?.startAt ?? null,
            timeZone: event?.timeZone ?? 'Australia/Sydney',
            isUpcoming: event ? now.getTime() < Date.parse(event.endAt) : false,
            coSpeakerNames: ((talkData.speakerIds ?? []) as string[])
              .filter((speakerId) => speakerId !== doc.id)
              .map((speakerId) => namesById.get(speakerId) ?? '')
              .filter(Boolean),
          };
        })
        .sort((first, second) => {
          if (first.isUpcoming !== second.isUpcoming) return first.isUpcoming ? -1 : 1;
          // Upcoming soonest first; past most recent first.
          const order = String(first.startAt).localeCompare(String(second.startAt));
          return first.isUpcoming ? order : -order;
        });
      return { ...toProfileFields(doc.id, doc.data()), talks };
    })
    .sort((first, second) => first.name.localeCompare(second.name));

  const proposals: PortalProposal[] = [
    ...submissionsSnapshot.docs.map((doc) => ({ doc, kind: 'devfest' as const })),
    ...meetupSnapshot.docs.map((doc) => ({ doc, kind: 'meetup' as const })),
  ]
    // Archived is how organisers clear out spam and duplicates; it says nothing to a speaker.
    .filter(({ doc }) => doc.data().status !== 'archived')
    .map(({ doc, kind }) => {
      const proposal = doc.data();
      const event = eventsById.get(text(proposal.eventId));
      const status = proposalStatus(proposal, event, now);
      return {
        id: doc.id,
        kind,
        talkTitle: text(proposal.talkTitle),
        eventName: event?.name ?? null,
        submittedAt: isoOrNull(proposal.submittedAt),
        status,
        confirmUrl: status === 'accepted' ? confirmUrl(doc.id) : null,
        savedTalkId: text(proposal.savedTalkId) || null,
        editable: proposal.status === 'pending' && status === 'under-review' ? toEditableProposal(kind, proposal) : null,
      };
    })
    .sort((first, second) => String(second.submittedAt).localeCompare(String(first.submittedAt)));

  return { profiles, proposals };
}

// One person, only if they belong to the signed-in address. Every portal read or write of a
// profile goes through this, so a speaker id in a URL or an action argument is never trusted.
export async function loadOwnedProfile(email: string, speakerId: string): Promise<Omit<PortalProfile, 'talks'> | null> {
  if (!speakerId || speakerId.includes('/')) return null;
  const snapshot = await adminDb.collection('speakers').doc(speakerId).get();
  const person = snapshot.data();
  if (!person || text(person.emailNormalised) !== email) return null;
  return toProfileFields(snapshot.id, person);
}

// The profiles an address owns, without their talks: for the proposal form's "propose as".
export async function loadOwnedProfiles(email: string): Promise<Omit<PortalProfile, 'talks'>[]> {
  const snapshot = await adminDb.collection('speakers').where('emailNormalised', '==', email).get();
  return snapshot.docs.map((doc) => toProfileFields(doc.id, doc.data())).sort((first, second) => first.name.localeCompare(second.name));
}
