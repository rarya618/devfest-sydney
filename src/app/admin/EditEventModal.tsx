'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { createEvent, updateEvent, type EventFormInput, type PrivateLinkChange } from './eventActions';
import type { AdminEventSummary } from './EventsDashboard';
import {
  DEFAULT_EVENT_TIME_ZONE,
  EVENT_FLOW_KEYS,
  EVENT_FLOW_LABELS,
  EVENT_ID_MAX,
  EVENT_PRIVATE_LINK_HINTS,
  EVENT_PRIVATE_LINK_KEYS,
  EVENT_PRIVATE_LINK_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from '@/lib/eventLabels';
import { isoToWallTime } from '@/lib/zonedTime';
import type { EventFlowKey, EventPrivateLinkKey, EventVenue, GdgEventType } from '@/lib/types';

interface Props {
  // Null to create a new event.
  summary: AdminEventSummary | null;
  onClose: () => void;
  onError: (message: string) => void;
}

const inputClasses =
  'w-full rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40 disabled:opacity-60';
const labelClasses = 'block text-xs font-semibold text-white/55 mb-1';
const hintClasses = 'mt-1 text-xs text-white/50';
const checkboxClasses = 'h-4 w-4 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue';

const EMPTY_VENUE: EventVenue = { name: '', streetAddress: '', locality: '', region: '', postalCode: '', country: 'AU' };

const KEEP_ALL_LINKS = Object.fromEntries(
  EVENT_PRIVATE_LINK_KEYS.map((linkKey) => [linkKey, { action: 'keep' }])
) as Record<EventPrivateLinkKey, PrivateLinkChange>;

function toFormInput(summary: AdminEventSummary | null): EventFormInput {
  if (!summary) {
    return {
      id: '',
      type: 'meetup',
      name: '',
      timeZone: DEFAULT_EVENT_TIME_ZONE,
      startAtWallTime: '',
      endAtWallTime: '',
      venue: null,
      bevyUrl: '',
      humanitixUrl: '',
      ticketLowestPrice: '',
      ticketsOnSaleAtWallTime: '',
      flows: {
        cfs: { enabled: false, open: false, closesAtWallTime: '' },
        showcase: { enabled: false, open: false, closesAtWallTime: '' },
        volunteers: { enabled: false, open: false, closesAtWallTime: '' },
      },
      privateLinks: KEEP_ALL_LINKS,
    };
  }
  const { event } = summary;
  const wallTime = (iso: string | null) => isoToWallTime(iso, event.timeZone);
  return {
    id: event.id,
    type: event.type,
    name: event.name,
    timeZone: event.timeZone,
    startAtWallTime: wallTime(event.startAt),
    endAtWallTime: wallTime(event.endAt),
    venue: event.venue ? { ...event.venue } : null,
    bevyUrl: event.bevyUrl,
    humanitixUrl: event.humanitixUrl,
    ticketLowestPrice: event.ticketLowestPrice,
    ticketsOnSaleAtWallTime: wallTime(event.ticketsOnSaleAt),
    flows: Object.fromEntries(
      EVENT_FLOW_KEYS.map((flowKey) => [
        flowKey,
        { enabled: event[flowKey].enabled, open: event[flowKey].open, closesAtWallTime: wallTime(event[flowKey].closesAt) },
      ])
    ) as EventFormInput['flows'],
    privateLinks: KEEP_ALL_LINKS,
  };
}

// "DevFest Sydney 2027" to "devfest-sydney-2027", offered while the id field is untouched.
function suggestEventId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, EVENT_ID_MAX)
    .replace(/-+$/, '');
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="pt-4 border-t border-white/10 first:pt-0 first:border-t-0 space-y-3">
      <legend className="text-sm font-bold text-white mb-1">{title}</legend>
      {hint && <p className="text-xs text-white/55 -mt-1">{hint}</p>}
      {children}
    </fieldset>
  );
}

