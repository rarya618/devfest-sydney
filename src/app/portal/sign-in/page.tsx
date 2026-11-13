import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/portalAuth';
import PortalShell from '../PortalShell';
import SignInForm from './SignInForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign in' };

export default async function PortalSignInPage() {
  // A failed read shows the form rather than an error: signing in again is harmless.
  const session = await getPortalSession().catch(() => null);
  if (session) redirect('/portal');

  return (
    <PortalShell>
      <div className="max-w-md mx-auto">
        <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-4">
          Speak at GDG Sydney
        </h1>
        <p className="text-white/70 leading-relaxed mb-8">
          Keep your speaker profile up to date, see your talks, and propose new ones for DevFest
          or a meetup. Enter your email and we&rsquo;ll send you a link to sign in. If you&rsquo;ve
          spoken for us before, use the address we have for you.
        </p>
        <SignInForm />
      </div>
    </PortalShell>
  );
}
