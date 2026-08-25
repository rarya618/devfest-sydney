'use client';

import { useState, useCallback, useTransition } from 'react';
import { removeAdmin } from '../actions';
import { getInitials, formatDate } from '@/lib/format';
import Alert from '@/components/Alert';
import { useMobileBarHidden } from '../MobileBarContext';
import type { AdminUser } from '@/lib/types';

interface Props {
  admins: AdminUser[];
  currentAdminEmail: string;
}

export default function AdminsView({ admins, currentAdminEmail }: Props) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const mobileBarHidden = useMobileBarHidden();

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
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-4 pb-4 md:pt-8 md:pb-5 bg-[#17181a]/95 backdrop-blur-sm`}>
        <h1 className="text-xl font-bold text-white tracking-tight">Admins</h1>
      </div>

      <div className="px-4 md:px-5">
        <div className="space-y-3">
          {admins.map((admin) => {
            const isSelf = admin.email === currentAdminEmail;
            const removing = isPending && removingEmail === admin.email;
            return (
              <div
                key={admin.email}
                className="flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-2 bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-4"
              >
                <span className="order-1 flex items-center justify-center w-8 h-8 rounded-full bg-google-blue text-white text-xs font-bold shrink-0">
                  {getInitials(admin.name)}
                </span>
                <div className="order-2 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {admin.name}
                    {isSelf && <span className="ml-2 text-xs font-medium text-white/40">(you)</span>}
                  </p>
                  <p className="text-xs text-white/50 truncate">{admin.email}</p>
                </div>
                <button
                  onClick={() => handleRemove(admin.email)}
                  disabled={isSelf || isPending}
                  aria-label={`Remove admin access for ${admin.name}`}
                  className="order-3 md:order-4 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-google-red/30 text-google-red/85 hover:bg-google-red/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {removing ? 'Removing…' : 'Remove'}
                </button>
                <div className="order-4 md:order-3 w-full md:w-auto pl-12 md:pl-0 text-left md:text-right md:shrink-0">
                  <p className="text-xs text-white/40 truncate">
                    Added {formatDate(admin.addedAt)}
                    {admin.addedBy && (
                      <span className="md:hidden"> by {admin.addedBy === 'self' ? 'self' : admin.addedBy}</span>
                    )}
                  </p>
                  {admin.addedBy && (
                    <p className="hidden md:block text-xs text-white/40">
                      by {admin.addedBy === 'self' ? 'self' : admin.addedBy}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
