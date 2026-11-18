import type { Metadata } from 'next';
import Link from 'next/link';
import { isFlowOpen, loadCurrentDevfest } from '@/lib/events';
import { requirePortalSession } from '@/lib/portalAuth';
import {
  loadPortalOverview,
  type PortalOverview,
  type PortalProposal,
  type PortalTalk,
} from '@/lib/portalData';
import { listSavedTalks, type SavedTalk } from '@/lib/portalSavedTalks';
import { TRACK_DOT_COLORS, TRACK_LABELS } from '@/lib/submissionLabels';
import type { GdgEvent, Track } from '@/lib/types';
import PortalShell from './PortalShell';
import SavedTalksSection, { type SavedTalkRow } from './SavedTalksSection';
import DashboardWorkspace from './DashboardWorkspace';
import EditProposalButton from './EditProposalButton';
import { agendaDate, agendaDateLabel, agendaHeading, agendaRow, pageHeading } from './portalStyles';

export const dynamic = 'force-dynamic';
// The layout's title template doesn't reach a page in its own segment.
export const metadata: Metadata = { title: { absolute: 'Your talks | GDG Sydney speaker portal' } };

function formatDay(iso: string | null, timeZone: string): string {
  if (!iso) return 'Date to come';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone });
}

// A deadline, with its weekday so it reads as a day to act by: "Fri 3 Oct".
function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' });
}

function isStillAhead(iso: string | null): iso is string {
  return iso !== null && Date.parse(iso) > Date.now();
}

const confirmButtonClass =
  'press inline-flex self-start sm:self-auto shrink-0 px-5 py-2 rounded-full bg-google-green-deep text-white text-sm font-bold hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 focus-visible:ring-offset-black-02';

const chipClass = 'inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-xs leading-none text-white/70';

