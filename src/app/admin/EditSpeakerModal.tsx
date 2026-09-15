'use client';

import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { removeSpeakerPhoto, updateSpeaker, uploadSpeakerPhoto, type SpeakerEditableFields } from './speakerActions';
import { getInitials } from '@/lib/format';
import { TRACK_LABELS, FORMAT_LABELS, EXPERIENCE_LABELS } from '@/lib/submissionLabels';
import type { Speaker } from '@/lib/types';

interface Props {
  speaker: Speaker;
  onClose: () => void;
  onError: (message: string) => void;
}

function toEditableFields(speaker: Speaker): SpeakerEditableFields {
  return {
    name: speaker.name,
    email: speaker.email,
    talkTitle: speaker.talkTitle,
    abstract: speaker.abstract,
    format: speaker.format,
    track: speaker.track,
    experienceLevel: speaker.experienceLevel,
    linkedinUrl: speaker.linkedinUrl,
    githubUrl: speaker.githubUrl,
    websiteUrl: speaker.websiteUrl,
    bio: speaker.bio,
    tagline: speaker.tagline,
    photoUrl: speaker.photoUrl,
  };
}

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40';
const labelClasses = 'block text-xs font-semibold text-white/50 mb-1';
const sectionHeadingClasses = 'text-[11px] font-bold uppercase tracking-wider text-white/50';

export default function EditSpeakerModal({ speaker, onClose, onError }: Props) {
  const [fields, setFields] = useState<SpeakerEditableFields>(() => toEditableFields(speaker));
  const [isPending, startTransition] = useTransition();
  const [isUploadingPhoto, startPhotoTransition] = useTransition();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Photo changes are saved the moment they happen, independently of the Save button:
  // the file is already in Storage by then, so leaving the doc pointing at the old one
  // would only strand the upload.
  function handlePhotoChosen(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;

    const formData = new FormData();
    formData.append('photo', chosen);
    startPhotoTransition(async () => {
      const result = await uploadSpeakerPhoto(speaker.id, formData);
      if (result.error || !result.photoUrl) {
        onError(result.error ?? 'Could not upload this photo. Please try again.');
        return;
      }
      update('photoUrl', result.photoUrl);
    });
  }

  function handlePhotoRemove() {
    startPhotoTransition(async () => {
      const result = await removeSpeakerPhoto(speaker.id);
      if (result.error) {
        onError(result.error);
        return;
      }
      update('photoUrl', '');
    });
  }

  function update<Key extends keyof SpeakerEditableFields>(key: Key, value: SpeakerEditableFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateSpeaker(speaker.id, fields);
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
      aria-label={`Edit speaker: ${speaker.name}`}
    >
      <div className="w-full max-w-xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Edit speaker</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close edit speaker form"
              className="text-white/55 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-white/50">
              This is what the public speakers section shows. Changes here don&apos;t touch the original proposal.
            </p>

            <div className="space-y-4">
              <h3 className={sectionHeadingClasses}>Profile</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="speaker-name">Name</label>
                  <input
                    id="speaker-name"
                    className={inputClasses}
                    value={fields.name}
                    onChange={(event) => update('name', event.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="speaker-email">Email</label>
                  <input
                    id="speaker-email"
                    type="email"
                    className={inputClasses}
                    value={fields.email}
                    onChange={(event) => update('email', event.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses} htmlFor="speaker-tagline">Tagline</label>
                <input
                  id="speaker-tagline"
                  className={inputClasses}
                  value={fields.tagline}
                  onChange={(event) => update('tagline', event.target.value)}
                  placeholder="e.g. Senior Android Engineer at Canva"
                  maxLength={200}
                />
              </div>

              <div>
                <label className={labelClasses} htmlFor="speaker-bio">Bio</label>
                <textarea
                  id="speaker-bio"
                  className={`${inputClasses} min-h-[100px]`}
                  value={fields.bio}
                  onChange={(event) => update('bio', event.target.value)}
                  maxLength={1000}
                />
              </div>

              <div>
                <p className={labelClasses}>Photo</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] shrink-0">
                    {fields.photoUrl ? (
                      <Image src={fields.photoUrl} alt={fields.name || 'Speaker photo'} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/55 text-base font-bold" aria-hidden="true">
                        {getInitials(fields.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChosen}
                      className="sr-only"
                      aria-label="Choose a speaker photo to upload"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto || isPending}
                      aria-label={fields.photoUrl ? 'Replace speaker photo' : 'Upload speaker photo'}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-google-blue-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5v-8M4.5 6L8 2.5 11.5 6" />
                        <path strokeLinecap="round" d="M2.5 11v1.5A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V11" />
                      </svg>
                      {isUploadingPhoto ? 'Uploading…' : fields.photoUrl ? 'Replace photo' : 'Upload photo'}
                    </button>
                    {fields.photoUrl && (
                      <button
                        type="button"
                        onClick={handlePhotoRemove}
                        disabled={isUploadingPhoto || isPending}
                        aria-label="Remove speaker photo"
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/40 text-white/50 hover:border-white/60 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/50">
                  JPEG, PNG, or WebP up to 5 MB. Square crops look best. Uploads save straight away.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="speaker-linkedin">LinkedIn</label>
                  <input
                    id="speaker-linkedin"
                    className={inputClasses}
                    value={fields.linkedinUrl}
                    onChange={(event) => update('linkedinUrl', event.target.value)}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="speaker-github">GitHub</label>
                  <input
                    id="speaker-github"
                    className={inputClasses}
                    value={fields.githubUrl}
                    onChange={(event) => update('githubUrl', event.target.value)}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="speaker-website">Website</label>
                  <input
                    id="speaker-website"
                    className={inputClasses}
                    value={fields.websiteUrl}
                    onChange={(event) => update('websiteUrl', event.target.value)}
                    maxLength={500}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className={sectionHeadingClasses}>Session</h3>

              <div>
                <label className={labelClasses} htmlFor="speaker-talk-title">Talk title</label>
                <input
                  id="speaker-talk-title"
                  className={inputClasses}
                  value={fields.talkTitle}
                  onChange={(event) => update('talkTitle', event.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label className={labelClasses} htmlFor="speaker-abstract">Abstract</label>
                <textarea
                  id="speaker-abstract"
                  className={`${inputClasses} min-h-[120px]`}
                  value={fields.abstract}
                  onChange={(event) => update('abstract', event.target.value)}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="speaker-track">Track</label>
                  <select
                    id="speaker-track"
                    className={inputClasses}
                    value={fields.track}
                    onChange={(event) => update('track', event.target.value as SpeakerEditableFields['track'])}
                  >
                    {Object.entries(TRACK_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses} htmlFor="speaker-format">Format</label>
                  <select
                    id="speaker-format"
                    className={inputClasses}
                    value={fields.format}
                    onChange={(event) => update('format', event.target.value as SpeakerEditableFields['format'])}
                  >
                    {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses} htmlFor="speaker-experience">Level</label>
                  <select
                    id="speaker-experience"
                    className={inputClasses}
                    value={fields.experienceLevel}
                    onChange={(event) => update('experienceLevel', event.target.value as SpeakerEditableFields['experienceLevel'])}
                  >
                    {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/40 text-white/50 hover:border-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label="Save changes to speaker"
              className="text-xs px-4 py-1.5 rounded-lg bg-google-blue-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
