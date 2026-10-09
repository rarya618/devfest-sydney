import type { FeedbackActivity, FeedbackAspect, FeedbackReturnIntent, FeedbackRole } from '@/lib/types';

// Browser-safe: no Admin SDK, so the survey form and the admin results page can both import it.

export const FEEDBACK_ASPECT_LABELS: Record<FeedbackAspect, string> = {
  talks: 'Talks',
  workshops: 'Workshops',
  venue: 'Venue',
  food: 'Food and drinks',
  organisation: 'Organisation and timing',
  networking: 'Meeting people',
};

export const FEEDBACK_ACTIVITY_LABELS: Record<FeedbackActivity, string> = {
  keynotes: 'Keynotes',
  spotlight: 'Spotlight talks',
  developer: 'Developer track',
  builder: 'Builder track',
  workshops: 'Workshops',
  showcase: 'Builder Showcase',
  'builders-space': "Builder's Space",
  'job-board': 'Job board',
};

export const FEEDBACK_ROLE_LABELS: Record<FeedbackRole, string> = {
  developer: 'Developer or engineer',
  builder: 'Product, design or founder',
  student: 'Student',
  other: 'Something else',
};

export const FEEDBACK_RETURN_LABELS: Record<FeedbackReturnIntent, string> = {
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
};

export const FEEDBACK_ASPECTS = Object.keys(FEEDBACK_ASPECT_LABELS) as FeedbackAspect[];
export const FEEDBACK_ACTIVITIES = Object.keys(FEEDBACK_ACTIVITY_LABELS) as FeedbackActivity[];
export const FEEDBACK_ROLES = Object.keys(FEEDBACK_ROLE_LABELS) as FeedbackRole[];
export const FEEDBACK_RETURN_INTENTS = Object.keys(FEEDBACK_RETURN_LABELS) as FeedbackReturnIntent[];

// Shared by the form and the API route, so a limit can't drift between the client check
// and the server one.
export const FEEDBACK_TEXT_LIMIT = 1500;

// One option in the "favourite session" select: a talk or workshop with a confirmed speaker.
export interface FeedbackSessionOption {
  id: string;
  label: string;
}
