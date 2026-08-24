'use client';

import { useState, useCallback, useEffect } from 'react';
import Alert from '@/components/Alert';
import { getTrackingParams } from '@/lib/tracking';

type TalkFormat = 'talk' | 'lightning-talk' | 'workshop';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type Track = 'developer' | 'builder' | 'workshop';
type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  name: string;
  email: string;
  talkTitle: string;
  abstract: string;
  format: TalkFormat | '';
  track: Track | '';
  experienceLevel: ExperienceLevel | '';
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
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

const FORMATS: { value: TalkFormat; label: string; duration: string; desc: string; color: string }[] = [
  { value: 'talk', label: 'Talk', duration: '30 min', desc: 'A focused technical or builder session.', color: 'google-blue' },
  { value: 'lightning-talk', label: 'Lightning Talk', duration: '10 min', desc: 'Short and punchy: one focused idea or demo.', color: 'google-yellow' },
];

const TRACKS: { value: Track; label: string; color: string; desc: string }[] = [
  { value: 'developer', label: 'Developer Track', color: 'google-blue', desc: 'Technical sessions for engineers: Gemini API, Flutter, Firebase, Android, Google Cloud.' },
  { value: 'builder', label: 'Builder Track', color: 'google-green', desc: 'For PMs, designers, and founders: prototyping with AI, automation, no-code tooling.' },
  { value: 'workshop', label: 'Workshops Track', color: 'google-yellow', desc: 'A dedicated hands-on stream running in parallel with the Developer and Builder talks.' },
];

