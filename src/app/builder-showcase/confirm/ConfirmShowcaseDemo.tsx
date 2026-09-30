'use client';

import { useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { confirmShowcaseDemo } from './actions';

interface ConfirmShowcaseDemoProps {
  token: string;
  projectName: string;
  // Rendered here rather than on the page so it disappears along with the button: a
  // "we need to hear from you by the 5th" line left standing under a confirmation reads
  // as though the click didn't take.
  intro: string;
}

export default function ConfirmShowcaseDemo({ token, projectName, intro }: ConfirmShowcaseDemoProps) {
  const [isPending, startTransition] = useTransition();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmShowcaseDemo(token);
      if (result.error) {
        setError(result.error);
      } else {
        setIsConfirmed(true);
      }
    });
  }

  if (isConfirmed) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-google-yellow/30 bg-google-yellow/10 px-6 py-8 text-center"
      >
        <p className="text-2xl font-bold text-google-yellow">See you on stage</p>
        <p className="mt-3 text-white/70 leading-relaxed">
          Thanks for confirming. We&rsquo;ll be in touch closer to the day with the running order
          and when to be at the stage for a quick tech check.
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
        aria-label={`Confirm you will demo ${projectName} in the DevFest Sydney 2026 Builder Showcase`}
        className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-yellow text-black-02 text-base font-bold rounded
          border border-google-yellow transition-opacity hover:opacity-80
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirming…' : 'Confirm your demo'}
      </button>
      {error && <Alert message={error} onDismiss={() => setError(null)} />}
    </>
  );
}
