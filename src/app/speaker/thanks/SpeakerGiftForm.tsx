'use client';

import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import Alert from '@/components/Alert';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import {
  ASANA_CONSENT_LABEL,
  findSpeakerGiftErrors,
  type SpeakerGiftErrors,
  type SpeakerGiftFormFields,
} from '@/lib/speakerGiftLabels';
import { errorClass, hintClass, inputError, inputNormal, labelClass, submitClass } from '../../jobs/formStyles';

type SubmitState = 'idle' | 'submitting' | 'success';
type TextFieldKey = { [Key in keyof SpeakerGiftFormFields]: SpeakerGiftFormFields[Key] extends string ? Key : never }[keyof SpeakerGiftFormFields];

const required = <span className="text-google-red-light" aria-hidden="true">*</span>;
const checkboxClass = 'mt-0.5 w-5 h-5 shrink-0 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue';

// Each half has a tick that opens it. The fields' order is what fits most countries'
// address formats; region and postcode are optional because not everywhere has them.
const ADDRESS_FIELDS: { key: TextFieldKey; label: string; autoComplete: string; required: boolean; hint?: string; type?: string }[] = [
  { key: 'recipientName', label: 'Name for the parcel', autoComplete: 'shipping name', required: true },
  { key: 'addressLine1', label: 'Street address', autoComplete: 'shipping address-line1', required: true },
  { key: 'addressLine2', label: 'Apartment, unit or company', autoComplete: 'shipping address-line2', required: false, hint: 'Optional.' },
  { key: 'city', label: 'City or suburb', autoComplete: 'shipping address-level2', required: true },
  { key: 'region', label: 'State or region', autoComplete: 'shipping address-level1', required: false, hint: 'If your country uses one.' },
  { key: 'postcode', label: 'Postcode', autoComplete: 'shipping postal-code', required: false, hint: 'If your country uses one.' },
  { key: 'country', label: 'Country', autoComplete: 'shipping country-name', required: true },
  {
    key: 'phone',
    label: 'Phone number',
    autoComplete: 'tel',
    required: true,
    type: 'tel',
    hint: 'With your country code. Couriers ask for one on international parcels, and we only pass it to them.',
  },
];

interface Props {
  token: string;
  initialFields: SpeakerGiftFormFields;
  // When they last saved, for a speaker coming back to change something. Null on a first visit.
  savedAt: string | null;
}

