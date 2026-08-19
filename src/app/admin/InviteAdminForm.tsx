'use client';

import { useState } from 'react';
import { addAdmin } from './actions';

interface Props {
  onDone: () => void;
  onError: (message: string) => void;
}

export default function InviteAdminForm({ onDone, onError }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await addAdmin(email, name);
    setSubmitting(false);
    if (result.error) {
      onError(result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Invite admin">
      <div className="w-full max-w-sm bg-[#2d2e31] border border-white/10 rounded-2xl p-6">
        <h2 className="font-bold text-white text-lg tracking-tight mb-1">Invite an admin</h2>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          They&apos;ll be able to sign in with Google immediately using this email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-name" className="block text-xs font-bold text-white/70 mb-1.5">
              Full name
            </label>
            <input
              id="invite-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-google-blue/50 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="invite-email" className="block text-xs font-bold text-white/70 mb-1.5">
              Google account email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-google-blue/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onDone}
              className="flex-1 text-sm px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-google-blue text-white hover:bg-[#3574db] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding…' : 'Add admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
