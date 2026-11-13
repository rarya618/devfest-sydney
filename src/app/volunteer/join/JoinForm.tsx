'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import { acceptVolunteerInvite } from './actions';
import { VOLUNTEER_AREA_LABELS } from '@/lib/volunteerLabels';
import { hintClass, inputNormal, labelClass, optionButtonClass } from '@/lib/formStyles';
import type { VolunteerArea } from '@/lib/types';

interface JoinFormProps {
  token: string;
  eventName: string;
  phone: string;
  dietaryRequirements: string;
}

// The shared submit button in the volunteer green, as /volunteer/confirm uses.
const GREEN_SUBMIT_CLASS =
  'inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-green-deep text-white text-base font-bold rounded-full border border-google-green-deep transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed';

// The lead-volunteer role is offered by the organisers, not picked from a list.
const OFFERED_AREAS = (Object.keys(VOLUNTEER_AREA_LABELS) as VolunteerArea[]).filter((area) => area !== 'lead-volunteer');

export default function JoinForm({ token, eventName, phone: savedPhone, dietaryRequirements: savedDietary }: JoinFormProps) {
  const [phone, setPhone] = useState(savedPhone);
  const [dietaryRequirements, setDietaryRequirements] = useState(savedDietary);
  const [areasOfInterest, setAreasOfInterest] = useState<VolunteerArea[]>([]);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAreaError, setShowAreaError] = useState(false);

  function toggleArea(area: VolunteerArea) {
    setShowAreaError(false);
    setAreasOfInterest((current) => (current.includes(area) ? current.filter((chosen) => chosen !== area) : [...current, area]));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (areasOfInterest.length === 0) {
      setShowAreaError(true);
      return;
    }
    startTransition(async () => {
      const result = await acceptVolunteerInvite(token, { phone, dietaryRequirements, areasOfInterest, note });
      if (result.error) setError(result.error);
      else setIsDone(true);
    });
  }

  if (isDone) {
    return (
      <div role="status" className="rounded-3xl bg-google-green/10 px-6 py-8">
        <p className="text-2xl font-bold text-google-green">You&rsquo;re in the queue</p>
        <p className="mt-3 text-white/70 leading-relaxed">
          Thanks for coming back. We&rsquo;ll email you to confirm your spot on the {eventName} crew.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-left space-y-6" noValidate>
      <fieldset>
        <legend className={labelClass}>Where would you like to help?</legend>
        <p className={`${hintClass} mt-0 mb-3`}>Pick as many as you like.</p>
        <div className="flex flex-wrap gap-2">
          {OFFERED_AREAS.map((area) => {
            const selected = areasOfInterest.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                aria-pressed={selected}
                aria-label={`${selected ? 'Remove' : 'Add'} ${VOLUNTEER_AREA_LABELS[area]}`}
                className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${optionButtonClass(selected, showAreaError)}`}
              >
                {VOLUNTEER_AREA_LABELS[area]}
              </button>
            );
          })}
        </div>
        {showAreaError && <p className="mt-2 text-xs text-google-red-light">Please choose at least one area.</p>}
      </fieldset>

      <div>
        <label htmlFor="join-phone" className={labelClass}>Phone (optional)</label>
        <input id="join-phone" type="tel" className={inputNormal} value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label htmlFor="join-dietary" className={labelClass}>Dietary requirements (optional)</label>
        <input id="join-dietary" className={inputNormal} value={dietaryRequirements} maxLength={300} onChange={(e) => setDietaryRequirements(e.target.value)} />
      </div>
      <div>
        <label htmlFor="join-note" className={labelClass}>Anything else we should know? (optional)</label>
        <textarea id="join-note" rows={3} className={inputNormal} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isPending} aria-label={`Put me down to volunteer at ${eventName}`} className={GREEN_SUBMIT_CLASS}>
          {isPending ? 'Saving…' : 'Count me in'}
        </button>
      </div>

      {error && <Alert message={error} onDismiss={() => setError(null)} />}
    </form>
  );
}
