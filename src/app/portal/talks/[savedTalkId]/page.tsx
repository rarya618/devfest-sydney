import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadOwnedSavedTalk } from '@/lib/portalSavedTalks';
import PortalShell from '../../PortalShell';
import SavedTalkEditor from '../SavedTalkEditor';
import { backLink, pageHeading, primaryButton } from '../../portalStyles';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Edit talk' };

interface SavedTalkPageProps {
  params: Promise<{ savedTalkId: string }>;
}

export default async function SavedTalkPage({ params }: SavedTalkPageProps) {
  const session = await requirePortalSession();
  const { savedTalkId } = await params;
  const savedTalk = await loadOwnedSavedTalk(session.email, savedTalkId);
  if (!savedTalk) notFound();

  const [devfestProposals, meetupProposals] = await Promise.all([
    adminDb.collection('submissions').where('savedTalkId', '==', savedTalkId).count().get(),
    adminDb.collection('meetupProposals').where('savedTalkId', '==', savedTalkId).count().get(),
  ]);
  const proposedCount = devfestProposals.data().count + meetupProposals.data().count;

  return (
    <PortalShell email={session.email} width="narrow">
      <Link href="/portal" aria-label="Back to your talks" className={backLink}>
        <span aria-hidden="true">←</span> Your talks
      </Link>
      <div className="mt-6 mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h1 className={pageHeading}>Edit talk</h1>
        <Link href={`/portal/propose?talk=${savedTalk.id}`} aria-label={`Propose ${savedTalk.talkTitle}`} className={`${primaryButton} self-start`}>
          Propose this talk
        </Link>
      </div>
      <SavedTalkEditor
        savedTalkId={savedTalk.id}
        initialFields={{ talkTitle: savedTalk.talkTitle, abstract: savedTalk.abstract, audience: savedTalk.audience }}
        proposedCount={proposedCount}
      />
    </PortalShell>
  );
}
