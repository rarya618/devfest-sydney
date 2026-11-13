import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/format';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadPortalOverview, type PortalOverview, type PortalProfile, type PortalTalk } from '@/lib/portalData';
import { PORTAL_STATUS_LABELS, PORTAL_STATUS_STYLES } from '@/lib/portalLabels';
import { listSavedTalks, type SavedTalk } from '@/lib/portalSavedTalks';
import PortalShell from './PortalShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Your talks — GDG Sydney speaker portal' } };

const linkButton =
  'inline-flex items-center px-5 py-2 text-sm font-bold text-white rounded border border-white/35 transition-colors hover:border-white';

// "a photo", "a photo and a bio", "a photo, a tagline and a bio".
function listInWords(parts: (string | false)[]): string {
  const words = parts.filter((part): part is string => Boolean(part));
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function formatEventDate(iso: string | null, timeZone: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone });
}

function TalkRow({ talk }: { talk: PortalTalk }) {
  return (
    <li className="py-4 border-t border-white/10 first:border-t-0">
      <p className="font-bold text-white">{talk.talkTitle}</p>
      <p className="mt-1 font-mono text-sm text-white/60">
        {talk.eventName}
        {talk.startAt && ` · ${formatEventDate(talk.startAt, talk.timeZone)}`}
        {talk.isUpcoming && <span className="text-google-green"> · upcoming</span>}
      </p>
      {talk.coSpeakerNames.length > 0 && (
        <p className="mt-1 text-sm text-white/60">With {talk.coSpeakerNames.join(', ')}</p>
      )}
    </li>
  );
}

