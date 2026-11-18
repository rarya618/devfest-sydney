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
  // The button is only for after an attempt has failed: before the first one starts it would
  // make the page look broken for a moment.
  const [hasFailed, setHasFailed] = useState(false);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);
  // React runs effects twice in development; the link works once, so only try once.
  const hasTriedAutomatically = useRef(false);

  const signIn = useCallback(() => {
    setAlertMessage(null);
    startTransition(async () => {
      // Redirects on success; anything returned is a problem to show.
      const result = await completePortalSignIn(token);
      if (result?.error) {
        setAlertMessage(result.error);
        setHasFailed(true);
      }
    });
  }, [token]);

  useEffect(() => {
    if (hasTriedAutomatically.current) return;
    hasTriedAutomatically.current = true;
    signIn();
  }, [signIn]);

  return (
    <>
      <p role="status" className="mb-6 text-white/70">{hasFailed && !isPending ? 'That didn’t work.' : 'Signing you in…'}</p>
      {hasFailed && (
        <button type="button" onClick={signIn} disabled={isPending} aria-label={`Try signing in as ${email} again`} className={primaryButton}>
          {isPending ? 'Signing in…' : 'Try again'}
        </button>
      )}
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
