import type { NextRequest } from 'next/server';
import { resolvePublicEvent, respondWith } from '@/lib/publicApi';
import { loadPublicSpeakers } from '@/lib/speakers';

export const dynamic = 'force-dynamic';

// One event's confirmed lineup, the same shape as /api/public/speakers (stage 4b, PM.md).
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const resolved = await resolvePublicEvent(request, (await params).eventId);
  if ('response' in resolved) return resolved.response;
  return respondWith(request, 'speaker lineup', async () => ({ speakers: await loadPublicSpeakers(resolved.eventId) }));
}
