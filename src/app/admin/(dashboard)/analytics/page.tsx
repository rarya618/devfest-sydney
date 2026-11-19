import { Fragment } from 'react';
import Link from 'next/link';
import { getVerifiedSession } from '@/lib/adminSession';
import { loadGdgAnalytics, type EventAnalyticsRow, type GdgAnalytics, type WaitingItem } from '@/lib/gdgAnalytics';
import StickyAdminHeader from '../../StickyAdminHeader';
import SubmissionsOverTimeChart from '../../SubmissionsOverTimeChart';
import { ChannelsCard, Disclosure, EmptyState, StatStrip, StatTile, StatusTiles } from '../../analyticsShared';
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

// One takeaway sentence says what the section shows at a glance. What the words mean lives in
// one note at the foot of the page (FigureDefinitions), so no section repeats a paragraph.
function SectionHeading({ id, children, takeaway }: { id: string; children: React.ReactNode; takeaway?: string }) {
  return (
    <>
      <h2 id={id} className={`text-lg font-bold text-off-white ${takeaway ? '' : 'mb-4'}`}>{children}</h2>
      {takeaway && <p className="mt-1 mb-4 max-w-prose text-sm text-white/80">{takeaway}</p>}
    </>
  );
}

function FigureDefinitions() {
  return (
    // A footnote to the whole page, so it sits closer than the 40px between sections.
    <Disclosure summary="What these figures mean" className="-mt-6">
      <ul className="mt-1 max-w-prose list-disc space-y-1.5 pl-5 text-sm text-white/60">
        <li>First-time means their first talk with GDG Sydney; returning means they spoke at an earlier event. In the bars, green is returning and grey is first-time.</li>
        <li>A meetup counts only the proposals accepted into it.</li>
        <li>People on file have a speaker profile. A talk counts once it is on an event&rsquo;s programme, upcoming events included.</li>
        <li>Volunteer profiles are everyone who has signed up. The pool is the opt-in list we invite to new events.</li>
        <li>Repeat speakers have talks at more than one event; repeat volunteers signed up for more than one.</li>
        <li>Each organiser is counted once, whichever events they organised.</li>
      </ul>
    </Disclosure>
  );
}

// Kept whole, so a narrow column breaks after the comma ("6 first-time, / 0 returning") and
// never between a number and its word.
function Phrases({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={part}>
          {index > 0 && ' '}
          <span className="whitespace-nowrap">{part}</span>
        </Fragment>
      ))}
    </>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-white/60">{children}</span>;
}