function ProfileCard({ profile }: { profile: PortalProfile }) {
  const isIncomplete = !profile.bio || !profile.photoUrl || !profile.tagline;
  return (
    <section aria-labelledby={`profile-${profile.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex items-start gap-5">
        {profile.photoUrl ? (
          <Image src={profile.photoUrl} alt={profile.name} width={72} height={72} className="w-[72px] h-[72px] rounded-full object-cover shrink-0" />
        ) : (
          <div aria-hidden="true" className="w-[72px] h-[72px] rounded-full bg-white/10 flex items-center justify-center font-bold text-white/70 shrink-0">
            {getInitials(profile.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 id={`profile-${profile.id}`} className="text-xl font-bold text-white">{profile.name}</h2>
          {profile.tagline && <p className="mt-1 text-white/70">{profile.tagline}</p>}
          {isIncomplete && (
            <p className="mt-2 text-sm text-google-yellow">
              Your profile is missing {listInWords([!profile.photoUrl && 'a photo', !profile.tagline && 'a tagline', !profile.bio && 'a bio'])}.
            </p>
          )}
          <Link href={`/portal/profile/${profile.id}`} aria-label={`Edit the speaker profile for ${profile.name}`} className={`${linkButton} mt-4`}>
            Edit profile
          </Link>
        </div>
      </div>

      <h3 className="mt-8 mb-1 font-mono text-sm text-white/60">Talks</h3>
      {profile.talks.length > 0 ? (
        <ul>{profile.talks.map((talk) => <TalkRow key={talk.talkId} talk={talk} />)}</ul>
      ) : (
        <p className="text-white/60">No talks on the schedule yet.</p>
      )}
    </section>
  );
}

function SavedTalks({ savedTalks, proposals }: { savedTalks: SavedTalk[]; proposals: PortalOverview['proposals'] }) {
  return (
    <section aria-labelledby="saved-talks-heading" className="mt-12">
      <div className="flex items-end justify-between gap-4 mb-2">
        <h2 id="saved-talks-heading" className="text-2xl font-bold">Saved talks</h2>
        <Link href="/portal/talks/new" aria-label="Add a talk to propose later" className={linkButton}>
          Add a talk
        </Link>
      </div>
      <p className="mb-5 text-white/60">Talks you keep here to propose when you&rsquo;re ready. Only you can see them.</p>
      {savedTalks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 px-6 py-5 text-white/60">
          No saved talks yet. Add one now and propose it whenever you like.
        </p>
      ) : (
        <ul className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 sm:px-8">
          {savedTalks.map((savedTalk) => {
            const proposedAs = proposals.filter((proposal) => proposal.savedTalkId === savedTalk.id);
            return (
              <li key={savedTalk.id} className="py-5 border-t border-white/10 first:border-t-0 flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-white">{savedTalk.talkTitle}</p>
                  {savedTalk.abstract && <p className="mt-1 text-sm text-white/60 line-clamp-2">{savedTalk.abstract}</p>}
                  <p className="mt-2 font-mono text-sm text-white/60">
                    {proposedAs.length === 0
                      ? 'Not proposed yet'
                      : `Proposed to ${proposedAs
                          .map((proposal) => proposal.eventName ?? (proposal.kind === 'meetup' ? 'a meetup' : 'DevFest'))
                          .join(', ')}`}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link href={`/portal/talks/${savedTalk.id}`} aria-label={`Edit ${savedTalk.talkTitle}`} className={linkButton}>
                    Edit
                  </Link>
                  <Link href={`/portal/propose?talk=${savedTalk.id}`} aria-label={`Propose ${savedTalk.talkTitle}`} className="inline-flex items-center px-5 py-2 text-sm font-bold text-white rounded bg-google-blue-deep transition-opacity hover:opacity-80">
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

function Proposals({ proposals }: { proposals: PortalOverview['proposals'] }) {
  if (proposals.length === 0) return null;
  return (
    <section aria-labelledby="proposals-heading" className="mt-12">
      <h2 id="proposals-heading" className="text-2xl font-bold mb-5">Your proposals</h2>
      <ul className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 sm:px-8">
        {proposals.map((proposal) => {
          const style = PORTAL_STATUS_STYLES[proposal.status];
          return (
            <li key={proposal.id} className="py-5 border-t border-white/10 first:border-t-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="min-w-0">
                <p className="font-bold text-white">{proposal.talkTitle}</p>
                <p className="mt-1 font-mono text-sm text-white/60">
                  {proposal.eventName ?? (proposal.kind === 'meetup' ? 'GDG Sydney meetup' : 'DevFest Sydney')}
                  {proposal.submittedAt && ` · sent ${formatEventDate(proposal.submittedAt, 'Australia/Sydney')}`}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className={`inline-flex items-center gap-2 text-sm font-bold ${style.text}`}>
                  <span aria-hidden="true" className={`w-2 h-2 rounded-full ${style.dot}`} />
                  {PORTAL_STATUS_LABELS[proposal.status]}
                </span>
                {proposal.confirmUrl && (
                  <a href={proposal.confirmUrl} aria-label={`Confirm you will give ${proposal.talkTitle}`} className="inline-flex px-4 py-1.5 text-sm font-bold text-white rounded bg-google-green-deep transition-opacity hover:opacity-80">
                    Confirm
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
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

  return (
    <PortalShell email={session.email}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
        <div>
          <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight">
            {overview?.profiles.length ? `Hi, ${overview.profiles[0].name.trim().split(/\s+/)[0]}` : 'Welcome'}
          </h1>
          <p className="mt-2 text-white/70">Your speaker profile, talks and proposals with GDG Sydney.</p>
        </div>
        <Link href="/portal/propose" aria-label="Propose a talk" className="inline-flex self-start sm:self-auto px-7 py-2 bg-google-blue-deep text-white font-bold rounded transition-opacity hover:opacity-80">
          Propose a talk
        </Link>
      </div>

      {!overview ? (
        <p role="alert" className="rounded-2xl border border-google-red/30 bg-google-red/10 px-6 py-5 text-white/80">
          We couldn&rsquo;t load your talks just now. Please refresh the page in a moment.
        </p>
      ) : (
        <>
          {overview.profiles.length > 0 ? (
            <div className="space-y-6">
              {overview.profiles.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-2">No speaker profile yet</h2>
              <p className="text-white/70 leading-relaxed">
                Your profile is set up when a talk of yours is accepted. Until then you can propose a
                talk, and follow it here. Spoken for us before under another address? Sign in with
                that one, or write to{' '}
                <a href="mailto:hello@gdgsydney.com" className="text-google-blue hover:underline">hello@gdgsydney.com</a>.
              </p>
            </div>
          )}
          <SavedTalks savedTalks={savedTalks} proposals={overview.proposals} />
          <Proposals proposals={overview.proposals} />
        </>
      )}
    </PortalShell>
  );
}
