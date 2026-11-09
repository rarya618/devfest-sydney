import type { NextRequest } from 'next/server';
import { publicJson } from '@/lib/publicApi';
import { areTicketsOpen, TICKETS_URL } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { isShowcaseOpen } from '@/lib/showcase';
import { isVolunteerOpen } from '@/lib/volunteer';
import { isBuildersSpaceRevealed } from '@/lib/buildersSpace';

export const dynamic = 'force-dynamic';

// The states that flip on a date or a switch rather than on a save: whether tickets are on
// sale, whether each form is taking entries, whether the Builder's Space is revealed. Worked
// out per request by the same helpers this app's pages use, so the two can never disagree.
// A static page can't freeze these at build time (the caching problem of 2026-08-30), so
// gdgsydney.com either asks here from the browser or rebuilds at each deadline: the open
// decision in PM.md. Allowed cross-origin from the GDG Sydney site for the first case.
// The form endpoints enforce the same checks themselves, so a stale answer here can only
// ever show a button that leads to a polite "this has closed".
function dateOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function GET(request: NextRequest) {
  const now = new Date();
  return publicJson(request, {
    checkedAt: now.toISOString(),
    tickets: {
      onSale: areTicketsOpen(now),
      url: TICKETS_URL || null,
      onSaleFrom: dateOrNull(process.env.TICKETS_ON_SALE_DATE),
    },
    callForSpeakers: { open: isCfsOpen(now), closesAt: dateOrNull(process.env.CFS_CLOSE_DATE) },
    builderShowcase: { open: isShowcaseOpen(now), closesAt: dateOrNull(process.env.SHOWCASE_CLOSE_DATE) },
    volunteering: { open: isVolunteerOpen() },
    buildersSpace: { revealed: isBuildersSpaceRevealed() },
  });
}
