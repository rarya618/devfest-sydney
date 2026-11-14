import { adminDb } from '@/lib/firebase-admin';
import { loadEventDocs } from '@/lib/eventScope';
import type { CalendarInviteSlot, PublicSpeaker, ScheduleRoom, Speaker, SpeakerConfirmation, TalkPresenterState } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

interface SubmissionConfirmationFields {
  acceptanceEmailSentAt?: Timestamp;
  acceptanceEmailSentBy?: string;
  confirmByDate?: Timestamp;
  speakerConfirmedAt?: Timestamp;
  speakerTicketEmailSentAt?: Timestamp;
  speakerTicketEmailSentBy?: string;
}

function toIsoOrNull(timestamp: Timestamp | undefined): string | null {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

function toConfirmation(submission: SubmissionConfirmationFields | undefined): SpeakerConfirmation {
  if (!submission) return 'unknown';
  if (submission.speakerConfirmedAt) return 'confirmed';
  if (submission.acceptanceEmailSentAt) return 'awaiting';
  return 'not-emailed';
}

// The snapshot sendCalendarInvite() writes. Anything malformed reads as "no invite
// details", which the dashboard treats as needing a fresh send rather than hiding it.
function toCalendarInviteSlot(value: unknown): CalendarInviteSlot | null {
  if (!value || typeof value !== 'object') return null;
  const slot = value as Record<string, unknown>;
  if (typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string' || typeof slot.room !== 'string') return null;
  return {
    startTime: slot.startTime,
    endTime: slot.endTime,
    room: slot.room as ScheduleRoom,
    talkTitle: typeof slot.talkTitle === 'string' ? slot.talkTitle : '',
  };
}

// Profile links arrive through the CfS form, which never required a scheme, so
// "linkedin.com/in/philnash" is a real value in the collection. Rendered as-is that becomes
// a relative link under /speakers/, so the scheme is added here on the way out and by the
// admin action on the way in. Anything that is not http(s) once normalised is dropped.
export function normaliseProfileUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return withScheme;
  } catch {
    return '';
  }
}

function toPresenterState(value: unknown): TalkPresenterState {
  const state = (value ?? {}) as Record<string, unknown>;
  const stamp = (key: string) => toIsoOrNull(state[key] as Timestamp | undefined);
  const text = (key: string) => (typeof state[key] === 'string' ? (state[key] as string) : null);
  return {
    ticketEmailSentAt: stamp('ticketEmailSentAt'),
    ticketEmailSentBy: text('ticketEmailSentBy'),
    calendarInviteSentAt: stamp('calendarInviteSentAt'),
    calendarInviteSentBy: text('calendarInviteSentBy'),
    calendarInviteSequence: typeof state.calendarInviteSequence === 'number' ? state.calendarInviteSequence : null,
    calendarInviteUid: text('calendarInviteUid'),
    calendarInviteSlot: toCalendarInviteSlot(state.calendarInviteSlot),
    thanksEmailSentAt: stamp('thanksEmailSentAt'),
    thanksEmailSentBy: text('thanksEmailSentBy'),
  };
}

// The selected DevFest's lineup as /admin/devfest/speakers lists it: a row per presenter per talk,
// newest promotion first, each talk's lead before its co-speakers. Since stage 4c the talk
// (`talks`) and the person (`speakers`) are joined here, and whether the talk is going ahead
// is read off the proposal it came from, which is where the acceptance email and
// /speaker/confirm record it. A presenter whose person document is missing is skipped.
export async function fetchSpeakers(eventId: string): Promise<Speaker[]> {
  const talkDocs = (await loadEventDocs('talks', eventId)).sort(
    (first, second) =>
      ((second.data().promotedAt as Timestamp | undefined)?.toMillis() ?? 0) -
      ((first.data().promotedAt as Timestamp | undefined)?.toMillis() ?? 0)
  );

  const speakerIds = [...new Set(talkDocs.flatMap((doc) => (doc.data().speakerIds ?? []) as string[]))];
  // A talk's proposal is a CfS submission or, for a general event, a meetup proposal (4f);
  // both carry the same acceptance and confirmation fields.
  const proposalRefs = talkDocs.flatMap((doc) => {
    const talk = doc.data();
    if (talk.meetupProposalId) return [adminDb.collection('meetupProposals').doc(String(talk.meetupProposalId))];
    if (talk.submissionId) return [adminDb.collection('submissions').doc(String(talk.submissionId))];
    return [];
  });
  const [personSnapshots, submissionSnapshots] = await Promise.all([
    speakerIds.length > 0 ? adminDb.getAll(...speakerIds.map((id) => adminDb.collection('speakers').doc(id))) : [],
    proposalRefs.length > 0 ? adminDb.getAll(...proposalRefs) : [],
  ]);
  const peopleById = new Map(personSnapshots.filter((snap) => snap.exists).map((snap) => [snap.id, snap.data()!]));
  const submissionsById = new Map(
    submissionSnapshots.filter((snap) => snap.exists).map((snap) => [snap.id, snap.data() as SubmissionConfirmationFields])
  );

  return talkDocs.flatMap((talkDoc) => {
    const talk = talkDoc.data();
    const talkSpeakerIds = (talk.speakerIds ?? []) as string[];
    const leadId = talkSpeakerIds[0];
    const submission = submissionsById.get(String(talk.meetupProposalId || talk.submissionId || ''));
    const promotedAt = talk.promotedAt as Timestamp | undefined;
    const states = (talk.speakerState ?? {}) as Record<string, unknown>;

    return talkSpeakerIds.flatMap((speakerId): Speaker[] => {
      const person = peopleById.get(speakerId);
      if (!person) return [];
      const isLead = speakerId === leadId;
      const state = toPresenterState(states[speakerId]);
      return [
        {
          id: speakerId,
          talkId: talkDoc.id,
          rowId: `${talkDoc.id}:${speakerId}`,
          name: person.name ?? '',
          email: person.email ?? '',
          talkTitle: talk.talkTitle ?? '',
          abstract: talk.abstract ?? '',
          format: talk.format ?? 'talk',
          track: talk.track ?? 'developer',
          experienceLevel: talk.experienceLevel ?? 'beginner',
          linkedinUrl: normaliseProfileUrl(person.linkedinUrl ?? ''),
          githubUrl: normaliseProfileUrl(person.githubUrl ?? ''),
          websiteUrl: normaliseProfileUrl(person.websiteUrl ?? ''),
          bio: person.bio ?? '',
          tagline: person.tagline ?? '',
          photoUrl: person.photoUrl ?? '',
          previousSlugs: Array.isArray(person.previousSlugs) ? (person.previousSlugs as string[]) : [],
          submissionId: String(talk.submissionId ?? ''),
          promotedAt: promotedAt ? promotedAt.toDate().toISOString() : new Date().toISOString(),
          confirmation: toConfirmation(submission),
          // The acceptance email and its deadline went to the lead, who answered for the
          // session, so they aren't repeated on a co-speaker's card.
          acceptanceEmailSentAt: isLead ? toIsoOrNull(submission?.acceptanceEmailSentAt) : null,
          acceptanceEmailSentBy: isLead ? submission?.acceptanceEmailSentBy ?? null : null,
          confirmByDate: isLead ? toIsoOrNull(submission?.confirmByDate) : null,
          speakerConfirmedAt: toIsoOrNull(submission?.speakerConfirmedAt),
          // A lead's ticket is recorded on the proposal; a co-speaker's on the talk.
          speakerTicketEmailSentAt: isLead ? toIsoOrNull(submission?.speakerTicketEmailSentAt) : state.ticketEmailSentAt,
          speakerTicketEmailSentBy: isLead ? submission?.speakerTicketEmailSentBy ?? null : state.ticketEmailSentBy,
          calendarInviteSentAt: state.calendarInviteSentAt,
          calendarInviteSentBy: state.calendarInviteSentBy,
          calendarInviteSlot: state.calendarInviteSlot,
          thanksEmailSentAt: state.thanksEmailSentAt,
          thanksEmailSentBy: state.thanksEmailSentBy,
          coSpeakerOf: isLead ? null : leadId,
        } satisfies Speaker,
      ];
    });
  });
}

