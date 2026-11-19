import { adminDb } from '@/lib/firebase-admin';
import { loadEvents } from '@/lib/events';
import type { GdgEventType } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

// The numbers on /admin/analytics: GDG Sydney across every event, DevFests and meetups alike
// (added 2026-11-14), where /admin/devfest/analytics looks at one DevFest's forms. Reads each
// collection once, only the fields counted, and works everything out here. Server only.

export interface EventAnalyticsRow {
  eventId: string;
  name: string;
  type: GdgEventType;
  startAt: string; // ISO
  isUpcoming: boolean;
  talks: number;
  speakers: number;
  // Of this event's speakers, those giving their first talk with us, and those who had spoken
  // at an earlier event.
  firstTimeSpeakers: number;
  returningSpeakers: number;
  // DevFest: proposals filed through its Call for Speakers. A meetup proposal gets an event
  // only when accepted, so a general event counts only the ones accepted into it.
  proposals: number;
  acceptedProposals: number;
  // Volunteer signups for this event (organisers aside), how many were accepted, and how many
  // came from people who had volunteered at an earlier event.
  volunteerSignups: number;
  acceptedVolunteers: number;
  returningVolunteers: number;
  organisers: number;
}

// Something an organiser has yet to decide, on an event that hasn't ended: how many are
// waiting and how long the oldest has been (whole days). Meetup proposals have no event until
// one is accepted into it, so theirs is a single item.
export interface WaitingItem {
  kind: 'devfest-proposals' | 'meetup-proposals' | 'volunteers' | 'showcase';
  eventId: string | null;
  eventName: string | null;
  eventType: GdgEventType | null;
  count: number;
  oldestDays: number;
}

export interface GdgAnalytics {
  waiting: WaitingItem[]; // most overdue first
  events: EventAnalyticsRow[]; // newest first
  speakers: {
    people: number;
    withTalks: number;
    // Gave talks at more than one event.
    repeat: number;
    talks: number;
  };
  meetupProposals: {
    total: number;
    uniqueProposers: number;
    pending: number;
    accepted: number;
    rejected: number;
    bySource: [string, number][]; // most first
    submittedAt: string[]; // ISO, for the over-time chart
  };
  volunteers: {
    profiles: number;
    inPool: number;
    // People who organise: an organiser signup at any event, or isOrganiser on the profile (as
    // PM.md defines it), each counted once.
    organisers: number;
    signups: number;
    // People with at least one signup, and of those how many signed up for more than one event.
    withSignups: number;
    repeat: number;
  };
}

