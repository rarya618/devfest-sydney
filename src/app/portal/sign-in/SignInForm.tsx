'use client';

import { useCallback, useState, useTransition, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import { EMAIL_PATTERN } from '@/lib/emailPattern';
import { errorClass, inputError, inputNormal, labelClass, submitClass } from '@/lib/formStyles';
import { requestPortalSignIn } from '../actions';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError('Please enter a valid email address.');
      document.getElementById('portal-email')?.focus();
      return;
    }
    startTransition(async () => {
      const result = await requestPortalSignIn(email, honeypot);
      if ('error' in result) setAlertMessage(result.error);
      else setSentTo(email.trim());
    });
  }

  if (sentTo) {
    return (
      <div role="status" className="rounded-2xl border border-google-green/30 bg-google-green/10 px-6 py-8">
        <p className="text-xl font-bold text-google-green mb-3">Check your inbox</p>
        <p className="text-white/70 leading-relaxed">
          We&rsquo;ve sent a sign-in link to <span className="text-white font-bold">{sentTo}</span>. It works
          once, for the next 30 minutes. Nothing there after a few minutes? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            aria-label="Use a different email address"
            className="text-google-blue underline hover:no-underline"
          >
            try another address
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <label htmlFor="portal-email" className={labelClass}>Email address</label>
          <input
            id="portal-email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'portal-email-error' : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldError(null);
            }}
            className={fieldError ? inputError : inputNormal}
          />
          {fieldError && <p id="portal-email-error" role="alert" className={errorClass}>{fieldError}</p>}
        </div>
        {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="portal-company-website">Company website</label>
          <input id="portal-company-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        </div>
        <button type="submit" disabled={isPending} aria-label="Email me a sign-in link" className={submitClass}>
          {isPending ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
