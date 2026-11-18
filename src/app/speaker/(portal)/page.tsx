import type { Metadata } from 'next';
import { isFlowOpen, loadCurrentDevfest } from '@/lib/events';
import { requirePortalSession } from '@/lib/portalAuth';
import {
  loadPortalOverview,
  type PortalOverview,
  type PortalProposal,
} from '@/lib/portalData';
import { listSavedTalks, type SavedTalk } from '@/lib/portalSavedTalks';
import type { GdgEvent } from '@/lib/types';
import PortalShell from './PortalShell';
import SavedTalksSection, { type SavedTalkRow } from './SavedTalksSection';
import DashboardWorkspace from './DashboardWorkspace';
import { buildAgenda, type AgendaTalk } from './agendaItems';
import ActionNeeded from './ActionNeeded';
import { pageHeading } from './portalStyles';

export const dynamic = 'force-dynamic';
// The layout's title template doesn't reach a page in its own segment.
export const metadata: Metadata = { title: { absolute: 'Your talks | GDG Sydney speaker portal' } };

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
  const allTalks: AgendaTalk[] = (overview?.profiles ?? []).flatMap((profile) =>
    profile.talks.map((talk) => ({ ...talk, speakerName: profile.name }))
  );
  const now = new Date();
  const agenda = buildAgenda(overview?.proposals ?? [], allTalks, now);

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
          agenda={{ ...agenda, todayIso: now.toISOString() }}
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
          <SavedTalksSection savedTalks={toSavedTalkRows(savedTalks, overview.proposals)} />
        </DashboardWorkspace>
      )}
    </PortalShell>
  );
}
