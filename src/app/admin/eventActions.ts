'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdminSession } from '@/lib/adminSession';
import { ADMIN_DEVFEST_COOKIE } from '@/lib/adminEvent';
import {
  EVENT_FLOW_KEYS,
  EVENT_FLOW_LABELS,
  EVENT_ID_MAX,
  EVENT_ID_PATTERN,
  EVENT_PRIVATE_LINK_KEYS,
  EVENT_PRIVATE_LINK_LABELS,
  EVENT_TYPES,
} from '@/lib/eventLabels';
import { isValidTimeZone, wallTimeToIso } from '@/lib/zonedTime';
import type { EventFlowKey, EventPrivateLinkKey, EventVenue, GdgEventType } from '@/lib/types';

// Create and edit events from /admin/events (stage 4a, PM.md). Every rule is checked here:
// the Admin SDK bypasses firestore.rules, and `events` has no rules block at all.
//
// Dates arrive as the wall-clock text an organiser typed ("2026-10-10T09:00") and are read in
// the event's own time zone, here on the server, which runs in UTC. Stored as Timestamps.

export interface EventFlowInput {
  enabled: boolean;
  open: boolean;
  closesAtWallTime: string; // '' for no deadline
}

// A private link is never sent to the browser, so the form can't round-trip it. It says
// what to do with each one instead: leave it, replace it, or remove it.
export type PrivateLinkChange = { action: 'keep' } | { action: 'clear' } | { action: 'set'; url: string };

export interface EventFormInput {
  id: string;
  type: GdgEventType;
  name: string;
  timeZone: string;
  startAtWallTime: string;
  endAtWallTime: string;
  venue: EventVenue | null;
  bevyUrl: string;
  humanitixUrl: string;
  ticketLowestPrice: string;
  ticketsOnSaleAtWallTime: string;
  flows: Record<EventFlowKey, EventFlowInput>;
  privateLinks: Record<EventPrivateLinkKey, PrivateLinkChange>;
}

const NAME_MAX = 120;
const VENUE_FIELD_MAX = 200;
const URL_MAX = 500;
const PRICE_PATTERN = /^\d{1,5}(\.\d{2})?$/;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function checkUrl(value: string, label: string): string | null {
  if (!value) return null;
  if (value.length > URL_MAX) return `${label} must be ${URL_MAX} characters or fewer.`;
  if (!isHttpsUrl(value)) return `${label} must be a full web address starting with https://.`;
  return null;
}

type ValidatedEvent = { error: string } | { eventData: Record<string, unknown>; privateLinkUpdates: Record<string, unknown> };

function validateEvent(input: EventFormInput): ValidatedEvent {
  const name = input.name.trim();
  if (!name) return { error: 'Give the event a name.' };
  if (name.length > NAME_MAX) return { error: `The name must be ${NAME_MAX} characters or fewer.` };
  if (!EVENT_TYPES.includes(input.type)) return { error: 'Choose what kind of event this is.' };

  const timeZone = input.timeZone.trim();
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return { error: 'The time zone must be a name like Australia/Sydney.' };
  }

  function toTimestamp(wallTime: string, label: string): { error: string } | { value: Timestamp | null } {
    if (!wallTime.trim()) return { value: null };
    const iso = wallTimeToIso(wallTime, timeZone);
    if (!iso) return { error: `${label} isn't a real time in ${timeZone}. Check the date, and avoid the hour skipped when daylight saving starts.` };
    return { value: Timestamp.fromDate(new Date(iso)) };
  }

  const startAt = toTimestamp(input.startAtWallTime, 'The start');
  if ('error' in startAt) return startAt;
  const endAt = toTimestamp(input.endAtWallTime, 'The end');
  if ('error' in endAt) return endAt;
  if (!startAt.value || !endAt.value) return { error: 'Give the event a start and an end.' };
  if (endAt.value.toMillis() <= startAt.value.toMillis()) return { error: 'The event has to end after it starts.' };

  let venue: EventVenue | null = null;
  if (input.venue) {
    const trimmedVenue: EventVenue = {
      name: input.venue.name.trim(),
      streetAddress: input.venue.streetAddress.trim(),
      locality: input.venue.locality.trim(),
      region: input.venue.region.trim(),
      postalCode: input.venue.postalCode.trim(),
      country: input.venue.country.trim().toUpperCase(),
    };
    if (!trimmedVenue.name) return { error: 'Give the venue a name, or untick "Has a venue".' };
    if (Object.values(trimmedVenue).some((value) => value.length > VENUE_FIELD_MAX)) {
      return { error: `Each venue line must be ${VENUE_FIELD_MAX} characters or fewer.` };
    }
    if (trimmedVenue.country && !/^[A-Z]{2}$/.test(trimmedVenue.country)) {
      return { error: 'The venue country must be a two-letter code, like AU.' };
    }
    venue = trimmedVenue;
  }

  const bevyUrl = input.bevyUrl.trim();
  const humanitixUrl = input.humanitixUrl.trim();
  const urlError = checkUrl(bevyUrl, 'The Bevy link') ?? checkUrl(humanitixUrl, 'The Humanitix link');
  if (urlError) return { error: urlError };

  const ticketLowestPrice = input.ticketLowestPrice.trim();
  if (ticketLowestPrice && !PRICE_PATTERN.test(ticketLowestPrice)) {
    return { error: 'The lowest ticket price must be a number like 40 or 40.00, without the dollar sign.' };
  }

  const ticketsOnSaleAt = toTimestamp(input.ticketsOnSaleAtWallTime, 'The ticket on-sale time');
  if ('error' in ticketsOnSaleAt) return ticketsOnSaleAt;
  if (ticketsOnSaleAt.value && !humanitixUrl) {
    return { error: 'Add the Humanitix link before setting when tickets go on sale.' };
  }

  const flows: Record<string, unknown> = {};
  for (const flowKey of EVENT_FLOW_KEYS) {
    const flow = input.flows[flowKey];
    const closesAt = toTimestamp(flow.closesAtWallTime, `The ${EVENT_FLOW_LABELS[flowKey]} deadline`);
    if ('error' in closesAt) return closesAt;
    // A flow the event doesn't have is stored switched off, so turning it back on later never
    // reopens a form by surprise.
    flows[flowKey] = flow.enabled
      ? { enabled: true, open: flow.open === true, closesAt: closesAt.value }
      : { enabled: false, open: false, closesAt: null };
  }

  const privateLinkUpdates: Record<string, unknown> = {};
  for (const linkKey of EVENT_PRIVATE_LINK_KEYS) {
    const change = input.privateLinks[linkKey];
    if (change.action === 'clear') privateLinkUpdates[linkKey] = FieldValue.delete();
    if (change.action === 'set') {
      const url = change.url.trim();
      if (!url) return { error: `Enter the ${EVENT_PRIVATE_LINK_LABELS[linkKey].toLowerCase()}, or leave it unchanged.` };
      const linkError = checkUrl(url, `The ${EVENT_PRIVATE_LINK_LABELS[linkKey].toLowerCase()}`);
      if (linkError) return { error: linkError };
      privateLinkUpdates[linkKey] = url;
    }
  }

  return {
    eventData: {
      type: input.type,
      name,
      timeZone,
      startAt: startAt.value,
      endAt: endAt.value,
      venue,
      bevyUrl,
      humanitixUrl,
      ticketLowestPrice,
      ticketsOnSaleAt: ticketsOnSaleAt.value,
      ...flows,
    },
    privateLinkUpdates,
  };
}

