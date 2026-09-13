'use client';

import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { removeCrewPhoto, updateCrewMember, uploadCrewPhoto, type CrewEditableFields } from './crewActions';
import { getInitials } from '@/lib/format';
import { VOLUNTEER_AREA_LABELS, VOLUNTEER_SHIFT_LABELS } from '@/lib/volunteerLabels';
import type { VolunteerSubmission } from '@/lib/types';

interface Props {
  member: VolunteerSubmission;
  onClose: () => void;
  onError: (message: string) => void;
}

function toEditableFields(member: VolunteerSubmission): CrewEditableFields {
  return {
    assignedArea: member.assignedArea,
    assignedShift: member.assignedShift,
    showOnCrewPage: member.showOnCrewPage,
    photoUrl: member.photoUrl,
  };
}

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30';
const labelClasses = 'block text-xs font-semibold text-white/50 mb-1';
const sectionHeadingClasses = 'text-[11px] font-bold uppercase tracking-wider text-white/50';

export default function EditCrewMemberModal({ member, onClose, onError }: Props) {
  const [fields, setFields] = useState<CrewEditableFields>(() => toEditableFields(member));
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
      const result = await uploadCrewPhoto(member.id, formData);
      if (result.error || !result.photoUrl) {
        onError(result.error ?? 'Could not upload this photo. Please try again.');
        return;
      }
      update('photoUrl', result.photoUrl);
    });
  }

  function handlePhotoRemove() {
    startPhotoTransition(async () => {
      const result = await removeCrewPhoto(member.id);
      if (result.error) {
        onError(result.error);
        return;
      }
      update('photoUrl', '');
    });
  }

  function update<Key extends keyof CrewEditableFields>(key: Key, value: CrewEditableFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateCrewMember(member.id, fields);
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
      aria-label={`Edit crew member: ${member.name}`}
    >
      <div className="w-full max-w-xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Edit crew member</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close edit crew member form"
              className="text-white/55 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-white/50">
              The roster and what the public crew page shows. What {member.name.split(/\s+/)[0] || 'this volunteer'} wrote
              on the signup form is left as they wrote it.
            </p>

            <div className="space-y-4">
              <h3 className={sectionHeadingClasses}>Roster</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="crew-area">Assigned area</label>
                  <select
                    id="crew-area"
                    className={inputClasses}
                    value={fields.assignedArea}
                    onChange={(event) => update('assignedArea', event.target.value as CrewEditableFields['assignedArea'])}
                  >
                    <option value="">Not assigned yet</option>
                    {Object.entries(VOLUNTEER_AREA_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses} htmlFor="crew-shift">Shift</label>
                  <select
                    id="crew-shift"
                    className={inputClasses}
                    value={fields.assignedShift}
                    onChange={(event) => update('assignedShift', event.target.value as CrewEditableFields['assignedShift'])}
                  >
                    {Object.entries(VOLUNTEER_SHIFT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {member.areasOfInterest.length > 0 && (
                <p className="text-xs text-white/50 leading-relaxed">
                  They asked for: {member.areasOfInterest.map((area) => VOLUNTEER_AREA_LABELS[area]).join(', ')}.
                </p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className={sectionHeadingClasses}>Public crew page</h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.showOnCrewPage}
                  onChange={(event) => update('showOnCrewPage', event.target.checked)}
                  aria-label={`Show ${member.name} on the public crew page`}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-google-green"
                />
                <span className="text-sm text-white/85 leading-snug">
                  Show on the public crew page
                  <span className="block mt-0.5 text-xs text-white/50 leading-relaxed">
                    Off by default. The signup form never asked whether they wanted their name on the
                    site, so tick this only once they&apos;ve said yes. They also have to have
                    confirmed before anything appears.
                  </span>
                </span>
              </label>

              <div>
                <p className={labelClasses}>Photo</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] shrink-0">
                    {fields.photoUrl ? (
                      <Image src={fields.photoUrl} alt={member.name || 'Crew photo'} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/55 text-base font-bold" aria-hidden="true">
                        {getInitials(member.name)}
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
                      aria-label="Choose a crew photo to upload"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto || isPending}
                      aria-label={fields.photoUrl ? 'Replace crew photo' : 'Upload crew photo'}
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
                        aria-label="Remove crew photo"
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:border-white/20 hover:text-white transition-colors disabled:opacity-50"
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
              aria-label="Save changes to crew member"
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
