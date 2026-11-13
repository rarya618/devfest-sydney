import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePortalSession } from '@/lib/portalAuth';
import PortalShell from '../../PortalShell';
import SavedTalkEditor from '../SavedTalkEditor';
import { backLink, pageHeading } from '../../portalStyles';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Add a talk' };

export default async function NewSavedTalkPage() {
  const session = await requirePortalSession();
  return (
    <PortalShell email={session.email} width="narrow">
      <Link href="/speaker" aria-label="Back to your talks" className={backLink}>
        <span aria-hidden="true">←</span> Your talks
      </Link>
      <h1 className={`${pageHeading} mt-6`}>Add a talk</h1>
      <p className="mt-5 mb-12 text-white/70 leading-relaxed">
        Keep a talk here and propose it when you&rsquo;re ready, to a meetup, to DevFest, or both. Nobody sees
        it until you send it as a proposal.
      </p>
      <SavedTalkEditor savedTalkId={null} initialFields={{ talkTitle: '', abstract: '', audience: '' }} proposedCount={0} />
    </PortalShell>
  );
}
