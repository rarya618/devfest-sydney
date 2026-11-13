import type { Metadata } from 'next';
import Link from 'next/link';
import { peekSignInLink } from '@/lib/portalAuth';
import PortalShell from '../../PortalShell';
import VerifySignIn from './VerifySignIn';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Sign in',
  // The token is in the URL: don't hand it to any site linked from here.
  referrer: 'no-referrer',
};

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

// Opened from the sign-in email. Loading the page only looks the link up; signing in is
// behind the button, so a mail scanner fetching the URL neither signs in nor uses it up.
export default async function PortalVerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;
  let email: string | null = null;
  let couldNotCheck = false;
  if (token) {
    try {
      email = await peekSignInLink(token);
    } catch (error) {
      console.error('Portal sign-in link lookup failed:', error);
      couldNotCheck = true;
    }
  }

  return (
    <PortalShell>
      <div className="max-w-md mx-auto">
        {email && token ? (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-4">Sign in</h1>
            <p className="text-white/70 leading-relaxed mb-8">
              You&rsquo;re signing in to the speaker portal as <span className="text-white font-bold">{email}</span>.
            </p>
            <VerifySignIn token={token} email={email} />
          </>
        ) : (
          <>
            <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight mb-4">
              {couldNotCheck ? 'We couldn’t check this link' : 'This link isn’t working'}
            </h1>
            <p className="text-white/70 leading-relaxed mb-8">
              {couldNotCheck
                ? 'Something went wrong on our side. Please open the link from your email again in a moment.'
                : 'Sign-in links work once and run out after 30 minutes. Ask for a new one and use the newest email.'}
            </p>
            <Link
              href="/portal/sign-in"
              aria-label="Ask for a new sign-in link"
              className="inline-flex px-7 py-2 bg-google-blue-deep text-white font-bold rounded transition-opacity hover:opacity-80"
            >
              Get a new link
            </Link>
          </>
        )}
      </div>
    </PortalShell>
  );
}
