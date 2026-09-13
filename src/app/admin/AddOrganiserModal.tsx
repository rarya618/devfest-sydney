'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { addOrganiser, type NewOrganiserFields } from './crewActions';
import { VOLUNTEER_SHIFT_LABELS } from '@/lib/volunteerLabels';

interface Props {
  onClose: () => void;
  onError: (message: string) => void;
}

const EMPTY_ORGANISER: NewOrganiserFields = {
  name: '',
  email: '',
  phone: '',
  organiserRole: '',
  linkedinUrl: '',
  assignedShift: 'full-day',
  showOnCrewPage: false,
};

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30';
const labelClasses = 'block text-xs font-semibold text-white/50 mb-1';

// Organisers never went through the volunteer form, so this is the only way one reaches
// the crew. Deliberately short: a name, how to reach them, and what they do. The photo
// is uploaded afterwards from Edit, which already owns that flow.
export default function AddOrganiserModal({ onClose, onError }: Props) {
  const [fields, setFields] = useState<NewOrganiserFields>(EMPTY_ORGANISER);
  const [isPending, startTransition] = useTransition();

  function update<Key extends keyof NewOrganiserFields>(key: Key, value: NewOrganiserFields[Key]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addOrganiser(fields);
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
      aria-label="Add an organiser to the crew"
    >
      <div className="w-full max-w-xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Add an organiser</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close add organiser form"
              className="text-white/55 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-white/50 leading-relaxed">
              Organisers go straight onto the crew: there is no signup to accept and no acceptance
              email to send. Add their photo from Edit once they are here.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="organiser-name">Name</label>
                <input
                  id="organiser-name"
                  type="text"
                  required
                  maxLength={100}
                  className={inputClasses}
                  value={fields.name}
                  onChange={(event) => update('name', event.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="organiser-role">Role</label>
                <input
                  id="organiser-role"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Lead organiser"
                  className={inputClasses}
                  value={fields.organiserRole}
                  onChange={(event) => update('organiserRole', event.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="organiser-email">Email</label>
                <input
                  id="organiser-email"
                  type="email"
                  required
                  maxLength={200}
                  className={inputClasses}
                  value={fields.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="organiser-phone">Phone (optional)</label>
                <input
                  id="organiser-phone"
                  type="tel"
                  maxLength={30}
                  className={inputClasses}
                  value={fields.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="organiser-linkedin">LinkedIn (optional)</label>
                <input
                  id="organiser-linkedin"
                  type="url"
                  maxLength={500}
                  placeholder="https://www.linkedin.com/in/…"
                  className={inputClasses}
                  value={fields.linkedinUrl}
                  onChange={(event) => update('linkedinUrl', event.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="organiser-shift">Shift</label>
                <select
                  id="organiser-shift"
                  className={inputClasses}
                  value={fields.assignedShift}
                  onChange={(event) => update('assignedShift', event.target.value as NewOrganiserFields['assignedShift'])}
                >
                  {Object.entries(VOLUNTEER_SHIFT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={fields.showOnCrewPage}
                onChange={(event) => update('showOnCrewPage', event.target.checked)}
                aria-label="Show this organiser on the crew and landing pages"
                className="mt-0.5 w-4 h-4 shrink-0 accent-google-green"
              />
              <span className="text-sm text-white/85 leading-snug">
                Show on the crew and landing pages
                <span className="block mt-0.5 text-xs text-white/50 leading-relaxed">
                  Lists them under Organisers on /crew and in the organisers section on the landing
                  page. You can turn this on later from Edit.
                </span>
              </span>
            </label>
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
              aria-label="Add this organiser to the crew"
              className="text-xs px-4 py-1.5 rounded-lg bg-google-blue-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Adding…' : 'Add organiser'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
