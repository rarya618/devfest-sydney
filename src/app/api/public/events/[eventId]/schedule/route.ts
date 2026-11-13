import type { NextRequest } from 'next/server';
import { resolvePublicEvent, respondWith } from '@/lib/publicApi';
import { loadPublicSchedule } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

// One event's schedule, the same shape as /api/public/schedule (stage 4b, PM.md).
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const resolved = await resolvePublicEvent(request, (await params).eventId);
  if ('response' in resolved) return resolved.response;
  return respondWith(request, 'schedule', async () => ({ slots: await loadPublicSchedule(resolved.eventId) }));
}
