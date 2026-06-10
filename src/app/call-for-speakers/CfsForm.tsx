'use client';

import { useState, useCallback } from 'react';
import Alert from '@/components/Alert';

type TalkFormat = 'talk' | 'workshop' | 'lightning-talk';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Track = 'developer' | 'builder' | 'showcase';
type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat | '';
  track: Track | '';
  experienceLevel: ExperienceLevel | '';
  socialLinks: string;
  previousTalkLink: string;
  requiresTravelSupport: boolean;
  isGoogleDeveloperExpert: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  talkTitle?: string;
  abstract?: string;
  format?: string;
  track?: string;
  experienceLevel?: string;
}

const FORMATS: { value: TalkFormat; label: string; duration: string; desc: string }[] = [
  { value: 'talk', label: 'Talk', duration: '30 min', desc: 'A focused technical or builder session.' },
  { value: 'workshop', label: 'Workshop', duration: '60 min', desc: 'Hands-on — attendees build something together.' },
  { value: 'lightning-talk', label: 'Lightning Talk', duration: '10 min', desc: 'Short and punchy — one focused idea or demo.' },
];

const TRACKS: { value: Track; label: string; color: string; desc: string }[] = [
  { value: 'developer', label: 'Developer Track', color: 'google-blue', desc: 'Technical sessions for engineers — Gemini API, Flutter, Firebase, Android, Google Cloud.' },
  { value: 'builder', label: 'Builder Track', color: 'google-green', desc: 'For PMs, designers, and founders — prototyping with AI, automation, no-code tooling.' },
  { value: 'showcase', label: 'Builder Showcase', color: 'google-yellow', desc: 'A 5-minute demo presented to the audience, with live voting.' },
];

const LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to the topic or speaking' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience speaking or in the field' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep expertise, seasoned speaker' },
];

const ABSTRACT_MAX = 2000;

