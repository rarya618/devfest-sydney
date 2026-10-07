'use client';

import Link from 'next/link';
import { useCallback, useState, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import { EMAIL_PATTERN, JOB_LIMITS, WORK_ARRANGEMENTS, WORK_ARRANGEMENT_LABELS } from '@/lib/jobBoardLabels';
import type { WorkArrangement } from '@/lib/types';
import { errorClass, hintClass, inputError, inputNormal, labelClass, optionButtonClass, submitClass } from '../../formStyles';

type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  name: string;
  email: string;
  headline: string;
  about: string;
  lookingFor: string;
  location: string;
  workArrangements: WorkArrangement[];
  linkedinUrl: string;
  portfolioUrl: string;
  consentToPublish: boolean;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;
type TextFieldName = Exclude<keyof FormFields, 'workArrangements' | 'consentToPublish'>;

export default function JobSeekerForm() {
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    headline: '',
    about: '',
    lookingFor: '',
    location: '',
    workArrangements: [],
    linkedinUrl: '',
    portfolioUrl: '',
    consentToPublish: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!fields.name.trim()) found.name = 'Please enter your name.';
    if (!EMAIL_PATTERN.test(fields.email.trim())) found.email = 'Please enter a valid email address.';
    if (!fields.headline.trim()) found.headline = 'Please add a one-line headline.';
    if (!fields.about.trim()) {
      found.about = 'Please tell employers a little about yourself.';
    } else if (fields.about.length > JOB_LIMITS.about) {
      found.about = `This must be ${JOB_LIMITS.about} characters or fewer.`;
    }
    if (!fields.lookingFor.trim()) found.lookingFor = 'Please say what kind of role you are after.';
    if (!fields.location.trim()) found.location = 'Please enter where you are based.';
    if (fields.workArrangements.length === 0) found.workArrangements = 'Please choose at least one.';
    if (!fields.linkedinUrl.trim()) found.linkedinUrl = 'Please add your LinkedIn profile, so employers can get in touch.';
    if (!fields.consentToPublish) found.consentToPublish = 'Please confirm you are happy for this to be shown publicly.';
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitState('submitting');
    try {
      const response = await fetch('/api/submit-job-seeker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong adding your profile. Please try again.');
      }
      setSubmitState('success');
    } catch (error) {
      setSubmitState('idle');
      setAlertMessage(error instanceof Error ? error.message : 'Something went wrong adding your profile. Please try again.');
    }
  }

  function textField(name: TextFieldName) {
    return {
      id: `seeker-${name}`,
      value: fields[name],
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `seeker-${name}-error` : undefined,
      className: errors[name] ? inputError : inputNormal,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields((previous) => ({ ...previous, [name]: event.target.value }));
        if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
      },
    };
  }

  function fieldError(name: keyof FormFields) {
    return errors[name] ? (
      <p id={`seeker-${name}-error`} role="alert" className={errorClass}>{errors[name]}</p>
    ) : null;
  }

  function toggleArrangement(arrangement: WorkArrangement) {
    setFields((previous) => ({
      ...previous,
      workArrangements: previous.workArrangements.includes(arrangement)
        ? previous.workArrangements.filter((existing) => existing !== arrangement)
        : [...previous.workArrangements, arrangement],
    }));
    setErrors((previous) => ({ ...previous, workArrangements: undefined }));
  }

  if (submitState === 'success') {
    return (
      <div className="bg-surface rounded-2xl p-12 text-center animate-slide-up">
        <h3 className="text-xl font-bold text-white mb-3">Thanks, your profile is in</h3>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
          An organiser will check it shortly and it will appear on the board once approved. We&apos;ve
          emailed you a copy. Reply to that email any time to change or remove it.
        </p>
        <Link
          href="/jobs"
          className="inline-flex mt-6 items-center px-6 py-2 text-white text-sm font-bold rounded border border-white/40 transition-colors hover:border-white"
        >
          See the job board
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="bg-surface rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="seeker-name" className={labelClass}>Name <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="text" autoComplete="name" aria-required="true" maxLength={JOB_LIMITS.name} {...textField('name')} />
            {fieldError('name')}
          </div>
          <div>
            <label htmlFor="seeker-email" className={labelClass}>Email <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="email" autoComplete="email" aria-required="true" {...textField('email')} />
            {errors.email ? fieldError('email') : <p className={hintClass}>So we can reach you about your profile. Never shown on the board.</p>}
          </div>
        </div>

        <div>
          <label htmlFor="seeker-headline" className={labelClass}>Headline <span className="text-google-red-light" aria-hidden="true">*</span></label>
          <input type="text" placeholder="e.g. Flutter developer, 3 years in fintech" aria-required="true" maxLength={JOB_LIMITS.headline} {...textField('headline')} />
          {fieldError('headline')}
        </div>

        <div>
          <label htmlFor="seeker-lookingFor" className={labelClass}>What are you looking for? <span className="text-google-red-light" aria-hidden="true">*</span></label>
          <input type="text" placeholder="e.g. Mid-level mobile or full-stack roles, full-time" aria-required="true" maxLength={JOB_LIMITS.lookingFor} {...textField('lookingFor')} />
          {fieldError('lookingFor')}
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor="seeker-about" className="block text-sm font-bold text-white/85">
              About you <span className="text-google-red-light" aria-hidden="true">*</span>
            </label>
            <span
              aria-label={`${fields.about.length} of ${JOB_LIMITS.about} characters used`}
              className={`text-xs tabular-nums ${fields.about.length > JOB_LIMITS.about ? 'text-google-red-light' : 'text-white/50'}`}
            >
              {fields.about.length}/{JOB_LIMITS.about}
            </span>
          </div>
          <textarea rows={5} placeholder="What you have worked on, what you are good at, and what you want to do next" aria-required="true" {...textField('about')} />
          {fieldError('about')}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="seeker-location" className={labelClass}>Where are you based? <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="text" placeholder="e.g. Inner West, Sydney" aria-required="true" maxLength={JOB_LIMITS.location} {...textField('location')} />
            {fieldError('location')}
          </div>
          <div>
            <p id="seeker-workArrangements-label" className={labelClass}>
              How would you like to work? <span className="text-google-red-light" aria-hidden="true">*</span>
            </p>
            <div role="group" aria-labelledby="seeker-workArrangements-label" aria-describedby={errors.workArrangements ? 'seeker-workArrangements-error' : undefined} className="flex flex-wrap gap-2.5">
              {WORK_ARRANGEMENTS.map((arrangement) => {
                const selected = fields.workArrangements.includes(arrangement);
                return (
                  <button
                    key={arrangement}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleArrangement(arrangement)}
                    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${optionButtonClass(selected, Boolean(errors.workArrangements))}`}
                  >
                    {WORK_ARRANGEMENT_LABELS[arrangement]}
                  </button>
                );
              })}
            </div>
            {fieldError('workArrangements')}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="seeker-linkedinUrl" className={labelClass}>LinkedIn profile <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="url" inputMode="url" placeholder="https://linkedin.com/in/you" aria-required="true" {...textField('linkedinUrl')} />
            {errors.linkedinUrl ? fieldError('linkedinUrl') : <p className={hintClass}>How employers will get in touch.</p>}
          </div>
          <div>
            <label htmlFor="seeker-portfolioUrl" className={labelClass}>Portfolio or GitHub</label>
            <input type="url" inputMode="url" placeholder="https://github.com/you" {...textField('portfolioUrl')} />
            <p className={hintClass}>Optional.</p>
          </div>
        </div>

        <div>
          <label htmlFor="seeker-consent" className="flex items-start gap-3 cursor-pointer">
            <input
              id="seeker-consent"
              type="checkbox"
              checked={fields.consentToPublish}
              aria-invalid={Boolean(errors.consentToPublish)}
              aria-describedby={errors.consentToPublish ? 'seeker-consentToPublish-error' : undefined}
              onChange={(event) => {
                setFields((previous) => ({ ...previous, consentToPublish: event.target.checked }));
                setErrors((previous) => ({ ...previous, consentToPublish: undefined }));
              }}
              className="mt-0.5 w-5 h-5 shrink-0 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue"
            />
            <span className="text-sm text-white/85 leading-relaxed">
              I&apos;m happy for my name and everything above, except my email, to be shown publicly on the
              DevFest Sydney job board. I can ask for it to be removed at any time.
            </span>
          </label>
          {fieldError('consentToPublish')}
        </div>

        <div className="pt-1">
          <button type="submit" disabled={submitState === 'submitting'} aria-label="Submit your profile to the job board" className={submitClass}>
            {submitState === 'submitting' ? 'Submitting…' : 'Submit profile'}
          </button>
          <p className="text-xs text-white/50 mt-3">
            See our{' '}
            <a href="/privacy#job-board" className="hover:text-white/85 underline underline-offset-2">Privacy Policy</a>{' '}
            for how we handle your profile.
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
