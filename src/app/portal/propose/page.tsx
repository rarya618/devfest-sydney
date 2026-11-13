import type { Metadata } from 'next';
import Link from 'next/link';
import { isFlowOpen, loadCurrentDevfest } from '@/lib/events';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadOwnedProfiles } from '@/lib/portalData';
import type { GdgEvent } from '@/lib/types';
import PortalShell from '../PortalShell';
import ProposalForm from './ProposalForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Propose a talk' };

export default async function PortalProposePage() {
  const session = await requirePortalSession();

  let profiles: Awaited<ReturnType<typeof loadOwnedProfiles>> = [];
  let devfest: GdgEvent | null = null;
  let loadFailed = false;
  try {
    [profiles, devfest] = await Promise.all([loadOwnedProfiles(session.email), loadCurrentDevfest()]);
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
        We&rsquo;ll email you a copy, and you can follow it from your portal. You can send as many
        proposals as you like.
      </p>
      {loadFailed ? (
        <p role="alert" className="rounded-2xl border border-google-red/30 bg-google-red/10 px-6 py-5 text-white/80">
          We couldn&rsquo;t load the proposal form just now. Please refresh the page in a moment.
        </p>
      ) : (
        <ProposalForm profiles={profiles} openDevfest={openDevfest} />
      )}
    </PortalShell>
  );
}
