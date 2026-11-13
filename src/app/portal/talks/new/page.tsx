import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePortalSession } from '@/lib/portalAuth';
import PortalShell from '../../PortalShell';
import SavedTalkEditor from '../SavedTalkEditor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Add a talk' };

export default async function NewSavedTalkPage() {
  const session = await requirePortalSession();
  return (
    <PortalShell email={session.email}>
      <Link href="/portal" aria-label="Back to your talks" className="font-mono text-sm text-white/60 hover:text-white">
        ← Your talks
      </Link>
      <h1 className="mt-4 mb-3 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight">Add a talk</h1>
      <p className="mb-10 text-white/70 leading-relaxed">
        Keep a talk here and propose it when you&rsquo;re ready, to a meetup, to DevFest, or both. Nobody sees
        it until you send it as a proposal.
      </p>
      <SavedTalkEditor savedTalkId={null} initialFields={{ talkTitle: '', abstract: '', audience: '' }} proposedCount={0} />
    </PortalShell>
  );
}
