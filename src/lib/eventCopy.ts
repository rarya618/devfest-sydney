import type { GdgEvent } from '@/lib/types';

// Stage 4e of the plan in PM.md: the wording people receive reads the event's name, date and
// venue from its document instead of "DevFest Sydney 2026", "Saturday 10 October" and
// "Torrens University" written into each template. Browser-safe, so emails, server pages
// and client components all phrase an event the same way.

export type EventCopy = Pick<GdgEvent, 'name' | 'type' | 'startAt' | 'timeZone' | 'venue'>;

// "Saturday 10 October", in the event's own time zone.
export function formatEventDay(event: EventCopy): string {
  return new Date(event.startAt).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: event.timeZone,
  });
}

// "Saturday 10 October at Torrens University, Surry Hills", or just the day when the event
// has no venue yet.
export function formatEventWhen(event: EventCopy): string {
  const day = formatEventDay(event);
  return event.venue?.name ? `${day} at ${event.venue.name}` : day;
}

export function isDevfest(event: EventCopy): boolean {
  return event.type === 'devfest';
}

// The fields an email or page needs, picked off a full event so a client component is only
// handed what it shows.
export function toEventCopy(event: GdgEvent): EventCopy {
  return { name: event.name, type: event.type, startAt: event.startAt, timeZone: event.timeZone, venue: event.venue };
}

// "Torrens University, Shop 1/37 Foveaux St, Surry Hills NSW 2010": the venue on one line,
// for a calendar invite's location and an email's "where". '' when the event has no venue.
export function formatVenueAddress(event: EventCopy): string {
  const venue = event.venue;
  if (!venue) return '';
  const area = [venue.locality, venue.region, venue.postalCode].filter(Boolean).join(' ');
  // A name that ends in the suburb ("Torrens University, Surry Hills") would say it twice.
  const suffix = venue.locality ? `, ${venue.locality}` : '';
  const name = suffix && area && venue.name.endsWith(suffix) ? venue.name.slice(0, -suffix.length) : venue.name;
  return [name, venue.streetAddress, area].filter(Boolean).join(', ');
}

// "Friday 9 October": the day before the event starts, in its own time zone, for the speaker
// dinner a DevFest holds the evening before.
export function formatEveningBefore(event: EventCopy): string {
  const dayBefore = new Date(Date.parse(event.startAt) - 24 * 60 * 60 * 1000).toISOString();
  return formatEventDay({ ...event, startAt: dayBefore });
}

// Where an event's schedule is published, for links in speaker emails: a DevFest's on the
// main site's DevFest page (gdgsydney.com/devfest, stage 2 of the plan), a general event's on
// its Bevy listing. Null when there's nowhere to send them.
export function eventScheduleUrl(event: Pick<GdgEvent, 'type' | 'bevyUrl'>): string | null {
  if (event.type === 'devfest') return 'https://gdgsydney.com/devfest';
  return event.bevyUrl || null;
}

// The logo at the top of an email: the DevFest wordmark for a DevFest, the GDG Sydney logo for
// anything else (a general event, or the volunteer pool, which belongs to all of GDG Sydney).
// The GDG logo is the dark-background one the main site serves from its public folder.
const DEVFEST_WORDMARK = {
  url: 'https://storage.googleapis.com/devfest-sydney-2026.firebasestorage.app/site-assets/logo-wordmark.png',
  alt: 'DevFest Sydney',
  aspectRatio: 1331 / 240,
};
const GDG_SYDNEY_LOGO = {
  url: 'https://gdgsydney.com/gdg-logo-dark.png',
  alt: 'GDG Sydney',
  aspectRatio: 1700 / 215,
};

export function emailLogoTag(eventType: GdgEvent['type'] | null, width: number, style: string): string {
  const logo = eventType === 'devfest' ? DEVFEST_WORDMARK : GDG_SYDNEY_LOGO;
  const height = Math.round(width / logo.aspectRatio);
  return `<img src="${logo.url}" alt="${logo.alt}" width="${width}" height="${height}" style="${style}" />`;
}
