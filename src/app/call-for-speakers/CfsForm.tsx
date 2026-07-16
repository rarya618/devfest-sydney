'use client';

import { useState, useCallback, useEffect } from 'react';
import Alert from '@/components/Alert';

type TalkFormat = 'talk' | 'workshop' | 'lightning-talk';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Track = 'developer' | 'builder';
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
  speakerTagline: string;
  speakerBio: string;
  previousTalkLink: string;
  howDidYouHear: string;
  coSpeakerEmails: string;
  accessibilityNeeds: string;
  requiresTravelSupport: boolean;
  travelSupportLocation: string;
  isGoogleDeveloperExpert: boolean;
  isFirstTimeSpeaker: boolean;
  wantsMentoring: boolean;
  hasSpokenAtGdgSydneyBefore: boolean;
  isOpenToAudienceQuestions: boolean;
  optOutOfRecording: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  talkTitle?: string;
  abstract?: string;
  format?: string;
  track?: string;
  experienceLevel?: string;
  travelSupportLocation?: string;
}

const FORMATS: { value: TalkFormat; label: string; duration: string; desc: string }[] = [
  { value: 'talk', label: 'Talk', duration: '30 min', desc: 'A focused technical or builder session.' },
  { value: 'workshop', label: 'Workshop', duration: '60 min', desc: 'Hands-on: attendees build something together.' },
  { value: 'lightning-talk', label: 'Lightning Talk', duration: '10 min', desc: 'Short and punchy: one focused idea or demo.' },
];

const TRACKS: { value: Track; label: string; color: string; desc: string }[] = [
  { value: 'developer', label: 'Developer Track', color: 'google-blue', desc: 'Technical sessions for engineers: Gemini API, Flutter, Firebase, Android, Google Cloud.' },
  { value: 'builder', label: 'Builder Track', color: 'google-green', desc: 'For PMs, designers, and founders: prototyping with AI, automation, no-code tooling.' },
];

const LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to the topic or speaking' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience speaking or in the field' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep expertise, seasoned speaker' },
];

const ABSTRACT_MAX = 2000;

