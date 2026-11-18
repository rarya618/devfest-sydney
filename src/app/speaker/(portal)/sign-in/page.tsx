import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portalAuth';
import PortalShell from '../PortalShell';
import SignInForm from './SignInForm';
import SignInBadge from '../SignInBadge';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign in' };

export default async function PortalSignInPage() {
  // A failed read shows the form rather than an error: signing in again is harmless.
  const session = await getPortalSession().catch(() => null);
  if (session) redirect('/speaker');

  return (
    <PortalShell width="narrow">
      <SignInBadge>
        <h1 className="text-[clamp(1.75rem,6vw,2.25rem)] font-bold leading-tight tracking-[-0.01em] text-balance text-off-white">Sign in to speak with us.</h1>
        <p className="mt-3 mb-8 text-white/70 leading-relaxed">
          Keep your speaker badge up to date, follow your talks, and propose new ones for DevFest or a
          meetup. We&rsquo;ll email you a link to sign in. If you&rsquo;ve spoken for us before, use the
          address we have for you.
        </p>
        <SignInForm />
      </SignInBadge>
    </PortalShell>
  );
}
