'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { updateMeetupProposal } from './meetupProposalActions';
import { MEETUP_FORMATS, MEETUP_FORMAT_LABELS, MEETUP_PROPOSAL_LIMITS } from '@/lib/meetupProposalLabels';
import type { MeetupFormat, MeetupProposal } from '@/lib/types';

// Edits a meetup proposal from /admin/meetups. The same fields a speaker can change from the
// portal; once accepted, saving updates its talk too (editMeetupProposal). Name and email stay
// as they are: they belong to the person, edited on All speakers.

interface Props {
  proposal: MeetupProposal;
  onClose: () => void;
  onError: (message: string) => void;
}

interface MeetupProposalFormFields {
  talkTitle: string;
  format: MeetupFormat;
  abstract: string;
  audience: string;
  bio: string;
  profileUrl: string;
  speakingExperience: string;
  notes: string;
}

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40';
const labelClasses = 'block text-xs font-semibold text-white/60 mb-1';

export default function EditMeetupProposalModal({ proposal, onClose, onError }: Props) {
  const [fields, setFields] = useState<MeetupProposalFormFields>({
    talkTitle: proposal.talkTitle,
    format: proposal.format,
    abstract: proposal.abstract,
    audience: proposal.audience,
    bio: proposal.bio,
    profileUrl: proposal.profileUrl,
    speakingExperience: proposal.speakingExperience,
    notes: proposal.notes,
  });
  const [isPending, startTransition] = useTransition();
  const isAccepted = proposal.status === 'accepted';

  function update<Key extends keyof MeetupProposalFormFields>(key: Key, value: MeetupProposalFormFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateMeetupProposal(proposal.id, { ...fields });
      if (result.error) {
        onError(result.error);
        return;
      }
      onClose();
    });
  }

  function textField(key: keyof Omit<MeetupProposalFormFields, 'format'>, label: string, options: { rows?: number; isRequired?: boolean } = {}) {
    const id = `edit-meetup-${key}`;
    return (
      <div>
        <label className={labelClasses} htmlFor={id}>
          {label}
          {!options.isRequired && <span className="font-normal text-white/50"> (optional)</span>}
        </label>
        {options.rows ? (
          <textarea
            id={id}
            rows={options.rows}
            className={`${inputClasses} resize-y`}
            value={fields[key]}
            maxLength={MEETUP_PROPOSAL_LIMITS[key]}
            required={options.isRequired}
            onChange={(event) => update(key, event.target.value)}
          />
        ) : (
          <input
            id={id}
            className={inputClasses}
            value={fields[key]}
            maxLength={MEETUP_PROPOSAL_LIMITS[key]}
            required={options.isRequired}
            onChange={(event) => update(key, event.target.value)}
          />
        )}
      </div>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit meetup talk: ${proposal.talkTitle}`}
    >
      <div className="w-full max-w-xl bg-surface-raised rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">{isAccepted ? 'Edit talk' : 'Edit proposal'}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close the edit form without saving"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-white/60 leading-relaxed">
              From {proposal.name} ({proposal.email}). Their name and email are edited on All speakers.
              {isAccepted && ' Saving updates the talk on the event page and in the speaker portal straight away.'}
            </p>

            {textField('talkTitle', 'Talk title', { isRequired: true })}

            <div>
              <label className={labelClasses} htmlFor="edit-meetup-format">Format</label>
              <select
                id="edit-meetup-format"
                className={inputClasses}
                value={fields.format}
                onChange={(event) => update('format', event.target.value as MeetupFormat)}
              >
                {MEETUP_FORMATS.map((format) => (
                  <option key={format} value={format} className="bg-surface-raised">{MEETUP_FORMAT_LABELS[format]}</option>
                ))}
              </select>
            </div>

            {textField('abstract', 'Abstract', { rows: 8, isRequired: true })}
            {textField('audience', 'Target audience', { rows: 3, isRequired: true })}
            {textField('bio', 'Speaker bio on this proposal', { rows: 4, isRequired: true })}
            {textField('profileUrl', 'LinkedIn or website')}
            {textField('speakingExperience', 'Speaking experience', { rows: 3 })}
            {textField('notes', 'Anything else', { rows: 3 })}
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Cancel editing"
              className="text-xs px-3 py-1.5 rounded-full border border-white/40 text-white/60 hover:border-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label={isAccepted ? 'Save changes to the talk' : 'Save changes to the proposal'}
              className="text-xs px-4 py-1.5 rounded-full bg-google-blue-deep text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
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