const SECTIONS: { id: string; label: string; required: boolean }[] = [
  { id: 'cfs-section-details', label: 'Your details', required: true },
  { id: 'cfs-section-talk', label: 'Your session', required: true },
  { id: 'cfs-section-about', label: 'About you', required: false },
  { id: 'cfs-section-logistics', label: 'Logistics', required: false },
];

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
    speakerTagline: '',
    speakerBio: '',
    previousTalkLink: '',
    howDidYouHear: '',
    coSpeakerEmails: '',
    accessibilityNeeds: '',
    requiresTravelSupport: false,
    travelSupportLocation: '',
    isGoogleDeveloperExpert: false,
    isFirstTimeSpeaker: false,
    wantsMentoring: false,
    hasSpokenAtGdgSydneyBefore: false,
    isOpenToAudienceQuestions: false,
    optOutOfRecording: false,
  });
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

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email);
  const sectionComplete: Record<string, boolean> = {
    'cfs-section-details': fields.name.trim() !== '' && isEmailValid,
    'cfs-section-talk':
      fields.talkTitle.trim() !== '' &&
      fields.abstract.trim() !== '' &&
      fields.abstract.length <= ABSTRACT_MAX &&
      fields.format !== '' &&
      fields.track !== '' &&
      fields.experienceLevel !== '',
    'cfs-section-about': false,
    'cfs-section-logistics': false,
  };

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fields.name.trim()) errs.name = 'Please enter your full name.';
    if (!fields.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!fields.talkTitle.trim()) errs.talkTitle = 'Please enter a title for your session.';
    if (!fields.abstract.trim()) {
      errs.abstract = 'Please write an abstract for your session.';
    } else if (fields.abstract.length > ABSTRACT_MAX) {
      errs.abstract = `Abstract must be ${ABSTRACT_MAX} characters or fewer.`;
    }
    if (!fields.format) errs.format = 'Please select a session format.';
    if (!fields.track) errs.track = 'Please select a track.';
    if (!fields.experienceLevel) errs.experienceLevel = 'Please select your experience level.';
    if (fields.requiresTravelSupport && !fields.travelSupportLocation.trim()) {
      errs.travelSupportLocation = 'Please let us know which city you\'d be travelling from.';
    }
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
          : 'Something went wrong submitting your session. Please try again.'
      );
    }
  }

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  type StringField = { [K in keyof FormFields]: FormFields[K] extends string ? K : never }[keyof FormFields];
  type BooleanField = { [K in keyof FormFields]: FormFields[K] extends boolean ? K : never }[keyof FormFields];

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

  function renderCheckbox({ id, field: name, label }: { id: string; field: BooleanField; label: string }) {
    return (
      <label key={id} htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
        <div className="relative shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={fields[name]}
            onChange={(e) => {
              const checked = e.target.checked;
              setFields((prev) => ({
                ...prev,
                [name]: checked,
                ...(name === 'requiresTravelSupport' && !checked ? { travelSupportLocation: '' } : {}),
              }));
              if (name === 'requiresTravelSupport' && !checked) {
                setErrors((prev) => ({ ...prev, travelSupportLocation: undefined }));
              }
            }}
            className="sr-only peer"
          />
          <div className="w-5 h-5 rounded-md border border-black-02/20 bg-white peer-checked:bg-google-red peer-checked:border-google-red transition-all group-hover:border-black-02/35 flex items-center justify-center">
            {fields[name] && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-black-02/70 group-hover:text-black-02/90 transition-colors select-none">
          {label}
        </span>
      </label>
    );
  }

  if (submitState === 'success') {
    return (
      <div className="bg-white border border-black-02/8 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-google-green/15 border border-google-green/25 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-google-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-black-02 mb-3">Session submitted!</h3>
        <p className="text-black-02/55 text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for submitting to DevFest Sydney. We&apos;ll review your session and be in touch via email.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full bg-white border rounded-xl px-4 py-3 text-black-02 text-sm placeholder-black-02/30 outline-none transition-colors focus:bg-white';
  const inputNormal = `${inputBase} border-black-02/15 focus:border-google-red/40`;
  const inputError = `${inputBase} border-google-red/40 bg-google-red/5`;

  return (
    <>
      <nav
        aria-label="Form progress"
        className="md:hidden sticky top-[68px] z-40 -mt-2 mb-6 bg-off-white/95 backdrop-blur-sm border-b border-black-02/8 px-1 py-2 -mx-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex items-center gap-1.5 w-max">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isComplete = sectionComplete[section.id];
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${isActive ? 'bg-google-red/8 text-black-02 font-semibold' : 'text-black-02/50 hover:text-black-02/80 hover:bg-black-02/5'}`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full border shrink-0 transition-colors
                      ${isComplete
                        ? 'bg-google-green border-google-green'
                        : isActive
                          ? 'border-google-red'
                          : 'border-black-02/20'
                      }`}
                  >
                    {isComplete && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </span>
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
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isComplete = sectionComplete[section.id];
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${isActive ? 'bg-google-red/8 text-black-02 font-semibold' : 'text-black-02/50 hover:text-black-02/80 hover:bg-black-02/5'}`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full border shrink-0 transition-colors
                      ${isComplete
                        ? 'bg-google-green border-google-green'
                        : isActive
                          ? 'border-google-red'
                          : 'border-black-02/20'
                      }`}
                  >
                    {isComplete && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1">{section.label}</span>
                  {!section.required && (
                    <span className="text-[10px] uppercase tracking-wide text-black-02/30">Optional</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <form onSubmit={handleSubmit} noValidate className="space-y-10 flex-1 min-w-0">

        {/* Section: Your details */}
        <div id="cfs-section-details" className="scroll-mt-28">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase whitespace-nowrap">Your details</p>
            <div className="h-px flex-1 bg-black-02/8" aria-hidden="true" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cfs-name" className="block text-sm font-bold text-black-02/70 mb-2">
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
            <label htmlFor="cfs-email" className="block text-sm font-bold text-black-02/70 mb-2">
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
        </div>

        {/* Section: Your talk */}
        <div id="cfs-section-talk" className="scroll-mt-28">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase whitespace-nowrap">Your session</p>
            <div className="h-px flex-1 bg-black-02/8" aria-hidden="true" />
          </div>

          <div className="space-y-7">
        {/* Talk title */}
        <div>
          <label htmlFor="cfs-title" className="block text-sm font-bold text-black-02/70 mb-2">
            Session title <span className="text-google-red" aria-hidden="true">*</span>
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
            <label htmlFor="cfs-abstract" className="block text-sm font-bold text-black-02/70">
              Abstract <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <span
              aria-label={`${fields.abstract.length} of ${ABSTRACT_MAX} characters used`}
              className={`text-xs font-mono tabular-nums ${fields.abstract.length > ABSTRACT_MAX ? 'text-google-red' : 'text-black-02/35'}`}
            >
              {fields.abstract.length}/{ABSTRACT_MAX}
            </span>
          </div>
          <textarea
            id="cfs-abstract"
            rows={6}
            placeholder="What is your session about? What will attendees take away?"
            aria-required="true"
            aria-describedby={errors.abstract ? 'cfs-abstract-error' : 'cfs-abstract-hint'}
            aria-invalid={!!errors.abstract}
            className={`${errors.abstract ? inputError : inputNormal} resize-none leading-relaxed`}
            {...field('abstract')}
          />
          {errors.abstract ? (
            <p id="cfs-abstract-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.abstract}</p>
          ) : (
            <p id="cfs-abstract-hint" className="mt-1.5 text-xs text-black-02/35">
              Briefly describe your session: the topic, key points, and what attendees will learn.
            </p>
          )}
        </div>

        {/* Format */}
        <div>
          <p className="text-sm font-bold text-black-02/70 mb-3" id="cfs-format-label">
            Session format <span className="text-google-red" aria-hidden="true">*</span>
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
                  className={`flex flex-col items-start text-left rounded-xl border px-4 py-4 transition-all cursor-pointer
                    ${selected
                      ? 'border-google-red/50 bg-google-red/10'
                      : errors.format
                        ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                        : 'border-black-02/10 bg-off-white hover:border-black-02/20'
                    }`}
                >
                  <div className="w-full flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${selected ? 'text-black-02' : 'text-black-02/70'}`}>
                      {f.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono
                      ${selected ? 'bg-google-red/20 text-google-red' : 'bg-black-02/6 text-black-02/40'}`}>
                      {f.duration}
                    </span>
                  </div>
                  <p className={`w-full text-xs leading-relaxed ${selected ? 'text-black-02/60' : 'text-black-02/40'}`}>
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
          <p className="text-sm font-bold text-black-02/70 mb-3" id="cfs-track-label">
            Track <span className="text-google-red" aria-hidden="true">*</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="cfs-track-label"
            aria-describedby={errors.track ? 'cfs-track-error' : undefined}
            className="grid sm:grid-cols-2 gap-3"
          >
            {TRACKS.map((t) => {
              const selected = fields.track === t.value;
              const colorMap: Record<string, string> = {
                'google-blue': selected ? 'border-google-blue/50 bg-google-blue/10' : 'border-black-02/10 bg-off-white hover:border-black-02/20',
                'google-green': selected ? 'border-google-green/50 bg-google-green/10' : 'border-black-02/10 bg-off-white hover:border-black-02/20',
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
                  className={`flex flex-col items-start text-left rounded-xl border px-4 py-4 transition-all cursor-pointer
                    ${errors.track && !selected
                      ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                      : colorMap[t.color]
                    }`}
                >
                  <span className={`w-full flex items-center gap-2 text-sm font-semibold mb-1.5 ${selected ? 'text-black-02' : 'text-black-02/70'}`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${t.color === 'google-blue' ? 'bg-google-blue' : 'bg-google-green'}`}
                      aria-hidden="true"
                    />
                    {t.label}
                  </span>
                  <p className={`w-full text-xs leading-relaxed ${selected ? 'text-black-02/60' : 'text-black-02/40'}`}>
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
          <p className="text-sm font-bold text-black-02/70 mb-3" id="cfs-level-label">
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
                  className={`flex flex-col items-start text-left rounded-xl border px-4 py-4 transition-all cursor-pointer
                    ${selected
                      ? 'border-google-red/50 bg-google-red/10'
                      : errors.experienceLevel
                        ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                        : 'border-black-02/10 bg-off-white hover:border-black-02/20'
                    }`}
                >
                  <span className={`w-full text-sm font-semibold mb-1.5 ${selected ? 'text-black-02' : 'text-black-02/70'}`}>
                    {level.label}
                  </span>
                  <p className={`w-full text-xs leading-relaxed ${selected ? 'text-black-02/60' : 'text-black-02/40'}`}>
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
          </div>
        </div>

        {/* Section: About you */}
        <div id="cfs-section-about" className="scroll-mt-28">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase whitespace-nowrap">About you <span className="text-black-02/25 normal-case font-medium tracking-normal">(optional)</span></p>
            <div className="h-px flex-1 bg-black-02/8" aria-hidden="true" />
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="cfs-social" className="block text-sm font-bold text-black-02/70 mb-2">
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
              <p id="cfs-social-hint" className="mt-1.5 text-xs text-black-02/35">
                Helps us learn more about you. Any format is fine.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-tagline" className="block text-sm font-bold text-black-02/70 mb-2">
                Tagline
              </label>
              <input
                id="cfs-tagline"
                type="text"
                placeholder="Your role, company, or a one-line intro"
                aria-describedby="cfs-tagline-hint"
                className={inputNormal}
                {...field('speakerTagline')}
              />
              <p id="cfs-tagline-hint" className="mt-1.5 text-xs text-black-02/35">
                Shown on your speaker profile if you&apos;re accepted.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-bio" className="block text-sm font-bold text-black-02/70 mb-2">
                Speaker bio
              </label>
              <textarea
                id="cfs-bio"
                rows={4}
                placeholder="Tell us a bit about yourself..."
                aria-describedby="cfs-bio-hint"
                className={`${inputNormal} resize-none leading-relaxed`}
                {...field('speakerBio')}
              />
              <p id="cfs-bio-hint" className="mt-1.5 text-xs text-black-02/35">
                We&apos;ll use this for your speaker profile if you&apos;re accepted.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-prev-talk" className="block text-sm font-bold text-black-02/70 mb-2">
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
              <p id="cfs-prev-talk-hint" className="mt-1.5 text-xs text-black-02/35">
                A recording of a previous talk, if you have one.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-how-heard" className="block text-sm font-bold text-black-02/70 mb-2">
                How did you hear about DevFest Sydney?
              </label>
              <input
                id="cfs-how-heard"
                type="text"
                placeholder="e.g. Twitter, a friend, a GDG Sydney meetup..."
                className={inputNormal}
                {...field('howDidYouHear')}
              />
            </div>
          </div>

          <div className="space-y-3 pt-5">
            {[
              {
                id: 'cfs-first-time',
                field: 'isFirstTimeSpeaker' as const,
                label: 'This would be my first time speaking at a conference',
              },
              {
                id: 'cfs-mentoring',
                field: 'wantsMentoring' as const,
                label: 'I would like some speaker mentoring to help me prepare',
              },
              {
                id: 'cfs-spoken-before',
                field: 'hasSpokenAtGdgSydneyBefore' as const,
                label: 'I have spoken at a GDG Sydney event before',
              },
              {
                id: 'cfs-gde',
                field: 'isGoogleDeveloperExpert' as const,
                label: 'I am a Google Developer Expert (GDE)',
              },
            ].map(renderCheckbox)}
          </div>
        </div>

        {/* Section: Logistics */}
        <div id="cfs-section-logistics" className="scroll-mt-28">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase whitespace-nowrap">Logistics <span className="text-black-02/25 normal-case font-medium tracking-normal">(optional)</span></p>
            <div className="h-px flex-1 bg-black-02/8" aria-hidden="true" />
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="cfs-co-speakers" className="block text-sm font-bold text-black-02/70 mb-2">
                Co-speaker email(s)
              </label>
              <input
                id="cfs-co-speakers"
                type="text"
                placeholder="jane@example.com, alex@example.com"
                aria-describedby="cfs-co-speakers-hint"
                className={inputNormal}
                {...field('coSpeakerEmails')}
              />
              <p id="cfs-co-speakers-hint" className="mt-1.5 text-xs text-black-02/35">
                If you&apos;re presenting with someone else, list their email(s).
              </p>
            </div>

            <div>
              <label htmlFor="cfs-accessibility" className="block text-sm font-bold text-black-02/70 mb-2">
                Accessibility support
              </label>
              <textarea
                id="cfs-accessibility"
                rows={3}
                placeholder="Let us know if you need anything to present comfortably, e.g. a sign language interpreter, step-free stage access, seating on stage..."
                aria-describedby="cfs-accessibility-hint"
                className={`${inputNormal} resize-none leading-relaxed`}
                {...field('accessibilityNeeds')}
              />
              <p id="cfs-accessibility-hint" className="mt-1.5 text-xs text-black-02/35">
                Anything we should arrange so you can present comfortably.
              </p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-5">
          {[
            {
              id: 'cfs-questions',
              field: 'isOpenToAudienceQuestions' as const,
              label: 'I am happy to take audience questions after my session',
            },
            {
              id: 'cfs-recording-opt-out',
              field: 'optOutOfRecording' as const,
              label: 'I would prefer my session not be recorded',
            },
            {
              id: 'cfs-travel',
              field: 'requiresTravelSupport' as const,
              label: 'I would require travel support to attend',
            },
          ].map(renderCheckbox)}

          <p className="text-xs text-black-02/35 leading-relaxed pt-1">
            Travel support is limited. We may not be able to cover costs for non-GDE speakers.
          </p>

          {fields.requiresTravelSupport && (
            <div className="pt-2">
              <label htmlFor="cfs-travel-location" className="block text-sm font-bold text-black-02/70 mb-2">
                Which city would you be travelling from? <span className="text-google-red" aria-hidden="true">*</span>
              </label>
              <input
                id="cfs-travel-location"
                type="text"
                placeholder="e.g. Melbourne, Australia"
                aria-required="true"
                aria-describedby={errors.travelSupportLocation ? 'cfs-travel-location-error' : undefined}
                aria-invalid={!!errors.travelSupportLocation}
                className={errors.travelSupportLocation ? inputError : inputNormal}
                {...field('travelSupportLocation')}
              />
              {errors.travelSupportLocation && (
                <p id="cfs-travel-location-error" role="alert" className="mt-1.5 text-xs text-google-red/80">
                  {errors.travelSupportLocation}
                </p>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            aria-label="Submit your session"
            className="inline-flex items-center justify-center gap-2 px-7 pt-2 pb-1.5 bg-google-blue text-white text-base font-semibold rounded-full
              shadow-[0_1px_6px_rgba(66,133,244,0.28)] hover:bg-[#3574db] hover:-translate-y-0.5 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-google-blue disabled:hover:translate-y-0"
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
              'Submit session'
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
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
