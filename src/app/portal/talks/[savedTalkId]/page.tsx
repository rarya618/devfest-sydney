import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadOwnedSavedTalk } from '@/lib/portalSavedTalks';
import PortalShell from '../../PortalShell';
import SavedTalkEditor from '../SavedTalkEditor';

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
    <PortalShell email={session.email}>
      <Link href="/portal" aria-label="Back to your talks" className="font-mono text-sm text-white/60 hover:text-white">
        ← Your talks
      </Link>
      <div className="mt-4 mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight">Edit talk</h1>
        <Link href={`/portal/propose?talk=${savedTalk.id}`} aria-label={`Propose ${savedTalk.talkTitle}`} className="inline-flex self-start px-6 py-2 bg-google-blue-deep text-white font-bold rounded transition-opacity hover:opacity-80">
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
