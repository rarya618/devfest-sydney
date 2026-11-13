'use client';

import { useCallback, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { primaryButton } from '../../portalStyles';
import { completePortalSignIn } from '../../actions';

export default function VerifySignIn({ token, email }: { token: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function handleSignIn() {
    startTransition(async () => {
      // Redirects to /speaker on success; anything returned is a problem to show.
      const result = await completePortalSignIn(token);
      if (result?.error) setAlertMessage(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={handleSignIn} disabled={isPending} aria-label={`Sign in as ${email}`} className={primaryButton}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
