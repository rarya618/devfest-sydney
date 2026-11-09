import type { NextRequest } from 'next/server';
import { respondWith } from '@/lib/publicApi';
import { loadPublicSchedule } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

// The day in start order, exactly as /schedule shows it. A session takes its title and
// speakers from a confirmed speaker only; until then it keeps its placeholder title.
export async function GET(request: NextRequest) {
  return respondWith(request, 'schedule', async () => ({ slots: await loadPublicSchedule() }));
}
