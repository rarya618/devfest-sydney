import { cache } from 'react';
import { cookies } from 'next/headers';
import { loadCurrentDevfestId, loadEvents } from '@/lib/events';
import type { GdgEvent } from '@/lib/types';

// Which DevFest edition the admin's DevFest section shows (stage 4b, PM.md). The DevFest
// sections (Submissions, Speakers, Volunteers, Crew, Showcase, Speaker gifts, Credits,
// Feedback, Analytics) list only that edition's records, and anything an admin creates there
// (a proposal entered by hand, an organiser) is filed under it. Defaults to the current
// DevFest; the picker in the sidebar's DevFest heading looks at a past year, and is kept in a
// cookie so it survives moving between sections. General events don't use it.

export const ADMIN_DEVFEST_COOKIE = 'admin-devfest';

export interface AdminDevfestContext {
  devfests: GdgEvent[]; // newest first
  selectedDevfest: GdgEvent | null;
  currentDevfestId: string | null;
}

export const getAdminDevfestContext = cache(async (): Promise<AdminDevfestContext> => {
  const [events, currentDevfestId, cookieStore] = await Promise.all([loadEvents(), loadCurrentDevfestId(), cookies()]);
  const devfests = events.filter((event) => event.type === 'devfest');
  const chosenId = cookieStore.get(ADMIN_DEVFEST_COOKIE)?.value;
  const selectedDevfest =
    devfests.find((event) => event.id === chosenId) ??
    devfests.find((event) => event.id === currentDevfestId) ??
    devfests[0] ??
    null;
  return { devfests, selectedDevfest, currentDevfestId };
});

// The selected edition's id, for a DevFest page's fetch or an action's write. '' when no
// DevFest exists at all, which every fetcher reads as "nothing to show".
export async function getAdminDevfestId(): Promise<string> {
  return (await getAdminDevfestContext()).selectedDevfest?.id ?? '';
}
