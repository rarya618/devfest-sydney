'use client';

import { useState, useCallback } from 'react';
import Alert from '@/components/Alert';
import { getTrackingParams } from '@/lib/tracking';

type VolunteerArea = 'registration' | 'av-tech' | 'speaker-support' | 'workshop-facilitator' | 'general-floater' | 'setup-packdown' | 'photography' | 'social-media' | 'merch-table';
type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  name: string;
  email: string;
  phone: string;
  motivation: string;
  areasOfInterest: VolunteerArea[];
  priorExperience: string;
  googleTechExperience: string;
  isTorrensStudentOrStaff: boolean;
  dietaryRequirements: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  motivation?: string;
  areasOfInterest?: string;
}

const AREAS: { value: VolunteerArea; label: string }[] = [
  { value: 'registration', label: 'Registration' },
  { value: 'av-tech', label: 'AV / Tech' },
  { value: 'speaker-support', label: 'Speaker support' },
  { value: 'workshop-facilitator', label: 'Workshop facilitator' },
  { value: 'general-floater', label: 'General floater' },
  { value: 'setup-packdown', label: 'Setup / Pack-down' },
  { value: 'photography', label: 'Photography' },
  { value: 'social-media', label: 'Social media' },
  { value: 'merch-table', label: 'Merch table' },
];

const MOTIVATION_MAX = 1000;

