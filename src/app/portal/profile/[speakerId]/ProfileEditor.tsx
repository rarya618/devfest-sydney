'use client';

import { useCallback, useRef, useState, useTransition, type FormEvent } from 'react';
import Image from 'next/image';
import Alert from '@/components/Alert';
import { getInitials } from '@/lib/format';
import { hintClass, inputNormal, labelClass, submitClass } from '@/lib/formStyles';
import { PORTAL_PROFILE_LIMITS, type PortalProfileFields } from '@/lib/portalLabels';
import type { PortalProfile } from '@/lib/portalData';
import { removePortalPhoto, updatePortalProfile, uploadPortalPhoto } from '../../actions';

interface ProfileEditorProps {
  profile: Omit<PortalProfile, 'talks'>;
}

const LINK_FIELDS: { key: 'linkedinUrl' | 'githubUrl' | 'websiteUrl'; label: string; placeholder: string }[] = [
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
  { key: 'githubUrl', label: 'GitHub', placeholder: 'github.com/…' },
  { key: 'websiteUrl', label: 'Website', placeholder: 'yoursite.com' },
];

const secondaryButton =
  'inline-flex items-center px-5 py-2 text-sm font-bold text-white rounded border border-white/35 transition-colors hover:border-white disabled:opacity-50';

export default function ProfileEditor({ profile }: ProfileEditorProps) {
  const [fields, setFields] = useState<PortalProfileFields>({
    tagline: profile.tagline,
    bio: profile.bio,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    websiteUrl: profile.websiteUrl,
  });
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isPhotoBusy, startPhoto] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function update(key: keyof PortalProfileFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setSavedMessage(null);
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      const result = await updatePortalProfile(profile.id, fields);
      if (result.error) setAlertMessage(result.error);
      else setSavedMessage('Saved. Your profile is up to date.');
    });
  }

  function handlePhotoChosen(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAlertMessage('That photo is too large. Please keep it under 5 MB.');
      return;
    }
    const formData = new FormData();
    formData.append('photo', file);
    startPhoto(async () => {
      const result = await uploadPortalPhoto(profile.id, formData);
      if (result.error) setAlertMessage(result.error);
      else if (result.photoUrl) setPhotoUrl(result.photoUrl);
      if (fileInput.current) fileInput.current.value = '';
    });
  }

  function handlePhotoRemove() {
    startPhoto(async () => {
      const result = await removePortalPhoto(profile.id);
      if (result.error) setAlertMessage(result.error);
      else setPhotoUrl('');
    });
  }

  return (
    <>
      <section aria-labelledby="photo-heading" className="mb-10">
        <h2 id="photo-heading" className={labelClass}>Photo</h2>
        <div className="flex items-center gap-5">
          {isPhotoBusy ? (
            <div aria-label="Updating your photo" className="w-24 h-24 rounded-full bg-white/10 animate-pulse shrink-0" />
          ) : photoUrl ? (
            <Image src={photoUrl} alt={`Photo of ${profile.name}`} width={96} height={96} className="w-24 h-24 rounded-full object-cover shrink-0" />
          ) : (
            <div aria-hidden="true" className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white/70 shrink-0">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInput}
              id="portal-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handlePhotoChosen(event.target.files?.[0])}
            />
            <button type="button" disabled={isPhotoBusy} onClick={() => fileInput.current?.click()} aria-label={photoUrl ? 'Replace your photo' : 'Upload a photo'} className={secondaryButton}>
              {photoUrl ? 'Replace photo' : 'Upload photo'}
            </button>
            {photoUrl && (
              <button type="button" disabled={isPhotoBusy} onClick={handlePhotoRemove} aria-label="Remove your photo" className={`${secondaryButton} text-google-red-light`}>
                Remove
              </button>
            )}
          </div>
        </div>
        <p className={hintClass}>A square headshot works best. JPEG, PNG or WebP, up to 5 MB.</p>
      </section>

      <form onSubmit={handleSave} noValidate className="space-y-6">
        <div>
          <label htmlFor="portal-tagline" className={labelClass}>Tagline</label>
          <input
            id="portal-tagline"
            value={fields.tagline}
            maxLength={PORTAL_PROFILE_LIMITS.tagline}
            placeholder="Your role and company, or a one-line intro"
            aria-describedby="portal-tagline-hint"
            onChange={(event) => update('tagline', event.target.value)}
            className={inputNormal}
          />
          <p id="portal-tagline-hint" className={hintClass}>Shown under your name, e.g. &ldquo;Staff Engineer at Canva&rdquo;.</p>
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

        {LINK_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`portal-${field.key}`} className={labelClass}>{field.label}</label>
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

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="submit" disabled={isSaving} aria-label="Save your profile" className={submitClass}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
          {savedMessage && <p role="status" className="text-sm text-google-green">{savedMessage}</p>}
        </div>
      </form>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