// What kind of event a row belongs to, and its DevFest track: the one place the portal shows
// the event's colours. The dot is decoration; the words carry the meaning.
function EventChips({ isDevfest, track }: { isDevfest: boolean; track: Track | null }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <span className={chipClass}>{isDevfest ? 'DevFest' : 'Meetup'}</span>
      {track && (
        <span className={chipClass}>
          <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${TRACK_DOT_COLORS[track]}`} />
          {TRACK_LABELS[track]}
          {track === 'keynote' || track === 'spotlight' || track === 'showcase' ? '' : ' track'}
        </span>
      )}
    </div>
  );
}

// Proposals accepted and waiting for the speaker to say yes: the one thing on the page that
// can run out, so it comes before everything else.
function ActionNeeded({ proposals }: { proposals: PortalProposal[] }) {
  const waiting = proposals.filter((proposal) => proposal.confirmUrl);
  if (waiting.length === 0) return null;
  return (
    <section aria-labelledby="action-needed-heading" className="row-in mb-10 rounded-3xl border border-google-green/30 bg-google-green/10 px-5 py-5 sm:px-7 sm:py-6">
      <h2 id="action-needed-heading" className="text-lg font-bold text-off-white">
        {waiting.length === 1 ? 'You’re in. Confirm your spot.' : 'You’re in. Confirm your spots.'}
      </h2>
      <ul className="mt-4 space-y-4">
        {waiting.map((proposal) => (
          <li key={proposal.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold leading-snug">{proposal.talkTitle}</p>
              <p className="mt-1 text-sm text-white/70">
                {proposal.eventName ?? 'A GDG Sydney meetup'}
                {isStillAhead(proposal.confirmBy) && (
                  <>. Confirm by <span className="font-mono text-google-green">{formatDeadline(proposal.confirmBy)}</span></>
                )}
              </p>
            </div>
            <a
              href={proposal.confirmUrl!}
              aria-label={`Confirm you will give ${proposal.talkTitle}`}
              className={confirmButtonClass}
            >
              Confirm your spot
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------------------
// Right column
// ---------------------------------------------------------------------------------------

type TalkWithSpeaker = PortalTalk & { speakerName: string };

function TalkSchedule({ headingId, title, talks, isPast }: { headingId: string; title: string; talks: TalkWithSpeaker[]; isPast: boolean }) {
  if (talks.length === 0) return null;
  const showSpeaker = new Set(talks.map((talk) => talk.speakerName)).size > 1;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className={agendaHeading}>{title}</h2>
      <ul className="mt-4">
        {talks.map((talk, index) => (
          <li key={`${talk.talkId}:${talk.speakerName}`} style={{ '--row-index': index } as React.CSSProperties} className={agendaRow}>
            <p className="pt-0.5">
              <span className={agendaDateLabel}>{isPast ? 'Gave it' : 'On stage'}</span>
              <span className={`${agendaDate} ${isPast ? 'text-white/60' : 'text-google-green'}`}>{formatDay(talk.startAt, talk.timeZone)}</span>
            </p>
            <div className="min-w-0">
              <p className={`font-bold leading-snug ${isPast ? 'text-white/75' : 'text-off-white'}`}>{talk.talkTitle}</p>
              <p className="mt-1 text-sm text-white/60">{talk.eventName}</p>
              <EventChips isDevfest={talk.eventType === 'devfest'} track={talk.track} />
              {(talk.coSpeakerNames.length > 0 || showSpeaker) && (
                <p className="mt-1 text-sm text-white/60">
                  {showSpeaker && `As ${talk.speakerName}`}
                  {showSpeaker && talk.coSpeakerNames.length > 0 && ', '}
                  {talk.coSpeakerNames.length > 0 && `${showSpeaker ? 'with' : 'With'} ${talk.coSpeakerNames.join(', ')}`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const PROGRESS_STEPS = ['Sent', 'Under review', 'Accepted', 'Confirmed'] as const;

// Where a proposal is on the way from sent to confirmed. A proposal that didn't go ahead has
// no progress to show, so it gets a sentence instead.
function ProposalProgress({ proposal }: { proposal: PortalProposal }) {
  if (proposal.status === 'not-selected') {
    // Not the end of the talk: a meetup is the natural next stage for it.
    const proposeHref = proposal.savedTalkId ? `/speaker?propose=${proposal.savedTalkId}` : '/speaker?propose';
    return (
      <p className="text-sm text-white/70 leading-relaxed">
        Not selected this time.{' '}
        {proposal.kind === 'devfest' ? 'Our monthly meetups are always looking for talks. ' : ''}
        <Link
          href={proposeHref}
          aria-label={proposal.kind === 'devfest' ? `Propose ${proposal.talkTitle} to a meetup` : 'Propose another talk'}
          className="text-google-blue-light underline underline-offset-2 hover:no-underline"
        >
          {proposal.kind === 'devfest' ? (proposal.savedTalkId ? 'Propose it to a meetup' : 'Propose a talk to a meetup') : 'Propose another talk'}
        </Link>
      </p>
    );
  }
  if (proposal.status === 'closed') return <p className="text-sm text-white/60">This event has passed.</p>;

  const reached = { 'under-review': 1, accepted: 2, confirmed: 3 }[proposal.status];
  const isConfirmed = proposal.status === 'confirmed';
  const fill = isConfirmed ? 'bg-google-green' : 'bg-google-blue';
  return (
    <ol aria-label={`Progress: ${PROGRESS_STEPS[reached]}, step ${reached + 1} of ${PROGRESS_STEPS.length}`} className="grid grid-cols-4 max-w-md">
      {PROGRESS_STEPS.map((step, index) => {
        const isDone = index <= reached;
        const isCurrent = index === reached;
        return (
          <li key={step} aria-current={isCurrent ? 'step' : undefined} className="min-w-0">
            <div className="flex items-center">
              <span
                aria-hidden="true"
                className={`w-3 h-3 rounded-full shrink-0 ${isDone ? fill : 'border border-white/35'} ${isCurrent && !isConfirmed ? 'ring-4 ring-google-blue/25' : ''}`}
              />
              {index < PROGRESS_STEPS.length - 1 && (
                <span aria-hidden="true" className={`h-0.5 flex-1 ${index < reached ? fill : 'bg-white/15'}`} />
              )}
            </div>
            <p className={`mt-2 pr-2 text-xs leading-tight ${isCurrent ? 'font-bold text-off-white' : isDone ? 'text-white/70' : 'text-white/50'}`}>
              {step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

// The date that matters for a proposal, and the colour of where it's up to: green once it's in,
// yellow while it's being read, quiet once it's over.
function proposalDate(proposal: PortalProposal): { label: string; date: string; colour: string } {
  const sent = proposal.submittedAt ? formatDeadline(proposal.submittedAt) : 'Date unknown';
  if (proposal.status === 'accepted' && isStillAhead(proposal.confirmBy)) {
    return { label: 'Confirm by', date: formatDeadline(proposal.confirmBy), colour: 'text-google-green' };
  }
  if (proposal.status === 'accepted' || proposal.status === 'confirmed') return { label: 'Sent', date: sent, colour: 'text-google-green' };
  if (proposal.status === 'under-review') return { label: 'Sent', date: sent, colour: 'text-google-yellow' };
  return { label: 'Sent', date: sent, colour: 'text-white/60' };
}

function Proposals({ proposals }: { proposals: PortalProposal[] }) {
  if (proposals.length === 0) {
    return (
      <section aria-labelledby="proposals-heading">
        <h2 id="proposals-heading" className={agendaHeading}>Proposals</h2>
        <p className="mt-4 py-5 border-t border-white/10 text-white/60">
          Nothing proposed yet. Each talk you propose shows here, with where it&rsquo;s up to, from sent to confirmed.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="proposals-heading">
      <h2 id="proposals-heading" className={agendaHeading}>Proposals</h2>
      <ul className="mt-4">
        {proposals.map((proposal, index) => {
          const keyDate = proposalDate(proposal);
          return (
            <li key={proposal.id} style={{ '--row-index': index } as React.CSSProperties} className={agendaRow}>
              <p className="pt-0.5">
                <span className={agendaDateLabel}>{keyDate.label}</span>
                <span className={`${agendaDate} ${keyDate.colour}`}>{keyDate.date}</span>
              </p>
              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold leading-snug">{proposal.talkTitle}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {proposal.eventName ?? (proposal.kind === 'meetup' ? 'A GDG Sydney meetup' : 'DevFest Sydney')}
                    </p>
                    <EventChips isDevfest={proposal.kind === 'devfest'} track={proposal.track} />
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {proposal.confirmUrl && (
                      <a href={proposal.confirmUrl} aria-label={`Confirm you will give ${proposal.talkTitle}`} className={confirmButtonClass}>
                        Confirm your spot
                      </a>
                    )}
                    {proposal.editable && <EditProposalButton proposalId={proposal.id} talkTitle={proposal.talkTitle} />}
                  </div>
                </div>
                <div className="mt-4">
                  <ProposalProgress proposal={proposal} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// The rows the Saved talks section shows, each with the events it has been proposed to.
function toSavedTalkRows(savedTalks: SavedTalk[], proposals: PortalProposal[]): SavedTalkRow[] {
  return savedTalks.map((savedTalk) => ({
    id: savedTalk.id,
    talkTitle: savedTalk.talkTitle,
    abstract: savedTalk.abstract,
    audience: savedTalk.audience,
    proposedTo: proposals
      .filter((proposal) => proposal.savedTalkId === savedTalk.id)
      .map((proposal) => proposal.eventName ?? (proposal.kind === 'meetup' ? 'a meetup' : 'DevFest')),
  }));
}

interface PortalHomePageProps {
  // ?edit=<speakerId> opens that profile's editor (the header's profile button links here);
  // ?propose, or ?propose=<savedTalkId>, opens the proposal form.
  searchParams: Promise<{ edit?: string; propose?: string }>;
}

export default async function PortalHomePage({ searchParams }: PortalHomePageProps) {
  const session = await requirePortalSession();
  const { edit, propose } = await searchParams;

  let overview: PortalOverview | null = null;
  let savedTalks: SavedTalk[] = [];
  let devfest: GdgEvent | null = null;
  try {
    [overview, savedTalks, devfest] = await Promise.all([
      loadPortalOverview(session.email),
      listSavedTalks(session.email),
      loadCurrentDevfest(),
    ]);
  } catch (error) {
    console.error('Portal overview failed for', session.email, error);
  }

  // Every talk of every profile on this address, once per presenter.
  const allTalks: TalkWithSpeaker[] = (overview?.profiles ?? []).flatMap((profile) =>
    profile.talks.map((talk) => ({ ...talk, speakerName: profile.name }))
  );
  const upcomingTalks = allTalks.filter((talk) => talk.isUpcoming);
  const pastTalks = allTalks.filter((talk) => !talk.isUpcoming);

  return (
    <PortalShell>
      {!overview ? (
        <>
          <h1 className={`${pageHeading} mb-12`}>Welcome.</h1>
          <p role="alert" className="rounded-2xl border border-google-red/30 bg-google-red/10 px-6 py-5 text-white/80">
            Your talks didn&rsquo;t load. Refresh the page to try again.
          </p>
        </>
      ) : (
        <DashboardWorkspace
          openDevfest={devfest && isFlowOpen(devfest, 'cfs') ? { name: devfest.name, closesAt: devfest.cfs.closesAt } : null}
          savedTalks={savedTalks.map(({ id, talkTitle, abstract, audience }) => ({ id, talkTitle, abstract, audience }))}
          editableProposals={overview.proposals.flatMap((proposal) =>
            proposal.editable ? [{ id: proposal.id, talkTitle: proposal.talkTitle, editable: proposal.editable }] : []
          )}
          actionStrip={<ActionNeeded proposals={overview.proposals} />}
          requestedPanel={
            edit ? { type: 'profile', profileId: edit } : propose !== undefined ? { type: 'propose', savedTalkId: propose || null } : null
          }
          profiles={overview.profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            tagline: profile.tagline,
            bio: profile.bio,
            photoUrl: profile.photoUrl,
            linkedinUrl: profile.linkedinUrl,
            githubUrl: profile.githubUrl,
            websiteUrl: profile.websiteUrl,
          }))}
        >
            {/* Nothing ahead at all: one line, not two empty sections in front of what exists. */}
            {upcomingTalks.length === 0 && overview.proposals.length === 0 ? (
              <section aria-labelledby="agenda-empty">
                <h2 id="agenda-empty" className={agendaHeading}>Coming up</h2>
                <p className="mt-4 py-5 border-t border-white/10 text-white/60">
                  Nothing scheduled or proposed yet. Propose a talk and it shows here, with where it&rsquo;s up to.
                </p>
              </section>
            ) : (
              <>
                <TalkSchedule headingId="upcoming-talks" title="Coming up" talks={upcomingTalks} isPast={false} />
                <Proposals proposals={overview.proposals} />
              </>
            )}
            <SavedTalksSection savedTalks={toSavedTalkRows(savedTalks, overview.proposals)} />
            <TalkSchedule headingId="past-talks" title="Past talks" talks={pastTalks} isPast />
        </DashboardWorkspace>
      )}
    </PortalShell>
  );
}
