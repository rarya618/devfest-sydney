'use client';

import { useCallback, useRef, useState, useTransition, type FormEvent } from 'react';
import Alert from '@/components/Alert';
import { hintClass, inputNormal, labelClass } from '@/lib/formStyles';
import { PORTAL_PROFILE_LIMITS, type PortalProfileFields } from '@/lib/portalLabels';
import type { PortalProfile } from '@/lib/portalData';
import { removePortalPhoto, updatePortalProfile, uploadPortalPhoto } from '../../actions';
import SpeakerCard from '../../SpeakerCard';
import { dangerOutlineButton, primaryButton, secondaryButton } from '../../portalStyles';

interface ProfileEditorProps {
  profile: Omit<PortalProfile, 'talks'>;
}

const LINK_FIELDS: { key: 'linkedinUrl' | 'githubUrl' | 'websiteUrl'; label: string; placeholder: string }[] = [
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
  { key: 'githubUrl', label: 'GitHub', placeholder: 'github.com/…' },
  { key: 'websiteUrl', label: 'Website', placeholder: 'yoursite.com' },
];

// What a link field will become once saved, so the preview's link works while typing.
function previewUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function ProfileEditor({ profile }: ProfileEditorProps) {
  const [fields, setFields] = useState<PortalProfileFields>({
    tagline: profile.tagline,
    bio: profile.bio,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    websiteUrl: profile.websiteUrl,
  });
  const [savedFields, setSavedFields] = useState<PortalProfileFields>(fields);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isPhotoBusy, startPhoto] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const hasUnsavedChanges = (Object.keys(fields) as (keyof PortalProfileFields)[]).some((key) => fields[key] !== savedFields[key]);

  function update(key: keyof PortalProfileFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setStatusMessage(null);
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const result = await updatePortalProfile(profile.id, fields);
      if (result.error) setAlertMessage(result.error);
      else {
        setSavedFields(fields);
        setStatusMessage('Saved. Your profile is live.');
      }
    });
  }

  function handlePhotoChosen(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAlertMessage('That photo is over 5 MB. Choose a smaller one.');
      return;
    }
    const formData = new FormData();
    formData.append('photo', file);
    startPhoto(async () => {
      const result = await uploadPortalPhoto(profile.id, formData);
      if (result.error) setAlertMessage(result.error);
      else if (result.photoUrl) {
        setPhotoUrl(result.photoUrl);
        setStatusMessage('Photo updated. It is live now.');
      }
      if (fileInput.current) fileInput.current.value = '';
    });
  }

  function handlePhotoRemove() {
    startPhoto(async () => {
      const result = await removePortalPhoto(profile.id);
      if (result.error) setAlertMessage(result.error);
      else {
        setPhotoUrl('');
        setStatusMessage('Photo removed.');
      }
    });
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SpeakerCard
          profile={{
            name: profile.name,
            tagline: fields.tagline.trim(),
            bio: fields.bio.trim(),
            photoUrl,
            linkedinUrl: previewUrl(fields.linkedinUrl),
            githubUrl: previewUrl(fields.githubUrl),
            websiteUrl: previewUrl(fields.websiteUrl),
          }}
          showFullBio
          isPhotoLoading={isPhotoBusy}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={fileInput}
            id="portal-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => handlePhotoChosen(event.target.files?.[0])}
          />
          <button type="button" disabled={isPhotoBusy} onClick={() => fileInput.current?.click()} aria-label={photoUrl ? 'Replace your photo' : 'Upload a photo'} className={secondaryButton}>
            {photoUrl ? 'Replace photo' : 'Upload photo'}
          </button>
          {photoUrl && (
            <button type="button" disabled={isPhotoBusy} onClick={handlePhotoRemove} aria-label="Remove your photo" className={dangerOutlineButton}>
              Remove photo
            </button>
          )}
        </div>
        <p className={hintClass}>A square headshot works best. JPEG, PNG or WebP, up to 5 MB. Photo changes go live straight away.</p>
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-7 max-w-2xl">
        <div>
          <label htmlFor="portal-tagline" className={labelClass}>Tagline</label>
          <input
            id="portal-tagline"
            value={fields.tagline}
            maxLength={PORTAL_PROFILE_LIMITS.tagline}
            placeholder="Staff Engineer at Canva"
            aria-describedby="portal-tagline-hint"
            onChange={(event) => update('tagline', event.target.value)}
            className={inputNormal}
          />
          <p id="portal-tagline-hint" className={hintClass}>Your role and company, or a one-line intro. Shown under your name.</p>
        </div>

        <div>
          <label htmlFor="portal-bio" className={labelClass}>Bio</label>
          <textarea
            id="portal-bio"
            rows={8}
            value={fields.bio}
            maxLength={PORTAL_PROFILE_LIMITS.bio}
            aria-describedby="portal-bio-hint"
            onChange={(event) => update('bio', event.target.value)}
            className={`${inputNormal} resize-y`}
          />
          <p id="portal-bio-hint" className={hintClass}>
            A few sentences in the third person. {fields.bio.length} of {PORTAL_PROFILE_LIMITS.bio} characters.
          </p>
        </div>

        <fieldset className="space-y-5">
          <legend className={`${labelClass} mb-3`}>Links</legend>
          {LINK_FIELDS.map((field) => (
            <div key={field.key} className="grid sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center gap-2 sm:gap-4">
              <label htmlFor={`portal-${field.key}`} className="text-sm text-white/75">{field.label}</label>
              <input
                id={`portal-${field.key}`}
                type="url"
                inputMode="url"
                value={fields[field.key]}
                placeholder={field.placeholder}
                maxLength={PORTAL_PROFILE_LIMITS.link}
                onChange={(event) => update(field.key, event.target.value)}
                className={inputNormal}
              />
            </div>
          ))}
        </fieldset>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="submit" disabled={isSaving || !hasUnsavedChanges} aria-label="Save and publish your profile" className={primaryButton}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
          <p role="status" className="text-sm">
            {statusMessage ? (
              <span className="text-google-green">{statusMessage}</span>
            ) : hasUnsavedChanges ? (
              <span className="text-google-yellow">Unsaved changes</span>
            ) : null}
          </p>
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </div>
  );
}
