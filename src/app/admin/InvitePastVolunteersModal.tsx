'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { sendVolunteerInvite } from './volunteerInviteActions';
import { formatDate } from '@/lib/format';
import type { InvitablePastVolunteer } from '@/lib/volunteerInvite';

interface Props {
  eventId: string;
  eventName: string;
  people: InvitablePastVolunteer[];
  onClose: () => void;
  onError: (message: string) => void;
}

// Matches the other bulk sends (calendar invites, thank-yous): one at a time, spaced out to
// stay under Resend's rate limit.
const SEND_SPACING_MS = 600;

// "Invite past volunteers" on /admin/crew (stage 4d-2, PM.md): everyone in the volunteer pool
// who crewed an earlier event and hasn't signed up for this one, ticked by default unless
// already invited.
export default function InvitePastVolunteersModal({ eventId, eventName, people, onClose, onError }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(people.filter((person) => !person.invitedAt).map((person) => person.profileId))
  );
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(profileId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  function handleSend() {
    const targets = people.filter((person) => selected.has(person.profileId));
    if (targets.length === 0) return;
    startTransition(async () => {
      let sendFailures = 0;
      let recordFailures = 0;
      setProgress({ sent: 0, total: targets.length });
      for (const [index, target] of targets.entries()) {
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));
        const result = await sendVolunteerInvite(target.profileId, eventId);
        if (result.error) {
          if (result.emailSent) recordFailures += 1;
          else sendFailures += 1;
        }
        setProgress({ sent: index + 1, total: targets.length });
      }
      setProgress(null);
      if (recordFailures > 0) {
        onError(`${recordFailures} invite${recordFailures === 1 ? ' was' : 's were'} sent but couldn't be recorded, so they may still look unsent. Refresh before sending again so nobody gets two.`);
      } else if (sendFailures > 0) {
        onError(`${sendFailures} of ${targets.length} invites couldn't be sent. They still show as not invited, so you can try them again.`);
      } else {
        onClose();
      }
    });
  }

  const allSelected = people.length > 0 && selected.size === people.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Invite past volunteers to ${eventName}`}
    >
      <div className="w-full max-w-xl bg-surface-raised rounded-2xl shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Invite past volunteers</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close without sending"
            className="text-white/55 hover:text-white/70 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-white/65 leading-relaxed">
            Each person gets an email asking them to crew {eventName}, with a link that shows the details we hold and
            asks only where they&rsquo;d like to help. Their answer lands in Volunteers as a pending signup.
          </p>
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <input
              type="checkbox"
              className="h-4 w-4 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(people.map((person) => person.profileId)))}
            />
            Everyone ({people.length})
          </label>
          <ul className="space-y-2">
            {people.map((person) => (
              <li key={person.profileId}>
                <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue"
                    checked={selected.has(person.profileId)}
                    onChange={() => toggle(person.profileId)}
                    aria-label={`Invite ${person.name}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{person.name}</span>
                    <span className="block text-xs text-white/55 truncate">{person.email}</span>
                    <span className="block text-xs text-white/55">
                      Crewed {person.pastEventNames.join(', ')}
                      {person.invitedAt && <> &middot; invited {formatDate(person.invitedAt)}</>}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          {progress && (
            <p className="mr-auto text-xs text-white/55" role="status">
              Sent {progress.sent} of {progress.total}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/40 text-white/55 hover:border-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || selected.size === 0}
            aria-label={`Send ${selected.size} invite${selected.size === 1 ? '' : 's'} to crew ${eventName}`}
            className="text-xs px-4 py-1.5 rounded-full bg-google-green-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Sending…' : `Send ${selected.size} invite${selected.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
