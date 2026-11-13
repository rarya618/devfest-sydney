import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePortalSession } from '@/lib/portalAuth';
import {
  loadPortalOverview,
  type PortalOverview,
  type PortalProfile,
  type PortalProposal,
  type PortalTalk,
} from '@/lib/portalData';
import { listSavedTalks, type SavedTalk } from '@/lib/portalSavedTalks';
import PortalShell from './PortalShell';
import SpeakerCard from './SpeakerCard';
import { pageHeading, primaryButton, primaryButtonSmall, secondaryButton, sectionHeading } from './portalStyles';

export const dynamic = 'force-dynamic';
// The layout's title template doesn't reach a page in its own segment.
export const metadata: Metadata = { title: { absolute: 'Your talks — GDG Sydney speaker portal' } };

function formatDay(iso: string | null, timeZone: string): string {
  if (!iso) return 'Date to come';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone });
}

// "a photo", "a photo and a bio", "a photo, a tagline and a bio".
function listInWords(parts: (string | false)[]): string {
  const words = parts.filter((part): part is string => Boolean(part));
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// ---------------------------------------------------------------------------------------
// Left column: the speaker card
// ---------------------------------------------------------------------------------------

function ProfileColumn({ profiles }: { profiles: PortalProfile[] }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-3xl bg-white/[0.05] p-6">
        <h2 className="text-xl font-bold">No speaker profile yet</h2>
        <p className="mt-3 text-white/70 leading-relaxed">
          Your profile is set up when a talk of yours is accepted. Until then, propose a talk and follow it here.
        </p>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">
          Spoken for us before under another address? Sign in with that one, or write to{' '}
          <a href="mailto:hello@gdgsydney.com" className="text-google-blue-light underline hover:no-underline">hello@gdgsydney.com</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {profiles.length > 1 && (
        <p className="text-sm text-white/65 leading-relaxed">
          {profiles.length} speakers share this email address, so you can edit each of their profiles.
        </p>
      )}
      {profiles.map((profile) => {
        const missing = listInWords([!profile.photoUrl && 'a photo', !profile.tagline && 'a tagline', !profile.bio && 'a bio']);
        return (
          <div key={profile.id}>
            <SpeakerCard profile={profile} />
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              This is how you appear next to your talks on our event pages.
              {missing && <span className="block mt-1 text-google-yellow">Add {missing} to finish it.</span>}
            </p>
            <Link href={`/speaker/profile/${profile.id}`} aria-label={`Edit the speaker profile for ${profile.name}`} className={`${secondaryButton} mt-4`}>
              Edit profile
            </Link>
          </div>
        );
      })}
    </div>
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

function SavedTalks({ savedTalks, proposals }: { savedTalks: SavedTalk[]; proposals: PortalProposal[] }) {
  return (
    <section aria-labelledby="saved-talks-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="saved-talks-heading" className={sectionHeading}>Saved talks</h2>
        <Link href="/speaker/talks/new" aria-label="Add a talk to propose later" className={secondaryButton}>
          Add a talk
        </Link>
      </div>
      <p className="mt-2 text-sm text-white/60">Only you can see these until you propose them.</p>
      {savedTalks.length === 0 ? (
        <p className="mt-4 py-5 border-t border-white/10 text-white/60">
          Keep a talk idea here and propose it when you&rsquo;re ready, to a meetup, DevFest, or both.
        </p>
      ) : (
        <ul className="mt-4">
          {savedTalks.map((savedTalk) => {
            const proposedTo = proposals
              .filter((proposal) => proposal.savedTalkId === savedTalk.id)
              .map((proposal) => proposal.eventName ?? (proposal.kind === 'meetup' ? 'a meetup' : 'DevFest'));
            return (
              <li key={savedTalk.id} className="py-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold leading-snug">{savedTalk.talkTitle}</p>
                  {savedTalk.abstract && <p className="mt-1 text-sm text-white/60 line-clamp-2">{savedTalk.abstract}</p>}
                  <p className="mt-2 text-sm text-white/60">
                    {proposedTo.length === 0 ? 'Not proposed yet' : `Proposed to ${proposedTo.join(', ')}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/speaker/talks/${savedTalk.id}`} aria-label={`Edit ${savedTalk.talkTitle}`} className={secondaryButton}>
                    Edit
                  </Link>
                  <Link href={`/speaker/propose?talk=${savedTalk.id}`} aria-label={`Propose ${savedTalk.talkTitle}`} className={primaryButtonSmall}>
                    Propose
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function PortalHomePage() {
  const session = await requirePortalSession();

  let overview: PortalOverview | null = null;
  let savedTalks: SavedTalk[] = [];
  try {
    [overview, savedTalks] = await Promise.all([loadPortalOverview(session.email), listSavedTalks(session.email)]);
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
        <h1 className={pageHeading}>{firstName ? `Hi, ${firstName}.` : 'Welcome.'}</h1>
        <Link href="/speaker/propose" aria-label="Propose a talk" className={`${primaryButton} self-start sm:self-auto`}>
          Propose a talk
        </Link>
      </div>

      {!overview ? (
        <p role="alert" className="rounded-2xl border border-google-red/30 bg-google-red/10 px-6 py-5 text-white/80">
          Your talks didn&rsquo;t load. Refresh the page to try again.
        </p>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
          <aside aria-label="Your speaker profile" className="lg:sticky lg:top-8 lg:self-start">
            <ProfileColumn profiles={overview.profiles} />
          </aside>
          <div className="space-y-14 min-w-0">
            {allTalks.length === 0 && overview.profiles.length > 0 && (
              <section aria-labelledby="talks-empty">
                <h2 id="talks-empty" className={sectionHeading}>Talks</h2>
                <p className="mt-4 py-5 border-t border-white/10 text-white/60">No talks on the schedule yet.</p>
              </section>
            )}
            <TalkSchedule headingId="upcoming-talks" title="Upcoming talks" talks={upcomingTalks} isPast={false} />
            <Proposals proposals={overview.proposals} />
            <SavedTalks savedTalks={savedTalks} proposals={overview.proposals} />
            <TalkSchedule headingId="past-talks" title="Past talks" talks={pastTalks} isPast />
          </div>
        </div>
      )}
    </PortalShell>
  );
}
