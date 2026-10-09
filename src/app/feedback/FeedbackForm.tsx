'use client';

import Link from 'next/link';
import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import Alert from '@/components/Alert';
import { EMAIL_PATTERN } from '@/lib/jobBoardLabels';
import {
  FEEDBACK_ACTIVITIES,
  FEEDBACK_ACTIVITY_LABELS,
  FEEDBACK_ASPECTS,
  FEEDBACK_ASPECT_LABELS,
  FEEDBACK_RETURN_INTENTS,
  FEEDBACK_RETURN_LABELS,
  FEEDBACK_ROLES,
  FEEDBACK_ROLE_LABELS,
  FEEDBACK_TEXT_LIMIT,
  type FeedbackSessionOption,
} from '@/lib/feedbackLabels';
import type { FeedbackActivity, FeedbackAspect, FeedbackReturnIntent, FeedbackRole } from '@/lib/types';
import { errorClass, hintClass, inputError, inputNormal, labelClass, optionButtonClass, submitClass } from '../jobs/formStyles';

type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  overallRating: number | null;
  recommendScore: number | null;
  aspectRatings: Partial<Record<FeedbackAspect, number>>;
  activities: FeedbackActivity[];
  favouriteSessionId: string;
  enjoyedMost: string;
  improve: string;
  topicsNextYear: string;
  role: FeedbackRole | '';
  isFirstDevFest: boolean | null;
  returnIntent: FeedbackReturnIntent | '';
  email: string;
}

type FormErrors = Partial<Record<'overallRating' | 'recommendScore' | 'enjoyedMost' | 'improve' | 'topicsNextYear' | 'email', string>>;
type TextFieldName = 'enjoyedMost' | 'improve' | 'topicsNextYear';

const OVERALL_SCALE = [1, 2, 3, 4, 5];
const RECOMMEND_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const sectionClass = 'bg-surface rounded-2xl p-6 sm:p-8 space-y-6';
const sectionHeadingClass = 'text-lg font-bold text-white';
const required = <span className="text-google-red-light" aria-hidden="true">*</span>;