export default function CfsForm() {
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    talkTitle: '',
    abstract: '',
    format: '',
    track: '',
    experienceLevel: '',
    socialLinks: '',
    previousTalkLink: '',
    requiresTravelSupport: false,
    isGoogleDeveloperExpert: false,
  });
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
    if (!fields.talkTitle.trim()) errs.talkTitle = 'Please enter a title for your talk.';
    if (!fields.abstract.trim()) {
      errs.abstract = 'Please write an abstract for your proposal.';
    } else if (fields.abstract.length > ABSTRACT_MAX) {
      errs.abstract = `Abstract must be ${ABSTRACT_MAX} characters or fewer.`;
    }
    if (!fields.format) errs.format = 'Please select a talk format.';
    if (!fields.track) errs.track = 'Please select a track.';
    if (!fields.experienceLevel) errs.experienceLevel = 'Please select your experience level.';
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
      const response = await fetch('/api/submit-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
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
          : 'Something went wrong submitting your proposal. Please try again.'
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

  if (submitState === 'success') {
    return (
      <div className="bg-white/[0.03] border border-white/6 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-google-green/15 border border-google-green/25 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-google-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Proposal submitted!</h3>
        <p className="text-white/45 text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for submitting to DevFest Sydney. We&apos;ll review your proposal and be in touch via email.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full bg-white/[0.05] border rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none transition-colors focus:bg-white/[0.07]';
  const inputNormal = `${inputBase} border-white/10 focus:border-google-red/40`;
  const inputError = `${inputBase} border-google-red/40 bg-google-red/5`;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-7">

        {/* Name + Email */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cfs-name" className="block text-sm font-medium text-white/70 mb-2">
              Full name <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <input
              id="cfs-name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              aria-required="true"
              aria-describedby={errors.name ? 'cfs-name-error' : undefined}
              aria-invalid={!!errors.name}
              className={errors.name ? inputError : inputNormal}
              {...field('name')}
            />
            {errors.name && (
              <p id="cfs-name-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="cfs-email" className="block text-sm font-medium text-white/70 mb-2">
              Email address <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <input
              id="cfs-email"
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              aria-required="true"
              aria-describedby={errors.email ? 'cfs-email-error' : undefined}
              aria-invalid={!!errors.email}
              className={errors.email ? inputError : inputNormal}
              {...field('email')}
            />
            {errors.email && (
              <p id="cfs-email-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Talk title */}
        <div>
          <label htmlFor="cfs-title" className="block text-sm font-medium text-white/70 mb-2">
            Talk title <span className="text-google-red" aria-hidden="true">*</span>
          </label>
          <input
            id="cfs-title"
            type="text"
            placeholder="e.g. Building Agentic Apps with Gemini"
            aria-required="true"
            aria-describedby={errors.talkTitle ? 'cfs-title-error' : undefined}
            aria-invalid={!!errors.talkTitle}
            className={errors.talkTitle ? inputError : inputNormal}
            {...field('talkTitle')}
          />
          {errors.talkTitle && (
            <p id="cfs-title-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.talkTitle}</p>
          )}
        </div>

        {/* Abstract */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="cfs-abstract" className="block text-sm font-medium text-white/70">
              Abstract <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <span
              aria-label={`${fields.abstract.length} of ${ABSTRACT_MAX} characters used`}
              className={`text-xs font-mono tabular-nums ${fields.abstract.length > ABSTRACT_MAX ? 'text-google-red' : 'text-white/25'}`}
            >
              {fields.abstract.length}/{ABSTRACT_MAX}
            </span>
          </div>
          <textarea
            id="cfs-abstract"
            rows={6}
            placeholder="What is your talk about? What will attendees take away?"
            aria-required="true"
            aria-describedby={errors.abstract ? 'cfs-abstract-error' : 'cfs-abstract-hint'}
            aria-invalid={!!errors.abstract}
            className={`${errors.abstract ? inputError : inputNormal} resize-none leading-relaxed`}
            {...field('abstract')}
          />
          {errors.abstract ? (
            <p id="cfs-abstract-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.abstract}</p>
          ) : (
            <p id="cfs-abstract-hint" className="mt-1.5 text-xs text-white/25">
              Briefly describe your talk — the topic, key points, and what attendees will learn.
            </p>
          )}
        </div>

        {/* Format */}
        <div>
          <p className="text-sm font-medium text-white/70 mb-3" id="cfs-format-label">
            Talk format <span className="text-google-red" aria-hidden="true">*</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="cfs-format-label"
            aria-describedby={errors.format ? 'cfs-format-error' : undefined}
            className="grid sm:grid-cols-3 gap-3"
          >
            {FORMATS.map((f) => {
              const selected = fields.format === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${f.label}, ${f.duration}`}
                  onClick={() => {
                    setFields((prev) => ({ ...prev, format: f.value }));
                    setErrors((prev) => ({ ...prev, format: undefined }));
                  }}
                  className={`text-left rounded-xl border px-4 py-4 transition-all cursor-pointer
                    ${selected
                      ? 'border-google-red/50 bg-google-red/10'
                      : errors.format
                        ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${selected ? 'text-white' : 'text-white/70'}`}>
                      {f.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono
                      ${selected ? 'bg-google-red/20 text-google-red' : 'bg-white/[0.06] text-white/35'}`}>
                      {f.duration}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${selected ? 'text-white/55' : 'text-white/30'}`}>
                    {f.desc}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.format && (
            <p id="cfs-format-error" role="alert" className="mt-2 text-xs text-google-red/80">{errors.format}</p>
          )}
        </div>

        {/* Track */}
        <div>
          <p className="text-sm font-medium text-white/70 mb-3" id="cfs-track-label">
            Track <span className="text-google-red" aria-hidden="true">*</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="cfs-track-label"
            aria-describedby={errors.track ? 'cfs-track-error' : undefined}
            className="grid sm:grid-cols-3 gap-3"
          >
            {TRACKS.map((t) => {
              const selected = fields.track === t.value;
              const colorMap: Record<string, string> = {
                'google-blue': selected ? 'border-google-blue/50 bg-google-blue/10' : 'border-white/8 bg-white/[0.03] hover:border-white/15',
                'google-green': selected ? 'border-google-green/50 bg-google-green/10' : 'border-white/8 bg-white/[0.03] hover:border-white/15',
                'google-yellow': selected ? 'border-google-yellow/50 bg-google-yellow/10' : 'border-white/8 bg-white/[0.03] hover:border-white/15',
              };
              const badgeMap: Record<string, string> = {
                'google-blue': selected ? 'bg-google-blue/20 text-google-blue' : 'bg-white/[0.06] text-white/35',
                'google-green': selected ? 'bg-google-green/20 text-google-green' : 'bg-white/[0.06] text-white/35',
                'google-yellow': selected ? 'bg-google-yellow/20 text-google-yellow' : 'bg-white/[0.06] text-white/35',
              };
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t.label}
                  onClick={() => {
                    setFields((prev) => ({ ...prev, track: t.value }));
                    setErrors((prev) => ({ ...prev, track: undefined }));
                  }}
                  className={`text-left rounded-xl border px-4 py-4 transition-all cursor-pointer
                    ${errors.track && !selected
                      ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                      : colorMap[t.color]
                    }`}
                >
                  <div className="mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeMap[t.color]}`}>
                      {t.label}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mt-2 ${selected ? 'text-white/55' : 'text-white/30'}`}>
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.track && (
            <p id="cfs-track-error" role="alert" className="mt-2 text-xs text-google-red/80">{errors.track}</p>
          )}
        </div>

        {/* Experience level */}
        <div>
          <p className="text-sm font-medium text-white/70 mb-3" id="cfs-level-label">
            Your experience level <span className="text-google-red" aria-hidden="true">*</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="cfs-level-label"
            aria-describedby={errors.experienceLevel ? 'cfs-level-error' : undefined}
            className="grid sm:grid-cols-3 gap-3"
          >
            {LEVELS.map((level) => {
              const selected = fields.experienceLevel === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={level.label}
                  onClick={() => {
                    setFields((prev) => ({ ...prev, experienceLevel: level.value }));
                    setErrors((prev) => ({ ...prev, experienceLevel: undefined }));
                  }}
                  className={`text-left rounded-xl border px-4 py-3.5 transition-all cursor-pointer
                    ${selected
                      ? 'border-google-red/50 bg-google-red/10'
                      : errors.experienceLevel
                        ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                    }`}
                >
                  <p className={`text-sm font-semibold mb-0.5 ${selected ? 'text-white' : 'text-white/70'}`}>
                    {level.label}
                  </p>
                  <p className={`text-xs ${selected ? 'text-white/50' : 'text-white/28'}`}>
                    {level.desc}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.experienceLevel && (
            <p id="cfs-level-error" role="alert" className="mt-2 text-xs text-google-red/80">{errors.experienceLevel}</p>
          )}
        </div>

        {/* Optional fields */}
        <div className="pt-1">
          <p className="text-xs font-bold text-white/25 tracking-[0.15em] uppercase mb-5">Optional</p>
          <div className="space-y-5">
            <div>
              <label htmlFor="cfs-social" className="block text-sm font-medium text-white/70 mb-2">
                Social or profile links
              </label>
              <input
                id="cfs-social"
                type="text"
                placeholder="LinkedIn, X/Twitter, personal site, GitHub..."
                aria-describedby="cfs-social-hint"
                className={inputNormal}
                {...field('socialLinks')}
              />
              <p id="cfs-social-hint" className="mt-1.5 text-xs text-white/25">
                Helps us learn more about you. Any format is fine.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-prev-talk" className="block text-sm font-medium text-white/70 mb-2">
                Previous talk recording
              </label>
              <input
                id="cfs-prev-talk"
                type="url"
                placeholder="https://youtube.com/..."
                aria-describedby="cfs-prev-talk-hint"
                className={inputNormal}
                {...field('previousTalkLink')}
              />
              <p id="cfs-prev-talk-hint" className="mt-1.5 text-xs text-white/25">
                A recording of a previous talk, if you have one.
              </p>
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-1">
          {[
            {
              id: 'cfs-gde',
              field: 'isGoogleDeveloperExpert' as const,
              label: 'I am a Google Developer Expert (GDE)',
            },
            {
              id: 'cfs-travel',
              field: 'requiresTravelSupport' as const,
              label: 'I would require travel support to attend',
            },
          ].map(({ id, field, label }) => (
            <label
              key={id}
              htmlFor={id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative shrink-0">
                <input
                  id={id}
                  type="checkbox"
                  checked={fields[field]}
                  onChange={(e) => setFields((prev) => ({ ...prev, [field]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border border-white/15 bg-white/[0.04] peer-checked:bg-google-red peer-checked:border-google-red transition-all group-hover:border-white/30 flex items-center justify-center">
                  {fields[field] && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors select-none">
                {label}
              </span>
            </label>
          ))}
        </div>

        {/* Submit */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            aria-label="Submit your speaker proposal"
            className="w-full py-4 bg-google-red text-white font-semibold rounded-xl
              hover:bg-[#d63b2f] active:scale-[0.99] transition-all shadow-lg shadow-google-red/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-google-red disabled:active:scale-100
              flex items-center justify-center gap-2"
          >
            {submitState === 'submitting' ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Submitting…
              </>
            ) : (
              'Submit proposal'
            )}
          </button>
          <p className="text-center text-xs text-white/25 mt-3">
            By submitting you agree to our{' '}
            <a href="/code-of-conduct" className="text-white/40 hover:text-white/60 underline underline-offset-2 transition-colors">
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
