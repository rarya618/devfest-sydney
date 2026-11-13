'use client';

import { useCallback, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { setCurrentDevfest } from './eventActions';
import EditEventModal from './EditEventModal';
import { EVENT_FLOW_KEYS, EVENT_FLOW_LABELS, EVENT_PRIVATE_LINK_KEYS, EVENT_TYPE_LABELS } from '@/lib/eventLabels';
import { formatEventDateTime } from '@/lib/zonedTime';
import type { EventFlowKey, EventPrivateLinkKey, GdgEvent } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';

export interface AdminEventSummary {
  event: GdgEvent;
  isCurrentDevfest: boolean;
  flowOpenNow: Record<EventFlowKey, boolean>;
  ticketsOnSaleNow: boolean;
  privateLinksSet: Record<EventPrivateLinkKey, boolean>;
}

const chipBase = 'inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold';
const CHIP_OPEN = `${chipBase} bg-google-green/15 text-google-green border-google-green/25`;
const CHIP_NEUTRAL = `${chipBase} bg-white/[0.06] text-white/70 border-white/10`;
const CHIP_CURRENT = `${chipBase} bg-google-blue/15 text-google-blue-light border-google-blue/25`;

// "Open until 31 Aug, 12:00 am", "Closed", or "Opens when switched on", in the event's zone.
function flowStatusLabel(summary: AdminEventSummary, flowKey: EventFlowKey): string {
  const window = summary.event[flowKey];
  if (summary.flowOpenNow[flowKey]) {
    return window.closesAt
      ? `open until ${formatEventDateTime(window.closesAt, summary.event.timeZone)}`
      : 'open, no deadline';
  }
  if (window.open && window.closesAt) return `closed ${formatEventDateTime(window.closesAt, summary.event.timeZone)}`;
  return 'closed';
}

function ticketStatusLabel(summary: AdminEventSummary): string | null {
  const { event } = summary;
  if (!event.humanitixUrl) return null;
  if (summary.ticketsOnSaleNow) return 'Tickets on sale';
  if (event.ticketsOnSaleAt && Date.parse(event.ticketsOnSaleAt) > Date.now()) {
    return `Tickets from ${formatEventDateTime(event.ticketsOnSaleAt, event.timeZone)}`;
  }
  return 'Tickets not on sale';
}

function EventCard({
  summary,
  onEdit,
  onError,
}: {
  summary: AdminEventSummary;
  onEdit: () => void;
  onError: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { event } = summary;
  const enabledFlows = EVENT_FLOW_KEYS.filter((flowKey) => event[flowKey].enabled);
  const linksSetCount = EVENT_PRIVATE_LINK_KEYS.filter((linkKey) => summary.privateLinksSet[linkKey]).length;
  const ticketLabel = ticketStatusLabel(summary);

  function handleMakeCurrent() {
    startTransition(async () => {
      const result = await setCurrentDevfest(event.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <div
      className={`bg-surface border-l-4 ${event.type === 'devfest' ? 'border-l-google-blue' : 'border-l-google-green'} rounded-lg p-5 sm:p-6 ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      }`}
      aria-label={`Event: ${event.name}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-bold text-white text-xl leading-snug tracking-tight">{event.name}</h3>
            <span className={CHIP_NEUTRAL}>{EVENT_TYPE_LABELS[event.type]}</span>
            {summary.isCurrentDevfest && (
              <span
                className={CHIP_CURRENT}
                title="The form endpoints, confirm pages, ticket emails and /api/public/status follow this event."
              >
                Current DevFest
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-white/55">
            {event.id} &middot; {formatEventDateTime(event.startAt, event.timeZone)} to{' '}
            {formatEventDateTime(event.endAt, event.timeZone)}
          </p>
          {event.venue && <p className="mt-1 text-sm text-white/65">{event.venue.name}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {event.type === 'devfest' && !summary.isCurrentDevfest && (
            <button
              type="button"
              onClick={handleMakeCurrent}
              aria-label={`Make ${event.name} the current DevFest`}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-white/40 text-white/70 hover:border-white/60 hover:text-white transition-colors"
            >
              Make current
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${event.name}`}
            className="text-xs font-semibold px-3 py-2 rounded-full bg-google-blue-deep text-white hover:opacity-90 transition-opacity"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 gap-y-2">
        {enabledFlows.map((flowKey) => (
          <span key={flowKey} className={summary.flowOpenNow[flowKey] ? CHIP_OPEN : CHIP_NEUTRAL}>
            {EVENT_FLOW_LABELS[flowKey]}: {flowStatusLabel(summary, flowKey)}
          </span>
        ))}
        {ticketLabel && <span className={summary.ticketsOnSaleNow ? CHIP_OPEN : CHIP_NEUTRAL}>{ticketLabel}</span>}
        {enabledFlows.length > 0 && (
          <span
            className={CHIP_NEUTRAL}
            title="Ticket access-code links and the volunteer WhatsApp invite. Never shown here, only whether each is set."
          >
            {linksSetCount} of {EVENT_PRIVATE_LINK_KEYS.length} private links set
          </span>
        )}
      </div>

      {event.updatedBy && (
        <p className="mt-4 text-xs text-white/50">
          Last saved{event.updatedAt ? ` ${formatEventDateTime(event.updatedAt, event.timeZone)}` : ''} by {event.updatedBy}
        </p>
      )}
    </div>
  );
}

interface Props {
  summaries: AdminEventSummary[];
  hasCurrentDevfest: boolean;
}

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; summary: AdminEventSummary };

export default function EventsDashboard({ summaries, hasCurrentDevfest }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);
  const closeModal = useCallback(() => setModal({ mode: 'closed' }), []);

  const currentDevfest = summaries.find((summary) => summary.isCurrentDevfest);

  return (
    <>
      <div
        className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-black-02/95 backdrop-blur-sm`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Events</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {summaries.length} {summaries.length === 1 ? 'event' : 'events'} &middot;{' '}
              {currentDevfest ? <>current DevFest: {currentDevfest.event.name}</> : 'no current DevFest set'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            aria-label="Create a new event"
            className="inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full bg-google-blue-deep text-white font-bold hover:opacity-90 transition-opacity"
          >
            New event
          </button>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {!hasCurrentDevfest && summaries.length > 0 && (
          <p className="mb-5 text-sm text-google-yellow bg-google-yellow/10 border border-google-yellow/25 rounded-lg px-4 py-3">
            No DevFest is set as current, so every form endpoint reads as closed and the ticket emails can&rsquo;t be sent.
            Use &ldquo;Make current&rdquo; on a DevFest.
          </p>
        )}
        {summaries.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">No events yet. Create one, or run scripts/migrate-events.mjs for DevFest 2026.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-start">
            {summaries.map((summary) => (
              <EventCard
                key={summary.event.id}
                summary={summary}
                onEdit={() => setModal({ mode: 'edit', summary })}
                onError={setAlertMessage}
              />
            ))}
          </div>
        )}
      </div>

      {modal.mode !== 'closed' && (
        <EditEventModal
          summary={modal.mode === 'edit' ? modal.summary : null}
          onClose={closeModal}
          onError={setAlertMessage}
        />
      )}

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
