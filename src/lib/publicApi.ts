import { NextResponse, type NextRequest } from 'next/server';
import { gdgSiteCorsHeaders } from '@/lib/gdgSiteOrigins';
import { loadCurrentDevfest, loadEvent } from '@/lib/events';
import { EVENT_ID_PATTERN } from '@/lib/eventLabels';

// The read-only public API under /api/public, stage 1 of the "One GDG Sydney Site" plan in
// PM.md. gdgsydney.com (static Astro) fetches it at build time, and /api/public/status from
// the browser as well. Every route returns only what this app's public pages already show:
// never an email, a submission id, or anything an organiser keeps to themselves.

// Never cached, here or at the CDN. A save in /admin is followed by a rebuild of the main
// site, and a rebuild that read a cached answer would publish the state from before the save.
const NO_STORE = { 'Cache-Control': 'no-store' };

export function publicJson(request: NextRequest, body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE, ...gdgSiteCorsHeaders(request.headers.get('origin'), 'GET') },
  });
}

// Runs a loader and answers with what it returns. A failed read is a 503, never an empty
// list: the build on the other side must fail and keep the pages it already has, rather
// than publish a lineup or schedule with nothing in it.
export async function respondWith(
  request: NextRequest,
  description: string,
  load: () => Promise<unknown>
): Promise<NextResponse> {
  try {
    return publicJson(request, await load());
  } catch (error) {
    console.error(`Public API read failed for ${description}:`, error);
    return publicJson(request, { message: `The ${description} couldn't be read. Please try again shortly.` }, 503);
  }
}

// Which event a public route is about: the one named in the path, or the current DevFest for
// the original routes (/api/public/speakers, /schedule), which answered for DevFest 2026
// before events existed and keep doing so for whichever DevFest is current. A response
// when the event can't be resolved, so the route can return it as it is.
export async function resolvePublicEvent(
  request: NextRequest,
  requestedEventId: string | null
): Promise<{ eventId: string } | { response: NextResponse }> {
  if (requestedEventId !== null && !EVENT_ID_PATTERN.test(requestedEventId)) {
    return { response: publicJson(request, { message: 'That is not an event id.' }, 400) };
  }
  try {
    const event = requestedEventId ? await loadEvent(requestedEventId) : await loadCurrentDevfest();
    if (!event) {
      return {
        response: publicJson(
          request,
          { message: requestedEventId ? 'There is no event with that id.' : 'No DevFest is set as current.' },
          404
        ),
      };
    }
    return { eventId: event.id };
  } catch (error) {
    console.error('Public API read failed for the event:', error);
    return { response: publicJson(request, { message: "The event couldn't be read. Please try again shortly." }, 503) };
  }
}
