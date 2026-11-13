import { cache } from 'react';
import { cookies } from 'next/headers';
import { loadCurrentDevfestId, loadEvents } from '@/lib/events';
import type { GdgEvent } from '@/lib/types';

// Which event the admin is looking at (stage 4b, PM.md). Kept in a cookie so it survives
// moving between sections, and defaulting to the current DevFest. The event-shaped sections
// (Submissions, Showcase, Volunteers, Crew, Speakers, Speaker gifts, Analytics, Feedback)
// list only its records, and anything an admin creates there (a proposal entered by hand, an
// organiser) is filed under it.

export const ADMIN_EVENT_COOKIE = 'admin-event';

export interface AdminEventContext {
  events: GdgEvent[];
  selectedEvent: GdgEvent | null;
}

export const getAdminEventContext = cache(async (): Promise<AdminEventContext> => {
  const [events, currentDevfestId, cookieStore] = await Promise.all([loadEvents(), loadCurrentDevfestId(), cookies()]);
  const chosenId = cookieStore.get(ADMIN_EVENT_COOKIE)?.value;
  const selectedEvent =
    events.find((event) => event.id === chosenId) ??
    events.find((event) => event.id === currentDevfestId) ??
    events[0] ??
    null;
  return { events, selectedEvent };
});

// The selected event's id, for a page's fetch or an action's write. '' when there are no
// events at all, which every fetcher reads as "nothing to show".
export async function getAdminEventId(): Promise<string> {
  return (await getAdminEventContext()).selectedEvent?.id ?? '';
}
