'use client';

import { useCallback, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { csvFilename, downloadCsv, formatCsvBoolean } from '@/lib/csv';
import { formatDate } from '@/lib/format';
import type { SpeakerGift } from '@/lib/types';
import { EmptyState } from './(dashboard)/analytics/shared';
import { deleteAllSpeakerGifts, deleteSpeakerGift } from './speakerThanksActions';
import StickyAdminHeader from './StickyAdminHeader';

interface AwaitingSpeaker {
  id: string;
  name: string;
  email: string;
}

interface Props {
  gifts: SpeakerGift[];
  awaitingReply: AwaitingSpeaker[];
  thankedCount: number;
}

type GiftTab = 'all' | 'mugs' | 'asana' | 'awaiting';

const secondaryButtonClass =
  'text-sm font-bold px-4 py-2 rounded-lg border border-white/35 text-white/85 hover:border-white transition-colors disabled:opacity-40';

function postalAddress(gift: SpeakerGift): string[] {
  return [
    gift.recipientName,
    gift.addressLine1,
    gift.addressLine2,
    [gift.city, gift.region, gift.postcode].filter(Boolean).join(' '),
    gift.country,
  ].filter(Boolean);
}

function GiftRow({ gift, onError }: { gift: SpeakerGift; onError: (message: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSpeakerGift(gift.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <li className="bg-surface rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-bold text-white">{gift.speakerName}</p>
        <a href={`mailto:${gift.speakerEmail}`} className="text-xs text-white/80 underline underline-offset-2 hover:text-white">{gift.speakerEmail}</a>
        <span className="ml-auto text-xs font-mono text-white/50">{formatDate(gift.submittedAt)}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/50 mb-1">Mug</p>
          {gift.wantsMug ? (
            <address className="not-italic text-sm text-white/85 leading-relaxed">
              {postalAddress(gift).map((line) => <span key={line} className="block">{line}</span>)}
              <span className="block font-mono text-xs text-white/60 mt-1">{gift.phone}</span>
            </address>
          ) : (
            <p className="text-sm text-white/50">Didn&apos;t want one</p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/50 mb-1">Asana trial</p>
          {gift.wantsAsanaTrial ? (
            <p className="text-sm text-white/85">
              {gift.workEmail}
              <span className="block text-xs text-google-green mt-1">Agreed to share with Asana</span>
            </p>
          ) : (
            <p className="text-sm text-white/50">Didn&apos;t want one</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        {confirmingDelete ? (
          <span className="flex items-center gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isPending} aria-label="Keep this answer" className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/35 text-white/80 hover:border-white disabled:opacity-40">
              Keep
            </button>
            <button type="button" onClick={handleDelete} disabled={isPending} aria-label={`Delete the answer from ${gift.speakerName}`} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-google-red-deep border border-google-red-deep text-white hover:opacity-90 disabled:opacity-40">
              Delete
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} aria-label={`Delete the answer from ${gift.speakerName}`} className="text-xs font-bold text-white/55 hover:text-google-red-light">
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export default function SpeakerGiftsDashboard({ gifts, awaitingReply, thankedCount }: Props) {
  const [tab, setTab] = useState<GiftTab>('all');
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [isDeletingAll, startDeleteAll] = useTransition();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const mugGifts = gifts.filter((gift) => gift.wantsMug);
  const asanaGifts = gifts.filter((gift) => gift.wantsAsanaTrial);
  const visibleGifts = tab === 'mugs' ? mugGifts : tab === 'asana' ? asanaGifts : gifts;

  const tabs: { value: GiftTab; label: string; count: number }[] = [
    { value: 'all', label: 'All answers', count: gifts.length },
    { value: 'mugs', label: 'Mugs', count: mugGifts.length },
    { value: 'asana', label: 'Asana trials', count: asanaGifts.length },
    { value: 'awaiting', label: 'Not answered', count: awaitingReply.length },
  ];

  function exportMugs() {
    downloadCsv(csvFilename('speaker-mugs'), [
      ['Recipient', 'Address line 1', 'Address line 2', 'City', 'State or region', 'Postcode', 'Country', 'Phone', 'Speaker email'],
      ...mugGifts.map((gift) => [
        gift.recipientName, gift.addressLine1, gift.addressLine2, gift.city, gift.region, gift.postcode, gift.country, gift.phone, gift.speakerEmail,
      ]),
    ]);
  }

  // Name and work email only: that is what the consent tick agreed to share with Asana.
  function exportAsana() {
    downloadCsv(csvFilename('asana-trials'), [
      ['Name', 'Work email', 'Consented'],
      ...asanaGifts.map((gift) => [gift.speakerName, gift.workEmail, formatCsvBoolean(gift.asanaConsent)]),
    ]);
  }

  function handleDeleteAll() {
    setConfirmingDeleteAll(false);
    startDeleteAll(async () => {
      const result = await deleteAllSpeakerGifts();
      if (result.error) setAlertMessage(result.error);
    });
  }

  return (
    <>
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Speaker gifts</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {gifts.length} of {thankedCount} thanked {thankedCount === 1 ? 'speaker has' : 'speakers have'} answered &middot;{' '}
              {mugGifts.length} {mugGifts.length === 1 ? 'mug' : 'mugs'} &middot; {asanaGifts.length} Asana {asanaGifts.length === 1 ? 'trial' : 'trials'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportMugs} disabled={mugGifts.length === 0} aria-label="Download the mug postal addresses as a CSV file" className={secondaryButtonClass}>
              Export mugs CSV
            </button>
            <button type="button" onClick={exportAsana} disabled={asanaGifts.length === 0} aria-label="Download the names and work emails for Asana as a CSV file" className={secondaryButtonClass}>
              Export Asana CSV
            </button>
            {confirmingDeleteAll ? (
              <span role="group" aria-label="Confirm deleting every answer" className="flex items-center gap-2">
                <button type="button" onClick={() => setConfirmingDeleteAll(false)} aria-label="Keep the answers" className="text-sm font-bold px-3 py-2 rounded-lg border border-white/35 text-white/80 hover:border-white">
                  Keep
                </button>
                <button type="button" onClick={handleDeleteAll} aria-label="Delete every speaker gift answer for good" className="text-sm font-bold px-3 py-2 rounded-lg bg-google-red-deep text-white hover:opacity-90">
                  Delete all {gifts.length}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDeleteAll(true)}
                disabled={gifts.length === 0 || isDeletingAll}
                aria-label="Delete every speaker gift answer, once the mugs have shipped and Asana has the list"
                title="Once the mugs have shipped and Asana has the list. The privacy policy promises this."
                className="text-sm font-bold px-4 py-2 rounded-lg text-white/60 hover:text-google-red-light transition-colors disabled:opacity-40"
              >
                Delete all
              </button>
            )}
          </div>
        </div>
      </StickyAdminHeader>

      <div className="px-4 md:px-5 pb-10">
        {thankedCount === 0 && gifts.length === 0 ? (
          <EmptyState message="No thank-yous sent yet. Send them from Speakers, with the heart button on each card or Send thank-yous in the header." />
        ) : (
          <>
            <div role="group" aria-label="Filter answers" className="mb-4 flex flex-wrap gap-1.5">
              {tabs.map(({ value, label, count }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={tab === value}
                  onClick={() => setTab(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    tab === value ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {label} <span className="font-mono">{count}</span>
                </button>
              ))}
            </div>

            {tab === 'awaiting' ? (
              awaitingReply.length === 0 ? (
                <EmptyState message="Everyone who was thanked has answered." />
              ) : (
                <ul className="bg-surface rounded-xl divide-y divide-white/10">
                  {awaitingReply.map((speaker) => (
                    <li key={speaker.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
                      <p className="text-sm font-bold text-white">{speaker.name}</p>
                      <a href={`mailto:${speaker.email}`} className="text-xs text-white/80 underline underline-offset-2 hover:text-white">{speaker.email}</a>
                    </li>
                  ))}
                </ul>
              )
            ) : visibleGifts.length === 0 ? (
              <EmptyState message="No answers here yet." />
            ) : (
              <ul className="space-y-3">
                {visibleGifts.map((gift) => (
                  <GiftRow key={gift.id} gift={gift} onError={setAlertMessage} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
