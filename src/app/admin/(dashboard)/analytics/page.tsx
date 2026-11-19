import Link from 'next/link';
import { getVerifiedSession } from '@/lib/adminSession';
import { loadGdgAnalytics, type EventAnalyticsRow, type GdgAnalytics, type WaitingItem } from '@/lib/gdgAnalytics';
import StickyAdminHeader from '../../StickyAdminHeader';
import SubmissionsOverTimeChart from '../../SubmissionsOverTimeChart';
import { BarRow, BreakdownCard, EmptyState, StatStrip, StatTile, StatusTiles } from '../../analyticsShared';
import { Chip, StatusLabel } from '../../Chips';
import LoadFailureAlert from '../../LoadFailureAlert';

// GDG Sydney across every event (added 2026-11-14). One DevFest's forms in detail are on
// /admin/devfest/analytics. The numbers come from src/lib/gdgAnalytics.ts.
//
// The page answers two questions in order: what is waiting on an organiser, and are people
// coming back. Every count of something waiting links to the queue holding it.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Community overview',
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' });
}

// One takeaway sentence, then what the figures mean. The takeaway is what the section says at
// a glance; the rest defines the words so nobody has to guess.
function SectionHeading({ id, children, takeaway, definition }: { id: string; children: React.ReactNode; takeaway?: string; definition?: string }) {
  const hasText = Boolean(takeaway || definition);
  return (
    <>
      <h2 id={id} className={`text-lg font-bold text-off-white ${hasText ? '' : 'mb-4'}`}>{children}</h2>
      {hasText && (
        <p className="mt-1 mb-4 max-w-prose text-sm text-white/60">
          {takeaway && <span className="text-white/90">{takeaway} </span>}
          {definition}
        </p>
      )}
    </>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-white/60">{children}</span>;
}

// Returning (green) beside first-time (grey), as a share of the whole. The words beside it say
// the same thing, so the colours are never the only signal.
function RetentionBar({ returning, firstTime }: { returning: number; firstTime: number }) {
  const total = returning + firstTime;
  if (total === 0) return null;
  return (
    <span aria-hidden="true" className="mt-2 flex h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
      <span className="h-full bg-google-green" style={{ width: `${(returning / total) * 100}%` }} />
      <span className="h-full bg-white/30" style={{ width: `${(firstTime / total) * 100}%` }} />
    </span>
  );
}

const WAITING_NOUNS: Record<WaitingItem['kind'], { singular: string; plural: string }> = {
  'devfest-proposals': { singular: 'talk proposal', plural: 'talk proposals' },
  'meetup-proposals': { singular: 'meetup talk proposal', plural: 'meetup talk proposals' },
  volunteers: { singular: 'volunteer signup', plural: 'volunteer signups' },
  showcase: { singular: 'Builder Showcase entry', plural: 'Builder Showcase entries' },
};

// DevFest queues follow the sidebar's DevFest picker, which defaults to the current DevFest.
function waitingHref(item: WaitingItem): string {
  switch (item.kind) {
    case 'devfest-proposals':
      return '/admin/devfest/proposals?status=pending';
    case 'showcase':
      return '/admin/devfest/showcase?status=pending';
    case 'meetup-proposals':
      return '/admin/meetups?status=pending';
    case 'volunteers':
      return item.eventType === 'devfest'
        ? '/admin/devfest/volunteers?status=pending'
        : `/admin/event-volunteers?event=${encodeURIComponent(item.eventId ?? '')}&status=pending`;
  }
}

function describeAge(days: number): string {
  if (days === 0) return 'the oldest came in today';
  return `the oldest has waited ${days} ${days === 1 ? 'day' : 'days'}`;
}

function WaitingForDecision({ waiting }: { waiting: WaitingItem[] }) {
  if (waiting.length === 0) {
    return (
      <div className="rounded-2xl bg-surface px-5 py-5">
        <StatusLabel tone="good">Nothing is waiting for a decision</StatusLabel>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-surface">
      {waiting.map((item) => {
        const nouns = WAITING_NOUNS[item.kind];
        const noun = item.count === 1 ? nouns.singular : nouns.plural;
        return (
          <li key={`${item.kind}-${item.eventId ?? 'meetups'}`}>
            <Link
              href={waitingHref(item)}
              aria-label={`Review ${item.count} ${noun}${item.eventName ? ` for ${item.eventName}` : ''}; ${describeAge(item.oldestDays)}`}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-google-blue"
            >
              <span className="w-10 shrink-0 text-2xl font-bold tabular-nums text-off-white">{item.count}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-off-white">{noun.charAt(0).toUpperCase() + noun.slice(1)}</span>
                <span className="block text-sm text-white/60">
                  {item.eventName ? `${item.eventName}, ` : ''}
                  <span className={item.oldestDays >= 7 ? 'text-google-yellow' : undefined}>
                    {item.eventName ? describeAge(item.oldestDays) : describeAge(item.oldestDays).replace(/^t/, 'T')}
                  </span>
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-white/35 px-4 py-1.5 text-sm font-bold text-off-white transition-colors group-hover:border-white">
                Review
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
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
                {event.speakers > 0 && (
                  <>
                    <RetentionBar returning={event.returningSpeakers} firstTime={event.firstTimeSpeakers} />
                    <Muted>{event.firstTimeSpeakers} first-time, {event.returningSpeakers} returning</Muted>
                  </>
                )}
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
                  <>
                    <RetentionBar returning={event.returningVolunteers} firstTime={event.volunteerSignups - event.returningVolunteers} />
                    <Muted>
                      {event.acceptedVolunteers} accepted, {event.returningVolunteers} returning
                    </Muted>
                  </>
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
  const speakerPlaces = analytics.events.reduce((total, event) => total + event.speakers, 0);
  const returningPlaces = analytics.events.reduce((total, event) => total + event.returningSpeakers, 0);

  return (
    <div className="space-y-12 pb-10">
      <section aria-labelledby="waiting-heading">
        <SectionHeading id="waiting-heading">Waiting for a decision</SectionHeading>
        <WaitingForDecision waiting={analytics.waiting} />
      </section>

      <section aria-labelledby="events-heading">
        <SectionHeading
          id="events-heading"
          takeaway={
            speakerPlaces > 0
              ? `${returningPlaces} of ${speakerPlaces} speaker places across ${analytics.events.length} events went to someone who had spoken before.`
              : undefined
          }
          definition="First-time means their first talk with GDG Sydney. In the bars, green is returning and grey is first-time. A meetup counts only the proposals accepted into it."
        >
          Events
        </SectionHeading>
        <EventsTable events={analytics.events} />
      </section>

      <section aria-labelledby="speakers-heading">
        <SectionHeading
          id="speakers-heading"
          takeaway={
            speakers.withTalks > 0 ? `${speakers.repeat} of ${speakers.withTalks} people with a talk have spoken at more than one event.` : undefined
          }
          definition="People on file have a speaker profile. A talk counts once it is on an event's programme, upcoming events included."
        >
          Speakers across events
        </SectionHeading>
        <StatStrip className="">
          <StatTile label="People on file" count={speakers.people} />
          <StatTile label="Speakers with a talk" count={speakers.withTalks} />
          <StatTile label="Spoke at more than one event" count={speakers.repeat} />
          <StatTile label="Talks across events" count={speakers.talks} />
        </StatStrip>
      </section>

      <section aria-labelledby="volunteers-heading">
        <SectionHeading
          id="volunteers-heading"
          takeaway={
            volunteers.withSignups > 0
              ? `${volunteers.repeat} of ${volunteers.withSignups} people who have signed up did so for more than one event.`
              : undefined
          }
          definition="Profiles are everyone who has signed up. The pool is the opt-in list we invite to new events. Each organiser is counted once, whichever events they organised."
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

      <section aria-labelledby="meetup-proposals-heading">
        <SectionHeading
          id="meetup-proposals-heading"
          takeaway={
            meetupProposals.total === 0
              ? undefined
              : meetupProposals.pending > 0
                ? `${meetupProposals.pending} ${meetupProposals.pending === 1 ? 'proposal is' : 'proposals are'} waiting for a decision.`
                : 'Nothing is waiting for a decision.'
          }
        >
          Meetup proposals
        </SectionHeading>
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
