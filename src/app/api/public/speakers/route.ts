import type { NextRequest } from 'next/server';
import { resolvePublicEvent, respondWith } from '@/lib/publicApi';
import { loadPublicSpeakers } from '@/lib/speakers';

export const dynamic = 'force-dynamic';

// The current DevFest's confirmed lineup: only speakers who have confirmed, each with their
// slug, the slugs they used to have (so old links can redirect), and the other presenters of
// their session. Any event's lineup is at /api/public/events/<id>/speakers.
export async function GET(request: NextRequest) {
  const resolved = await resolvePublicEvent(request, null);
  if ('response' in resolved) return resolved.response;
  return respondWith(request, 'speaker lineup', async () => ({ speakers: await loadPublicSpeakers(resolved.eventId) }));
}
