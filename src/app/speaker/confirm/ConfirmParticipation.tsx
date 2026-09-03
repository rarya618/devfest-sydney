'use client';

import { useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { confirmSpeakerParticipation } from './actions';

interface ConfirmParticipationProps {
  token: string;
  talkTitle: string;
  // Rendered here rather than on the page so it disappears along with the button: a
  // "we need to hear from you by the 10th" line left standing under a confirmation reads
  // as though the click didn't take.
  intro: string;
}

export default function ConfirmParticipation({ token, talkTitle, intro }: ConfirmParticipationProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmSpeakerParticipation(token);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmed(true);
      }
    });
  }

  if (confirmed) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-google-green/30 bg-google-green/10 px-6 py-8 text-center"
      >
        <p className="text-2xl font-bold text-google-green">You&rsquo;re confirmed</p>
        <p className="mt-3 text-white/70 leading-relaxed">
          Thanks for confirming. We&rsquo;ll be in touch with your speaker ticket and the running order for the day.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-white/70 leading-relaxed mb-8">{intro}</p>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        aria-label={`Confirm you will be speaking: ${talkTitle}`}
        className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-green text-white text-base font-bold rounded
          border border-google-green transition-opacity hover:opacity-80
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-google-green disabled:hover:text-white"
      >
        {isPending ? 'Confirming…' : 'Confirm participation'}
      </button>
      {error && <Alert message={error} onDismiss={() => setError(null)} />}
    </>
  );
}
