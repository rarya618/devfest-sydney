import type { GdgOnCampusChapter, VolunteerArea, VolunteerConfirmation, VolunteerShift, VolunteerStatus } from '@/lib/types';

export const VOLUNTEER_STATUS_DOT_STYLES: Record<VolunteerStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/55', dot: 'bg-white/55' },
  archived: { text: 'text-white/50', dot: 'bg-white/50' },
};

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const VOLUNTEER_AREA_LABELS: Record<VolunteerArea, string> = {
  registration: 'Registration',
  'av-tech': 'AV / Tech',
  'speaker-support': 'Speaker support',
  'workshop-facilitator': 'Workshop facilitator',
  mc: 'MC',
  'general-floater': 'General floater',
  'setup-packdown': 'Setup / Pack-down',
  photography: 'Photography',
  'social-media': 'Social media',
  'merch-table': 'Merch table',
};

export const GDG_ON_CAMPUS_CHAPTERS: { value: Exclude<GdgOnCampusChapter, ''>; label: string }[] = [
  { value: 'usyd', label: 'USYD' },
  { value: 'uts', label: 'UTS' },
  { value: 'other', label: 'Other' },
];

export const GDG_ON_CAMPUS_CHAPTER_LABELS: Record<Exclude<GdgOnCampusChapter, ''>, string> = {
  usyd: 'USYD',
  uts: 'UTS',
  other: 'Other chapter',
};

// The shift a crew member is rostered for. The empty option is a real state, not a
// placeholder: most of the roster is unassigned until the week before the event.
export const VOLUNTEER_SHIFT_LABELS: Record<VolunteerShift, string> = {
  '': 'No shift yet',
  'full-day': 'Full day',
  morning: 'Morning',
  afternoon: 'Afternoon',
};

// The three stages of telling an accepted volunteer and hearing back. Shared by the
// chips on /admin/volunteers and /admin/crew so the two can't describe them differently.
export const VOLUNTEER_CONFIRMATION_CHIPS: Record<VolunteerConfirmation, { label: string; className: string; title: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-google-green/15 text-google-green',
    title: 'The volunteer has confirmed they are coming.',
  },
  awaiting: {
    label: 'Awaiting confirmation',
    className: 'bg-white/10 text-white/60',
    title: 'The acceptance email has been sent but the volunteer has not confirmed yet.',
  },
  'not-emailed': {
    label: 'Not emailed',
    className: 'bg-google-yellow/15 text-google-yellow',
    title: 'This volunteer has not been told yet. Send the acceptance email with the envelope button.',
  },
};
