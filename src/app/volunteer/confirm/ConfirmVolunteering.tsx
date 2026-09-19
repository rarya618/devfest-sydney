'use client';

import { useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { confirmVolunteering } from './actions';
import VolunteerNextSteps, { type VolunteerLinks } from './VolunteerNextSteps';

interface ConfirmVolunteeringProps {
  token: string;
  name: string;
  // Rendered here rather than on the page so it disappears along with the button: a
  // "we need to hear from you by the 10th" line left standing under a confirmation reads
  // as though the click didn't take.
  intro: string;
}

export default function ConfirmVolunteering({ token, name, intro }: ConfirmVolunteeringProps) {
  const [isPending, startTransition] = useTransition();
  const [links, setLinks] = useState<VolunteerLinks | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmVolunteering(token);
      if (result.error || !result.links) {
        setError(result.error ?? 'We couldn\'t record your confirmation just now. Please try again in a moment.');
      } else {
        setLinks(result.links);
      }
    });
  }

  if (links) {
    return (
      <>
        <div
          role="status"
          className="rounded-2xl border border-google-green/30 bg-google-green/10 px-6 py-8 text-center"
        >
          <p className="text-2xl font-bold text-google-green">You&rsquo;re on the crew</p>
          <p className="mt-3 text-white/70 leading-relaxed">
            Thanks for confirming. We&rsquo;ll be in touch closer to the day with the run sheet,
            your arrival time, and who to find when you get there.
          </p>
        </div>
        <VolunteerNextSteps {...links} />
      </>
    );
  }

  return (
    <>
      <p className="text-white/70 leading-relaxed mb-8">{intro}</p>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        aria-label={`Confirm you will be volunteering at DevFest Sydney 2026 as ${name}`}
        className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-green-deep text-white text-base font-bold rounded
          border border-google-green-deep transition-opacity hover:opacity-80
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-google-green-deep disabled:hover:text-white"
      >
        {isPending ? 'Confirming…' : 'Confirm you’re coming'}
      </button>
      {error && <Alert message={error} onDismiss={() => setError(null)} />}
    </>
  );
}
