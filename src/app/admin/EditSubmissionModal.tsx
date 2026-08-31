'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { createSubmission, updateSubmission, type SubmissionEditableFields } from './actions';
import { TRACK_LABELS, FORMAT_LABELS, EXPERIENCE_LABELS } from '@/lib/submissionLabels';
import type { Submission } from '@/lib/types';

interface Props {
  // Absent means create mode: a proposal that arrived outside the form is entered here
  // rather than written to Firestore by hand.
  submission?: Submission;
  onClose: () => void;
  onError: (message: string) => void;
}

const BLANK_FIELDS: SubmissionEditableFields = {
  name: '',
  email: '',
  talkTitle: '',
  abstract: '',
  format: 'talk',
  track: 'developer',
  experienceLevel: 'beginner',
  linkedinUrl: '',
  githubUrl: '',
  websiteUrl: '',
  speakerTagline: '',
  speakerBio: '',
  previousTalkLink: '',
  accessibilityNeeds: '',
  travelSupportLocation: '',
  coSpeakerEmails: '',
  requiresTravelSupport: false,
  isGoogleDeveloperExpert: false,
  isFirstTimeSpeaker: false,
  wantsMentoring: false,
  hasSpokenAtGdgSydneyBefore: false,
  isOpenToAudienceQuestions: false,
  optOutOfRecording: false,
  // Pre-filled so a manual entry is attributable in analytics rather than looking like
  // organic form traffic. The admin can overwrite them below.
  trackingUtmSource: 'manual',
  trackingUtmMedium: 'admin',
  trackingUtmCampaign: '',
  trackingUtmContent: '',
  trackingUtmTerm: '',
  trackingRef: '',
};

function toEditableFields(submission: Submission): SubmissionEditableFields {
  return {
    name: submission.name,
    email: submission.email,
    talkTitle: submission.talkTitle,
    abstract: submission.abstract,
    format: submission.format,
    track: submission.track,
    experienceLevel: submission.experienceLevel,
    linkedinUrl: submission.linkedinUrl,
    githubUrl: submission.githubUrl,
    websiteUrl: submission.websiteUrl,
    speakerTagline: submission.speakerTagline,
    speakerBio: submission.speakerBio,
    previousTalkLink: submission.previousTalkLink,
    accessibilityNeeds: submission.accessibilityNeeds,
    travelSupportLocation: submission.travelSupportLocation,
    coSpeakerEmails: submission.coSpeakerEmails,
    requiresTravelSupport: submission.requiresTravelSupport,
    isGoogleDeveloperExpert: submission.isGoogleDeveloperExpert,
    isFirstTimeSpeaker: submission.isFirstTimeSpeaker,
    wantsMentoring: submission.wantsMentoring,
    hasSpokenAtGdgSydneyBefore: submission.hasSpokenAtGdgSydneyBefore,
    isOpenToAudienceQuestions: submission.isOpenToAudienceQuestions,
    optOutOfRecording: submission.optOutOfRecording,
    trackingUtmSource: submission.tracking.utmSource,
    trackingUtmMedium: submission.tracking.utmMedium,
    trackingUtmCampaign: submission.tracking.utmCampaign,
    trackingUtmContent: submission.tracking.utmContent,
    trackingUtmTerm: submission.tracking.utmTerm,
    trackingRef: submission.tracking.ref,
  };
}

const inputClasses =
  'w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30';
const labelClasses = 'block text-xs font-semibold text-white/50 mb-1';