// "Brett Morgan" -> "brett-morgan". Names that collapse to nothing (all symbols) fall
// back to "speaker" so the page still has a segment.
export function toSpeakerSlug(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'speaker';
}

// Two confirmed speakers with the same name get "-2", "-3" and so on, in name order, so
// every slug is unique for a given lineup.
function assignUniqueSlugs(speakers: Omit<PublicSpeaker, 'slug' | 'sessionPartners'>[]): Omit<PublicSpeaker, 'sessionPartners'>[] {
  const seen = new Map<string, number>();
  return speakers.map((speaker) => {
    const base = toSpeakerSlug(speaker.name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...speaker, slug: count === 1 ? base : `${base}-${count}` };
  });
}

// The id that names a session: the lead speaker's, shared by their co-speakers.
export function sessionLeadId(speaker: Pick<PublicSpeaker, 'id' | 'coSpeakerOf'>): string {
  return speaker.coSpeakerOf ?? speaker.id;
}

// Everyone else on each speaker's session, lead first and then co-speakers by name (the
// list is already in name order).
function attachSessionPartners(speakers: Omit<PublicSpeaker, 'sessionPartners'>[]): PublicSpeaker[] {
  return speakers.map((speaker) => {
    const sessionId = sessionLeadId(speaker);
    const partners = speakers
      .filter((other) => other.id !== speaker.id && sessionLeadId(other) === sessionId)
      .sort((first, second) => Number(Boolean(first.coSpeakerOf)) - Number(Boolean(second.coSpeakerOf)))
      .map((other) => ({ name: other.name, slug: other.slug }));
    return { ...speaker, sessionPartners: partners };
  });
}

// The public lineup from the admin rows, with the talk each entry belongs to, which the
// schedule uses to put presenters on their slot. Only confirmed talks appear: a promoted
// speaker who has not been emailed yet, or has not answered, is not announced.
export function toPublicLineup(rows: Speaker[]): { talkId: string; speaker: PublicSpeaker }[] {
  const confirmed = rows
    .filter((row) => row.confirmation === 'confirmed')
    .sort((first, second) => first.name.localeCompare(second.name));
  const publicSpeakers = attachSessionPartners(
    assignUniqueSlugs(
      confirmed.map((row) => ({
        id: row.id,
        name: row.name,
        talkTitle: row.talkTitle,
        abstract: row.abstract,
        format: row.format,
        track: row.track,
        linkedinUrl: row.linkedinUrl,
        githubUrl: row.githubUrl,
        websiteUrl: row.websiteUrl,
        bio: row.bio,
        tagline: row.tagline,
        photoUrl: row.photoUrl,
        previousSlugs: row.previousSlugs,
        coSpeakerOf: row.coSpeakerOf,
      }))
    )
  );
  return publicSpeakers.map((speaker, index) => ({ talkId: confirmed[index].talkId, speaker }));
}

// Throws on a failed read, for /api/public/speakers: a static build that took a failed read
// for an empty lineup would publish a page with no speakers on it.
export async function loadPublicSpeakers(eventId: string): Promise<PublicSpeaker[]> {
  return toPublicLineup(await fetchSpeakers(eventId)).map((entry) => entry.speaker);
}
