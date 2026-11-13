import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { fetchMeetupProposals } from '@/lib/meetupProposals';
import { hasEventEnded, loadEvents } from '@/lib/events';
import MeetupProposalsDashboard from '../../MeetupProposalsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meetup talks',
  openGraph: { title: 'Meetup talks — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Meetup talks — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export default async function MeetupProposalsPage() {
  const [, proposals, events] = await Promise.all([getVerifiedSession(), fetchMeetupProposals(), loadEvents()]);

  // What a proposal can be accepted into (stage 4f): general events that haven't ended, soonest
  // first. Every event's name, for the chip on an accepted card.
  const now = new Date();
  const upcomingGeneral = events
    .filter((event) => event.type === 'general' && !hasEventEnded(event, now))
    .sort((first, second) => first.startAt.localeCompare(second.startAt))
    .map((event) => ({ id: event.id, name: event.name }));
  const eventNames = Object.fromEntries(events.map((event) => [event.id, event.name]));

  return <MeetupProposalsDashboard proposals={proposals} events={upcomingGeneral} eventNames={eventNames} />;
}
