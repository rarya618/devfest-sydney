import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadOwnedProfile } from '@/lib/portalData';
import PortalShell from '../../PortalShell';
import { backLink, pageHeading } from '../../portalStyles';
import ProfileEditor from './ProfileEditor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your profile' };

interface ProfilePageProps {
  params: Promise<{ speakerId: string }>;
}

export default async function PortalProfilePage({ params }: ProfilePageProps) {
  const session = await requirePortalSession();
  const { speakerId } = await params;
  // Someone else's profile and a missing one look the same: not found.
  const profile = await loadOwnedProfile(session.email, speakerId);
  if (!profile) notFound();

  return (
    <PortalShell email={session.email}>
      <Link href="/portal" aria-label="Back to your talks" className={backLink}>
        <span aria-hidden="true">←</span> Your talks
      </Link>
      <h1 className={`${pageHeading} mt-6`}>Your profile</h1>
      <p className="mt-4 mb-12 max-w-2xl text-white/70 leading-relaxed">
        The card shows what people see next to your talks, and changes as you type. Saving publishes it. To
        change your name or email address, write to{' '}
        <a href="mailto:hello@gdgsydney.com" className="text-google-blue-light underline hover:no-underline">hello@gdgsydney.com</a>.
      </p>
      <ProfileEditor profile={profile} />
    </PortalShell>
  );
}
