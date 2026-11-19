import { getVerifiedSession } from '@/lib/adminSession';
import { fetchMeetupProposals } from '@/lib/meetupProposals';
import { hasEventEnded, loadEvents } from '@/lib/events';
import MeetupProposalsDashboard from '../../MeetupProposalsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meetup talks',
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function MeetupProposalsPage({ searchParams }: Props) {
  const [, proposals, events, { status }] = await Promise.all([getVerifiedSession(), fetchMeetupProposals(), loadEvents(), searchParams]);

  // What a proposal can be accepted into (stage 4f): general events that haven't ended, soonest
  // first. Every event's name, for the chip on an accepted card.
  const now = new Date();
  const upcomingGeneral = events
    .filter((event) => event.type === 'general' && !hasEventEnded(event, now))
    .sort((first, second) => first.startAt.localeCompare(second.startAt))
    .map((event) => ({ id: event.id, name: event.name }));
  const eventNames = Object.fromEntries(events.map((event) => [event.id, event.name]));

  return <MeetupProposalsDashboard proposals={proposals} events={upcomingGeneral} eventNames={eventNames} initialStatus={status === 'pending' ? 'pending' : undefined} />;
}
