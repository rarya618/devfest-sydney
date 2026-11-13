import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { areTicketsOnSale, isFlowOpen, loadCurrentDevfestId, loadEventPrivateLinks, loadEvents } from '@/lib/events';
import { EVENT_FLOW_KEYS, EVENT_PRIVATE_LINK_KEYS } from '@/lib/eventLabels';
import type { EventFlowKey, EventPrivateLinkKey } from '@/lib/types';
import EventsDashboard, { type AdminEventSummary } from '../../EventsDashboard';

export const metadata = {
  title: 'Events',
  openGraph: { title: 'Events — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Events — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const [, events, currentDevfestId] = await Promise.all([getVerifiedSession(), loadEvents(), loadCurrentDevfestId()]);

  // Only whether each private link is set reaches the browser, never the link itself.
  const privateLinks = await Promise.all(events.map((event) => loadEventPrivateLinks(event.id)));

  const now = new Date();
  const summaries: AdminEventSummary[] = events.map((event, index) => ({
    event,
    isCurrentDevfest: event.id === currentDevfestId,
    // What production does right now: the local DEV_OPEN_FLOWS override is ignored here.
    flowOpenNow: Object.fromEntries(
      EVENT_FLOW_KEYS.map((flowKey) => [flowKey, isFlowOpen(event, flowKey, now, { honourDevOverride: false })])
    ) as Record<EventFlowKey, boolean>,
    ticketsOnSaleNow: areTicketsOnSale(event, now),
    privateLinksSet: Object.fromEntries(
      EVENT_PRIVATE_LINK_KEYS.map((linkKey) => [linkKey, Boolean(privateLinks[index][linkKey])])
    ) as Record<EventPrivateLinkKey, boolean>,
  }));

  return <EventsDashboard summaries={summaries} hasCurrentDevfest={Boolean(currentDevfestId)} />;
}
