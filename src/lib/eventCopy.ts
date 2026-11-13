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
