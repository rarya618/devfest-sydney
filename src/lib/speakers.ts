import { adminDb } from '@/lib/firebase-admin';
import type { CalendarInviteSlot, PublicSpeaker, ScheduleRoom, Speaker, SpeakerConfirmation } from '@/lib/types';
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

// Speakers are the public lineup, but whether each one has actually confirmed lives on
// the submission they were promoted from, so the two are joined here.
export async function fetchSpeakers(): Promise<Speaker[]> {
  const snapshot = await adminDb
    .collection('speakers')
    .orderBy('promotedAt', 'desc')
    .get();

  const submissionIds = snapshot.docs
    .map((doc) => doc.data().submissionId as string | undefined)
    .filter((submissionId): submissionId is string => Boolean(submissionId));

  const submissionRefs = submissionIds.map((submissionId) => adminDb.collection('submissions').doc(submissionId));
  const submissionSnapshots = submissionRefs.length > 0 ? await adminDb.getAll(...submissionRefs) : [];
  const submissionsById = new Map<string, SubmissionConfirmationFields>();
  submissionSnapshots.forEach((submissionSnapshot) => {
    if (submissionSnapshot.exists) {
      submissionsById.set(submissionSnapshot.id, submissionSnapshot.data() as SubmissionConfirmationFields);
    }
  });

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const promotedAt = data.promotedAt as Timestamp | undefined;
    const submissionId: string = data.submissionId ?? '';
    const sourceSubmission = submissionsById.get(submissionId);
    return {
      id: doc.id,
      name: data.name ?? '',
      email: data.email ?? '',
      talkTitle: data.talkTitle ?? '',
      abstract: data.abstract ?? '',
      format: data.format ?? 'talk',
      track: data.track ?? 'developer',
      experienceLevel: data.experienceLevel ?? 'beginner',
      linkedinUrl: normaliseProfileUrl(data.linkedinUrl ?? ''),
      githubUrl: normaliseProfileUrl(data.githubUrl ?? ''),
      websiteUrl: normaliseProfileUrl(data.websiteUrl ?? ''),
      bio: data.bio ?? '',
      tagline: data.tagline ?? '',
      photoUrl: data.photoUrl ?? '',
      previousSlugs: Array.isArray(data.previousSlugs) ? (data.previousSlugs as string[]) : [],
      submissionId,
      promotedAt: promotedAt ? promotedAt.toDate().toISOString() : new Date().toISOString(),
      confirmation: toConfirmation(sourceSubmission),
      acceptanceEmailSentAt: toIsoOrNull(sourceSubmission?.acceptanceEmailSentAt),
      acceptanceEmailSentBy: sourceSubmission?.acceptanceEmailSentBy ?? null,
      confirmByDate: toIsoOrNull(sourceSubmission?.confirmByDate),
      speakerConfirmedAt: toIsoOrNull(sourceSubmission?.speakerConfirmedAt),
      speakerTicketEmailSentAt: toIsoOrNull(sourceSubmission?.speakerTicketEmailSentAt),
      speakerTicketEmailSentBy: sourceSubmission?.speakerTicketEmailSentBy ?? null,
      calendarInviteSentAt: toIsoOrNull(data.calendarInviteSentAt as Timestamp | undefined),
      calendarInviteSentBy: data.calendarInviteSentBy ?? null,
      calendarInviteSlot: toCalendarInviteSlot(data.calendarInviteSlot),
    } satisfies Speaker;
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
function assignUniqueSlugs(speakers: Omit<PublicSpeaker, 'slug'>[]): PublicSpeaker[] {
  const seen = new Map<string, number>();
  return speakers.map((speaker) => {
    const base = toSpeakerSlug(speaker.name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...speaker, slug: count === 1 ? base : `${base}-${count}` };
  });
}

// The public lineup. Only speakers who have confirmed through /speaker/confirm appear:
// a promoted speaker who has not been emailed yet, or has not answered, is not announced.
// Returns an empty list rather than throwing so the page can show its "coming soon" state.
export async function fetchPublicSpeakers(): Promise<PublicSpeaker[]> {
  try {
    const speakers = await fetchSpeakers();
    const confirmed = speakers
      .filter((speaker) => speaker.confirmation === 'confirmed')
      .sort((first, second) => first.name.localeCompare(second.name))
      .map((speaker) => ({
        id: speaker.id,
        name: speaker.name,
        talkTitle: speaker.talkTitle,
        abstract: speaker.abstract,
        format: speaker.format,
        track: speaker.track,
        linkedinUrl: speaker.linkedinUrl,
        githubUrl: speaker.githubUrl,
        websiteUrl: speaker.websiteUrl,
        bio: speaker.bio,
        tagline: speaker.tagline,
        photoUrl: speaker.photoUrl,
        previousSlugs: speaker.previousSlugs,
      }));
    return assignUniqueSlugs(confirmed);
  } catch {
    return [];
  }
}

// Null for an unknown slug and for a speaker who exists but has not confirmed, so the
// two cases are indistinguishable from outside: an unconfirmed speaker has no page yet.
export async function fetchPublicSpeakerBySlug(slug: string): Promise<PublicSpeaker | null> {
  const speakers = await fetchPublicSpeakers();
  return speakers.find((speaker) => speaker.slug === slug) ?? null;
}

// Where a slug that no longer matches anyone should send the visitor. Renaming a speaker in
// /admin/speakers records their old slug in previousSlugs, so a link shared before the
// rename still lands on their page. A live slug always wins over a remembered one, and only
// confirmed speakers are considered: a redirect must not reveal a page that does not exist.
export async function findCurrentSlugForPreviousSlug(previousSlug: string): Promise<string | null> {
  const speakers = await fetchPublicSpeakers();
  if (speakers.some((speaker) => speaker.slug === previousSlug)) return null;
  const owner = speakers.find((speaker) => speaker.previousSlugs.includes(previousSlug));
  return owner?.slug ?? null;
}
