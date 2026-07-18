'use client';

import { useState, useCallback, useTransition } from 'react';
import { removeAdmin } from '../actions';
import { getInitials, formatDate } from '@/lib/format';
import Alert from '@/components/Alert';
import type { AdminUser } from '@/lib/types';

interface Props {
  admins: AdminUser[];
  currentAdminEmail: string;
}

export default function AdminsView({ admins, currentAdminEmail }: Props) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  function handleRemove(email: string) {
    setRemovingEmail(email);
    startTransition(async () => {
      const result = await removeAdmin(email);
      if (result.error) setAlertMessage(result.error);
      setRemovingEmail(null);
    });
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-black-02 tracking-tight mt-8 mb-6">Admins</h1>

        <div className="space-y-3">
          {admins.map((admin) => {
            const isSelf = admin.email === currentAdminEmail;
            const removing = isPending && removingEmail === admin.email;
            return (
              <div
                key={admin.email}
                className="flex items-center gap-4 bg-white border border-black-02/8 rounded-2xl px-5 py-4"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-google-blue text-white text-sm font-bold shrink-0">
                  {getInitials(admin.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black-02 truncate">
                    {admin.name}
                    {isSelf && <span className="ml-2 text-xs font-medium text-black-02/40">(you)</span>}
                  </p>
                  <p className="text-xs font-mono text-black-02/45 truncate">{admin.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-black-02/40">Added {formatDate(admin.addedAt)}</p>
                  {admin.addedBy && (
                    <p className="text-xs text-black-02/30">by {admin.addedBy === 'self' ? 'self' : admin.addedBy}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(admin.email)}
                  disabled={isSelf || isPending}
                  aria-label={`Remove admin access for ${admin.name}`}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-google-red/25 text-google-red/85 hover:bg-google-red/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {removing ? 'Removing…' : 'Remove'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
