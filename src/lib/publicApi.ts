import { NextResponse, type NextRequest } from 'next/server';
import { gdgSiteCorsHeaders } from '@/lib/gdgSiteOrigins';

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
