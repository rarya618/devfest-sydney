'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { addCoSpeaker, type SpeakerProfileFields } from './speakerActions';
import type { Speaker } from '@/lib/types';

interface Props {
  lead: Speaker;
  onClose: () => void;
  onError: (message: string) => void;
}

const EMPTY_PROFILE: SpeakerProfileFields = {
  name: '',
  email: '',
  linkedinUrl: '',
  githubUrl: '',
  websiteUrl: '',
  bio: '',
  tagline: '',
  photoUrl: '',
};

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40';
const labelClasses = 'block text-xs font-semibold text-white/50 mb-1';

// Someone presenting the lead's session with them. Only their profile is asked for: the
// talk is the lead's. The photo is added afterwards with Edit, since an upload needs the
// speaker document to exist first.
export default function AddCoSpeakerModal({ lead, onClose, onError }: Props) {
  const [fields, setFields] = useState<SpeakerProfileFields>(EMPTY_PROFILE);
  const [isPending, startTransition] = useTransition();

  function update<Key extends keyof SpeakerProfileFields>(key: Key, value: SpeakerProfileFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addCoSpeaker(lead.id, fields);
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
      aria-label={`Add a co-speaker to ${lead.name}'s session`}
    >
      <div className="w-full max-w-xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Add co-speaker</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close add co-speaker form"
              className="text-white/55 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-white/50 leading-relaxed">
              Presenting <span className="font-bold text-white/70">{lead.talkTitle}</span> with {lead.name}. They appear on the
              public pages once {lead.name.split(' ')[0]} has confirmed, and take the session&apos;s time and room. Add a photo with
              Edit once they&apos;re saved.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="co-speaker-name">Name</label>
                <input
                  id="co-speaker-name"
                  className={inputClasses}
                  value={fields.name}
                  onChange={(event) => update('name', event.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="co-speaker-email">Email</label>
                <input
                  id="co-speaker-email"
                  type="email"
                  className={inputClasses}
                  value={fields.email}
                  onChange={(event) => update('email', event.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="co-speaker-tagline">Tagline</label>
              <input
                id="co-speaker-tagline"
                className={inputClasses}
                value={fields.tagline}
                onChange={(event) => update('tagline', event.target.value)}
                placeholder="e.g. Senior Android Engineer at Canva"
                maxLength={200}
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="co-speaker-bio">Bio</label>
              <textarea
                id="co-speaker-bio"
                className={`${inputClasses} min-h-[100px]`}
                value={fields.bio}
                onChange={(event) => update('bio', event.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses} htmlFor="co-speaker-linkedin">LinkedIn</label>
                <input
                  id="co-speaker-linkedin"
                  className={inputClasses}
                  value={fields.linkedinUrl}
                  onChange={(event) => update('linkedinUrl', event.target.value)}
                  maxLength={500}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="co-speaker-github">GitHub</label>
                <input
                  id="co-speaker-github"
                  className={inputClasses}
                  value={fields.githubUrl}
                  onChange={(event) => update('githubUrl', event.target.value)}
                  maxLength={500}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="co-speaker-website">Website</label>
                <input
                  id="co-speaker-website"
                  className={inputClasses}
                  value={fields.websiteUrl}
                  onChange={(event) => update('websiteUrl', event.target.value)}
                  maxLength={500}
                />
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
              aria-label={`Add co-speaker to ${lead.name}'s session`}
              className="text-xs px-4 py-1.5 rounded-lg bg-google-blue-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Adding…' : 'Add co-speaker'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
