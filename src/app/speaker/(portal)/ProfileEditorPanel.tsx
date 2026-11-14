'use client';

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { hintClass, inputNormal, labelClass } from '@/lib/formStyles';
import { PORTAL_PROFILE_LIMITS, type PortalProfileFields } from '@/lib/portalLabels';
import { removePortalPhoto, updatePortalProfile, uploadPortalPhoto } from './actions';
import type { SpeakerCardProfile } from '@/components/SpeakerCard';
import { dangerOutlineButton, primaryButton, secondaryButton } from './portalStyles';

export interface EditableProfile extends SpeakerCardProfile {
  id: string;
}

interface ProfileEditorPanelProps {
  profile: EditableProfile;
  // What the card beside the form should show while editing: the unsaved text, and the photo
  // (which saves as soon as it's chosen).
  onPreviewChange: (preview: SpeakerCardProfile, isPhotoBusy: boolean) => void;
  onDone: () => void;
  onCancel: () => void;
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

// The profile form, opened in place on the dashboard (DashboardWorkspace). The card beside it is
// the preview. Saving publishes and closes the form; Cancel drops unsaved text.
export default function ProfileEditorPanel({ profile, onPreviewChange, onDone, onCancel }: ProfileEditorPanelProps) {
  const router = useRouter();
  const [fields, setFields] = useState<PortalProfileFields>({
    tagline: profile.tagline,
    bio: profile.bio,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    websiteUrl: profile.websiteUrl,
  });
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isPhotoBusy, startPhoto] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const taglineInput = useRef<HTMLInputElement>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const hasUnsavedChanges = (Object.keys(fields) as (keyof PortalProfileFields)[]).some((key) => fields[key] !== profile[key]);

  useEffect(() => {
    taglineInput.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    onPreviewChange(
      {
        name: profile.name,
        tagline: fields.tagline.trim(),
        bio: fields.bio.trim(),
        photoUrl,
        linkedinUrl: previewUrl(fields.linkedinUrl),
        githubUrl: previewUrl(fields.githubUrl),
        websiteUrl: previewUrl(fields.websiteUrl),
      },
      isPhotoBusy
    );
  }, [fields, photoUrl, isPhotoBusy, profile.name, onPreviewChange]);

  function update(key: keyof PortalProfileFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!hasUnsavedChanges) {
      onDone();
      return;
    }
    startSaving(async () => {
      const result = await updatePortalProfile(profile.id, fields);
      if (result.error) setAlertMessage(result.error);
      else {
        router.refresh();
        onDone();
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
        setPhotoMessage('Photo updated. It is live now.');
        router.refresh();
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
        setPhotoMessage('Photo removed.');
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
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
          {isPhotoBusy ? 'Uploading…' : photoUrl ? 'Replace photo' : 'Upload photo'}
        </button>
        {photoUrl && (
          <button type="button" disabled={isPhotoBusy} onClick={handlePhotoRemove} aria-label="Remove your photo" className={dangerOutlineButton}>
            Remove photo
          </button>
        )}
        {photoMessage && <p role="status" className="text-sm text-google-green">{photoMessage}</p>}
      </div>
      <p className={hintClass}>A square headshot works best. JPEG, PNG or WebP, up to 5 MB. Photo changes go live straight away.</p>

      <form onSubmit={handleSave} noValidate className="mt-8 space-y-7">
        <div>
          <label htmlFor="portal-tagline" className={labelClass}>Tagline</label>
          <input
            ref={taglineInput}
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
            rows={7}
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

        <p className="text-sm text-white/60">
          To change your name or email address, write to{' '}
          <a href="mailto:hello@gdgsydney.com" className="text-google-blue-light underline hover:no-underline">hello@gdgsydney.com</a>.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={isSaving || isPhotoBusy} aria-label="Save and publish your profile" className={primaryButton}>
            {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save profile' : 'Done'}
          </button>
          <button type="button" disabled={isSaving} onClick={onCancel} aria-label="Stop editing without saving" className={secondaryButton}>
            Cancel
          </button>
          {hasUnsavedChanges && <p className="text-sm text-google-yellow">Unsaved changes</p>}
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
