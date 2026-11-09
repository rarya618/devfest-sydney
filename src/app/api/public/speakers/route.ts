import type { NextRequest } from 'next/server';
import { respondWith } from '@/lib/publicApi';
import { loadPublicSpeakers } from '@/lib/speakers';

export const dynamic = 'force-dynamic';

// The confirmed lineup, exactly as /speakers shows it: only speakers who have confirmed,
// each with their slug, the slugs they used to have (so old links can redirect), and the
// other presenters of their session.
export async function GET(request: NextRequest) {
  return respondWith(request, 'speaker lineup', async () => ({ speakers: await loadPublicSpeakers() }));
}
