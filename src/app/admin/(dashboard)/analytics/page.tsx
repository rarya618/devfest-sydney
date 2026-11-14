import Link from 'next/link';
import { SITE_OG_IMAGE } from '@/lib/metadata';
import { getVerifiedSession } from '@/lib/adminSession';
import { loadGdgAnalytics, type EventAnalyticsRow, type GdgAnalytics } from '@/lib/gdgAnalytics';
import StickyAdminHeader from '../../StickyAdminHeader';
import SubmissionsOverTimeChart from '../../SubmissionsOverTimeChart';
import { BarRow, BreakdownCard, EmptyState, StatTile, StatusTiles } from '../../analyticsShared';

// GDG Sydney across every event (added 2026-11-14). One DevFest's forms in detail are on
// /admin/devfest/analytics. The numbers come from src/lib/gdgAnalytics.ts.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics',
  openGraph: { title: 'Analytics — GDG Sydney', images: [SITE_OG_IMAGE] },
  twitter: { card: 'summary_large_image', title: 'Analytics — GDG Sydney', images: [SITE_OG_IMAGE] },
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' });
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-lg font-bold text-off-white mb-4">{children}</h2>;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-white/55">{children}</span>;
}

function EventsTable({ events }: { events: EventAnalyticsRow[] }) {
  if (events.length === 0) return <EmptyState message="No events yet." />;
  const cell = 'px-4 py-3 align-top';
  return (
    <div className="bg-surface border border-white/10 rounded-2xl overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm text-white/80">
        <caption className="sr-only">Every GDG Sydney event, newest first, with its talks, speakers, proposals and volunteers</caption>
        <thead>
          <tr className="text-left text-xs font-semibold text-white/55 border-b border-white/10">
            <th scope="col" className={cell}>Event</th>
            <th scope="col" className={cell}>Talks</th>
            <th scope="col" className={cell}>Speakers</th>
            <th scope="col" className={cell}>Proposals</th>
            <th scope="col" className={cell}>Volunteers</th>
            <th scope="col" className={cell}>Organisers</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.eventId} className="border-b border-white/[0.06] last:border-b-0">
              <th scope="row" className={`${cell} text-left font-normal`}>
                <span className="block font-bold text-white">{event.name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                  <span className="font-mono">{formatEventDate(event.startAt)}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${event.type === 'devfest' ? 'bg-google-blue/15 text-google-blue-light' : 'bg-google-green/15 text-google-green'}`}>
                    {event.type === 'devfest' ? 'DevFest' : 'Meetup'}
                  </span>
                  {event.isUpcoming && <span className="px-2 py-0.5 rounded-full font-bold bg-google-yellow/15 text-google-yellow">Upcoming</span>}
                </span>
              </th>
              <td className={cell}>{event.talks}</td>
              <td className={cell}>
                {event.speakers}
                {event.speakers > 0 && <Muted>{event.firstTimeSpeakers} first-time, {event.returningSpeakers} returning</Muted>}
              </td>
              <td className={cell}>
                {event.type === 'devfest' ? (
                  <>
                    {event.proposals}
                    {event.proposals > 0 && <Muted>{event.acceptedProposals} accepted</Muted>}
                  </>
                ) : (
                  <>
                    {event.acceptedProposals}
                    <Muted>accepted from meetup proposals</Muted>
                  </>
                )}
              </td>
              <td className={cell}>
                {event.volunteerSignups}
                {event.volunteerSignups > 0 && (
                  <Muted>
                    {event.acceptedVolunteers} accepted{event.returningVolunteers > 0 ? `, ${event.returningVolunteers} returning` : ''}
                  </Muted>
                )}
              </td>
              <td className={cell}>{event.organisers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsBody({ analytics }: { analytics: GdgAnalytics }) {
  const { speakers, meetupProposals, volunteers } = analytics;
  return (
    <div className="space-y-12 pb-10">
      <section aria-labelledby="events-heading">
        <SectionHeading id="events-heading">Events</SectionHeading>
        <EventsTable events={analytics.events} />
      </section>

      <section aria-labelledby="speakers-heading">
        <SectionHeading id="speakers-heading">Speakers across events</SectionHeading>
        <div className="flex flex-wrap gap-2.5">
          <StatTile label="People on file" count={speakers.people} icon="users" accent="neutral" />
          <StatTile label="Have given a talk" count={speakers.withTalks} icon="check" accent="blue" />
          <StatTile
            label="Spoke at more than one event"
            count={speakers.repeat}
            subtext={speakers.withTalks > 0 ? `${Math.round((speakers.repeat / speakers.withTalks) * 100)}% of those who have given a talk` : undefined}
            icon="users"
            accent="green"
          />
          <StatTile label="Talks" count={speakers.talks} icon="layers" accent="neutral" />
        </div>
      </section>

      <section aria-labelledby="meetup-proposals-heading">
        <SectionHeading id="meetup-proposals-heading">Meetup proposals</SectionHeading>
        <StatusTiles
          total={meetupProposals.total}
          totalLabel="Proposals"
          uniqueCount={meetupProposals.uniqueProposers}
          uniqueLabel="Unique proposers"
          pending={meetupProposals.pending}
          accepted={meetupProposals.accepted}
          rejected={meetupProposals.rejected}
        />
        {meetupProposals.total === 0 ? (
          <EmptyState message="No meetup proposals yet." />
        ) : (
          <>
            <SubmissionsOverTimeChart entries={meetupProposals.submittedAt.map((submittedAt) => ({ submittedAt }))} noun="proposals" accent="green" />
            <div className="grid sm:grid-cols-2 gap-3">
              <BreakdownCard title="Where they came from">
                {meetupProposals.bySource.map(([source, count]) => (
                  <BarRow key={source} label={source} count={count} total={meetupProposals.total} barClass="bg-google-green" />
                ))}
              </BreakdownCard>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="volunteers-heading">
        <SectionHeading id="volunteers-heading">Volunteers across events</SectionHeading>
        <div className="flex flex-wrap gap-2.5">
          <StatTile label="Volunteer profiles" count={volunteers.profiles} icon="users" accent="neutral" />
          <StatTile label="In the volunteer pool" count={volunteers.inPool} icon="check" accent="green" />
          <StatTile label="Signups" count={volunteers.signups} icon="layers" accent="neutral" />
          <StatTile
            label="Volunteered at more than one event"
            count={volunteers.repeat}
            icon="users"
            accent="blue"
          />
          <StatTile label="Organisers" count={volunteers.organisers} icon="users" accent="yellow" />
        </div>
      </section>
    </div>
  );
}

export default async function GdgAnalyticsPage() {
  await getVerifiedSession();
  let analytics: GdgAnalytics | null = null;
  try {
    analytics = await loadGdgAnalytics();
  } catch (error) {
    console.error('GDG analytics failed to load:', error);
  }

  return (
    <>
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-4 pb-3 md:pt-8 md:pb-4 bg-black-02/95 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Analytics</h1>
        <p className="mt-0.5 text-sm text-white/55">
          Every GDG Sydney event. One DevFest&rsquo;s forms in detail are on{' '}
          <Link href="/admin/devfest/analytics" className="text-google-blue-light underline underline-offset-2 hover:no-underline">
            DevFest analytics
          </Link>
          .
        </p>
      </StickyAdminHeader>
      <div className="px-4 md:px-5 pt-4">
        {analytics ? (
          <AnalyticsBody analytics={analytics} />
        ) : (
          <p role="alert" className="rounded-2xl border border-google-red/30 bg-google-red/10 px-6 py-5 text-white/80">
            The analytics didn&rsquo;t load. Refresh the page to try again.
          </p>
        )}
      </div>
    </>
  );
}