export default function EditSubmissionModal({ submission, onClose, onError }: Props) {
  const isCreating = submission === undefined;
  const [fields, setFields] = useState<SubmissionEditableFields>(() =>
    submission ? toEditableFields(submission) : BLANK_FIELDS
  );
  // Create mode only: an empty value means "now", which is what the server does with it.
  const [submittedAt, setSubmittedAt] = useState('');
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof SubmissionEditableFields>(key: K, value: SubmissionEditableFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = submission
        ? await updateSubmission(submission.id, fields)
        : await createSubmission(fields, submittedAt);
      if (result.error) {
        onError(result.error);
        return;
      }
      onClose();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isCreating ? 'Add a submission' : `Edit submission: ${submission.talkTitle}`}
    >
      <div className="w-full max-w-xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">
              {isCreating ? 'Add submission' : 'Edit submission'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label={isCreating ? 'Close add submission form' : 'Close edit form'}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {isCreating && (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-xs text-white/50 mb-2.5">
                  This proposal did not come through the public form, so a note recording
                  that is added automatically. No confirmation email is sent to the speaker.
                </p>
                <label className={labelClasses} htmlFor="add-submitted-at">
                  Submitted at (leave blank for now)
                </label>
                <input
                  id="add-submitted-at"
                  type="datetime-local"
                  className={`${inputClasses} [color-scheme:dark]`}
                  value={submittedAt}
                  onChange={(e) => setSubmittedAt(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  className={inputClasses}
                  value={fields.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  className={inputClasses}
                  value={fields.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-talk-title">Talk title</label>
              <input
                id="edit-talk-title"
                className={inputClasses}
                value={fields.talkTitle}
                onChange={(e) => update('talkTitle', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-abstract">Abstract</label>
              <textarea
                id="edit-abstract"
                className={`${inputClasses} min-h-[100px]`}
                value={fields.abstract}
                onChange={(e) => update('abstract', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-track">Track</label>
                <select
                  id="edit-track"
                  className={inputClasses}
                  value={fields.track}
                  onChange={(e) => update('track', e.target.value as SubmissionEditableFields['track'])}
                >
                  {Object.entries(TRACK_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-format">Format</label>
                <select
                  id="edit-format"
                  className={inputClasses}
                  value={fields.format}
                  onChange={(e) => update('format', e.target.value as SubmissionEditableFields['format'])}
                >
                  {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-experience">Experience</label>
                <select
                  id="edit-experience"
                  className={inputClasses}
                  value={fields.experienceLevel}
                  onChange={(e) => update('experienceLevel', e.target.value as SubmissionEditableFields['experienceLevel'])}
                >
                  {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-linkedin">LinkedIn</label>
                <input
                  id="edit-linkedin"
                  className={inputClasses}
                  value={fields.linkedinUrl}
                  onChange={(e) => update('linkedinUrl', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-github">GitHub</label>
                <input
                  id="edit-github"
                  className={inputClasses}
                  value={fields.githubUrl}
                  onChange={(e) => update('githubUrl', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-website">Website</label>
                <input
                  id="edit-website"
                  className={inputClasses}
                  value={fields.websiteUrl}
                  onChange={(e) => update('websiteUrl', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-previous-talk">Previous talk link</label>
                <input
                  id="edit-previous-talk"
                  className={inputClasses}
                  value={fields.previousTalkLink}
                  onChange={(e) => update('previousTalkLink', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-tagline">Speaker tagline</label>
              <input
                id="edit-tagline"
                className={inputClasses}
                value={fields.speakerTagline}
                onChange={(e) => update('speakerTagline', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="edit-bio">Speaker bio</label>
              <textarea
                id="edit-bio"
                className={`${inputClasses} min-h-[80px]`}
                value={fields.speakerBio}
                onChange={(e) => update('speakerBio', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="edit-cospeakers">Co-speaker email(s)</label>
                <input
                  id="edit-cospeakers"
                  className={inputClasses}
                  value={fields.coSpeakerEmails}
                  onChange={(e) => update('coSpeakerEmails', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="edit-accessibility">Accessibility needs</label>
                <input
                  id="edit-accessibility"
                  className={inputClasses}
                  value={fields.accessibilityNeeds}
                  onChange={(e) => update('accessibilityNeeds', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className={labelClasses}>Flags</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.isFirstTimeSpeaker}
                    onChange={(e) => update('isFirstTimeSpeaker', e.target.checked)}
                  />
                  First-time speaker
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.wantsMentoring}
                    onChange={(e) => update('wantsMentoring', e.target.checked)}
                  />
                  Wants mentoring
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.isGoogleDeveloperExpert}
                    onChange={(e) => update('isGoogleDeveloperExpert', e.target.checked)}
                  />
                  Google Developer Expert
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.hasSpokenAtGdgSydneyBefore}
                    onChange={(e) => update('hasSpokenAtGdgSydneyBefore', e.target.checked)}
                  />
                  Spoken at GDG Sydney before
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.isOpenToAudienceQuestions}
                    onChange={(e) => update('isOpenToAudienceQuestions', e.target.checked)}
                  />
                  Open to audience questions
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.optOutOfRecording}
                    onChange={(e) => update('optOutOfRecording', e.target.checked)}
                  />
                  Opt out of recording
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={fields.requiresTravelSupport}
                    onChange={(e) => update('requiresTravelSupport', e.target.checked)}
                  />
                  Requires travel support
                </label>
              </div>
              {fields.requiresTravelSupport && (
                <div>
                  <label className={labelClasses} htmlFor="edit-travel-location">Travel support location</label>
                  <input
                    id="edit-travel-location"
                    className={inputClasses}
                    value={fields.travelSupportLocation}
                    onChange={(e) => update('travelSupportLocation', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className={labelClasses}>Link tracking</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="edit-tracking-ref">Ref</label>
                  <input
                    id="edit-tracking-ref"
                    className={inputClasses}
                    value={fields.trackingRef}
                    onChange={(e) => update('trackingRef', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="edit-tracking-source">UTM source</label>
                  <input
                    id="edit-tracking-source"
                    className={inputClasses}
                    value={fields.trackingUtmSource}
                    onChange={(e) => update('trackingUtmSource', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="edit-tracking-medium">UTM medium</label>
                  <input
                    id="edit-tracking-medium"
                    className={inputClasses}
                    value={fields.trackingUtmMedium}
                    onChange={(e) => update('trackingUtmMedium', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="edit-tracking-campaign">UTM campaign</label>
                  <input
                    id="edit-tracking-campaign"
                    className={inputClasses}
                    value={fields.trackingUtmCampaign}
                    onChange={(e) => update('trackingUtmCampaign', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="edit-tracking-content">UTM content</label>
                  <input
                    id="edit-tracking-content"
                    className={inputClasses}
                    value={fields.trackingUtmContent}
                    onChange={(e) => update('trackingUtmContent', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="edit-tracking-term">UTM term</label>
                  <input
                    id="edit-tracking-term"
                    className={inputClasses}
                    value={fields.trackingUtmTerm}
                    onChange={(e) => update('trackingUtmTerm', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label={isCreating ? 'Add this submission' : 'Save changes to submission'}
              className="text-xs px-4 py-1.5 rounded-lg bg-google-blue text-white font-medium hover:bg-google-blue/90 transition-colors disabled:opacity-50"
            >
              {isPending ? (isCreating ? 'Adding…' : 'Saving…') : isCreating ? 'Add submission' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
