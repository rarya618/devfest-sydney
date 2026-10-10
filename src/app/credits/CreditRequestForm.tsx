'use client';

import Link from 'next/link';
import { useCallback, useState, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import { CREDIT_REQUEST_NAME_LIMIT, CREDIT_REQUEST_NOTE_LIMIT, type CreditWorkshopOption } from '@/lib/creditRequestLabels';
import { errorClass, hintClass, inputError, inputNormal, labelClass, submitClass } from '../jobs/formStyles';

type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  name: string;
  email: string;
  workshopSlotId: string;
  note: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

const required = <span className="text-google-red-light" aria-hidden="true">*</span>;

interface Props {
  workshopOptions: CreditWorkshopOption[];
}

export default function CreditRequestForm({ workshopOptions }: Props) {
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    // With one workshop on offer there is nothing to choose.
    workshopSlotId: workshopOptions.length === 1 ? workshopOptions[0].id : '',
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function update(key: keyof FormFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!fields.name.trim()) found.name = 'Please enter your name.';
    else if (fields.name.trim().length > CREDIT_REQUEST_NAME_LIMIT) found.name = `This must be ${CREDIT_REQUEST_NAME_LIMIT} characters or fewer.`;
    if (!EMAIL_PATTERN.test(fields.email.trim())) found.email = 'Please enter a valid email address, so we can send your credits.';
    if (!fields.workshopSlotId) found.workshopSlotId = 'Please pick the workshop you were in.';
    if (fields.note.length > CREDIT_REQUEST_NOTE_LIMIT) found.note = `This must be ${CREDIT_REQUEST_NOTE_LIMIT} characters or fewer.`;
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`credits-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setSubmitState('submitting');
    try {
      const response = await fetch('/api/submit-credit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong sending your request. Please try again.');
      }
      setSubmitState('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitState('idle');
      setAlertMessage(error instanceof Error ? error.message : 'Something went wrong sending your request. Please try again.');
    }
  }

  function fieldError(name: keyof FormFields) {
    return errors[name] ? (
      <p id={`credits-${name}-error`} role="alert" className={errorClass}>{errors[name]}</p>
    ) : null;
  }

  if (submitState === 'success') {
    return (
      <div className="bg-surface rounded-2xl p-12 text-center animate-slide-up">
        <h2 className="text-xl font-bold text-white mb-3">You&apos;re on the list</h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
          We&apos;ll email your credits to {fields.email.trim()} after the event. Thanks for bearing with us.
        </p>
        <Link
          href="/schedule"
          className="inline-flex mt-6 items-center px-6 py-2 text-white text-sm font-bold rounded border border-white/40 transition-colors hover:border-white"
        >
          Back to the schedule
        </Link>
      </div>
    );
  }

  if (workshopOptions.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-8 text-center">
        <p className="text-white/70 text-sm leading-relaxed">
          We couldn&apos;t load the workshops just now. Please try again in a moment, or email{' '}
          <a href="mailto:hello@gdgsydney.com" className="underline underline-offset-2 hover:text-white">hello@gdgsydney.com</a>.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="bg-surface rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <label htmlFor="credits-name" className={labelClass}>Name {required}</label>
          <input
            id="credits-name"
            type="text"
            autoComplete="name"
            value={fields.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'credits-name-error' : undefined}
            onChange={(event) => update('name', event.target.value)}
            className={errors.name ? inputError : inputNormal}
          />
          {fieldError('name')}
        </div>

        <div>
          <label htmlFor="credits-email" className={labelClass}>Email {required}</label>
          <input
            id="credits-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'credits-email-error' : 'credits-email-hint'}
            onChange={(event) => update('email', event.target.value)}
            className={errors.email ? inputError : inputNormal}
          />
          {errors.email ? fieldError('email') : (
            <p id="credits-email-hint" className={hintClass}>Where we&apos;ll send your credits. We won&apos;t use it for anything else.</p>
          )}
        </div>

        {workshopOptions.length === 1 ? (
          // One workshop on offer: say which, rather than a select with nothing to choose.
          <div>
            <p className={labelClass}>Workshop</p>
            <p className="text-sm text-white/80 font-mono">{workshopOptions[0].label}</p>
          </div>
        ) : (
          <div>
            <label htmlFor="credits-workshopSlotId" className={labelClass}>Workshop {required}</label>
            <select
              id="credits-workshopSlotId"
              value={fields.workshopSlotId}
              aria-invalid={Boolean(errors.workshopSlotId)}
              aria-describedby={errors.workshopSlotId ? 'credits-workshopSlotId-error' : undefined}
              onChange={(event) => update('workshopSlotId', event.target.value)}
              className={`${errors.workshopSlotId ? inputError : inputNormal} [&>option]:bg-black-02`}
            >
              <option value="">Pick the workshop you were in</option>
              {workshopOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            {fieldError('workshopSlotId')}
          </div>
        )}

        <div>
          <label htmlFor="credits-note" className={labelClass}>Anything we should know?</label>
          <textarea
            id="credits-note"
            rows={3}
            value={fields.note}
            placeholder="Optional"
            aria-invalid={Boolean(errors.note)}
            aria-describedby={errors.note ? 'credits-note-error' : undefined}
            onChange={(event) => update('note', event.target.value)}
            className={errors.note ? inputError : inputNormal}
          />
          {fieldError('note')}
        </div>

        <div className="pt-1">
          <button type="submit" disabled={submitState === 'submitting'} aria-label="Request workshop credits" className={submitClass}>
            {submitState === 'submitting' ? 'Sending…' : 'Request credits'}
          </button>
          <p className="text-xs text-white/50 mt-3">
            See our{' '}
            <a href="/privacy#workshop-credits" className="hover:text-white/85 underline underline-offset-2">Privacy Policy</a>{' '}
            for how we handle your details.
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
