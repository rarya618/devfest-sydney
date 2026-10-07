'use client';

import Link from 'next/link';
import { useCallback, useState, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import {
  EMAIL_PATTERN,
  JOB_LIMITS,
  JOB_TYPES,
  JOB_TYPE_LABELS,
  WORK_ARRANGEMENTS,
  WORK_ARRANGEMENT_LABELS,
} from '@/lib/jobBoardLabels';
import type { JobType, WorkArrangement } from '@/lib/types';
import { errorClass, hintClass, inputError, inputNormal, labelClass, optionButtonClass, submitClass } from '../formStyles';

type SubmitState = 'idle' | 'submitting' | 'success';

interface FormFields {
  companyName: string;
  contactName: string;
  contactEmail: string;
  roleTitle: string;
  location: string;
  workArrangement: WorkArrangement | '';
  jobType: JobType | '';
  description: string;
  howToApply: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;
type TextFieldName = Exclude<keyof FormFields, 'workArrangement' | 'jobType'>;

const EMPTY_FIELDS: FormFields = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  roleTitle: '',
  location: '',
  workArrangement: '',
  jobType: '',
  description: '',
  howToApply: '',
};

export default function JobListingForm() {
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!fields.companyName.trim()) found.companyName = 'Please enter the company name.';
    if (!fields.contactName.trim()) found.contactName = 'Please enter your name.';
    if (!EMAIL_PATTERN.test(fields.contactEmail.trim())) found.contactEmail = 'Please enter a valid email address.';
    if (!fields.roleTitle.trim()) found.roleTitle = 'Please enter the role title.';
    if (!fields.location.trim()) found.location = 'Please enter where the role is based.';
    if (!fields.workArrangement) found.workArrangement = 'Please choose one.';
    if (!fields.jobType) found.jobType = 'Please choose the type of role.';
    if (!fields.description.trim()) {
      found.description = 'Please describe the role.';
    } else if (fields.description.length > JOB_LIMITS.description) {
      found.description = `The description must be ${JOB_LIMITS.description} characters or fewer.`;
    }
    if (!fields.howToApply.trim()) found.howToApply = 'Please tell applicants how to apply.';
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitState('submitting');
    try {
      const response = await fetch('/api/submit-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Something went wrong posting your role. Please try again.');
      }
      setSubmitState('success');
    } catch (error) {
      setSubmitState('idle');
      setAlertMessage(error instanceof Error ? error.message : 'Something went wrong posting your role. Please try again.');
    }
  }

  function textField(name: TextFieldName) {
    return {
      id: `job-${name}`,
      value: fields[name],
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `job-${name}-error` : undefined,
      className: errors[name] ? inputError : inputNormal,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields((previous) => ({ ...previous, [name]: event.target.value }));
        if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
      },
    };
  }

  function fieldError(name: keyof FormFields) {
    return errors[name] ? (
      <p id={`job-${name}-error`} role="alert" className={errorClass}>{errors[name]}</p>
    ) : null;
  }

  if (submitState === 'success') {
    return (
      <div className="bg-surface rounded-2xl p-12 text-center animate-slide-up">
        <h3 className="text-xl font-bold text-white mb-3">Thanks, your role is in</h3>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto">
          An organiser will check it shortly and it will appear on the board once approved. We&apos;ve
          emailed you a copy.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/jobs"
            className="inline-flex items-center px-6 py-2 text-white text-sm font-bold rounded border border-white/40 transition-colors hover:border-white"
          >
            See the job board
          </Link>
          <button
            type="button"
            onClick={() => {
              setFields(EMPTY_FIELDS);
              setSubmitState('idle');
            }}
            aria-label="Post another role"
            className="text-sm text-white/70 hover:text-white underline underline-offset-2"
          >
            Post another role
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="bg-surface rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="job-companyName" className={labelClass}>Company <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="text" autoComplete="organization" aria-required="true" maxLength={JOB_LIMITS.companyName} {...textField('companyName')} />
            {fieldError('companyName')}
          </div>
          <div>
            <label htmlFor="job-roleTitle" className={labelClass}>Role title <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="text" placeholder="e.g. Senior Android Engineer" aria-required="true" maxLength={JOB_LIMITS.roleTitle} {...textField('roleTitle')} />
            {fieldError('roleTitle')}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="job-location" className={labelClass}>Location <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="text" placeholder="e.g. Sydney CBD" aria-required="true" maxLength={JOB_LIMITS.location} {...textField('location')} />
            {fieldError('location')}
          </div>
          <div>
            <label htmlFor="job-jobType" className={labelClass}>Type of role <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <select
              id="job-jobType"
              value={fields.jobType}
              aria-required="true"
              aria-invalid={Boolean(errors.jobType)}
              aria-describedby={errors.jobType ? 'job-jobType-error' : undefined}
              onChange={(event) => {
                setFields((previous) => ({ ...previous, jobType: event.target.value as JobType }));
                setErrors((previous) => ({ ...previous, jobType: undefined }));
              }}
              className={`${errors.jobType ? inputError : inputNormal} [&>option]:bg-black-02`}
            >
              <option value="" disabled>Choose one</option>
              {JOB_TYPES.map((jobType) => (
                <option key={jobType} value={jobType}>{JOB_TYPE_LABELS[jobType]}</option>
              ))}
            </select>
            {fieldError('jobType')}
          </div>
        </div>

        <div>
          <p id="job-workArrangement-label" className={labelClass}>
            Where is the work done? <span className="text-google-red-light" aria-hidden="true">*</span>
          </p>
          <div role="radiogroup" aria-labelledby="job-workArrangement-label" aria-describedby={errors.workArrangement ? 'job-workArrangement-error' : undefined} className="flex flex-wrap gap-2.5">
            {WORK_ARRANGEMENTS.map((arrangement) => {
              const selected = fields.workArrangement === arrangement;
              return (
                <button
                  key={arrangement}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setFields((previous) => ({ ...previous, workArrangement: arrangement }));
                    setErrors((previous) => ({ ...previous, workArrangement: undefined }));
                  }}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${optionButtonClass(selected, Boolean(errors.workArrangement))}`}
                >
                  {WORK_ARRANGEMENT_LABELS[arrangement]}
                </button>
              );
            })}
          </div>
          {fieldError('workArrangement')}
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor="job-description" className="block text-sm font-bold text-white/85">
              About the role <span className="text-google-red-light" aria-hidden="true">*</span>
            </label>
            <span
              aria-label={`${fields.description.length} of ${JOB_LIMITS.description} characters used`}
              className={`text-xs tabular-nums ${fields.description.length > JOB_LIMITS.description ? 'text-google-red-light' : 'text-white/50'}`}
            >
              {fields.description.length}/{JOB_LIMITS.description}
            </span>
          </div>
          <textarea rows={6} placeholder="What the team does, what the role involves, and who would be a good fit" aria-required="true" {...textField('description')} />
          {fieldError('description')}
        </div>

        <div>
          <label htmlFor="job-howToApply" className={labelClass}>How to apply <span className="text-google-red-light" aria-hidden="true">*</span></label>
          <input type="text" inputMode="url" placeholder="https://careers.example.com/role or jobs@example.com" aria-required="true" maxLength={JOB_LIMITS.howToApply} {...textField('howToApply')} />
          {errors.howToApply ? fieldError('howToApply') : <p className={hintClass}>A link to the job ad, or an email address applicants should write to. This is shown publicly.</p>}
        </div>

        <div className="pt-2 border-t border-white/10 grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="job-contactName" className={labelClass}>Your name <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="text" autoComplete="name" aria-required="true" maxLength={JOB_LIMITS.contactName} {...textField('contactName')} />
            {fieldError('contactName')}
          </div>
          <div>
            <label htmlFor="job-contactEmail" className={labelClass}>Your email <span className="text-google-red-light" aria-hidden="true">*</span></label>
            <input type="email" autoComplete="email" aria-required="true" {...textField('contactEmail')} />
            {errors.contactEmail ? fieldError('contactEmail') : <p className={hintClass}>So we can reach you about the listing. Never shown on the board.</p>}
          </div>
        </div>

        <div className="pt-1">
          <button type="submit" disabled={submitState === 'submitting'} aria-label="Submit this role to the job board" className={submitClass}>
            {submitState === 'submitting' ? 'Submitting…' : 'Submit role'}
          </button>
          <p className="text-xs text-white/50 mt-3">
            By submitting you agree to our{' '}
            <a href="/conduct" className="hover:text-white/85 underline underline-offset-2">Code of Conduct</a>.
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
