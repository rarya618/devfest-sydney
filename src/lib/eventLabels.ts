import type { EventFlowKey, EventPrivateLinkKey, GdgEventType } from '@/lib/types';

// Browser-safe labels for the events model, shared by /admin/events and the server.

export const EVENT_TYPES: GdgEventType[] = ['devfest', 'general'];

export const EVENT_TYPE_LABELS: Record<GdgEventType, string> = {
  devfest: 'DevFest',
  general: 'General event',
};

export const EVENT_FLOW_KEYS: EventFlowKey[] = ['cfs', 'showcase', 'volunteers'];

export const EVENT_FLOW_LABELS: Record<EventFlowKey, string> = {
  cfs: 'Call for Speakers',
  showcase: 'Builder Showcase',
  volunteers: 'Volunteer signups',
};

export const EVENT_PRIVATE_LINK_KEYS: EventPrivateLinkKey[] = [
  'speakerTicketUrl',
  'showcaseTicketUrl',
  'volunteerTicketUrl',
  'volunteerWhatsappUrl',
];

export const EVENT_PRIVATE_LINK_LABELS: Record<EventPrivateLinkKey, string> = {
  speakerTicketUrl: 'Speaker ticket link',
  showcaseTicketUrl: 'Builder Showcase ticket link',
  volunteerTicketUrl: 'Volunteer ticket link',
  volunteerWhatsappUrl: 'Volunteer WhatsApp invite',
};

export const EVENT_PRIVATE_LINK_HINTS: Record<EventPrivateLinkKey, string> = {
  speakerTicketUrl: 'The Humanitix link with the speaker access code. Emailed to confirmed speakers and shown on /speaker/confirm.',
  showcaseTicketUrl: 'The Humanitix link with the showcase access code. Shown on /builder-showcase/confirm and emailed from /admin/devfest/showcase.',
  volunteerTicketUrl: 'The Humanitix link with the volunteer access code. Shown on /volunteer/confirm.',
  volunteerWhatsappUrl: 'The group invite, shown on /volunteer/confirm. Anyone holding it can join.',
};

// Event ids are readable and permanent, since documents in other collections will point at
// them (stage 4b): lower-case words and digits joined by single hyphens.
export const EVENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const EVENT_ID_MAX = 60;

export const DEFAULT_EVENT_TIME_ZONE = 'Australia/Sydney';
