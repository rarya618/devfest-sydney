'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { primaryButton } from '../../portalStyles';
import { completePortalSignIn } from '../../actions';

// Signs in as soon as the page opens (decided 2026-11-14), so a click in the email is all it
// takes. Mail scanners that only fetch the page never run this, so they don't use the link
// up; scanners that run JavaScript can, and the speaker then asks for a new link. The button
// stays as the fallback when the automatic attempt fails for a passing reason.
export default function VerifySignIn({ token, email }: { token: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);
  // React runs effects twice in development; the link works once, so only try once.
  const hasTriedAutomatically = useRef(false);

  const signIn = useCallback(() => {
    startTransition(async () => {
      // Redirects on success; anything returned is a problem to show.
      const result = await completePortalSignIn(token);
      if (result?.error) setAlertMessage(result.error);
    });
  }, [token]);

  useEffect(() => {
    if (hasTriedAutomatically.current) return;
    hasTriedAutomatically.current = true;
    signIn();
  }, [signIn]);

  return (
    <>
      <p role="status" className="mb-6 text-white/70">{isPending ? 'Signing you in…' : alertMessage ? 'That didn’t work.' : ''}</p>
      <button type="button" onClick={signIn} disabled={isPending} aria-label={`Sign in as ${email}`} className={primaryButton}>
        {isPending ? 'Signing in…' : 'Try again'}
      </button>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