// A row of numbered choices built on real radio inputs, so arrow keys move between them
// and a screen reader announces "3 of 5". The input is visually hidden and the label is
// the button; peer-focus-visible gives the keyboard ring.
function ScaleRadios({
  name,
  values,
  selected,
  onSelect,
  lowLabel,
  highLabel,
  hasError,
  ariaLabelFor,
}: {
  name: string;
  values: number[];
  selected: number | null;
  onSelect: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  hasError: boolean;
  ariaLabelFor: (value: number) => string;
}) {
  // w-fit so the end labels sit under the first and last buttons, whatever the scale's length.
  return (
    <div className="w-fit max-w-full">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {values.map((value) => (
          <label key={value} className="relative">
            <input
              type="radio"
              name={name}
              value={value}
              checked={selected === value}
              onChange={() => onSelect(value)}
              aria-label={ariaLabelFor(value)}
              className="peer sr-only"
            />
            <span
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg border text-sm font-bold font-mono cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-google-blue ${optionButtonClass(selected === value, hasError)}`}
            >
              {value}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-4 text-xs text-white/50 font-mono">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

// Pill choices for a single optional answer, also on radio inputs. Clicking the chosen
// pill again clears it, since every question here can be skipped.
function PillRadios<Value extends string>({
  name,
  options,
  selected,
  onSelect,
}: {
  name: string;
  options: { value: Value; label: string }[];
  selected: Value | '';
  onSelect: (value: Value | '') => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => (
        <label key={option.value} className="relative">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selected === option.value}
            onChange={() => onSelect(option.value)}
            onClick={() => selected === option.value && onSelect('')}
            className="peer sr-only"
          />
          <span
            className={`inline-flex px-4 py-2 rounded-lg border text-sm font-bold cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-google-blue ${optionButtonClass(selected === option.value, false)}`}
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function Fieldset({ legend, hint, children }: { legend: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      {hint && <p className="-mt-1 mb-3 text-xs text-white/50">{hint}</p>}
      {children}
    </fieldset>
  );
}

interface Props {
  sessionOptions: FeedbackSessionOption[];
}

export default function FeedbackForm({ sessionOptions }: Props) {
  const [fields, setFields] = useState<FormFields>({
    overallRating: null,
    recommendScore: null,
    aspectRatings: {},
    activities: [],
    favouriteSessionId: '',
    enjoyedMost: '',
    improve: '',
    topicsNextYear: '',
    role: '',
    isFirstDevFest: null,
    returnIntent: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function update<Key extends keyof FormFields>(key: Key, value: FormFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
    if (key in errors) setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (fields.overallRating === null) found.overallRating = 'Please rate the day overall.';
    if (fields.recommendScore === null) found.recommendScore = 'Please pick a number from 0 to 10.';
    for (const name of ['enjoyedMost', 'improve', 'topicsNextYear'] as const) {
      if (fields[name].length > FEEDBACK_TEXT_LIMIT) found[name] = `This must be ${FEEDBACK_TEXT_LIMIT} characters or fewer.`;
    }
    if (fields.email.trim() && !EMAIL_PATTERN.test(fields.email.trim())) {
      found.email = 'That email address doesn\'t look right. Leave it blank to stay anonymous.';
    }
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Focus the first answer that needs fixing: the two required scales sit at the top
      // of a long form, well out of view of the submit button.
      const firstInvalid = document.getElementById(`feedback-${Object.keys(found)[0]}`);
      firstInvalid?.scrollIntoView({ block: 'center' });
      (firstInvalid?.matches('input, textarea') ? firstInvalid : firstInvalid?.querySelector('input'))?.focus({ preventScroll: true });
      return;
    }

    setSubmitState('submitting');
    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong sending your feedback. Please try again.');
      }
      setSubmitState('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitState('idle');
      setAlertMessage(error instanceof Error ? error.message : 'Something went wrong sending your feedback. Please try again.');
    }
  }

  function toggleActivity(activity: FeedbackActivity) {
    update(
      'activities',
      fields.activities.includes(activity)
        ? fields.activities.filter((existing) => existing !== activity)
        : [...fields.activities, activity]
    );
  }

  function setAspectRating(aspect: FeedbackAspect, rating: number | null) {
    const next = { ...fields.aspectRatings };
    if (rating === null) delete next[aspect];
    else next[aspect] = rating;
    update('aspectRatings', next);
  }

  function fieldError(name: keyof FormErrors) {
    return errors[name] ? (
      <p id={`feedback-${name}-error`} role="alert" className={errorClass}>{errors[name]}</p>
    ) : null;
  }

  function textArea(name: TextFieldName, label: string, placeholder: string) {
    const length = fields[name].length;
    return (
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label htmlFor={`feedback-${name}`} className="block text-sm font-bold text-white/85">{label}</label>
          <span
            aria-label={`${length} of ${FEEDBACK_TEXT_LIMIT} characters used`}
            className={`text-xs tabular-nums ${length > FEEDBACK_TEXT_LIMIT ? 'text-google-red-light' : 'text-white/50'}`}
          >
            {length}/{FEEDBACK_TEXT_LIMIT}
          </span>
        </div>
        <textarea
          id={`feedback-${name}`}
          rows={4}
          value={fields[name]}
          placeholder={placeholder}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `feedback-${name}-error` : undefined}
          onChange={(event) => update(name, event.target.value)}
          className={errors[name] ? inputError : inputNormal}
        />
        {fieldError(name)}
      </div>
    );
  }

  if (submitState === 'success') {
    return (
      <div className="bg-surface rounded-2xl p-12 text-center animate-slide-up">
        <h2 className="text-xl font-bold text-white mb-3">Thank you</h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
          Every response is read by the organising team, and it shapes what DevFest Sydney looks like next year.
          Thanks for coming, and for telling us how it went.
        </p>
        <Link
          href="/"
          className="inline-flex mt-6 items-center px-6 py-2 text-white text-sm font-bold rounded border border-white/40 transition-colors hover:border-white"
        >
          Back to DevFest Sydney
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <section aria-labelledby="feedback-section-day" className={sectionClass}>
          <h2 id="feedback-section-day" className={sectionHeadingClass}>The day</h2>

          <div id="feedback-overallRating">
            <Fieldset legend={<>Overall, how was DevFest Sydney 2026? {required}</>}>
              <ScaleRadios
                name="overallRating"
                values={OVERALL_SCALE}
                selected={fields.overallRating}
                onSelect={(value) => update('overallRating', value)}
                lowLabel="1 Poor"
                highLabel="5 Excellent"
                hasError={Boolean(errors.overallRating)}
                ariaLabelFor={(value) => `${value} out of 5`}
              />
              {fieldError('overallRating')}
            </Fieldset>
          </div>

          <div id="feedback-recommendScore">
            <Fieldset legend={<>How likely are you to recommend DevFest to a friend or colleague? {required}</>}>
              <ScaleRadios
                name="recommendScore"
                values={RECOMMEND_SCALE}
                selected={fields.recommendScore}
                onSelect={(value) => update('recommendScore', value)}
                lowLabel="0 Not likely"
                highLabel="10 Very likely"
                hasError={Boolean(errors.recommendScore)}
                ariaLabelFor={(value) => `${value} out of 10`}
              />
              {fieldError('recommendScore')}
            </Fieldset>
          </div>

          <Fieldset legend="What did you get to?" hint="Pick everything that applies.">
            <div className="flex flex-wrap gap-2.5">
              {FEEDBACK_ACTIVITIES.map((activity) => {
                const selected = fields.activities.includes(activity);
                return (
                  <button
                    key={activity}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleActivity(activity)}
                    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${optionButtonClass(selected, false)}`}
                  >
                    {FEEDBACK_ACTIVITY_LABELS[activity]}
                  </button>
                );
              })}
            </div>
          </Fieldset>
        </section>

        <section aria-labelledby="feedback-section-parts" className={sectionClass}>
          <div>
            <h2 id="feedback-section-parts" className={sectionHeadingClass}>Rate each part</h2>
            <p className="mt-1 text-sm text-white/60">1 is poor, 5 is excellent. Skip anything you didn&apos;t try.</p>
          </div>

          <div className="space-y-4">
            {FEEDBACK_ASPECTS.map((aspect) => {
              const rating = fields.aspectRatings[aspect] ?? null;
              return (
                <div key={aspect} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p id={`feedback-aspect-${aspect}`} className="text-sm font-bold text-white/85">{FEEDBACK_ASPECT_LABELS[aspect]}</p>
                  <div role="radiogroup" aria-labelledby={`feedback-aspect-${aspect}`} className="flex items-center gap-1.5">
                    {OVERALL_SCALE.map((value) => (
                      <label key={value} className="relative">
                        <input
                          type="radio"
                          name={`aspect-${aspect}`}
                          value={value}
                          checked={rating === value}
                          onChange={() => setAspectRating(aspect, value)}
                          aria-label={`${FEEDBACK_ASPECT_LABELS[aspect]}: ${value} out of 5`}
                          className="peer sr-only"
                        />
                        <span
                          className={`flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-bold font-mono cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-google-blue ${optionButtonClass(rating === value, false)}`}
                        >
                          {value}
                        </span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAspectRating(aspect, null)}
                      disabled={rating === null}
                      aria-label={`Clear your rating for ${FEEDBACK_ASPECT_LABELS[aspect]}`}
                      className="ml-1 px-2 py-2 text-xs font-bold text-white/60 hover:text-white disabled:invisible"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {sessionOptions.length > 0 && (
            <div>
              <label htmlFor="feedback-favouriteSessionId" className={labelClass}>Your favourite session</label>
              <select
                id="feedback-favouriteSessionId"
                value={fields.favouriteSessionId}
                onChange={(event) => update('favouriteSessionId', event.target.value)}
                className={`${inputNormal} [&>option]:bg-black-02`}
              >
                <option value="">Skip this one</option>
                {sessionOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section aria-labelledby="feedback-section-words" className={sectionClass}>
          <h2 id="feedback-section-words" className={sectionHeadingClass}>In your own words</h2>
          {textArea('enjoyedMost', 'What did you enjoy most?', 'A talk, a conversation, something you built')}
          {textArea('improve', 'What should we do better next time?', 'Anything at all: content, timing, venue, food, signage')}
          {textArea('topicsNextYear', 'What would you like to see next year?', 'Topics, speakers or formats')}
        </section>

        <section aria-labelledby="feedback-section-you" className={sectionClass}>
          <div>
            <h2 id="feedback-section-you" className={sectionHeadingClass}>About you</h2>
            <p className="mt-1 text-sm text-white/60">All optional.</p>
          </div>

          <Fieldset legend="Which best describes you?">
            <PillRadios
              name="role"
              options={FEEDBACK_ROLES.map((role) => ({ value: role, label: FEEDBACK_ROLE_LABELS[role] }))}
              selected={fields.role}
              onSelect={(value) => update('role', value)}
            />
          </Fieldset>

          <Fieldset legend="Was this your first DevFest?">
            <PillRadios
              name="isFirstDevFest"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              selected={fields.isFirstDevFest === null ? '' : fields.isFirstDevFest ? 'yes' : 'no'}
              onSelect={(value) => update('isFirstDevFest', value === '' ? null : value === 'yes')}
            />
          </Fieldset>

          <Fieldset legend="Would you come back next year?">
            <PillRadios
              name="returnIntent"
              options={FEEDBACK_RETURN_INTENTS.map((intent) => ({ value: intent, label: FEEDBACK_RETURN_LABELS[intent] }))}
              selected={fields.returnIntent}
              onSelect={(value) => update('returnIntent', value)}
            />
          </Fieldset>

          <div>
            <label htmlFor="feedback-email" className={labelClass}>Email</label>
            <input
              id="feedback-email"
              type="email"
              autoComplete="email"
              value={fields.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'feedback-email-error' : 'feedback-email-hint'}
              onChange={(event) => update('email', event.target.value)}
              className={errors.email ? inputError : inputNormal}
            />
            {errors.email ? fieldError('email') : (
              <p id="feedback-email-hint" className={hintClass}>
                Only if you&apos;d like us to reply to something you wrote. Leave it blank to stay anonymous.
              </p>
            )}
          </div>
        </section>

        <div className="pt-1">
          <button type="submit" disabled={submitState === 'submitting'} aria-label="Send your feedback about DevFest Sydney" className={submitClass}>
            {submitState === 'submitting' ? 'Sending…' : 'Send feedback'}
          </button>
          <p className="text-xs text-white/50 mt-3">
            See our{' '}
            <a href="/privacy#feedback" className="hover:text-white/85 underline underline-offset-2">Privacy Policy</a>{' '}
            for how we handle your answers.
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
