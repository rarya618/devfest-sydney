import type { Metadata } from 'next';
import { isFlowOpen, loadCurrentDevfest } from '@/lib/events';
import { requirePortalSession } from '@/lib/portalAuth';
import {
  loadPortalOverview,
  type PortalOverview,
  type PortalProposal,
  type PortalTalk,
} from '@/lib/portalData';
import { listSavedTalks, type SavedTalk } from '@/lib/portalSavedTalks';
import type { GdgEvent } from '@/lib/types';
import PortalShell from './PortalShell';
import SavedTalksSection, { type SavedTalkRow } from './SavedTalksSection';
import DashboardWorkspace from './DashboardWorkspace';
import EditProposalButton from './EditProposalButton';
import { pageHeading, sectionHeading } from './portalStyles';

export const dynamic = 'force-dynamic';
// The layout's title template doesn't reach a page in its own segment.
export const metadata: Metadata = { title: { absolute: 'Your talks — GDG Sydney speaker portal' } };

function formatDay(iso: string | null, timeZone: string): string {
  if (!iso) return 'Date to come';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone });
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
      <h2 id={headingId} className={sectionHeading}>{title}</h2>
      <ul className="mt-4">
        {talks.map((talk) => (
          <li key={`${talk.talkId}:${talk.speakerName}`} className="grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)] gap-4 py-4 border-t border-white/10">
            <p className={`font-mono text-sm pt-0.5 ${isPast ? 'text-white/50' : 'text-google-green'}`}>{formatDay(talk.startAt, talk.timeZone)}</p>
            <div className="min-w-0">
              <p className={`font-bold leading-snug ${isPast ? 'text-white/75' : 'text-off-white'}`}>{talk.talkTitle}</p>
              <p className="mt-1 text-sm text-white/60">{talk.eventName}</p>
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
  if (proposal.status === 'not-selected') return <p className="text-sm text-white/60">Not selected this time.</p>;
  if (proposal.status === 'closed') return <p className="text-sm text-white/60">Closed: the event has passed.</p>;

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

function Proposals({ proposals }: { proposals: PortalProposal[] }) {
  if (proposals.length === 0) return null;
  return (
    <section aria-labelledby="proposals-heading">
      <h2 id="proposals-heading" className={sectionHeading}>Proposals</h2>
      <ul className="mt-4">
        {proposals.map((proposal) => (
          <li key={proposal.id} className="py-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold leading-snug">{proposal.talkTitle}</p>
                <p className="mt-1 text-sm text-white/60">
                  {proposal.eventName ?? (proposal.kind === 'meetup' ? 'A GDG Sydney meetup' : 'DevFest Sydney')}
                  {proposal.submittedAt && <>, sent <span className="font-mono">{formatDay(proposal.submittedAt, 'Australia/Sydney')}</span></>}
                </p>
              </div>
              {proposal.confirmUrl && (
                <a href={proposal.confirmUrl} aria-label={`Confirm you will give ${proposal.talkTitle}`} className="inline-flex self-start px-5 py-2 rounded-full bg-google-green-deep text-white text-sm font-bold transition-opacity hover:opacity-85">
                  Confirm your spot
                </a>
              )}
              {proposal.editable && <EditProposalButton proposalId={proposal.id} talkTitle={proposal.talkTitle} />}
            </div>
            <div className="mt-4">
              <ProposalProgress proposal={proposal} />
            </div>
          </li>
        ))}
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

  const firstName = overview?.profiles[0]?.name.trim().split(/\s+/)[0];
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
          greeting={firstName ? `Hi, ${firstName}.` : 'Welcome.'}
          openDevfest={devfest && isFlowOpen(devfest, 'cfs') ? { name: devfest.name, closesAt: devfest.cfs.closesAt } : null}
          savedTalks={savedTalks.map(({ id, talkTitle, abstract, audience }) => ({ id, talkTitle, abstract, audience }))}
          editableProposals={overview.proposals.flatMap((proposal) =>
            proposal.editable ? [{ id: proposal.id, talkTitle: proposal.talkTitle, editable: proposal.editable }] : []
          )}
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
            {allTalks.length === 0 && overview.profiles.length > 0 && (
              <section aria-labelledby="talks-empty">
                <h2 id="talks-empty" className={sectionHeading}>Talks</h2>
                <p className="mt-4 py-5 border-t border-white/10 text-white/60">No talks on the schedule yet.</p>
              </section>
            )}
            <TalkSchedule headingId="upcoming-talks" title="Upcoming talks" talks={upcomingTalks} isPast={false} />
            <Proposals proposals={overview.proposals} />
            <SavedTalksSection savedTalks={toSavedTalkRows(savedTalks, overview.proposals)} />
            <TalkSchedule headingId="past-talks" title="Past talks" talks={pastTalks} isPast />
        </DashboardWorkspace>
      )}
    </PortalShell>
  );
}
