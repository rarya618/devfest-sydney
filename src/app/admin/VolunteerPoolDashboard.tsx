'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Alert from '@/components/Alert';
import { restoreVolunteerInvites, sendVolunteerInvite } from './volunteerInviteActions';
import { formatDate } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/eventLabels';
import { VOLUNTEER_STATUS_LABELS } from '@/lib/volunteerLabels';
import type { VolunteerPoolEvent, VolunteerPoolMember } from '@/lib/volunteerInvite';
import type { VolunteerStatus } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';

// The volunteer pool (stage 4d-2, PM.md): everyone who has volunteered or signed up to, kept
// like a mailing list. Pick an event, tick people, and each gets a "Want to crew X?" email
// whose link asks only that event's questions. Anyone who used "Don't invite me again" stays
// listed but can't be ticked.

// Matches the other bulk sends: one at a time, spaced out to stay under Resend's rate limit.
const SEND_SPACING_MS = 600;

type PoolFilter = 'all' | 'crewed' | 'not-invited';

const FILTER_TABS: { value: PoolFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'crewed', label: 'Crewed before' },
  { value: 'not-invited', label: 'Not invited yet' },
];

interface Props {
  members: VolunteerPoolMember[];
  events: VolunteerPoolEvent[];
}

export default function VolunteerPoolDashboard({ members, events }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [filter, setFilter] = useState<PoolFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const chosenEvent = events.find((event) => event.id === eventId) ?? null;

  // Who can be ticked for the chosen event: not opted out, and not already signed up for it.
  const canInvite = useCallback(
    (member: VolunteerPoolMember) => Boolean(chosenEvent) && !member.optedOut && !member.signupStatusByEvent[eventId],
    [chosenEvent, eventId]
  );

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      members
        .filter((member) => filter !== 'crewed' || member.crewedEventNames.length > 0)
        .filter((member) => filter !== 'not-invited' || (!member.invitedAtByEvent[eventId] && canInvite(member)))
        .filter((member) => !query || member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)),
    [members, filter, eventId, query, canInvite]
  );
  const selectableVisible = visible.filter(canInvite);
  const selectedForEvent = [...selected].filter((profileId) => {
    const member = members.find((candidate) => candidate.profileId === profileId);
    return member && canInvite(member);
  });
  const signedUpCount = members.filter((member) => member.signupStatusByEvent[eventId]).length;
  const optedOutCount = members.filter((member) => member.optedOut).length;
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((member) => selected.has(member.profileId));

  function toggle(profileId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      for (const member of selectableVisible) {
        if (allVisibleSelected) next.delete(member.profileId);
        else next.add(member.profileId);
      }
      return next;
    });
  }

  function handleSend() {
    if (!chosenEvent || selectedForEvent.length === 0) return;
    const targets = selectedForEvent;
    startTransition(async () => {
      let sendFailures = 0;
      let recordFailures = 0;
      setProgress({ sent: 0, total: targets.length });
      for (const [index, profileId] of targets.entries()) {
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));
        const result = await sendVolunteerInvite(profileId, chosenEvent.id);
        if (result.error) {
          if (result.emailSent) recordFailures += 1;
          else sendFailures += 1;
        }
        setProgress({ sent: index + 1, total: targets.length });
      }
      setProgress(null);
      setSelected(new Set());
      if (recordFailures > 0) {
        setAlertMessage(`${recordFailures} invite${recordFailures === 1 ? ' was' : 's were'} sent but couldn't be recorded, so they may still look uninvited. Refresh before sending again so nobody gets two.`);
      } else if (sendFailures > 0) {
        setAlertMessage(`${sendFailures} of ${targets.length} invites couldn't be sent. They still show as not invited, so you can try them again.`);
      }
    });
  }

  function handleRestore(profileId: string) {
    startTransition(async () => {
      const result = await restoreVolunteerInvites(profileId);
      if (result.error) setAlertMessage(result.error);
    });
  }

  function statusFor(member: VolunteerPoolMember): string | null {
    if (member.optedOut) return 'Asked not to be invited';
    const status = member.signupStatusByEvent[eventId] as VolunteerStatus | undefined;
    if (status) return `Signed up · ${VOLUNTEER_STATUS_LABELS[status] ?? status}`;
    if (member.invitedAtByEvent[eventId]) return `Invited ${formatDate(member.invitedAtByEvent[eventId])}`;
    return null;
  }

  return (
    <>
      <div
        className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Volunteer pool</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {members.length} {members.length === 1 ? 'person' : 'people'}
              {chosenEvent && <> &middot; {signedUpCount} signed up for {chosenEvent.name}</>}
              {optedOutCount > 0 && <> &middot; {optedOutCount} asked not to be invited</>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {events.length > 0 && (
              <>
                <label htmlFor="pool-event" className="text-sm font-semibold text-white/70">Invite to</label>
                <select
                  id="pool-event"
                  value={eventId}
                  onChange={(changeEvent) => {
                    setEventId(changeEvent.target.value);
                    setSelected(new Set());
                  }}
                  disabled={isPending}
                  aria-label="Choose the event to invite volunteers to"
                  className="h-10 rounded-full border border-white/35 bg-white/[0.06] px-4 text-sm font-semibold text-white focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id} className="bg-[#191a1d]">
                      {event.name} ({EVENT_TYPE_LABELS[event.type]})
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={isPending || !chosenEvent || selectedForEvent.length === 0}
              aria-label={chosenEvent ? `Send ${selectedForEvent.length} invites to crew ${chosenEvent.name}` : 'Send invites'}
              className="inline-flex items-center h-10 text-sm px-4 rounded-full bg-google-green-deep text-white font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {progress ? `Sent ${progress.sent} of ${progress.total}` : `Send ${selectedForEvent.length} invite${selectedForEvent.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter the pool" className="flex items-center gap-2 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                aria-label={`Show ${tab.label.toLowerCase()}`}
                className={`shrink-0 h-9 text-sm px-4 rounded-full font-bold transition-colors ${
                  filter === tab.value ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(changeEvent) => setSearch(changeEvent.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search the volunteer pool by name or email"
            className="ml-auto w-full sm:w-64 h-9 rounded-full bg-white/[0.06] border border-white/35 px-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
          />
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {events.length === 0 && (
          <p className="mb-5 text-sm text-google-yellow bg-google-yellow/10 border border-google-yellow/25 rounded-lg px-4 py-3">
            No upcoming event is taking volunteers, so there is nothing to invite people to yet. Create one in Events and
            tick Volunteer signups.
          </p>
        )}

        {visible.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">{members.length === 0 ? 'Nobody in the pool yet.' : 'Nobody matches this filter.'}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden">
            {chosenEvent && selectableVisible.length > 0 && (
              <label className="flex items-center gap-3 px-4 py-3 border-b border-white/10 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                />
                Select all {selectableVisible.length} shown who can be invited
              </label>
            )}
            <ul>
              {visible.map((member) => {
                const status = statusFor(member);
                const selectable = canInvite(member);
                return (
                  <li key={member.profileId} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.06] last:border-b-0">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue disabled:opacity-30"
                      checked={selectable && selected.has(member.profileId)}
                      disabled={!selectable || isPending}
                      onChange={() => toggle(member.profileId)}
                      aria-label={`Invite ${member.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {member.name}
                        {member.hasBeenOrganiser && <span className="ml-2 text-xs font-normal text-white/55">organiser</span>}
                      </p>
                      <p className="text-xs text-white/55 truncate">{member.email}</p>
                      <p className="text-xs text-white/55">
                        {member.crewedEventNames.length > 0 ? `Crewed ${member.crewedEventNames.join(', ')}` : 'Not on a crew yet'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {status && <p className={`text-xs ${member.optedOut ? 'text-google-yellow' : 'text-white/65'}`}>{status}</p>}
                      {member.optedOut && (
                        <button
                          type="button"
                          onClick={() => handleRestore(member.profileId)}
                          disabled={isPending}
                          aria-label={`Put ${member.name} back on the invite list`}
                          className="mt-1 text-xs text-white/70 underline underline-offset-2 hover:text-white"
                        >
                          Put back on the list
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