// Returning (green) beside first-time (grey), as a share of the whole. It sits under the words
// that say the same thing, so the colours are never the only signal, and so every column's
// caption starts right under its number and lines up across the row.
function RetentionBar({ returning, firstTime }: { returning: number; firstTime: number }) {
  const total = returning + firstTime;
  if (total === 0) return null;
  return (
    <span aria-hidden="true" className="mt-1.5 flex h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
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
              className="group flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-google-blue"
            >
              <span className="w-8 shrink-0 text-2xl font-bold tabular-nums text-off-white sm:w-10">{item.count}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-off-white">{noun.charAt(0).toUpperCase() + noun.slice(1)}</span>
                <span className="block text-sm text-white/60">
                  {item.eventName ? `${item.eventName}, ` : ''}
                  <span className={item.oldestDays >= 7 ? 'text-google-yellow' : undefined}>
                    {item.eventName ? describeAge(item.oldestDays) : describeAge(item.oldestDays).replace(/^t/, 'T')}
                  </span>
                </span>
              </span>
              <span className="hidden shrink-0 rounded-full border border-white/35 px-4 py-1.5 text-sm font-bold text-off-white transition-colors group-hover:border-white sm:inline-flex">
                Review
              </span>
              {/* On a phone the pill squeezed the row to four lines; the row's own open arrow says the same. */}
              <svg className="h-4 w-4 shrink-0 text-white/60 group-hover:text-white sm:hidden" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5L10.5 8 6 12.5" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// The same facts feed the table (from sm) and the stacked cards (below it), so a phone never
// has to scroll sideways to reach Proposals or Volunteers.
function SpeakersFact({ event, compact = false }: { event: EventAnalyticsRow; compact?: boolean }) {
  return (
    <>
      {event.speakers}
      {event.speakers > 0 && (
        <>
          <Muted>{compact ? `${event.returningSpeakers} returning` : <Phrases parts={[`${event.firstTimeSpeakers} first-time,`, `${event.returningSpeakers} returning`]} />}</Muted>
          <RetentionBar returning={event.returningSpeakers} firstTime={event.firstTimeSpeakers} />
        </>
      )}
    </>
  );
}

function ProposalsFact({ event, compact = false }: { event: EventAnalyticsRow; compact?: boolean }) {
  if (event.type === 'devfest') {
    return (
      <>
        {event.proposals}
        {event.proposals > 0 && <Muted>{event.acceptedProposals} accepted</Muted>}
      </>
    );
  }
  return (
    <>
      {event.acceptedProposals}
      <Muted>{compact ? 'accepted' : 'accepted from meetup proposals'}</Muted>
    </>
  );
}

function VolunteersFact({ event, compact = false }: { event: EventAnalyticsRow; compact?: boolean }) {
  return (
    <>
      {event.volunteerSignups}
      {event.volunteerSignups > 0 && (
        <>
          <Muted>
            {compact ? `${event.returningVolunteers} returning` : <Phrases parts={[`${event.acceptedVolunteers} accepted,`, `${event.returningVolunteers} returning`]} />}
          </Muted>
          <RetentionBar returning={event.returningVolunteers} firstTime={event.volunteerSignups - event.returningVolunteers} />
        </>
      )}
    </>
  );
}

function EventHeading({ event }: { event: EventAnalyticsRow }) {
  return (
    <>
      <span className="block font-bold text-white">{event.name}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
        <span className="font-mono">{formatEventDate(event.startAt)}</span>
        <Chip>{event.type === 'devfest' ? 'DevFest' : 'Meetup'}</Chip>
        {event.isUpcoming && <StatusLabel tone="good">Upcoming</StatusLabel>}
      </span>
    </>
  );
}

function EventCards({ events }: { events: EventAnalyticsRow[] }) {
  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.eventId} className="rounded-2xl bg-surface px-4 py-4">
          <EventHeading event={event} />
          <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-3 text-sm text-white/80">
            <div>
              <dt className="text-xs font-bold text-white/60">Talks</dt>
              <dd className="mt-0.5">{event.talks}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-white/60">Speakers</dt>
              <dd className="mt-0.5"><SpeakersFact event={event} compact /></dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-white/60">Volunteers</dt>
              <dd className="mt-0.5"><VolunteersFact event={event} compact /></dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-white/60">Proposals</dt>
              <dd className="mt-0.5"><ProposalsFact event={event} compact /></dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-white/60">Organisers</dt>
              <dd className="mt-0.5">{event.organisers}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

function EventRows({ events }: { events: EventAnalyticsRow[] }) {
  // 20px at the outer edges, the inset of every other panel on the page, so the event names
  // line up with the waiting list and the figures above and below them.
  const cell = 'px-3 py-3 align-top first:pl-5 last:pr-5';
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface">
      <table className="w-full min-w-[640px] text-sm text-white/80">
        <caption className="sr-only">GDG Sydney events, newest first, with their talks, speakers, proposals and volunteers</caption>
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
                <EventHeading event={event} />
              </th>
              <td className={cell}>{event.talks}</td>
              <td className={cell}><SpeakersFact event={event} /></td>
              <td className={cell}><ProposalsFact event={event} /></td>
              <td className={cell}><VolunteersFact event={event} /></td>
              <td className={cell}>{event.organisers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The four newest events show; the rest sit behind "Earlier events", since the list grows by a
// meetup a month. The same facts feed the table (from sm) and the stacked cards below it.
const RECENT_EVENT_COUNT = 4;

function EventsList({ events }: { events: EventAnalyticsRow[] }) {
  if (events.length === 0) return <EmptyState message="No events yet." />;
  const recent = events.slice(0, RECENT_EVENT_COUNT);
  const earlier = events.slice(RECENT_EVENT_COUNT);
  return (
    <>
      <div className="sm:hidden"><EventCards events={recent} /></div>
      <div className="hidden sm:block"><EventRows events={recent} /></div>
      {earlier.length > 0 && (
        <Disclosure summary={`Earlier events (${earlier.length})`} className="mt-2">
          <div className="mt-2 sm:hidden"><EventCards events={earlier} /></div>
          <div className="mt-2 hidden sm:block"><EventRows events={earlier} /></div>
        </Disclosure>
      )}
    </>
  );
}

function AnalyticsBody({ analytics }: { analytics: GdgAnalytics }) {
  const { speakers, meetupProposals, volunteers } = analytics;
  const speakerPlaces = analytics.events.reduce((total, event) => total + event.speakers, 0);
  const returningPlaces = analytics.events.reduce((total, event) => total + event.returningSpeakers, 0);

  return (
    <div className="space-y-10 pb-10">
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
        >
          Events
        </SectionHeading>
        <EventsList events={analytics.events} />
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="speakers-heading" className="flex flex-col">
        <SectionHeading
          id="speakers-heading"
          takeaway={
            speakers.withTalks > 0 ? `${speakers.repeat} of ${speakers.withTalks} people with a talk have spoken at more than one event.` : undefined
          }
        >
          Speakers across events
        </SectionHeading>
        <StatStrip className="flex-1">
          <StatTile label="People on file" count={speakers.people} />
          <StatTile label="Speakers with a talk" count={speakers.withTalks} />
          <StatTile label="Repeat speakers" count={speakers.repeat} />
          <StatTile label="Talks across events" count={speakers.talks} />
        </StatStrip>
      </section>

      <section aria-labelledby="volunteers-heading" className="flex flex-col">
        <SectionHeading
          id="volunteers-heading"
          takeaway={
            volunteers.withSignups > 0
              ? `${volunteers.repeat} of ${volunteers.withSignups} people who have signed up did so for more than one event.`
              : undefined
          }
        >
          Volunteers across events
        </SectionHeading>
        <StatStrip className="flex-1">
          <StatTile label="Profiles" count={volunteers.profiles} />
          <StatTile label="In the pool" count={volunteers.inPool} />
          <StatTile label="Signups" count={volunteers.signups} />
          <StatTile label="Repeat volunteers" count={volunteers.repeat} />
          <StatTile label="Organisers" count={volunteers.organisers} />
        </StatStrip>
      </section>

      </div>

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
          <Disclosure summary="Proposals over time and how they arrived" className="-mt-4">
            <div className="mt-2">
              <SubmissionsOverTimeChart entries={meetupProposals.submittedAt.map((submittedAt) => ({ submittedAt }))} noun="proposals" accent="green" />
              <div className="grid gap-3 sm:grid-cols-2">
                <ChannelsCard title="How proposals arrived" channels={meetupProposals.bySource} total={meetupProposals.total} noun="proposals" barClass="bg-google-green" />
              </div>
            </div>
          </Disclosure>
        )}
      </section>

      <FigureDefinitions />
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
