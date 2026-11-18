'use client';

import { useCallback, useEffect, useState, useTransition, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import { EMAIL_PATTERN } from '@/lib/emailPattern';
import { errorClass, inputError, inputNormal, labelClass } from '@/lib/formStyles';
import { primaryButton, secondaryButton } from '../portalStyles';
import { requestPortalSignIn } from '../actions';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissAlert = useCallback(() => setAlertMessage(null), []);
  // The server sends one link a minute per address, so "Send it again" waits that long.
  const [canResend, setCanResend] = useState(false);
  const [resentCount, setResentCount] = useState(0);

  useEffect(() => {
    if (!sentTo) return;
    setCanResend(false);
    const timer = setTimeout(() => setCanResend(true), 60_000);
    return () => clearTimeout(timer);
  }, [sentTo, resentCount]);

  function resend() {
    if (!sentTo) return;
    setAlertMessage(null);
    startTransition(async () => {
      const result = await requestPortalSignIn(sentTo, honeypot);
      if ('error' in result) setAlertMessage(result.error);
      else setResentCount((count) => count + 1);
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlertMessage(null);
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
      <>
        <div role="status" className="rounded-3xl bg-google-green/10 px-6 py-6 sm:px-8">
          <p className="text-xl font-bold text-google-green mb-3">{resentCount > 0 ? 'Sent again' : 'Check your inbox'}</p>
          <p className="text-white/70 leading-relaxed">
            We&rsquo;ve sent a sign-in link to <span className="text-white font-bold">{sentTo}</span>. It works
            once, for the next 30 minutes. Nothing there after a few minutes? Check your spam folder.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={!canResend || isPending}
              aria-label={`Send another sign-in link to ${sentTo}`}
              className={secondaryButton}
            >
              {isPending ? 'Sending…' : 'Send it again'}
            </button>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              aria-label="Use a different email address"
              className="text-sm text-google-blue-light underline underline-offset-2 hover:no-underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
            >
              Use another address
            </button>
          </div>
          {!canResend && <p className="mt-3 text-xs text-white/60">You can ask for another link in a minute.</p>}
        </div>
        {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
      </>
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
        <button type="submit" disabled={isPending} aria-label="Email me a sign-in link" className={primaryButton}>
          {isPending ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
