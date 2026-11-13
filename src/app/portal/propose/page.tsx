import type { Metadata } from 'next';
import Link from 'next/link';
import { isFlowOpen, loadCurrentDevfest } from '@/lib/events';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadOwnedProfiles } from '@/lib/portalData';
import { listSavedTalks, type SavedTalk } from '@/lib/portalSavedTalks';
import type { GdgEvent } from '@/lib/types';
import PortalShell from '../PortalShell';
import ProposalForm from './ProposalForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Propose a talk' };

interface ProposePageProps {
  // ?talk=<savedTalkId> starts the form from that saved talk.
  searchParams: Promise<{ talk?: string }>;
}

export default async function PortalProposePage({ searchParams }: ProposePageProps) {
  const session = await requirePortalSession();
  const { talk } = await searchParams;

  let profiles: Awaited<ReturnType<typeof loadOwnedProfiles>> = [];
  let devfest: GdgEvent | null = null;
  let savedTalks: SavedTalk[] = [];
  let loadFailed = false;
  try {
    [profiles, devfest, savedTalks] = await Promise.all([loadOwnedProfiles(session.email), loadCurrentDevfest(), listSavedTalks(session.email)]);
  } catch (error) {
    console.error('Portal propose page failed to load for', session.email, error);
    loadFailed = true;
  }
  const openDevfest = devfest && isFlowOpen(devfest, 'cfs') ? { name: devfest.name, closesAt: devfest.cfs.closesAt } : null;

  return (
    <PortalShell email={session.email}>
      <Link href="/portal" aria-label="Back to your talks" className="font-mono text-sm text-white/60 hover:text-white">
        ← Your talks
      </Link>
      <h1 className="mt-4 mb-3 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight">Propose a talk</h1>
      <p className="mb-10 text-white/70 leading-relaxed">
        We&rsquo;ll email you a copy, and you can follow it from your portal. Not ready to send it?
        Save it for later and it waits under Saved talks.
      </p>
      {loadFailed ? (
        <p role="alert" className="rounded-2xl border border-google-red/30 bg-google-red/10 px-6 py-5 text-white/80">
          We couldn&rsquo;t load the proposal form just now. Please refresh the page in a moment.
        </p>
      ) : (
        <ProposalForm
          profiles={profiles}
          openDevfest={openDevfest}
          savedTalks={savedTalks}
          initialSavedTalkId={savedTalks.some((savedTalk) => savedTalk.id === talk) ? talk! : null}
        />
      )}
    </PortalShell>
  );
}
