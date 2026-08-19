import type { VolunteerArea, VolunteerStatus } from '@/lib/types';

export const VOLUNTEER_STATUS_DOT_STYLES: Record<VolunteerStatus, { text: string; dot: string }> = {
  pending: { text: 'text-google-yellow', dot: 'bg-google-yellow' },
  accepted: { text: 'text-google-green', dot: 'bg-google-green' },
  rejected: { text: 'text-white/40', dot: 'bg-white/40' },
  archived: { text: 'text-white/30', dot: 'bg-white/30' },
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
  'general-floater': 'General floater',
  'setup-packdown': 'Setup / Pack-down',
  photography: 'Photography',
  'social-media': 'Social media',
  'merch-table': 'Merch table',
};
