import type { MeetupFormat, MeetupProposalStatus } from '@/lib/types';

// Browser-safe, so the admin dashboard and /api/submit-meetup-proposal share one list.

export const MEETUP_FORMATS: MeetupFormat[] = ['standard', 'workshop'];

// The wording the /speak form uses, quoted back in the confirmation email.
export const MEETUP_FORMAT_LABELS: Record<MeetupFormat, string> = {
  standard: 'Standard talk (20 to 30 min)',
  workshop: 'Workshop (60 to 90 min)',
};

// Shorter, for chips and filter tabs.
export const MEETUP_FORMAT_SHORT_LABELS: Record<MeetupFormat, string> = {
  standard: 'Talk',
  workshop: 'Workshop',
};

export const MEETUP_STATUS_LABELS: Record<MeetupProposalStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const MEETUP_STATUS_DOT_STYLES: Record<MeetupProposalStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/55', dot: 'bg-white/55' },
  archived: { text: 'text-white/50', dot: 'bg-white/50' },
};
