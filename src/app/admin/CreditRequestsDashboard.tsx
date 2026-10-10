'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { csvFilename, downloadCsv } from '@/lib/csv';
import { formatDate } from '@/lib/format';
import type { CreditRequest } from '@/lib/types';
import { EmptyState } from './(dashboard)/analytics/shared';
import { deleteCreditRequest } from './creditRequestActions';
import StickyAdminHeader from './StickyAdminHeader';

interface Props {
  requests: CreditRequest[];
}

function RequestRow({ request, onError }: { request: CreditRequest; onError: (message: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCreditRequest(request.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <li className="bg-surface rounded-xl p-5 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-bold text-white">{request.name}</p>
        <a href={`mailto:${request.email}`} className="text-xs text-white/80 underline underline-offset-2 hover:text-white">{request.email}</a>
        <span className="ml-auto text-xs font-mono text-white/50">{formatDate(request.submittedAt)}</span>
      </div>
      <p className="text-xs font-mono text-white/60">{request.workshopTitle}</p>
      {request.note && <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line">{request.note}</p>}
      <div className="flex justify-end pt-1">
        {confirmingDelete ? (
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isPending} aria-label="Keep this request" className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/35 text-white/80 hover:border-white disabled:opacity-40">
              Keep
            </button>
            <button type="button" onClick={handleDelete} disabled={isPending} aria-label={`Delete the credit request from ${request.name}`} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-google-red-deep border border-google-red-deep text-white hover:opacity-90 disabled:opacity-40">
              Delete
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} aria-label={`Delete the credit request from ${request.name}`} className="text-xs font-bold text-white/55 hover:text-google-red-light">
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export default function CreditRequestsDashboard({ requests }: Props) {
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const workshops = [...new Map(requests.map((request) => [request.workshopSlotId, request.workshopTitle])).entries()];
  const visibleRequests = requests.filter((request) => workshopFilter === 'all' || request.workshopSlotId === workshopFilter);

  function exportCsv() {
    downloadCsv(csvFilename('credit-requests'), [
      ['Submitted', 'Name', 'Email', 'Workshop', 'Note'],
      ...visibleRequests.map((request) => [request.submittedAt, request.name, request.email, request.workshopTitle, request.note]),
    ]);
  }

  return (
    <>
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Workshop credits</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {requests.length} request{requests.length === 1 ? '' : 's'} &middot;{' '}
              <Link href="/credits" className="underline underline-offset-2 hover:text-white">Open the form</Link>
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={visibleRequests.length === 0}
            aria-label="Download the credit requests shown as a CSV file"
            className="text-sm font-bold px-4 py-2 rounded-lg border border-white/35 text-white/85 hover:border-white transition-colors disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </StickyAdminHeader>

      <div className="px-4 md:px-5 pb-10">
        {requests.length === 0 ? (
          <EmptyState message="No credit requests yet. Share /credits with the workshop attendees to start collecting them." />
        ) : (
          <>
            {workshops.length > 1 && (
              <div role="group" aria-label="Filter by workshop" className="mb-4 flex flex-wrap gap-1.5">
                {[['all', 'All workshops'] as const, ...workshops].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={workshopFilter === value}
                    onClick={() => setWorkshopFilter(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      workshopFilter === value ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {label}{' '}
                    <span className="font-mono">
                      {value === 'all' ? requests.length : requests.filter((request) => request.workshopSlotId === value).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <ul className="space-y-3">
              {visibleRequests.map((request) => (
                <RequestRow key={request.id} request={request} onError={setAlertMessage} />
              ))}
            </ul>
          </>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
