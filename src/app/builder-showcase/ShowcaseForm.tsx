'use client';

import { useState, useCallback, useEffect } from 'react';
import Alert from '@/components/Alert';
import { getTrackingParams } from '@/lib/tracking';
import type { ShowcaseStage } from '@/lib/types';

type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  name: string;
  email: string;
  projectName: string;
  pitch: string;
  description: string;
  stage: ShowcaseStage | '';
  demoUrl: string;
  repoUrl: string;
  linkedinUrl: string;
  builtWith: string;
  coPresenterNames: string;
  coPresenterEmails: string;
  demoRequirements: string;
  isFirstTimePresenter: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  projectName?: string;
  pitch?: string;
  description?: string;
  stage?: string;
}

const STAGES: { value: ShowcaseStage; label: string; hint: string }[] = [
  { value: 'idea', label: 'Idea or concept', hint: 'Still taking shape, but you can show the thinking.' },
  { value: 'prototype', label: 'Working prototype', hint: 'Rough edges are fine, it runs.' },
  { value: 'live', label: 'Live and in use', hint: 'Real people are using it today.' },
];

const PITCH_MAX = 140;
const DESCRIPTION_MAX = 1000;

const SECTIONS: { id: string; label: string }[] = [
  { id: 'showcase-section-details', label: 'Your details' },
  { id: 'showcase-section-demo', label: 'Your demo' },
  { id: 'showcase-section-day', label: 'On the day' },
];