const LEVELS: { value: ExperienceLevel; label: string; desc: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to the topic or speaking', color: 'google-green' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience speaking or in the field', color: 'google-yellow' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep expertise, seasoned speaker', color: 'google-blue' },
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
    linkedinUrl: '',
    githubUrl: '',
    websiteUrl: '',
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

  const showFormat = fields.track === 'developer' || fields.track === 'builder';

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
          <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.05] peer-checked:bg-google-red peer-checked:border-google-red transition-colors duration-150 group-hover:border-white/35 flex items-center justify-center">
            {fields[name] && (
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
          {label}
        </span>
      </label>
    );
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
          <h3 className="text-xl font-bold text-white">Session submitted!</h3>
        </div>
        <p className="text-white/55 text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for submitting to DevFest Sydney. We&apos;ll review your session and be in touch via email.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full bg-white/[0.05] border rounded-lg px-5 py-2.5 text-white text-base placeholder-white/30 outline-none transition-colors focus:bg-white/[0.08]';
  const inputNormal = `${inputBase} border-white/8 focus:border-google-red/40`;
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
      <nav aria-label="Form progress" className="hidden md:block sticky top-28 w-64 shrink-0 self-start">
        <ul className="space-y-1">
          {SECTIONS.map((section, index) => {
            const isActive = activeSection === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-center gap-6 px-6 py-3 rounded border-l-4 text-base font-bold text-white transition-colors
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
        <div id="cfs-section-details" className="scroll-mt-28 bg-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Your details</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cfs-name" className="block text-sm font-bold text-white/70 mb-1.5">
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
            <label htmlFor="cfs-email" className="block text-sm font-bold text-white/70 mb-1.5">
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
        <div id="cfs-section-talk" className="scroll-mt-28 bg-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Your session</h3>
          </div>

          <div className="space-y-7">
        {/* Talk title */}
        <div>
          <label htmlFor="cfs-title" className="block text-sm font-bold text-white/70 mb-1.5">
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
            <label htmlFor="cfs-abstract" className="block text-sm font-bold text-white/70">
              Abstract <span className="text-google-red" aria-hidden="true">*</span>
            </label>
            <span
              aria-label={`${fields.abstract.length} of ${ABSTRACT_MAX} characters used`}
              className={`text-xs tabular-nums ${fields.abstract.length > ABSTRACT_MAX ? 'text-google-red' : 'text-white/35'}`}
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
            <p id="cfs-abstract-hint" className="mt-1.5 text-xs text-white/35">
              Briefly describe your session: the topic, key points, and what attendees will learn.
            </p>
          )}
        </div>

        {/* Track */}
        <div>
          <p className="text-sm font-bold text-white/70 mb-3" id="cfs-track-label">
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
                'google-blue': selected ? 'border-google-blue/50 bg-google-blue/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
                'google-green': selected ? 'border-google-green/50 bg-google-green/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
                'google-yellow': selected ? 'border-google-yellow/50 bg-google-yellow/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
              };
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t.label}
                  onClick={() => {
                    setFields((prev) => ({
                      ...prev,
                      track: t.value,
                      format: t.value === 'workshop' ? 'workshop' : prev.format === 'workshop' ? '' : prev.format,
                    }));
                    setErrors((prev) => ({ ...prev, track: undefined, format: undefined }));
                  }}
                  className={`flex flex-col items-start text-left rounded-lg border px-4 py-4 transition-colors duration-200 cursor-pointer
                    ${errors.track && !selected
                      ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                      : colorMap[t.color]
                    }`}
                >
                  <span className={`w-full flex items-center gap-2 text-sm font-semibold mb-1.5 ${selected ? 'text-white' : 'text-white/70'}`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.color === 'google-blue' ? 'bg-google-blue' : t.color === 'google-green' ? 'bg-google-green' : 'bg-google-yellow'
                      }`}
                      aria-hidden="true"
                    />
                    {t.label}
                  </span>
                  <p className={`w-full text-xs leading-relaxed ${selected ? 'text-white/60' : 'text-white/40'}`}>
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

        {/* Format */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            showFormat ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className={`pt-1 transition-opacity duration-200 ${showFormat ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm font-bold text-white/70 mb-3" id="cfs-format-label">
              Session format <span className="text-google-red" aria-hidden="true">*</span>
            </p>
            <div
              role="radiogroup"
              aria-labelledby="cfs-format-label"
              aria-describedby={errors.format ? 'cfs-format-error' : undefined}
              className="grid sm:grid-cols-2 gap-3"
            >
              {FORMATS.map((f) => {
                const selected = fields.format === f.value;
                const formatColorMap: Record<string, string> = {
                  'google-blue': selected ? 'border-google-blue/50 bg-google-blue/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
                  'google-yellow': selected ? 'border-google-yellow/50 bg-google-yellow/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
                };
                const formatPillColorMap: Record<string, string> = {
                  'google-blue': 'bg-google-blue/20 text-google-blue',
                  'google-yellow': 'bg-google-yellow/20 text-google-yellow',
                };
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${f.label}, ${f.duration}`}
                    tabIndex={showFormat ? 0 : -1}
                    onClick={() => {
                      setFields((prev) => ({ ...prev, format: f.value }));
                      setErrors((prev) => ({ ...prev, format: undefined }));
                    }}
                    className={`flex flex-col items-start text-left rounded-lg border px-4 py-4 transition-colors duration-200 cursor-pointer
                      ${errors.format && !selected
                        ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                        : formatColorMap[f.color]
                      }`}
                  >
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span className={`inline-flex items-center gap-2 text-sm font-semibold ${selected ? 'text-white' : 'text-white/70'}`}>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${f.color === 'google-blue' ? 'bg-google-blue' : 'bg-google-yellow'}`}
                          aria-hidden="true"
                        />
                        {f.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${selected ? formatPillColorMap[f.color] : 'bg-white/6 text-white/40'}`}>
                        {f.duration}
                      </span>
                    </div>
                    <p className={`w-full text-xs leading-relaxed ${selected ? 'text-white/60' : 'text-white/40'}`}>
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
          </div>
        </div>

        {/* Experience level */}

        <div>
          <p className="text-sm font-bold text-white/70 mb-3" id="cfs-level-label">
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
              const levelColorMap: Record<string, string> = {
                'google-green': selected ? 'border-google-green/50 bg-google-green/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
                'google-yellow': selected ? 'border-google-yellow/50 bg-google-yellow/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
                'google-blue': selected ? 'border-google-blue/50 bg-google-blue/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20',
              };
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
                  className={`flex flex-col items-start text-left rounded-lg border px-4 py-4 transition-colors duration-200 cursor-pointer
                    ${errors.experienceLevel && !selected
                      ? 'border-google-red/30 bg-google-red/5 hover:border-google-red/30'
                      : levelColorMap[level.color]
                    }`}
                >
                  <span className={`w-full flex items-center gap-2 text-sm font-semibold mb-1.5 ${selected ? 'text-white' : 'text-white/70'}`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        level.color === 'google-green' ? 'bg-google-green' : level.color === 'google-yellow' ? 'bg-google-yellow' : 'bg-google-blue'
                      }`}
                      aria-hidden="true"
                    />
                    {level.label}
                  </span>
                  <p className={`w-full text-xs leading-relaxed ${selected ? 'text-white/60' : 'text-white/40'}`}>
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
        <div id="cfs-section-about" className="scroll-mt-28 bg-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="flex items-baseline gap-3 mb-6">
            <h3 className="text-2xl font-bold text-white">About you</h3>
            <span className="text-xs font-medium text-white/35">Optional</span>
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="cfs-linkedin" className="block text-sm font-bold text-white/70 mb-1.5">
                LinkedIn
              </label>
              <input
                id="cfs-linkedin"
                type="url"
                placeholder="linkedin.com/in/..."
                className={inputNormal}
                {...field('linkedinUrl')}
              />
            </div>

            <div>
              <label htmlFor="cfs-github" className="block text-sm font-bold text-white/70 mb-1.5">
                GitHub
              </label>
              <input
                id="cfs-github"
                type="url"
                placeholder="github.com/..."
                className={inputNormal}
                {...field('githubUrl')}
              />
            </div>

            <div>
              <label htmlFor="cfs-website" className="block text-sm font-bold text-white/70 mb-1.5">
                Website
              </label>
              <input
                id="cfs-website"
                type="url"
                placeholder="yoursite.com"
                aria-describedby="cfs-website-hint"
                className={inputNormal}
                {...field('websiteUrl')}
              />
              <p id="cfs-website-hint" className="mt-1.5 text-xs text-white/35">
                Helps us learn more about you. All optional.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-tagline" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <p id="cfs-tagline-hint" className="mt-1.5 text-xs text-white/35">
                Shown on your speaker profile if you&apos;re accepted.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-bio" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <p id="cfs-bio-hint" className="mt-1.5 text-xs text-white/35">
                We&apos;ll use this for your speaker profile if you&apos;re accepted.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-prev-talk" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <p id="cfs-prev-talk-hint" className="mt-1.5 text-xs text-white/35">
                A recording of a previous talk, if you have one.
              </p>
            </div>

            <div>
              <label htmlFor="cfs-how-heard" className="block text-sm font-bold text-white/70 mb-1.5">
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
        <div id="cfs-section-logistics" className="scroll-mt-28 bg-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="flex items-baseline gap-3 mb-6">
            <h3 className="text-2xl font-bold text-white">Logistics</h3>
            <span className="text-xs font-medium text-white/35">Optional</span>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="cfs-co-speakers" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <p id="cfs-co-speakers-hint" className="mt-1.5 text-xs text-white/35">
                If you&apos;re presenting with someone else, list their email(s).
              </p>
            </div>

            <div>
              <label htmlFor="cfs-accessibility" className="block text-sm font-bold text-white/70 mb-1.5">
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
              <p id="cfs-accessibility-hint" className="mt-1.5 text-xs text-white/35">
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

          <p className="text-xs text-white/35 leading-relaxed pt-1">
            Travel support is limited. We may not be able to cover costs for non-GDE speakers.
          </p>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              fields.requiresTravelSupport ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className={`pt-2 transition-opacity duration-200 ${fields.requiresTravelSupport ? 'opacity-100' : 'opacity-0'}`}>
                <label htmlFor="cfs-travel-location" className="block text-sm font-bold text-white/70 mb-1.5">
                  Which city would you be travelling from? <span className="text-google-red" aria-hidden="true">*</span>
                </label>
                <input
                  id="cfs-travel-location"
                  type="text"
                  placeholder="e.g. Melbourne, Australia"
                  aria-required="true"
                  aria-describedby={errors.travelSupportLocation ? 'cfs-travel-location-error' : undefined}
                  aria-invalid={!!errors.travelSupportLocation}
                  tabIndex={fields.requiresTravelSupport ? 0 : -1}
                  className={errors.travelSupportLocation ? inputError : inputNormal}
                  {...field('travelSupportLocation')}
                />
                {errors.travelSupportLocation && (
                  <p id="cfs-travel-location-error" role="alert" className="mt-1.5 text-xs text-google-red/80">
                    {errors.travelSupportLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            aria-label="Submit your session"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-green text-white text-base font-bold rounded
              border border-google-green transition-opacity hover:opacity-80
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
                Apply now
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