export default function VolunteerForm() {
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    phone: '',
    motivation: '',
    areasOfInterest: [],
    priorExperience: '',
    googleTechExperience: '',
    isTorrensStudentOrStaff: false,
    dietaryRequirements: '',
  });
  const [tracking] = useState<Record<string, string>>(() => getTrackingParams());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fields.name.trim()) errs.name = 'Please enter your full name.';
    if (!fields.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!fields.motivation.trim()) {
      errs.motivation = 'Please tell us why you\'d like to volunteer.';
    } else if (fields.motivation.length > MOTIVATION_MAX) {
      errs.motivation = `Your answer must be ${MOTIVATION_MAX} characters or fewer.`;
    }
    if (fields.areasOfInterest.length === 0) errs.areasOfInterest = 'Please select at least one area of interest.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitState('submitting');
    try {
      const response = await fetch('/api/submit-volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, tracking }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong. Please try again.');
      }
      setSubmitState('success');
    } catch (err) {
      setSubmitState('idle');
      setAlertMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong submitting your signup. Please try again.'
      );
    }
  }

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  type StringField = { [K in keyof FormFields]: FormFields[K] extends string ? K : never }[keyof FormFields];

  function field(name: StringField) {
    return {
      value: fields[name] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields((prev) => ({ ...prev, [name]: e.target.value }));
        if (errors[name as keyof FormErrors]) {
          setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
      },
    };
  }

  function toggleArea(area: VolunteerArea) {
    setFields((prev) => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(area)
        ? prev.areasOfInterest.filter((a) => a !== area)
        : [...prev.areasOfInterest, area],
    }));
    setErrors((prev) => ({ ...prev, areasOfInterest: undefined }));
  }

  if (submitState === 'success') {
    return (
      <div className="bg-white border border-black-02/8 rounded-2xl p-12 text-center animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span
            className="material-symbols-outlined text-google-green text-[32px] flex items-center justify-center shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            check_circle
          </span>
          <h3 className="text-xl font-bold text-black-02">Thanks for signing up!</h3>
        </div>
        <p className="text-black-02/55 text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for offering to volunteer at DevFest Sydney. We&apos;ll be in touch via email with next steps.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full bg-white border rounded-lg px-4 py-3 text-black-02 text-sm placeholder-black-02/30 outline-none transition-colors focus:bg-white';
  const inputNormal = `${inputBase} border-black-02/15 focus:border-google-green/40`;
  const inputError = `${inputBase} border-google-red/40 bg-google-red/5`;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-8 bg-white border border-black-02/8 rounded-2xl p-6 sm:p-10">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="vol-name" className="block text-sm font-bold text-black-02/70 mb-2">
              Full name <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <input
              id="vol-name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              aria-required="true"
              aria-describedby={errors.name ? 'vol-name-error' : undefined}
              aria-invalid={!!errors.name}
              className={errors.name ? inputError : inputNormal}
              {...field('name')}
            />
            {errors.name && (
              <p id="vol-name-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="vol-email" className="block text-sm font-bold text-black-02/70 mb-2">
              Email address <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <input
              id="vol-email"
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              aria-required="true"
              aria-describedby={errors.email ? 'vol-email-error' : undefined}
              aria-invalid={!!errors.email}
              className={errors.email ? inputError : inputNormal}
              {...field('email')}
            />
            {errors.email && (
              <p id="vol-email-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="vol-phone" className="block text-sm font-bold text-black-02/70 mb-2">
            Phone number
          </label>
          <input
            id="vol-phone"
            type="tel"
            autoComplete="tel"
            placeholder="0400 000 000"
            aria-describedby="vol-phone-hint"
            className={inputNormal}
            {...field('phone')}
          />
          <p id="vol-phone-hint" className="mt-1.5 text-xs text-black-02/35">Optional, in case we need to reach you on the day.</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="vol-motivation" className="block text-sm font-bold text-black-02/70">
              Why would you like to volunteer? <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <span
              aria-label={`${fields.motivation.length} of ${MOTIVATION_MAX} characters used`}
              className={`text-xs tabular-nums ${fields.motivation.length > MOTIVATION_MAX ? 'text-google-red' : 'text-black-02/35'}`}
            >
              {fields.motivation.length}/{MOTIVATION_MAX}
            </span>
          </div>
          <textarea
            id="vol-motivation"
            rows={5}
            placeholder="Tell us a bit about yourself and why you'd like to help out"
            aria-required="true"
            aria-describedby={errors.motivation ? 'vol-motivation-error' : undefined}
            aria-invalid={!!errors.motivation}
            className={`${errors.motivation ? inputError : inputNormal} resize-none leading-relaxed`}
            {...field('motivation')}
          />
          {errors.motivation && (
            <p id="vol-motivation-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.motivation}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-black-02/70 mb-3" id="vol-areas-label">
            Areas of interest <span className="text-google-red" aria-hidden="true">*</span>
          </p>
          <div
            role="group"
            aria-labelledby="vol-areas-label"
            aria-describedby={errors.areasOfInterest ? 'vol-areas-error' : undefined}
            className="flex flex-wrap gap-2.5"
          >
            {AREAS.map((area) => {
              const selected = fields.areasOfInterest.includes(area.value);
              return (
                <button
                  key={area.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleArea(area.value)}
                  className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer
                    ${errors.areasOfInterest && !selected
                      ? 'border-google-red/30 bg-google-red/5 text-black-02/60'
                      : selected
                        ? 'border-google-green/50 bg-google-green/10 text-black-02'
                        : 'border-black-02/10 bg-off-white text-black-02/60 hover:border-black-02/20'
                    }`}
                >
                  {selected && (
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      <span
                        className="material-symbols-outlined text-google-green text-[16px] flex items-center justify-center"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        aria-hidden="true"
                      >
                        check_small
                      </span>
                    </span>
                  )}
                  {area.label}
                </button>
              );
            })}
          </div>
          {errors.areasOfInterest && (
            <p id="vol-areas-error" role="alert" className="mt-2 text-xs text-google-red/80">{errors.areasOfInterest}</p>
          )}
        </div>

        <div>
          <label htmlFor="vol-experience" className="block text-sm font-bold text-black-02/70 mb-2">
            Prior volunteering experience
          </label>
          <textarea
            id="vol-experience"
            rows={3}
            placeholder="Have you volunteered at an event before? Tell us about it."
            className={`${inputNormal} resize-none leading-relaxed`}
            {...field('priorExperience')}
          />
        </div>

        <div>
          <label htmlFor="vol-google-tech" className="block text-sm font-bold text-black-02/70 mb-2">
            Experience with Google technologies
          </label>
          <textarea
            id="vol-google-tech"
            rows={3}
            placeholder="e.g. Firebase, Android, Flutter, Gemini, Google Cloud..."
            aria-describedby="vol-google-tech-hint"
            className={`${inputNormal} resize-none leading-relaxed`}
            {...field('googleTechExperience')}
          />
          <p id="vol-google-tech-hint" className="mt-1.5 text-xs text-black-02/35">
            Optional. Helps us know if you could facilitate a hands-on workshop.
          </p>
        </div>

        <div>
          <label htmlFor="vol-torrens" className="flex items-center gap-3 cursor-pointer group">
            <div className="relative shrink-0">
              <input
                id="vol-torrens"
                type="checkbox"
                checked={fields.isTorrensStudentOrStaff}
                onChange={(e) => setFields((prev) => ({ ...prev, isTorrensStudentOrStaff: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border border-black-02/20 bg-white peer-checked:bg-google-green peer-checked:border-google-green transition-colors duration-150 group-hover:border-black-02/35 flex items-center justify-center">
                {fields.isTorrensStudentOrStaff && (
                  <span
                    className="material-symbols-outlined text-white text-[18px] flex items-center justify-center"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    check_small
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm text-black-02/70 group-hover:text-black-02/90 transition-colors select-none">
              Are you a student or staff member at Torrens University?
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="vol-dietary" className="block text-sm font-bold text-black-02/70 mb-2">
            Dietary requirements
          </label>
          <input
            id="vol-dietary"
            type="text"
            placeholder="e.g. vegetarian, gluten-free, nut allergy"
            className={inputNormal}
            {...field('dietaryRequirements')}
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            aria-label="Submit volunteer signup"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 bg-google-green text-white text-sm font-bold rounded-[3px]
              border border-google-green transition-colors hover:bg-transparent hover:text-google-green
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-google-green disabled:hover:text-white"
          >
            {submitState === 'submitting' ? (
              <>
                <span className="material-symbols-outlined text-[16px] flex items-center justify-center animate-spin" aria-hidden="true">
                  progress_activity
                </span>
                Submitting…
              </>
            ) : (
              <>
                Sign up to volunteer
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>
          <p className="text-xs text-black-02/35 mt-3">
            By submitting you agree to our{' '}
            <a href="/code-of-conduct" className="text-black-02/50 hover:text-black-02/70 underline underline-offset-2 transition-colors">
              Code of Conduct
            </a>
            .
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