export default function EditEventModal({ summary, onClose, onError }: Props) {
  const isCreating = summary === null;
  const [fields, setFields] = useState<EventFormInput>(() => toFormInput(summary));
  const [idTouched, setIdTouched] = useState(!isCreating);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function updateName(name: string) {
    setFields((previous) => ({ ...previous, name, id: idTouched ? previous.id : suggestEventId(name) }));
  }

  function updateVenue(key: keyof EventVenue, value: string) {
    setFields((previous) => ({ ...previous, venue: { ...(previous.venue ?? EMPTY_VENUE), [key]: value } }));
  }

  function updateFlow(flowKey: EventFlowKey, change: Partial<EventFormInput['flows'][EventFlowKey]>) {
    setFields((previous) => ({
      ...previous,
      flows: { ...previous.flows, [flowKey]: { ...previous.flows[flowKey], ...change } },
    }));
  }

  function updateLink(linkKey: EventPrivateLinkKey, change: PrivateLinkChange) {
    setFields((previous) => ({ ...previous, privateLinks: { ...previous.privateLinks, [linkKey]: change } }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = isCreating ? await createEvent(fields) : await updateEvent(fields);
      if (result.error) {
        onError(result.error);
        return;
      }
      onClose();
    });
  }

  const title = isCreating ? 'New event' : `Edit ${summary.event.name}`;
  const hasAnyFlow = EVENT_FLOW_KEYS.some((flowKey) => fields.flows[flowKey].enabled);

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-2xl bg-[#2d2e31] rounded-2xl shadow-xl my-8">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Close the event form without saving"
              className="text-white/55 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <Section title="The event">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClasses} htmlFor="event-name">Name</label>
                  <input
                    id="event-name"
                    className={inputClasses}
                    value={fields.name}
                    maxLength={120}
                    placeholder="DevFest Sydney 2027"
                    onChange={(e) => updateName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="event-type">Kind</label>
                  <select
                    id="event-type"
                    className={inputClasses}
                    value={fields.type}
                    onChange={(e) => update('type', e.target.value as GdgEventType)}
                  >
                    {EVENT_TYPES.map((eventType) => (
                      <option key={eventType} value={eventType}>{EVENT_TYPE_LABELS[eventType]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClasses} htmlFor="event-id">Id</label>
                <input
                  id="event-id"
                  className={`${inputClasses} font-mono`}
                  value={fields.id}
                  maxLength={EVENT_ID_MAX}
                  placeholder="devfest-sydney-2027"
                  disabled={!isCreating}
                  onChange={(e) => {
                    setIdTouched(true);
                    update('id', e.target.value);
                  }}
                  required
                />
                <p className={hintClasses}>
                  {isCreating
                    ? 'Permanent once created: other records will point at it. Lower-case words and numbers joined by hyphens.'
                    : 'Fixed: other records point at it.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="event-start">Starts</label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    className={inputClasses}
                    value={fields.startAtWallTime}
                    onChange={(e) => update('startAtWallTime', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="event-end">Ends</label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    className={inputClasses}
                    value={fields.endAtWallTime}
                    onChange={(e) => update('endAtWallTime', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="event-timezone">Time zone</label>
                  <input
                    id="event-timezone"
                    className={inputClasses}
                    value={fields.timeZone}
                    onChange={(e) => update('timeZone', e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className={hintClasses}>Every date and time on this form is in the event&rsquo;s time zone.</p>
            </Section>

            <Section title="Venue">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  className={checkboxClasses}
                  checked={fields.venue !== null}
                  onChange={(e) => update('venue', e.target.checked ? { ...(fields.venue ?? EMPTY_VENUE) } : null)}
                />
                Has a venue
              </label>
              {fields.venue && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ['name', 'Venue name', 'Torrens University, Surry Hills'],
                      ['streetAddress', 'Street address', 'Shop 1/37 Foveaux St'],
                      ['locality', 'Suburb', 'Surry Hills'],
                      ['region', 'State', 'NSW'],
                      ['postalCode', 'Postcode', '2010'],
                      ['country', 'Country code', 'AU'],
                    ] as [keyof EventVenue, string, string][]
                  ).map(([venueKey, label, placeholder]) => (
                    <div key={venueKey}>
                      <label className={labelClasses} htmlFor={`event-venue-${venueKey}`}>{label}</label>
                      <input
                        id={`event-venue-${venueKey}`}
                        className={inputClasses}
                        value={fields.venue?.[venueKey] ?? ''}
                        placeholder={placeholder}
                        maxLength={venueKey === 'country' ? 2 : 200}
                        onChange={(e) => updateVenue(venueKey, e.target.value)}
                        required={venueKey === 'name'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Listing and tickets">
              <div>
                <label className={labelClasses} htmlFor="event-bevy">Bevy page</label>
                <input
                  id="event-bevy"
                  type="url"
                  className={inputClasses}
                  value={fields.bevyUrl}
                  placeholder="https://gdg.community.dev/events/details/..."
                  onChange={(e) => update('bevyUrl', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="event-humanitix">Humanitix page</label>
                <input
                  id="event-humanitix"
                  type="url"
                  className={inputClasses}
                  value={fields.humanitixUrl}
                  placeholder="https://events.humanitix.com/..."
                  onChange={(e) => update('humanitixUrl', e.target.value)}
                />
                <p className={hintClasses}>The public ticket page. Leave empty for an event that isn&rsquo;t ticketed.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses} htmlFor="event-on-sale">Tickets on sale from</label>
                  <input
                    id="event-on-sale"
                    type="datetime-local"
                    className={inputClasses}
                    value={fields.ticketsOnSaleAtWallTime}
                    onChange={(e) => update('ticketsOnSaleAtWallTime', e.target.value)}
                  />
                  <p className={hintClasses}>Sales stop on their own when the event ends.</p>
                </div>
                <div>
                  <label className={labelClasses} htmlFor="event-price">Lowest ticket price (AUD)</label>
                  <input
                    id="event-price"
                    inputMode="decimal"
                    className={inputClasses}
                    value={fields.ticketLowestPrice}
                    placeholder="40.00"
                    onChange={(e) => update('ticketLowestPrice', e.target.value)}
                  />
                  <p className={hintClasses}>The cheapest tier, before booking fees. For search results only.</p>
                </div>
              </div>
            </Section>

            <Section
              title="Forms"
              hint="Tick what this event has at all, then whether it is taking entries now. A deadline closes it on its own."
            >
              {EVENT_FLOW_KEYS.map((flowKey) => {
                const flow = fields.flows[flowKey];
                return (
                  <div key={flowKey} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        <input
                          type="checkbox"
                          className={checkboxClasses}
                          checked={flow.enabled}
                          onChange={(e) => updateFlow(flowKey, { enabled: e.target.checked })}
                        />
                        {EVENT_FLOW_LABELS[flowKey]}
                      </label>
                      {flow.enabled && (
                        <label className="flex items-center gap-2 text-sm text-white/70">
                          <input
                            type="checkbox"
                            className={checkboxClasses}
                            checked={flow.open}
                            onChange={(e) => updateFlow(flowKey, { open: e.target.checked })}
                          />
                          Taking entries
                        </label>
                      )}
                    </div>
                    {flow.enabled && (
                      <div className="mt-3 max-w-xs">
                        <label className={labelClasses} htmlFor={`event-${flowKey}-closes`}>Closes at (optional)</label>
                        <input
                          id={`event-${flowKey}-closes`}
                          type="datetime-local"
                          className={inputClasses}
                          value={flow.closesAtWallTime}
                          onChange={(e) => updateFlow(flowKey, { closesAtWallTime: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>

            {hasAnyFlow && (
              <Section
                title="Private links"
                hint="These unlock free tickets or a group chat, so they are never shown here once saved: only whether each one is set."
              >
                {EVENT_PRIVATE_LINK_KEYS.map((linkKey) => {
                  const change = fields.privateLinks[linkKey];
                  const isSet = summary?.privateLinksSet[linkKey] ?? false;
                  return (
                    <div key={linkKey}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-white/55">
                          {EVENT_PRIVATE_LINK_LABELS[linkKey]}{' '}
                          <span className={isSet ? 'text-google-green' : 'text-white/50'}>
                            {change.action === 'clear' ? '(will be removed)' : isSet ? '(set)' : '(not set)'}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          {change.action === 'keep' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateLink(linkKey, { action: 'set', url: '' })}
                                aria-label={`${isSet ? 'Replace' : 'Add'} the ${EVENT_PRIVATE_LINK_LABELS[linkKey].toLowerCase()}`}
                                className="text-xs px-2.5 py-1 rounded-lg border border-white/40 text-white/70 hover:border-white/60 hover:text-white transition-colors"
                              >
                                {isSet ? 'Replace' : 'Add'}
                              </button>
                              {isSet && (
                                <button
                                  type="button"
                                  onClick={() => updateLink(linkKey, { action: 'clear' })}
                                  aria-label={`Remove the ${EVENT_PRIVATE_LINK_LABELS[linkKey].toLowerCase()}`}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-white/40 text-google-red-light hover:border-white/60 transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateLink(linkKey, { action: 'keep' })}
                              aria-label={`Leave the ${EVENT_PRIVATE_LINK_LABELS[linkKey].toLowerCase()} as it is`}
                              className="text-xs px-2.5 py-1 rounded-lg border border-white/40 text-white/70 hover:border-white/60 hover:text-white transition-colors"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </div>
                      {change.action === 'set' && (
                        <input
                          type="url"
                          aria-label={EVENT_PRIVATE_LINK_LABELS[linkKey]}
                          className={inputClasses}
                          value={change.url}
                          placeholder="https://"
                          autoComplete="off"
                          onChange={(e) => updateLink(linkKey, { action: 'set', url: e.target.value })}
                          required
                        />
                      )}
                      <p className={hintClasses}>{EVENT_PRIVATE_LINK_HINTS[linkKey]}</p>
                    </div>
                  );
                })}
              </Section>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/40 text-white/55 hover:border-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label={isCreating ? 'Create this event' : 'Save changes to this event'}
              className="text-xs px-4 py-1.5 rounded-lg bg-google-blue-deep text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : isCreating ? 'Create event' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
