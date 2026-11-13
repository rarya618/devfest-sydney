'use client';

import { useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { optOutOfVolunteerInvites } from './actions';

// Behind a button rather than on page load: mail scanners fetch links on their own, and a
// GET that wrote would take people off the list without their asking.
export default function OptOutButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isDone) {
    return (
      <p role="status" className="text-white/70 leading-relaxed">
        Done. We won&rsquo;t send you volunteer invites any more. If you change your mind, write to
        hello@gdgsydney.com.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await optOutOfVolunteerInvites(token);
            if (result.error) setError(result.error);
            else setIsDone(true);
          })
        }
        aria-label="Stop sending me GDG Sydney volunteer invites"
        className="inline-flex items-center justify-center px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded-full border border-google-blue-deep transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Stop inviting me'}
      </button>
      {error && <Alert message={error} onDismiss={() => setError(null)} />}
    </>
  );
}
