'use client';

import { useState, useCallback, useEffect } from 'react';
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

const SECTIONS: { id: string; label: string }[] = [
  { id: 'vol-section-details', label: 'Your details' },
  { id: 'vol-section-questions', label: 'General questions' },
];

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
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-12 text-center animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span
            className="material-symbols-outlined text-google-green text-[32px] flex items-center justify-center shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            check_circle
          </span>
          <h3 className="text-xl font-bold text-white">Thanks for signing up!</h3>
        </div>
        <p className="text-white/55 text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for offering to volunteer at DevFest Sydney. We&apos;ll be in touch via email with next steps.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full bg-white/[0.05] border rounded-lg px-5 py-2.5 text-white text-base placeholder-white/30 outline-none transition-colors focus:bg-white/[0.08]';
  const inputNormal = `${inputBase} border-white/8 focus:border-google-green/40`;
  const inputError = `${inputBase} border-google-red/40 bg-google-red/5`;

  return (
    <>
      <nav
        aria-label="Form progress"
        className="md:hidden sticky top-[88px] z-40 -mt-2 mb-6 bg-[#202124] border-b border-white/8 px-1 py-2 -mx-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex items-center gap-1.5 w-max">
          {SECTIONS.map((section, index) => {
            const isActive = activeSection === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-white whitespace-nowrap transition-colors
                    ${isActive ? 'bg-white/[0.06]' : 'hover:bg-white/5'}`}
                >
                  <span className="text-white/40" aria-hidden="true">{index + 1}</span>
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="md:flex md:items-start md:gap-10">
      <nav aria-label="Form progress" className="hidden md:block sticky top-28 w-52 shrink-0 self-start">
        <ul className="space-y-1">
          {SECTIONS.map((section, index) => {
            const isActive = activeSection === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-center gap-6 px-6 py-3 rounded-lg border border-l-4 text-sm font-bold text-white transition-colors
                    ${isActive ? 'bg-white/[0.06] border-[#555555]' : 'border-transparent hover:bg-white/5'}`}
                >
                  <span className="text-xs text-white/40 leading-none self-center" aria-hidden="true">{index + 1}</span>
                  <span className="leading-none self-center">{section.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <form onSubmit={handleSubmit} noValidate className="space-y-10 flex-1 min-w-0">

        {/* Section: Your details */}
        <div id="vol-section-details" className="scroll-mt-28 bg-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Your details</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="vol-name" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <label htmlFor="vol-email" className="block text-sm font-bold text-white/70 mb-1.5">
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

          <div className="mt-5">
            <label htmlFor="vol-phone" className="block text-sm font-bold text-white/70 mb-1.5">
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
            <p id="vol-phone-hint" className="mt-1.5 text-xs text-white/35">Optional, in case we need to reach you on the day.</p>
          </div>
        </div>

        {/* Section: General questions */}
        <div id="vol-section-questions" className="scroll-mt-28 bg-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">General questions</h3>
          </div>

          <div className="space-y-7">
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="vol-motivation" className="block text-sm font-bold text-white/70">
                  Why would you like to volunteer? <span className="text-google-red" aria-hidden="true">*</span>
                </label>
                <span
                  aria-label={`${fields.motivation.length} of ${MOTIVATION_MAX} characters used`}
                  className={`text-xs tabular-nums ${fields.motivation.length > MOTIVATION_MAX ? 'text-google-red' : 'text-white/35'}`}
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
              <p className="text-sm font-bold text-white/70 mb-3" id="vol-areas-label">
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
                          ? 'border-google-red/30 bg-google-red/5 text-white/60'
                          : selected
                            ? 'border-google-green/50 bg-google-green/10 text-white'
                            : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20'
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
              <label htmlFor="vol-experience" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <label htmlFor="vol-google-tech" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <p id="vol-google-tech-hint" className="mt-1.5 text-xs text-white/35">
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
                  <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.05] peer-checked:bg-google-green peer-checked:border-google-green transition-colors duration-150 group-hover:border-white/35 flex items-center justify-center">
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
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors select-none">
                  Are you a student or staff member at Torrens University?
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="vol-dietary" className="block text-sm font-bold text-white/70 mb-1.5">
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
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            aria-label="Submit volunteer signup"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-red text-white text-base font-bold rounded
              border border-google-red transition-opacity hover:opacity-80
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-google-red disabled:hover:text-white"
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
              </>
            )}
          </button>
          <p className="text-xs text-white/35 mt-3">
            By submitting you agree to our{' '}
            <a href="/conduct" className="text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors">
              Code of Conduct
            </a>
            .
          </p>
        </div>
      </form>
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
