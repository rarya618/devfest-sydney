import { cache } from 'react';
import type { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { DEFAULT_EVENT_TIME_ZONE, EVENT_PRIVATE_LINK_KEYS, EVENT_TYPES } from '@/lib/eventLabels';
import type {
  EventFlowKey,
  EventFlowWindow,
  EventPrivateLinkKey,
  EventPrivateLinks,
  EventVenue,
  GdgEvent,
  GdgEventType,
} from '@/lib/types';

// The events model, stage 4a of the One GDG Sydney Site plan in PM.md. Two kinds of event:
// DevFest, and general events (meetups, workshops and the rest). Everything a DevFest
// used to read from env vars (whether each form is open and until when, when tickets go on
// sale, the ticket links) is read from Firestore instead, per request, so a deadline still
// passes with no deploy, and the next event is a document rather than a code change.
//
// Two shapes of read, as in speakers.ts and sponsors.ts: load* throws on a failed read, for
// callers that must not mistake "couldn't read" for "closed" or "unset"; the rest are pure
// functions of an event and a time.

const EMPTY_PRIVATE_LINKS: EventPrivateLinks = {
  speakerTicketUrl: '',
  showcaseTicketUrl: '',
  volunteerTicketUrl: '',
  volunteerWhatsappUrl: '',
};

function isoOrNull(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as Timestamp).toDate === 'function') return (value as Timestamp).toDate().toISOString();
  return null;
}

function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toFlowWindow(value: unknown): EventFlowWindow {
  const flow = (value ?? {}) as Record<string, unknown>;
  return {
    enabled: flow.enabled === true,
    open: flow.open === true,
    closesAt: isoOrNull(flow.closesAt),
  };
}

function toVenue(value: unknown): EventVenue | null {
  if (!value || typeof value !== 'object') return null;
  const venue = value as Record<string, unknown>;
  return {
    name: stringOrEmpty(venue.name),
    streetAddress: stringOrEmpty(venue.streetAddress),
    locality: stringOrEmpty(venue.locality),
    region: stringOrEmpty(venue.region),
    postalCode: stringOrEmpty(venue.postalCode),
    country: stringOrEmpty(venue.country),
  };
}

export function toGdgEvent(id: string, eventData: FirebaseFirestore.DocumentData): GdgEvent {
  return {
    id,
    type: EVENT_TYPES.includes(eventData.type) ? (eventData.type as GdgEventType) : 'general',
    name: stringOrEmpty(eventData.name),
    // Both are required on write; the fallback only stops a hand-edited document crashing a page.
    startAt: isoOrNull(eventData.startAt) ?? new Date(0).toISOString(),
    endAt: isoOrNull(eventData.endAt) ?? new Date(0).toISOString(),
    timeZone: stringOrEmpty(eventData.timeZone) || DEFAULT_EVENT_TIME_ZONE,
    venue: toVenue(eventData.venue),
    bevyUrl: stringOrEmpty(eventData.bevyUrl),
    humanitixUrl: stringOrEmpty(eventData.humanitixUrl),
    ticketLowestPrice: stringOrEmpty(eventData.ticketLowestPrice),
    ticketsOnSaleAt: isoOrNull(eventData.ticketsOnSaleAt),
    cfs: toFlowWindow(eventData.cfs),
    showcase: toFlowWindow(eventData.showcase),
    volunteers: toFlowWindow(eventData.volunteers),
    updatedAt: isoOrNull(eventData.updatedAt),
    updatedBy: stringOrEmpty(eventData.updatedBy),
  };
}

export async function loadEvent(eventId: string): Promise<GdgEvent | null> {
  const snapshot = await adminDb.collection('events').doc(eventId).get();
  return snapshot.exists ? toGdgEvent(snapshot.id, snapshot.data()!) : null;
}

// Every event, newest first, for /admin/events.
export async function loadEvents(): Promise<GdgEvent[]> {
  const snapshot = await adminDb.collection('events').orderBy('startAt', 'desc').get();
  return snapshot.docs.map((doc) => toGdgEvent(doc.id, doc.data()));
}

// Which DevFest the app is about, named on settings/site rather than guessed from dates, so
// the switch to next year's happens when an organiser says so.
export async function loadCurrentDevfestId(): Promise<string | null> {
  const settings = await adminDb.collection('settings').doc('site').get();
  const eventId = settings.data()?.currentDevfestEventId;
  return typeof eventId === 'string' && eventId ? eventId : null;
}

// Once per request: the form endpoints, the confirm pages and the status route can all ask
// without a second read. Null when no current DevFest is set, which reads as all closed.
export const loadCurrentDevfest = cache(async (): Promise<GdgEvent | null> => {
  const eventId = await loadCurrentDevfestId();
  return eventId ? loadEvent(eventId) : null;
});

export async function loadEventPrivateLinks(eventId: string): Promise<EventPrivateLinks> {
  const snapshot = await adminDb.collection('eventPrivate').doc(eventId).get();
  const linkData = snapshot.data() ?? {};
  const links = { ...EMPTY_PRIVATE_LINKS };
  for (const key of EVENT_PRIVATE_LINK_KEYS) links[key] = stringOrEmpty(linkData[key]).trim();
  return links;
}

