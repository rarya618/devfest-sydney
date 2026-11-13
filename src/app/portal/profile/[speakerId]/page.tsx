import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePortalSession } from '@/lib/portalAuth';
import { loadOwnedProfile } from '@/lib/portalData';
import PortalShell from '../../PortalShell';
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
      <Link href="/portal" aria-label="Back to your talks" className="font-mono text-sm text-white/60 hover:text-white">
        ← Your talks
      </Link>
      <h1 className="mt-4 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight">{profile.name}</h1>
      <p className="mt-2 mb-10 text-white/70 leading-relaxed">
        This is what we show next to your talks. Changes go live as soon as you save. To change your
        name or email address, write to{' '}
        <a href="mailto:hello@gdgsydney.com" className="text-google-blue hover:underline">hello@gdgsydney.com</a>.
      </p>
      <ProfileEditor profile={profile} />
    </PortalShell>
  );
}