const SOURCE_LABELS: Record<string, string> = {
  'gdgsydney.com/speak': 'gdgsydney.com/speak',
  'speaker-portal': 'Speaker portal',
  organiser: 'Added by an organiser',
  api: 'Agent or API',
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isoOrNull(value: unknown): string | null {
  return value && typeof (value as Timestamp).toDate === 'function' ? (value as Timestamp).toDate().toISOString() : null;
}

export async function loadGdgAnalytics(): Promise<GdgAnalytics> {
  const [events, talks, people, submissions, meetupProposals, volunteerSignups, volunteerProfiles, showcaseEntries] = await Promise.all([
    loadEvents(),
    adminDb.collection('talks').select('eventId', 'speakerIds').get(),
    adminDb.collection('speakers').count().get(),
    adminDb.collection('submissions').select('eventId', 'status', 'submittedAt').get(),
    adminDb.collection('meetupProposals').select('eventId', 'status', 'source', 'submittedAt', 'email').get(),
    adminDb.collection('volunteers').select('eventId', 'profileId', 'status', 'isOrganiser', 'submittedAt').get(),
    adminDb.collection('volunteerProfiles').select('inPool', 'isOrganiser').get(),
    adminDb.collection('showcase').select('eventId', 'status', 'submittedAt').get(),
  ]);

  const now = Date.now();
  // Oldest first, so "first time" and "returning" follow the order events happened in.
  const chronological = [...events].sort((first, second) => Date.parse(first.startAt) - Date.parse(second.startAt));
  const eventOrder = new Map(chronological.map((event, index) => [event.id, index]));

  // Each speaker's and each volunteer's earliest event, by that order.
  const talkDocs = talks.docs.map((doc) => ({ eventId: text(doc.data().eventId), speakerIds: (doc.data().speakerIds ?? []) as string[] }));
  const firstEventOfSpeaker = new Map<string, number>();
  const eventsOfSpeaker = new Map<string, Set<string>>();
  for (const talk of talkDocs) {
    const position = eventOrder.get(talk.eventId);
    for (const speakerId of talk.speakerIds) {
      if (!eventsOfSpeaker.has(speakerId)) eventsOfSpeaker.set(speakerId, new Set());
      eventsOfSpeaker.get(speakerId)!.add(talk.eventId);
      if (position !== undefined && position < (firstEventOfSpeaker.get(speakerId) ?? Infinity)) firstEventOfSpeaker.set(speakerId, position);
    }
  }

  const signupDocs = volunteerSignups.docs
    .map((doc) => doc.data())
    .filter((signup) => signup.status !== 'archived')
    .map((signup) => ({
      eventId: text(signup.eventId),
      profileId: text(signup.profileId),
      status: text(signup.status),
      isOrganiser: signup.isOrganiser === true,
      submittedAt: isoOrNull(signup.submittedAt),
    }));
  const volunteerSignupsOnly = signupDocs.filter((signup) => !signup.isOrganiser);
  const firstEventOfVolunteer = new Map<string, number>();
  const eventsOfVolunteer = new Map<string, Set<string>>();
  for (const signup of volunteerSignupsOnly) {
    if (!signup.profileId) continue;
    if (!eventsOfVolunteer.has(signup.profileId)) eventsOfVolunteer.set(signup.profileId, new Set());
    eventsOfVolunteer.get(signup.profileId)!.add(signup.eventId);
    const position = eventOrder.get(signup.eventId);
    if (position !== undefined && position < (firstEventOfVolunteer.get(signup.profileId) ?? Infinity)) firstEventOfVolunteer.set(signup.profileId, position);
  }

  const submissionDocs = submissions.docs.map((doc) => doc.data()).filter((submission) => submission.status !== 'archived');
  const showcaseDocs = showcaseEntries.docs.map((doc) => doc.data()).filter((entry) => entry.status !== 'archived');
  const meetupDocs = meetupProposals.docs.map((doc) => doc.data()).filter((proposal) => proposal.status !== 'archived');

  const eventRows: EventAnalyticsRow[] = events.map((event) => {
    const position = eventOrder.get(event.id)!;
    const eventTalks = talkDocs.filter((talk) => talk.eventId === event.id);
    const speakerIds = new Set(eventTalks.flatMap((talk) => talk.speakerIds));
    const firstTimeSpeakers = [...speakerIds].filter((speakerId) => firstEventOfSpeaker.get(speakerId) === position).length;
    const eventProposals =
      event.type === 'devfest'
        ? submissionDocs.filter((submission) => submission.eventId === event.id)
        : meetupDocs.filter((proposal) => proposal.eventId === event.id);
    const eventSignups = signupDocs.filter((signup) => signup.eventId === event.id);
    const eventVolunteers = eventSignups.filter((signup) => !signup.isOrganiser);
    return {
      eventId: event.id,
      name: event.name,
      type: event.type,
      startAt: event.startAt,
      isUpcoming: now < Date.parse(event.endAt),
      talks: eventTalks.length,
      speakers: speakerIds.size,
      firstTimeSpeakers,
      returningSpeakers: speakerIds.size - firstTimeSpeakers,
      proposals: eventProposals.length,
      acceptedProposals: eventProposals.filter((proposal) => proposal.status === 'accepted').length,
      volunteerSignups: eventVolunteers.length,
      acceptedVolunteers: eventVolunteers.filter((signup) => signup.status === 'accepted').length,
      returningVolunteers: eventVolunteers.filter(
        (signup) => signup.profileId && (firstEventOfVolunteer.get(signup.profileId) ?? position) < position
      ).length,
      organisers: eventSignups.filter((signup) => signup.isOrganiser).length,
    };
  });

  // What is waiting on an organiser. Only events still to come: a pending signup for a finished
  // event is history, not a to-do.
  const waitingFrom = (kind: WaitingItem['kind'], event: (typeof events)[number] | null, submittedAts: (string | null)[]): WaitingItem | null => {
    if (submittedAts.length === 0) return null;
    const oldest = Math.min(...submittedAts.map((iso) => (iso ? Date.parse(iso) : now)));
    return {
      kind,
      eventId: event?.id ?? null,
      eventName: event?.name ?? null,
      eventType: event?.type ?? null,
      count: submittedAts.length,
      oldestDays: Math.max(0, Math.floor((now - oldest) / 86_400_000)),
    };
  };
  const waiting: WaitingItem[] = [];
  for (const event of events.filter((candidate) => now < Date.parse(candidate.endAt))) {
    const pendingIn = (docs: { eventId?: unknown; status?: unknown; submittedAt?: unknown }[]) =>
      docs.filter((doc) => doc.eventId === event.id && doc.status === 'pending').map((doc) => isoOrNull(doc.submittedAt));
    if (event.type === 'devfest') {
      waiting.push(...[waitingFrom('devfest-proposals', event, pendingIn(submissionDocs)), waitingFrom('showcase', event, pendingIn(showcaseDocs))].filter((item): item is WaitingItem => item !== null));
    }
    const pendingVolunteers = volunteerSignupsOnly.filter((signup) => signup.eventId === event.id && signup.status === 'pending').map((signup) => signup.submittedAt);
    const volunteerItem = waitingFrom('volunteers', event, pendingVolunteers);
    if (volunteerItem) waiting.push(volunteerItem);
  }
  const pendingMeetupProposals = waitingFrom(
    'meetup-proposals',
    null,
    meetupDocs.filter((proposal) => proposal.status === 'pending').map((proposal) => isoOrNull(proposal.submittedAt))
  );
  if (pendingMeetupProposals) waiting.push(pendingMeetupProposals);
  waiting.sort((first, second) => second.oldestDays - first.oldestDays);

  const sourceCounts = new Map<string, number>();
  for (const proposal of meetupDocs) {
    // Proposals from before `source` was recorded all came through the /speak form.
    const label = SOURCE_LABELS[text(proposal.source) || 'gdgsydney.com/speak'] ?? text(proposal.source);
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
  }

  const profiles = volunteerProfiles.docs.map((doc) => ({ id: doc.id, inPool: doc.data().inPool === true, isOrganiser: doc.data().isOrganiser === true }));
  const organiserIds = new Set([
    ...profiles.filter((profile) => profile.isOrganiser).map((profile) => profile.id),
    ...signupDocs.filter((signup) => signup.isOrganiser && signup.profileId).map((signup) => signup.profileId),
  ]);

  return {
    waiting,
    events: eventRows,
    speakers: {
      people: people.data().count,
      withTalks: eventsOfSpeaker.size,
      repeat: [...eventsOfSpeaker.values()].filter((eventIds) => eventIds.size > 1).length,
      talks: talkDocs.length,
    },
    meetupProposals: {
      total: meetupDocs.length,
      uniqueProposers: new Set(meetupDocs.map((proposal) => text(proposal.email).trim().toLowerCase()).filter(Boolean)).size,
      pending: meetupDocs.filter((proposal) => proposal.status === 'pending').length,
      accepted: meetupDocs.filter((proposal) => proposal.status === 'accepted').length,
      rejected: meetupDocs.filter((proposal) => proposal.status === 'rejected').length,
      bySource: [...sourceCounts.entries()].sort((first, second) => second[1] - first[1]),
      submittedAt: meetupDocs.map((proposal) => isoOrNull(proposal.submittedAt)).filter((iso): iso is string => iso !== null),
    },
    volunteers: {
      profiles: profiles.length,
      inPool: profiles.filter((profile) => profile.inPool).length,
      organisers: organiserIds.size,
      signups: volunteerSignupsOnly.length,
      withSignups: eventsOfVolunteer.size,
      repeat: [...eventsOfVolunteer.values()].filter((eventIds) => eventIds.size > 1).length,
    },
  };
}
