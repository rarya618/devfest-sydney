import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { loadEvents } from '@/lib/events';
import { fetchVolunteerSignups } from '@/lib/volunteers';
import VolunteersDashboard from '../../VolunteersDashboard';

export const metadata = {
  title: 'Event volunteers',
  openGraph: { title: 'Event volunteers — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Event volunteers — GDG Sydney', images: [SITE_OG_IMAGE] },
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ event?: string }>;
}

// General events > Volunteers: the same review queue as DevFest's, for one general event at a
// time, chosen in the page (?event=<id>, so a view can be bookmarked). Signups arrive from the
// volunteer pool's invites. The acceptance email and /volunteer/confirm read the event (stage
// 4e), so they work here too; the roster and ticket marks live on DevFest > Crew only.
export default async function EventVolunteersPage({ searchParams }: Props) {
  const [, { event: requestedId }, events] = await Promise.all([getVerifiedSession(), searchParams, loadEvents()]);

  // Upcoming general events soonest first, then past ones most recent first.
  const now = Date.now();
  const generalEvents = events.filter((event) => event.type === 'general');
  const upcoming = generalEvents.filter((event) => Date.parse(event.endAt) >= now).sort((first, second) => first.startAt.localeCompare(second.startAt));
  const past = generalEvents.filter((event) => Date.parse(event.endAt) < now).sort((first, second) => second.startAt.localeCompare(first.startAt));
  const ordered = [...upcoming, ...past];

  const selected = ordered.find((event) => event.id === requestedId) ?? ordered[0] ?? null;
  const volunteers = selected ? await fetchVolunteerSignups(selected.id) : [];

  if (!selected) {
    return (
      <div className="px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-10">
        <h1 className="text-2xl font-bold text-off-white tracking-[-0.01em] mb-5">Volunteers</h1>
        <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-sm text-white/50">No general events yet. Create one in Events, then invite people from the Volunteer pool.</p>
        </div>
      </div>
    );
  }

  return (
    <VolunteersDashboard
      volunteers={volunteers}
      generalEvents={{ events: ordered.map((event) => ({ id: event.id, name: event.name })), selectedId: selected.id }}
    />
  );
}