async function saveEvent(input: EventFormInput, mode: 'create' | 'update'): Promise<{ error?: string }> {
  let adminEmail: string;
  try {
    ({ email: adminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const eventId = input.id.trim();
  if (!EVENT_ID_PATTERN.test(eventId) || eventId.length > EVENT_ID_MAX) {
    return { error: 'The event id must be lower-case words and numbers joined by hyphens, like devfest-2027.' };
  }

  const validated = validateEvent(input);
  if ('error' in validated) return validated;

  const eventRef = adminDb.collection('events').doc(eventId);
  const privateRef = adminDb.collection('eventPrivate').doc(eventId);
  const stamp = { updatedAt: FieldValue.serverTimestamp(), updatedBy: adminEmail };

  try {
    await adminDb.runTransaction(async (transaction) => {
      const existing = await transaction.get(eventRef);
      if (mode === 'create' && existing.exists) throw new Error('event-exists');
      if (mode === 'update' && !existing.exists) throw new Error('event-missing');

      if (mode === 'create') {
        transaction.create(eventRef, { ...validated.eventData, ...stamp, createdAt: FieldValue.serverTimestamp() });
      } else {
        transaction.update(eventRef, { ...validated.eventData, ...stamp });
      }
      if (Object.keys(validated.privateLinkUpdates).length > 0) {
        transaction.set(privateRef, { ...validated.privateLinkUpdates, ...stamp }, { merge: true });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'event-exists') {
      return { error: `There is already an event with the id ${eventId}. Pick another.` };
    }
    if (error instanceof Error && error.message === 'event-missing') {
      return { error: 'This event no longer exists. Refresh the page.' };
    }
    console.error('Saving event failed:', eventId, error);
    return { error: 'Could not save this event. Please try again.' };
  }

  // The layout too: the sidebar's DevFest picker lists every DevFest.
  revalidatePath('/admin', 'layout');
  return {};
}

export async function createEvent(input: EventFormInput): Promise<{ error?: string }> {
  return saveEvent(input, 'create');
}

export async function updateEvent(input: EventFormInput): Promise<{ error?: string }> {
  return saveEvent(input, 'update');
}

// Which DevFest the form endpoints, confirm pages, ticket emails and /api/public/status
// follow. Changing it moves all of them at once, so it is its own deliberate action.
export async function setCurrentDevfest(eventId: string): Promise<{ error?: string }> {
  let adminEmail: string;
  try {
    ({ email: adminEmail } = await verifyAdminSession());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const snapshot = await adminDb.collection('events').doc(eventId).get();
    if (!snapshot.exists) return { error: 'This event no longer exists. Refresh the page.' };
    if (snapshot.data()?.type !== 'devfest') return { error: 'Only a DevFest can be the current DevFest.' };

    await adminDb.collection('settings').doc('site').set(
      { currentDevfestEventId: eventId, currentDevfestSetBy: adminEmail, currentDevfestSetAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error('Setting the current DevFest failed:', eventId, error);
    return { error: 'Could not make this the current DevFest. Please try again.' };
  }

  // The layout too: the sidebar's DevFest picker lists every DevFest.
  revalidatePath('/admin', 'layout');
  return {};
}

// The edition picker in the sidebar's DevFest heading. Per browser, not per admin: two
// organisers can look at different years at once.
export async function selectAdminDevfest(eventId: string): Promise<{ error?: string }> {
  try {
    await verifyAdminSession();
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  try {
    const snapshot = await adminDb.collection('events').doc(eventId).get();
    if (!snapshot.exists) return { error: 'This DevFest no longer exists. Refresh the page.' };
    if (snapshot.data()?.type !== 'devfest') return { error: 'Only a DevFest can be picked here.' };
  } catch {
    return { error: 'Could not switch to that DevFest. Please try again.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_DEVFEST_COOKIE, eventId, {
    path: '/admin',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/admin', 'layout');
  return {};
}