export default function SpeakerGiftForm({ token, initialFields, savedAt }: Props) {
  const [fields, setFields] = useState<SpeakerGiftFormFields>(initialFields);
  const [errors, setErrors] = useState<SpeakerGiftErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function update<Key extends keyof SpeakerGiftFormFields>(key: Key, value: SpeakerGiftFormFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined, form: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = findSpeakerGiftErrors(fields, EMAIL_PATTERN);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`gift-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitState('submitting');
    try {
      const response = await fetch('/api/submit-speaker-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong saving your details. Please try again.');
      }
      setSubmitState('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitState('idle');
      setAlertMessage(error instanceof Error ? error.message : 'Something went wrong saving your details. Please try again.');
    }
  }

  function fieldError(key: keyof SpeakerGiftErrors): ReactNode {
    return errors[key] ? (
      <p id={`gift-${key}-error`} role="alert" className={errorClass}>{errors[key]}</p>
    ) : null;
  }

  if (submitState === 'success') {
    return (
      <div className="text-center animate-slide-up">
        <h2 className="text-xl font-bold text-white mb-3">Got it, thank you</h2>
        <p className="text-white/70 leading-relaxed">
          {fields.wantsMug && fields.wantsAsanaTrial
            ? 'We\'ll post your mug and pass your work email to Asana, who will be in touch about the trial.'
            : fields.wantsMug
              ? 'We\'ll post your mug and email you if the courier needs anything.'
              : 'We\'ll pass your work email to Asana, who will be in touch about the trial.'}{' '}
          Need to change something? Come back to this link any time before we send them out.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-8 text-left">
        {savedAt && (
          <p className="text-sm text-white/70 leading-relaxed bg-black/20 border border-white/10 rounded-xl px-4 py-3">
            We have your details from {new Date(savedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', timeZone: 'Australia/Sydney' })}.
            Change anything below and save again.
          </p>
        )}

        <fieldset className="space-y-5">
          <legend className="sr-only">Speaker mug</legend>
          <label htmlFor="gift-wantsMug" className="flex items-start gap-3 cursor-pointer">
            <input
              id="gift-wantsMug"
              type="checkbox"
              checked={fields.wantsMug}
              onChange={(event) => update('wantsMug', event.target.checked)}
              className={checkboxClass}
            />
            <span>
              <span className="block font-bold text-white">Send me a speaker mug</span>
              <span className="block text-sm text-white/60 leading-relaxed">Posted to you, wherever you are in the world.</span>
            </span>
          </label>

          {fields.wantsMug && (
            <div className="space-y-5 pl-8">
              {ADDRESS_FIELDS.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`gift-${field.key}`} className={labelClass}>
                    {field.label} {field.required && required}
                  </label>
                  <input
                    id={`gift-${field.key}`}
                    type={field.type ?? 'text'}
                    autoComplete={field.autoComplete}
                    value={fields[field.key]}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={errors[field.key] ? `gift-${field.key}-error` : field.hint ? `gift-${field.key}-hint` : undefined}
                    onChange={(event) => update(field.key, event.target.value)}
                    className={errors[field.key] ? inputError : inputNormal}
                  />
                  {errors[field.key]
                    ? fieldError(field.key)
                    : field.hint && <p id={`gift-${field.key}-hint`} className={hintClass}>{field.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-5 pt-6 border-t border-white/10">
          <legend className="sr-only">Asana Enterprise trial</legend>
          <label htmlFor="gift-wantsAsanaTrial" className="flex items-start gap-3 cursor-pointer">
            <input
              id="gift-wantsAsanaTrial"
              type="checkbox"
              checked={fields.wantsAsanaTrial}
              onChange={(event) => update('wantsAsanaTrial', event.target.checked)}
              className={checkboxClass}
            />
            <span>
              <span className="block font-bold text-white">I&apos;d like the Asana Enterprise trial</span>
              <span className="block text-sm text-white/60 leading-relaxed">Courtesy of Asana, one of our sponsors. Asana sets it up and gets in touch with you directly.</span>
            </span>
          </label>

          {fields.wantsAsanaTrial && (
            <div className="space-y-5 pl-8">
              <div>
                <label htmlFor="gift-workEmail" className={labelClass}>Work email {required}</label>
                <input
                  id="gift-workEmail"
                  type="email"
                  autoComplete="work email"
                  value={fields.workEmail}
                  aria-invalid={Boolean(errors.workEmail)}
                  aria-describedby={errors.workEmail ? 'gift-workEmail-error' : 'gift-workEmail-hint'}
                  onChange={(event) => update('workEmail', event.target.value)}
                  className={errors.workEmail ? inputError : inputNormal}
                />
                {errors.workEmail ? fieldError('workEmail') : (
                  <p id="gift-workEmail-hint" className={hintClass}>The trial is set up for your organisation, so use your work address rather than a personal one.</p>
                )}
              </div>

              <div>
                <label htmlFor="gift-asanaConsent" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="gift-asanaConsent"
                    type="checkbox"
                    checked={fields.asanaConsent}
                    aria-invalid={Boolean(errors.asanaConsent)}
                    aria-describedby={errors.asanaConsent ? 'gift-asanaConsent-error' : undefined}
                    onChange={(event) => update('asanaConsent', event.target.checked)}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-white/85 leading-relaxed">{ASANA_CONSENT_LABEL}</span>
                </label>
                {fieldError('asanaConsent')}
              </div>
            </div>
          )}
        </fieldset>

        {errors.form && <p id="gift-form" tabIndex={-1} role="alert" className={errorClass}>{errors.form}</p>}

        <div>
          <button type="submit" disabled={submitState === 'submitting'} aria-label="Save your details for the mug and the Asana trial" className={submitClass}>
            {submitState === 'submitting' ? 'Saving…' : savedAt ? 'Save changes' : 'Send my details'}
          </button>
          <p className="text-xs text-white/50 mt-3">
            We use your address only to post the mug and delete it once it ships. See our{' '}
            <a href="/privacy#speaker-gifts" className="hover:text-white/85 underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
