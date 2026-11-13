import type { NextRequest } from 'next/server';
import { publicJson } from '@/lib/publicApi';
import { areTicketsOnSale, isFlowOpen, loadCurrentDevfest, loadEvent } from '@/lib/events';
import { EVENT_ID_PATTERN } from '@/lib/eventLabels';
import { isBuildersSpaceRevealed } from '@/lib/buildersSpace';
import type { GdgEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

// The states that flip on a date or a switch rather than on a save: whether tickets are on
// sale and whether each form is taking entries. Worked out per request from the event's
// document (stage 4a, PM.md), by the same helpers the form endpoints use, so the two can
// never disagree. A static page can't freeze these at build time (the caching problem of
// 2026-08-30), so gdgsydney.com either asks here from the browser or rebuilds at each
// deadline: the open decision in PM.md. Allowed cross-origin from the GDG Sydney site.
//
// ?event=<id> asks about one event; without it, the current DevFest, which is what this route
// answered before events existed, so nothing already calling it changes.
export async function GET(request: NextRequest) {
  const requestedEventId = request.nextUrl.searchParams.get('event');
  if (requestedEventId !== null && !EVENT_ID_PATTERN.test(requestedEventId)) {
    return publicJson(request, { message: 'That is not an event id.' }, 400);
  }

  let event: GdgEvent | null;
  try {
    event = requestedEventId ? await loadEvent(requestedEventId) : await loadCurrentDevfest();
  } catch (error) {
    console.error('Public API read failed for event status:', error);
    return publicJson(request, { message: "The event status couldn't be read. Please try again shortly." }, 503);
  }
  if (requestedEventId && !event) {
    return publicJson(request, { message: 'There is no event with that id.' }, 404);
  }

  const now = new Date();
  return publicJson(request, {
    checkedAt: now.toISOString(),
    event: event
      ? { id: event.id, type: event.type, name: event.name, startAt: event.startAt, endAt: event.endAt }
      : null,
    tickets: {
      onSale: areTicketsOnSale(event, now),
      url: event?.humanitixUrl || null,
      onSaleFrom: event?.ticketsOnSaleAt ?? null,
    },
    callForSpeakers: { open: isFlowOpen(event, 'cfs', now), closesAt: event?.cfs.closesAt ?? null },
    builderShowcase: { open: isFlowOpen(event, 'showcase', now), closesAt: event?.showcase.closesAt ?? null },
    volunteering: { open: isFlowOpen(event, 'volunteers', now), closesAt: event?.volunteers.closesAt ?? null },
    // DevFest 2026 only, and a fixed date: it never became an event setting.
    buildersSpace: { revealed: isBuildersSpaceRevealed() },
  });
}
