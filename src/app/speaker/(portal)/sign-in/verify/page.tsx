import type { Metadata } from 'next';
import Link from 'next/link';
import { peekSignInLink } from '@/lib/portalAuth';
import PortalShell from '../../PortalShell';
import { pageHeading, primaryButton } from '../../portalStyles';
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

// Opened from the sign-in email. The server render only looks the link up, so a scanner that
// fetches the URL without running JavaScript neither signs in nor uses it up; VerifySignIn then
// signs in from the browser straight away.
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
    <PortalShell width="narrow">
      <div className="max-w-md">
        {email && token ? (
          <>
            <h1 className={pageHeading}>Sign in</h1>
            <p className="mt-5 mb-4 text-white/70 leading-relaxed">
              As <span className="text-white font-bold">{email}</span>.
            </p>
            <VerifySignIn token={token} email={email} />
          </>
        ) : (
          <>
            <h1 className={pageHeading}>
              {couldNotCheck ? 'We couldn’t check this link' : 'This link isn’t working'}
            </h1>
            <p className="mt-5 mb-10 text-white/70 leading-relaxed">
              {couldNotCheck
                ? 'Something went wrong on our side. Please open the link from your email again in a moment.'
                : 'Sign-in links work once and run out after 30 minutes. Ask for a new one and use the newest email.'}
            </p>
            <Link
              href="/speaker/sign-in"
              aria-label="Ask for a new sign-in link"
              className={primaryButton}
            >
              Get a new link
            </Link>
          </>
        )}
      </div>
    </PortalShell>
  );
}