export default function ShowcaseForm() {
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    projectName: '',
    pitch: '',
    description: '',
    stage: '',
    demoUrl: '',
    repoUrl: '',
    linkedinUrl: '',
    builtWith: '',
    coPresenterNames: '',
    coPresenterEmails: '',
    demoRequirements: '',
    isFirstTimePresenter: false,
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
    if (!fields.projectName.trim()) errs.projectName = 'Please give your project a name.';
    if (!fields.pitch.trim()) {
      errs.pitch = 'Please add a one-line pitch for your demo.';
    } else if (fields.pitch.length > PITCH_MAX) {
      errs.pitch = `Your pitch must be ${PITCH_MAX} characters or fewer.`;
    }
    if (!fields.description.trim()) {
      errs.description = 'Please tell us what you\'ll demo.';
    } else if (fields.description.length > DESCRIPTION_MAX) {
      errs.description = `Your description must be ${DESCRIPTION_MAX} characters or fewer.`;
    }
    if (!fields.stage) errs.stage = 'Please tell us what stage your project is at.';
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
      const response = await fetch('/api/submit-showcase', {
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
          : 'Something went wrong submitting your demo. Please try again.'
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

  function selectStage(stage: ShowcaseStage) {
    setFields((prev) => ({ ...prev, stage }));
    setErrors((prev) => ({ ...prev, stage: undefined }));
  }

  if (submitState === 'success') {
    return (
      <div className="bg-white/[0.025] border border-white/10 rounded-2xl p-12 text-center animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span
            className="material-symbols-outlined text-google-green text-[32px] flex items-center justify-center shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            check_circle
          </span>
          <h3 className="text-xl font-bold text-white">Your demo is in!</h3>
        </div>
        <p className="text-white/65 text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for entering the Builder Showcase. We&apos;ll review every entry and email you
          either way once the lineup is set.
        </p>
      </div>
    );
  }

  const inputBase =
    'w-full bg-white/[0.05] border rounded-lg px-5 py-2.5 text-white text-base placeholder-white/60 outline-none transition-colors focus:bg-white/[0.08]';
  const inputNormal = `${inputBase} border-white/8 focus:border-google-yellow/40`;
  const inputError = `${inputBase} border-google-red/40 bg-google-red/5`;

  return (
    <>
      <nav
        aria-label="Form progress"
        className="md:hidden sticky top-[88px] z-40 -mt-2 mb-6 bg-[#17181a] border-b border-white/8 px-1 py-2 -mx-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                  <span className="text-white/65" aria-hidden="true">{index + 1}</span>
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
                  <span className="text-xs text-white/65 leading-none self-center" aria-hidden="true">{index + 1}</span>
                  <span className="leading-none self-center">{section.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <form onSubmit={handleSubmit} noValidate className="space-y-10 flex-1 min-w-0">

        {/* Section: Your details */}
        <div id="showcase-section-details" className="scroll-mt-28 bg-white/[0.035] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Your details</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="showcase-name" className="block text-sm font-bold text-white/85 mb-1.5">
                Full name <span className="text-google-red" aria-hidden="true">*</span>
              </label>
              <input
                id="showcase-name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                aria-required="true"
                aria-describedby={errors.name ? 'showcase-name-error' : undefined}
                aria-invalid={!!errors.name}
                className={errors.name ? inputError : inputNormal}
                {...field('name')}
              />
              {errors.name && (
                <p id="showcase-name-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="showcase-email" className="block text-sm font-bold text-white/85 mb-1.5">
                Email address <span className="text-google-red" aria-hidden="true">*</span>
              </label>
              <input
                id="showcase-email"
                type="email"
                autoComplete="email"
                placeholder="ada@example.com"
                aria-required="true"
                aria-describedby={errors.email ? 'showcase-email-error' : undefined}
                aria-invalid={!!errors.email}
                className={errors.email ? inputError : inputNormal}
                {...field('email')}
              />
              {errors.email && (
                <p id="showcase-email-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="showcase-linkedin" className="block text-sm font-bold text-white/85 mb-1.5">
              LinkedIn profile
            </label>
            <input
              id="showcase-linkedin"
              type="url"
              inputMode="url"
              placeholder="https://linkedin.com/in/adalovelace"
              aria-describedby="showcase-linkedin-hint"
              className={inputNormal}
              {...field('linkedinUrl')}
            />
            <p id="showcase-linkedin-hint" className="mt-1.5 text-xs text-white/50">Optional, so we can credit you if your demo is picked.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mt-5">
            <div>
              <label htmlFor="showcase-co-presenter-names" className="block text-sm font-bold text-white/85 mb-1.5">
                Co-presenter name(s)
              </label>
              <input
                id="showcase-co-presenter-names"
                type="text"
                placeholder="Grace Hopper, Alan Turing"
                aria-describedby="showcase-co-presenter-names-hint"
                className={inputNormal}
                {...field('coPresenterNames')}
              />
              <p id="showcase-co-presenter-names-hint" className="mt-1.5 text-xs text-white/50">
                Optional. Anyone joining you on stage, so we can introduce them too.
              </p>
            </div>

            <div>
              <label htmlFor="showcase-co-presenter-emails" className="block text-sm font-bold text-white/85 mb-1.5">
                Co-presenter email(s)
              </label>
              <input
                id="showcase-co-presenter-emails"
                type="text"
                placeholder="grace@example.com, alan@example.com"
                aria-describedby="showcase-co-presenter-emails-hint"
                className={inputNormal}
                {...field('coPresenterEmails')}
              />
              <p id="showcase-co-presenter-emails-hint" className="mt-1.5 text-xs text-white/50">
                Optional, so we can keep them in the loop about the lineup.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Your demo */}
        <div id="showcase-section-demo" className="scroll-mt-28 bg-white/[0.035] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Your demo</h3>
          </div>

          <div className="space-y-7">
            <div>
              <label htmlFor="showcase-project" className="block text-sm font-bold text-white/85 mb-1.5">
                Project name <span className="text-google-red" aria-hidden="true">*</span>
              </label>
              <input
                id="showcase-project"
                type="text"
                placeholder="What are you calling it?"
                aria-required="true"
                aria-describedby={errors.projectName ? 'showcase-project-error' : undefined}
                aria-invalid={!!errors.projectName}
                className={errors.projectName ? inputError : inputNormal}
                {...field('projectName')}
              />
              {errors.projectName && (
                <p id="showcase-project-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.projectName}</p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="showcase-pitch" className="block text-sm font-bold text-white/85">
                  One-line pitch <span className="text-google-red" aria-hidden="true">*</span>
                </label>
                <span
                  aria-label={`${fields.pitch.length} of ${PITCH_MAX} characters used`}
                  className={`text-xs tabular-nums ${fields.pitch.length > PITCH_MAX ? 'text-google-red' : 'text-white/50'}`}
                >
                  {fields.pitch.length}/{PITCH_MAX}
                </span>
              </div>
              <input
                id="showcase-pitch"
                type="text"
                placeholder="Sum it up in one sentence"
                aria-required="true"
                aria-describedby={errors.pitch ? 'showcase-pitch-error' : 'showcase-pitch-hint'}
                aria-invalid={!!errors.pitch}
                className={errors.pitch ? inputError : inputNormal}
                {...field('pitch')}
              />
              {errors.pitch ? (
                <p id="showcase-pitch-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.pitch}</p>
              ) : (
                <p id="showcase-pitch-hint" className="mt-1.5 text-xs text-white/50">This is what we&apos;d read out when we introduce you.</p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="showcase-description" className="block text-sm font-bold text-white/85">
                  What will you demo? <span className="text-google-red" aria-hidden="true">*</span>
                </label>
                <span
                  aria-label={`${fields.description.length} of ${DESCRIPTION_MAX} characters used`}
                  className={`text-xs tabular-nums ${fields.description.length > DESCRIPTION_MAX ? 'text-google-red' : 'text-white/50'}`}
                >
                  {fields.description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                id="showcase-description"
                rows={5}
                placeholder="What you built, what problem it solves, and what you'd show in five minutes on stage"
                aria-required="true"
                aria-describedby={errors.description ? 'showcase-description-error' : undefined}
                aria-invalid={!!errors.description}
                className={`${errors.description ? inputError : inputNormal} resize-none leading-relaxed`}
                {...field('description')}
              />
              {errors.description && (
                <p id="showcase-description-error" role="alert" className="mt-1.5 text-xs text-google-red/80">{errors.description}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-white/85 mb-3" id="showcase-stage-label">
                What stage is it at? <span className="text-google-red" aria-hidden="true">*</span>
              </p>
              <div
                role="radiogroup"
                aria-labelledby="showcase-stage-label"
                aria-describedby={errors.stage ? 'showcase-stage-error' : undefined}
                className="grid sm:grid-cols-3 gap-2.5"
              >
                {STAGES.map((stage) => {
                  const selected = fields.stage === stage.value;
                  return (
                    <button
                      key={stage.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectStage(stage.value)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer
                        ${errors.stage && !selected
                          ? 'border-google-red/30 bg-google-red/5'
                          : selected
                            ? 'border-google-yellow/50 bg-google-yellow/10'
                            : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                        }`}
                    >
                      <span className={`block text-sm font-bold ${selected ? 'text-white' : 'text-white/70'}`}>
                        {stage.label}
                      </span>
                      <span className="block mt-1 text-xs text-white/50 leading-relaxed">{stage.hint}</span>
                    </button>
                  );
                })}
              </div>
              {errors.stage && (
                <p id="showcase-stage-error" role="alert" className="mt-2 text-xs text-google-red/80">{errors.stage}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="showcase-demo-url" className="block text-sm font-bold text-white/85 mb-1.5">
                  Link to the project
                </label>
                <input
                  id="showcase-demo-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://myproject.app"
                  aria-describedby="showcase-demo-url-hint"
                  className={inputNormal}
                  {...field('demoUrl')}
                />
                <p id="showcase-demo-url-hint" className="mt-1.5 text-xs text-white/50">Optional. A live link or a short video.</p>
              </div>

              <div>
                <label htmlFor="showcase-repo-url" className="block text-sm font-bold text-white/85 mb-1.5">
                  Repository
                </label>
                <input
                  id="showcase-repo-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://github.com/you/project"
                  aria-describedby="showcase-repo-url-hint"
                  className={inputNormal}
                  {...field('repoUrl')}
                />
                <p id="showcase-repo-url-hint" className="mt-1.5 text-xs text-white/50">Optional, if the code is public.</p>
              </div>
            </div>

            <div>
              <label htmlFor="showcase-built-with" className="block text-sm font-bold text-white/85 mb-1.5">
                What did you build it with?
              </label>
              <input
                id="showcase-built-with"
                type="text"
                placeholder="e.g. Gemini, Firebase, Flutter, n8n, no-code tools"
                aria-describedby="showcase-built-with-hint"
                className={inputNormal}
                {...field('builtWith')}
              />
              <p id="showcase-built-with-hint" className="mt-1.5 text-xs text-white/50">
                Optional. Anything goes, code or no-code.
              </p>
            </div>
          </div>
        </div>

        {/* Section: On the day */}
        <div id="showcase-section-day" className="scroll-mt-28 bg-white/[0.035] rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">On the day</h3>
          </div>

          <div className="space-y-7">
            <div>
              <label htmlFor="showcase-requirements" className="block text-sm font-bold text-white/85 mb-1.5">
                Anything you need to demo?
              </label>
              <textarea
                id="showcase-requirements"
                rows={3}
                placeholder="e.g. sound, a stable internet connection, a physical device on stage"
                aria-describedby="showcase-requirements-hint"
                className={`${inputNormal} resize-none leading-relaxed`}
                {...field('demoRequirements')}
              />
              <p id="showcase-requirements-hint" className="mt-1.5 text-xs text-white/50">
                Optional. We provide a screen and a mic as standard, so tell us about anything beyond that.
              </p>
            </div>

            <div>
              <label htmlFor="showcase-first-time" className="flex items-center gap-3 cursor-pointer group">
                <div className="relative shrink-0">
                  <input
                    id="showcase-first-time"
                    type="checkbox"
                    checked={fields.isFirstTimePresenter}
                    onChange={(e) => setFields((prev) => ({ ...prev, isFirstTimePresenter: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.05] peer-checked:bg-google-yellow peer-checked:border-google-yellow transition-colors duration-150 group-hover:border-white/35 flex items-center justify-center">
                    {fields.isFirstTimePresenter && (
                      <span
                        className="material-symbols-outlined text-[#1e1e1e] text-[18px] flex items-center justify-center"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        aria-hidden="true"
                      >
                        check_small
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-white/85 group-hover:text-white/90 transition-colors select-none">
                  This would be my first time presenting on stage
                </span>
              </label>
              <p className="mt-2 ml-8 text-xs text-white/50">
                No downside to ticking this. It just tells us who might want a hand rehearsing.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            aria-label="Submit Builder Showcase demo"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-yellow text-[#1e1e1e] text-base font-bold rounded
              border border-google-yellow transition-opacity hover:opacity-80
              disabled:opacity-50 disabled:cursor-not-allowed"
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
                Submit my demo
              </>
            )}
          </button>
          <p className="text-xs text-white/50 mt-3">
            By submitting you agree to our{' '}
            <a href="/conduct" className="text-white/50 hover:text-white/85 underline underline-offset-2 transition-colors">
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
