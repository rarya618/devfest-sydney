import { adminDb } from '@/lib/firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';
import { fetchPublicSchedule, formatScheduleTime } from '@/lib/schedule';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import {
  FEEDBACK_ACTIVITIES,
  FEEDBACK_ASPECTS,
  FEEDBACK_RETURN_INTENTS,
  FEEDBACK_ROLES,
  FEEDBACK_TEXT_LIMIT,
  type FeedbackSessionOption,
} from '@/lib/feedbackLabels';
import type {
  FeedbackActivity,
  FeedbackAspect,
  FeedbackResponse,
  FeedbackReturnIntent,
  FeedbackRole,
  PublicScheduleSlot,
} from '@/lib/types';

export type FeedbackFields = Omit<FeedbackResponse, 'id' | 'submittedAt'>;

// ---------------------------------------------------------------------------------------
// The favourite-session choices: every talk or workshop with a confirmed speaker, in
// start order. A keynote counts, since it is a talk people will want to name.
// ---------------------------------------------------------------------------------------

function sessionTitleOf(slot: PublicScheduleSlot): string {
  return slot.kind === 'plenary' ? slot.talkTitle ?? slot.title : slot.title;
}

export async function fetchFeedbackSessionOptions(): Promise<FeedbackSessionOption[]> {
  const schedule = await fetchPublicSchedule();
  return schedule
    .filter((slot) => slot.speakers.length > 0 && (slot.kind === 'session' || slot.talkTitle))
    .map((slot) => ({
      id: slot.id,
      label: `${formatScheduleTime(slot.startTime)} · ${sessionTitleOf(slot)} · ${slot.speakers.map((speaker) => speaker.name).join(', ')}`,
    }));
}

// ---------------------------------------------------------------------------------------
// Validation, for /api/submit-feedback. The Admin SDK bypasses firestore.rules, so this is
// the only check there is.
// ---------------------------------------------------------------------------------------

function wholeNumberBetween(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function optionalText(value: unknown, label: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > FEEDBACK_TEXT_LIMIT) throw new Error(`${label} must be ${FEEDBACK_TEXT_LIMIT} characters or fewer.`);
  return text;
}

export async function validateFeedback(body: unknown): Promise<FeedbackFields> {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body.');
  const input = body as Record<string, unknown>;

  const overallRating = wholeNumberBetween(input.overallRating, 1, 5);
  if (overallRating === null) throw new Error('Please rate the day overall.');
  const recommendScore = wholeNumberBetween(input.recommendScore, 0, 10);
  if (recommendScore === null) throw new Error('Please say how likely you are to recommend DevFest.');

  const aspectRatings: Partial<Record<FeedbackAspect, number>> = {};
  const rawAspects = input.aspectRatings && typeof input.aspectRatings === 'object' ? (input.aspectRatings as Record<string, unknown>) : {};
  for (const aspect of FEEDBACK_ASPECTS) {
    const rating = wholeNumberBetween(rawAspects[aspect], 1, 5);
    if (rating !== null) aspectRatings[aspect] = rating;
  }

  const activities = Array.isArray(input.activities)
    ? FEEDBACK_ACTIVITIES.filter((activity) => (input.activities as unknown[]).includes(activity))
    : [];

  // The title is looked up here rather than trusted from the form, so a response can only
  // name a session that is actually on the schedule.
  let favouriteSessionId = '';
  let favouriteSessionTitle = '';
  if (typeof input.favouriteSessionId === 'string' && input.favouriteSessionId) {
    const match = (await fetchFeedbackSessionOptions()).find((option) => option.id === input.favouriteSessionId);
    if (!match) throw new Error('That session is no longer on the schedule. Please pick another.');
    favouriteSessionId = match.id;
    favouriteSessionTitle = match.label;
  }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (email && !EMAIL_PATTERN.test(email)) throw new Error('That email address doesn\'t look right. Leave it blank to stay anonymous.');

  return {
    overallRating,
    recommendScore,
    aspectRatings,
    activities: activities as FeedbackActivity[],
    favouriteSessionId,
    favouriteSessionTitle,
    enjoyedMost: optionalText(input.enjoyedMost, 'What you enjoyed most'),
    improve: optionalText(input.improve, 'What we could improve'),
    topicsNextYear: optionalText(input.topicsNextYear, 'Topics for next year'),
    role: FEEDBACK_ROLES.includes(input.role as FeedbackRole) ? (input.role as FeedbackRole) : '',
    isFirstDevFest: typeof input.isFirstDevFest === 'boolean' ? input.isFirstDevFest : null,
    returnIntent: FEEDBACK_RETURN_INTENTS.includes(input.returnIntent as FeedbackReturnIntent)
      ? (input.returnIntent as FeedbackReturnIntent)
      : '',
    email,
  };
}

// ---------------------------------------------------------------------------------------
// Reads, for /admin/feedback.
// ---------------------------------------------------------------------------------------

function toFeedbackResponse(id: string, data: FirebaseFirestore.DocumentData): FeedbackResponse {
  const submittedAt = data.submittedAt as Timestamp | undefined;
  return {
    id,
    overallRating: data.overallRating ?? 0,
    recommendScore: data.recommendScore ?? 0,
    aspectRatings: data.aspectRatings ?? {},
    activities: data.activities ?? [],
    favouriteSessionId: data.favouriteSessionId ?? '',
    favouriteSessionTitle: data.favouriteSessionTitle ?? '',
    enjoyedMost: data.enjoyedMost ?? '',
    improve: data.improve ?? '',
    topicsNextYear: data.topicsNextYear ?? '',
    role: data.role ?? '',
    isFirstDevFest: typeof data.isFirstDevFest === 'boolean' ? data.isFirstDevFest : null,
    returnIntent: data.returnIntent ?? '',
    email: data.email ?? '',
    submittedAt: submittedAt ? submittedAt.toDate().toISOString() : new Date().toISOString(),
  };
}

export async function fetchFeedbackResponses(): Promise<FeedbackResponse[]> {
  const snapshot = await adminDb.collection('feedback').orderBy('submittedAt', 'desc').get();
  return snapshot.docs.map((doc) => toFeedbackResponse(doc.id, doc.data()));
}