// One private link of the current DevFest, or null when it is unset, there is no current
// DevFest, or the read fails. For the confirm pages, which treat null as "we'll email it to
// you" rather than showing a dead button; an admin send uses requireCurrentDevfestLink.
export async function fetchCurrentDevfestLink(key: EventPrivateLinkKey): Promise<string | null> {
  try {
    const event = await loadCurrentDevfest();
    if (!event) return null;
    return (await loadEventPrivateLinks(event.id))[key] || null;
  } catch (error) {
    console.error(`Could not read the current DevFest's ${key}:`, error);
    return null;
  }
}

// One private link of a given event, for an admin about to email it: says which of the
// three things went wrong, since each has a different fix (stage 4e: the event is the talk's
// own, not whichever DevFest is current).
export async function requireEventLink(
  eventId: string,
  key: EventPrivateLinkKey,
  label: string
): Promise<{ url: string } | { error: string }> {
  let event: GdgEvent | null;
  let links: EventPrivateLinks;
  try {
    event = eventId ? await loadEvent(eventId) : null;
    if (!event) return { error: 'This isn\'t filed under an event that still exists, so there is no link to send.' };
    links = await loadEventPrivateLinks(event.id);
  } catch {
    return { error: `We couldn't read the ${label.toLowerCase()} just now. Please try again in a moment.` };
  }
  const url = links[key];
  if (!url) return { error: `The ${label.toLowerCase()} isn't set on ${event.name} yet. Add it in Events first.` };
  return { url };
}

// One private link of a given event, or null when it is unset, the event is gone, or the
// read fails. For the confirm pages, which hand a person the links of the event they signed
// up for rather than whichever DevFest is current (stage 4e).
export async function fetchEventLink(eventId: string, key: EventPrivateLinkKey): Promise<string | null> {
  if (!eventId) return null;
  try {
    return (await loadEventPrivateLinks(eventId))[key] || null;
  } catch (error) {
    console.error(`Could not read ${key} for ${eventId}:`, error);
    return null;
  }
}

// The same, for an admin about to email the link: tells them which of the three things went
// wrong, since each has a different fix.
export async function requireCurrentDevfestLink(
  key: EventPrivateLinkKey,
  label: string
): Promise<{ url: string } | { error: string }> {
  let event: GdgEvent | null;
  let links: EventPrivateLinks;
  try {
    event = await loadCurrentDevfest();
    if (!event) return { error: 'No DevFest is set as current in Events, so there is no ticket link to send.' };
    links = await loadEventPrivateLinks(event.id);
  } catch {
    return { error: `We couldn't read the ${label.toLowerCase()} just now. Please try again in a moment.` };
  }
  const url = links[key];
  if (!url) return { error: `The ${label.toLowerCase()} isn't set on ${event.name} yet. Add it in Events first.` };
  return { url };
}

// Local development reads the same Firestore as production, so it can't open a form without
// opening it for real. DEV_OPEN_FLOWS=true in .env.local opens every enabled flow, in
// `next dev` only, the way the old *_OPEN=true values in .env.local did.
function isDevOverrideOn(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEV_OPEN_FLOWS === 'true';
}

// Whether an event is taking entries for one of its flows: it has the flow, an organiser has
// it switched on, and the deadline (if any) hasn't passed. Dates are validated on save, so an
// unparseable one can't reach here the way a mistyped env var once could.
// /admin/events passes honourDevOverride: false, so the admin shows what production does.
export function isFlowOpen(
  event: GdgEvent | null,
  flow: EventFlowKey,
  now: Date = new Date(),
  { honourDevOverride = true }: { honourDevOverride?: boolean } = {}
): boolean {
  if (!event) return false;
  const window = event[flow];
  if (!window.enabled) return false;
  if (honourDevOverride && isDevOverrideOn()) return true;
  if (!window.open) return false;
  if (!window.closesAt) return true;
  return now.getTime() < Date.parse(window.closesAt);
}

export function hasEventEnded(event: GdgEvent, now: Date = new Date()): boolean {
  return now.getTime() >= Date.parse(event.endAt);
}

// On sale from ticketsOnSaleAt until the event ends. The end is new: before 4a tickets were
// closed after the day by deleting TICKETS_ON_SALE_DATE (2026-11-10), which is a step someone
// has to remember. Without a ticket page there is nothing to sell, whatever the date says.
export function areTicketsOnSale(event: GdgEvent | null, now: Date = new Date()): boolean {
  if (!event || !event.humanitixUrl || !event.ticketsOnSaleAt) return false;
  if (hasEventEnded(event, now)) return false;
  return now.getTime() >= Date.parse(event.ticketsOnSaleAt);
}


// For the form endpoints: whether the current DevFest is taking entries for a flow, with a
// failed read kept apart from "closed", so a Firestore hiccup asks the person to try again
// rather than telling them the form has shut.
// When open, it also names the event, so the entry is filed under the event that took it.
export async function currentDevfestFlowState(
  flow: EventFlowKey
): Promise<{ state: 'open'; eventId: string } | { state: 'closed' | 'unreadable' }> {
  try {
    const event = await loadCurrentDevfest();
    return event && isFlowOpen(event, flow) ? { state: 'open', eventId: event.id } : { state: 'closed' };
  } catch (error) {
    console.error(`Could not read the current DevFest to check ${flow}:`, error);
    return { state: 'unreadable' };
  }
}
