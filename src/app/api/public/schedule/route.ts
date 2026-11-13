import type { NextRequest } from 'next/server';
import { resolvePublicEvent, respondWith } from '@/lib/publicApi';
import { loadPublicSchedule } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

// The current DevFest's day in start order. A session takes its title and speakers from a
// confirmed speaker only; until then it keeps its placeholder title. Any event's schedule is
// at /api/public/events/<id>/schedule.
export async function GET(request: NextRequest) {
  const resolved = await resolvePublicEvent(request, null);
  if ('response' in resolved) return resolved.response;
  return respondWith(request, 'schedule', async () => ({ slots: await loadPublicSchedule(resolved.eventId) }));
}
