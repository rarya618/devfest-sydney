import Link from 'next/link';
import { getVerifiedSession } from '@/lib/adminSession';
import { loadGdgAnalytics, type EventAnalyticsRow, type GdgAnalytics } from '@/lib/gdgAnalytics';
import StickyAdminHeader from '../../StickyAdminHeader';
import SubmissionsOverTimeChart from '../../SubmissionsOverTimeChart';
import { BarRow, BreakdownCard, EmptyState, StatStrip, StatTile, StatusTiles } from '../../analyticsShared';
import { Chip, StatusLabel } from '../../Chips';
import LoadFailureAlert from '../../LoadFailureAlert';

// GDG Sydney across every event (added 2026-11-14). One DevFest's forms in detail are on
// /admin/devfest/analytics. The numbers come from src/lib/gdgAnalytics.ts.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Community overview',
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' });
}

function SectionHeading({ id, children, description }: { id: string; children: React.ReactNode; description?: string }) {
  return (
    <>
      <h2 id={id} className={`text-lg font-bold text-off-white ${description ? '' : 'mb-4'}`}>{children}</h2>
      {description && <p className="mt-1 mb-4 max-w-prose text-sm text-white/60">{description}</p>}
    </>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-white/60">{children}</span>;
}

function EventsTable({ events }: { events: EventAnalyticsRow[] }) {
  if (events.length === 0) return <EmptyState message="No events yet." />;
  const cell = 'px-4 py-3 align-top';
  return (
    <div className="bg-surface border border-white/10 rounded-2xl overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm text-white/80">
        <caption className="sr-only">Every GDG Sydney event, newest first, with its talks, speakers, proposals and volunteers</caption>
        <thead>
          <tr className="text-left text-xs font-bold text-white/60 border-b border-white/10">
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
                <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span className="font-mono">{formatEventDate(event.startAt)}</span>
                  <Chip>{event.type === 'devfest' ? 'DevFest' : 'Meetup'}</Chip>
                  {event.isUpcoming && <StatusLabel tone="good">Upcoming</StatusLabel>}
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
        <SectionHeading
          id="events-heading"
          description="First-time speakers are giving their first talk with GDG Sydney; returning speakers spoke at an earlier event. A meetup counts only the proposals accepted into it."
        >
          Events
        </SectionHeading>
        <EventsTable events={analytics.events} />
      </section>

      <section aria-labelledby="speakers-heading">
        <SectionHeading
          id="speakers-heading"
          description="People on file have a speaker profile. Speakers with a talk have at least one talk on an event's programme, upcoming events included."
        >
          Speakers across events
        </SectionHeading>
        <StatStrip className="">
          <StatTile label="People on file" count={speakers.people} />
          <StatTile label="Speakers with a talk" count={speakers.withTalks} />
          <StatTile
            label="Spoke at more than one event"
            count={speakers.repeat}
            subtext={speakers.withTalks > 0 ? `${Math.round((speakers.repeat / speakers.withTalks) * 100)}% of speakers with a talk` : undefined}
          />
          <StatTile label="Talks across events" count={speakers.talks} />
        </StatStrip>
      </section>

      <section aria-labelledby="meetup-proposals-heading">
        <SectionHeading id="meetup-proposals-heading">Meetup proposals</SectionHeading>
        <StatusTiles
          total={meetupProposals.total}
          totalLabel="Proposals"
          uniqueCount={meetupProposals.uniqueProposers}
          uniqueLabel="People who proposed"
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
              <BreakdownCard title="How proposals arrived">
                {meetupProposals.bySource.map(([source, count]) => (
                  <BarRow key={source} label={source} count={count} total={meetupProposals.total} barClass="bg-google-green" />
                ))}
              </BreakdownCard>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="volunteers-heading">
        <SectionHeading
          id="volunteers-heading"
          description="Profiles are everyone who has signed up. The pool is the opt-in list we invite to new events. Each organiser is counted once, whichever events they organised."
        >
          Volunteers across events
        </SectionHeading>
        <StatStrip className="">
          <StatTile label="Volunteer profiles" count={volunteers.profiles} />
          <StatTile label="In the volunteer pool" count={volunteers.inPool} />
          <StatTile label="Signups" count={volunteers.signups} />
          <StatTile label="Volunteered at more than one event" count={volunteers.repeat} />
          <StatTile label="Organisers" count={volunteers.organisers} />
        </StatStrip>
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
        <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Community overview</h1>
        <p className="mt-0.5 text-sm text-white/60">
          Every GDG Sydney event side by side. For one DevFest&rsquo;s forms, see{' '}
          <Link href="/admin/devfest/analytics" className="text-google-blue-light underline underline-offset-2 hover:no-underline">
            Form results
          </Link>
          .
        </p>
      </StickyAdminHeader>
      <div className="px-4 md:px-5 pt-4">
        {analytics ? (
          <AnalyticsBody analytics={analytics} />
        ) : (
          <>
            <EmptyState message="The numbers aren't showing right now." />
            <LoadFailureAlert message="The numbers didn't load. Refresh the page to try again." />
          </>
        )}
      </div>
    </>
  );
}
