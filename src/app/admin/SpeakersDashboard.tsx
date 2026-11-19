'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import MarkdownText from '@/components/MarkdownText';
import Image from 'next/image';
import { removeSpeaker } from './speakerActions';
import { sendAcceptanceEmail, sendCoSpeakerTicketEmail, sendSpeakerTicketEmail } from './actions';
import { sendCalendarInvite } from './calendarInviteActions';
import { sendSpeakerThanksEmail } from './speakerThanksActions';
import EditSpeakerModal from './EditSpeakerModal';
import AddCoSpeakerModal from './AddCoSpeakerModal';
import Alert from '@/components/Alert';
import { formatDate, getInitials } from '@/lib/format';
import {
  TRACK_LABELS,
  TRACK_CHIP_COLORS,
  TRACK_DOT_COLORS,
  FORMAT_LABELS,
  EXPERIENCE_LABELS,
} from '@/lib/submissionLabels';
import { calendarInviteStatus } from '@/lib/calendarInvite';
import { formatScheduleTime, SCHEDULE_ROOM_LABELS } from '@/lib/scheduleLabels';
import type { CalendarInviteStatus, Speaker, SpeakerConfirmation, SpeakerSessionTime, Track } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';
import HistoryDisclosure, { stampedOn, type HistoryRow } from './HistoryDisclosure';
import ConfirmAction from './ConfirmAction';
import AdminSearch from './AdminSearch';
import SidePanel from './SidePanel';
import { Chip, StatusLabel } from './Chips';
import { PANEL_PILL_CLASSES, PANEL_TEXT_BUTTON_CLASSES } from './RailButtons';
import { acceptedStatus } from './recordStatus';

// The speaker card's history rows. Same shape as the crew card's, so the two dashboards
// read the same way; the dates themselves differ because a speaker is promoted from a
// proposal rather than signing up.
function speakerHistoryRows(speaker: Speaker): HistoryRow[] {
  const rows: HistoryRow[] = [{ label: 'Added to lineup', value: formatDate(speaker.promotedAt) }];

  if (speaker.acceptanceEmailSentAt) {
    rows.push({ label: 'Acceptance sent', value: stampedOn(formatDate(speaker.acceptanceEmailSentAt), speaker.acceptanceEmailSentBy) });
  }

  if (speaker.speakerConfirmedAt) {
    rows.push({ label: 'Confirmed', value: formatDate(speaker.speakerConfirmedAt) });
  } else if (speaker.confirmByDate) {
    rows.push({ label: 'Confirmation due', value: formatDate(speaker.confirmByDate) });
  }

  if (speaker.speakerTicketEmailSentAt) {
    rows.push({ label: 'Ticket sent', value: stampedOn(formatDate(speaker.speakerTicketEmailSentAt), speaker.speakerTicketEmailSentBy) });
  }

  if (speaker.calendarInviteSentAt) {
    rows.push({ label: 'Calendar invite', value: stampedOn(formatDate(speaker.calendarInviteSentAt), speaker.calendarInviteSentBy) });
  }

  if (speaker.thanksEmailSentAt) {
    rows.push({ label: 'Thank-you sent', value: stampedOn(formatDate(speaker.thanksEmailSentAt), speaker.thanksEmailSentBy) });
  }

  return rows;
}

// Null when the schedule could not be read: the calendar controls are hidden rather than
// guessing, since a wrong "off the schedule" would offer a cancellation.
function inviteStatusFor(speaker: Speaker, sessionTimes: Record<string, SpeakerSessionTime> | null): CalendarInviteStatus | null {
  if (!sessionTimes) return null;
  return calendarInviteStatus(speaker.calendarInviteSlot, sessionTimes[speaker.talkId] ?? null, speaker.talkTitle);
}

// The statuses that still need something sent. Bulk sends only the first two:
// cancellations go one at a time, from the card, on purpose.
const INVITE_NEEDS_SENDING: CalendarInviteStatus[] = ['not-sent', 'changed', 'removed'];

const INVITE_CHIP: Partial<Record<CalendarInviteStatus, { label: string; title: string }>> = {
  'not-sent': {
    label: 'No calendar invite',
    title: 'This speaker is on the schedule but hasn\'t been sent a calendar invite. Send it with the calendar button.',
  },
  changed: {
    label: 'Schedule changed',
    title: 'Their time, room or talk title has changed since the invite went out. The calendar button sends an update to the same event.',
  },
  removed: {
    label: 'Off the schedule',
    title: 'They were sent an invite but are no longer on the schedule. The calendar button sends a cancellation that removes it from their calendar.',
  },
};

const INVITE_BUTTON_TITLE: Record<Exclude<CalendarInviteStatus, 'unscheduled'>, string> = {
  'not-sent': 'Send calendar invite',
  changed: 'Send calendar update',
  removed: 'Send calendar cancellation',
  sent: 'Resend calendar invite',
};

// What each calendar send does, for its confirmation.
const INVITE_CONFIRM_DETAIL: Record<Exclude<CalendarInviteStatus, 'unscheduled'>, string> = {
  'not-sent': 'It adds their session to their calendar.',
  changed: 'It moves the session in their calendar to its new time or room.',
  removed: 'It takes the session out of their calendar.',
  sent: 'They get the same invite again; their calendar keeps one entry.',
};

type FilterTrack = 'all' | Track;
type FilterConfirmation = 'all' | SpeakerConfirmation;

const CONFIRMATION_CHIP: Record<SpeakerConfirmation, { label: string; className: string; title: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-google-green/15 text-google-green-light',
    title: 'The speaker has confirmed their participation.',
  },
  awaiting: {
    label: 'Awaiting confirmation',
    className: 'bg-white/10 text-white/60',
    title: 'The acceptance email has been sent but the speaker has not confirmed yet.',
  },
  'not-emailed': {
    label: 'Not emailed',
    className: 'bg-google-yellow/15 text-google-yellow',
    title: 'This speaker has not been told yet. Send the acceptance email with the envelope button.',
  },
  unknown: {
    label: 'No proposal',
    className: 'bg-white/10 text-white/60',
    title: 'The proposal this speaker was promoted from no longer exists.',
  },
};

function missingProfileParts(speaker: Speaker): string[] {
  const missing: string[] = [];
  if (!speaker.photoUrl) missing.push('photo');
  if (!speaker.tagline) missing.push('tagline');
  if (!speaker.bio) missing.push('bio');
  return missing;
}

function SpeakerAvatar({ speaker }: { speaker: Speaker }) {
  return (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white/[0.06] shrink-0">
      {speaker.photoUrl ? (
        <Image src={speaker.photoUrl} alt={speaker.name} width={44} height={44} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/60 text-xs font-bold" aria-hidden="true">
          {getInitials(speaker.name)}
        </div>
      )}
    </div>
  );
}

interface ProfileLinkProps {
  href: string;
  label: string;
}

function ProfileLink({ href, label }: ProfileLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} profile in a new tab`}
      className="inline-flex items-center gap-1 text-xs font-bold text-google-blue hover:underline"
    >
      {label}
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 2.5h5v5M9.5 2.5l-6 6" />
      </svg>
    </a>
  );
}

interface LineupCardProps {
  speaker: Speaker;
  // On a co-speaker, the speaker whose session they present. Undefined otherwise.
  leadSpeaker?: Speaker;
  // On a lead, anyone presenting their session with them.
  coSpeakers: Speaker[];
  session: SpeakerSessionTime | null;
  inviteStatus: CalendarInviteStatus | null;
  onError: (message: string) => void;
  // Shown inside the table's side panel: opens expanded.
  inPanel?: boolean;
}

// One (talk, speaker) pair in full: named LineupCard so it can't be mistaken for the shared
// SpeakerCard (the portal's badge face) imported elsewhere.
function LineupCard({ speaker, leadSpeaker, coSpeakers, session, inviteStatus, onError, inPanel = false }: LineupCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(inPanel);
  const [editing, setEditing] = useState(false);
  const [addingCoSpeaker, setAddingCoSpeaker] = useState(false);
  const isCoSpeaker = Boolean(speaker.coSpeakerOf);
  const missing = missingProfileParts(speaker);


  function handleRemove() {
    startTransition(async () => {
      const result = await removeSpeaker(speaker.talkId, speaker.id);
      if (result.error) onError(result.error);
    });
  }

  // The email is sent against the proposal, not the speaker doc: that is where the sent /
  // confirmed bookkeeping lives, and where /speaker/confirm looks it up.
  function handleSendAcceptanceEmail() {
    startTransition(async () => {
      const result = await sendAcceptanceEmail(speaker.submissionId);
      if (result.error) onError(result.error);
    });
  }

  // The ticket link unlocks a free ticket, so it is only offered once the speaker has
  // confirmed: the same rule the action enforces on the server. A co-speaker has no
  // proposal, so theirs is sent against their own document.
  function handleSendSpeakerTicket() {
    startTransition(async () => {
      const result = isCoSpeaker ? await sendCoSpeakerTicketEmail(speaker.talkId, speaker.id) : await sendSpeakerTicketEmail(speaker.submissionId);
      if (result.error) onError(result.error);
    });
  }

  function handleSendCalendarInvite() {
    startTransition(async () => {
      const result = await sendCalendarInvite(speaker.talkId, speaker.id);
      if (result.error) onError(result.error);
    });
  }

  function handleSendThanks() {
    startTransition(async () => {
      const result = await sendSpeakerThanksEmail(speaker.talkId, speaker.id);
      if (result.error) onError(result.error);
    });
  }

  const alreadyEmailed = Boolean(speaker.acceptanceEmailSentAt);
  // A co-speaker was never sent an acceptance: the lead answered for the session.
  const canEmail = !isCoSpeaker && speaker.confirmation !== 'unknown';
  const canSendTicket = speaker.confirmation === 'confirmed';
  const ticketSent = Boolean(speaker.speakerTicketEmailSentAt);
  const thanksSent = Boolean(speaker.thanksEmailSentAt);
  // Confirmed only, as the action enforces: an invite announces a slot the speaker has
  // agreed to turn up for.
  const inviteAction = canSendTicket && inviteStatus && inviteStatus !== 'unscheduled' ? inviteStatus : null;
  const inviteChip = inviteAction ? INVITE_CHIP[inviteAction] : undefined;

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, summary, [role="menu"], [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  const neutralChip = 'inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full bg-white/[0.06] text-white/70 font-bold';
  const warningChip = 'inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full font-bold bg-google-yellow/15 text-google-yellow';

  // Compact by default (redesigned 2026-11-14: the card had seven stacked action buttons and six
  // lines before the talk title). Collapsed: who, what, and one row of chips with every gap
  // that needs acting on. Expanded (click the card): tagline, email, abstract, bio, links,
  // history.
  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-surface rounded-2xl px-4 py-4 sm:px-5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      }`}
      aria-label={`Speaker ${speaker.name}`}
    >
      {/* In the side panel the actions take their own row along the top, so the text keeps the
          panel's full width instead of wrapping beside seven buttons. */}
      <div className={`flex items-start gap-4 ${inPanel ? 'flex-wrap' : ''}`}>
        <SpeakerAvatar speaker={speaker} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h2 className="font-bold text-white text-base leading-snug">{speaker.name}</h2>
            <StatusLabel tone={acceptedStatus(speaker.confirmation).tone} title={acceptedStatus(speaker.confirmation).title}>
              {acceptedStatus(speaker.confirmation).label}
            </StatusLabel>
            {isCoSpeaker && (
              <span className="text-xs font-bold text-google-blue-light">
                with {leadSpeaker?.name ?? 'a speaker no longer in the lineup'}
              </span>
            )}
            {coSpeakers.length > 0 && (
              <span className="text-xs font-bold text-google-blue-light">
                with {coSpeakers.map((coSpeaker) => coSpeaker.name).join(' and ')}
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm text-white/85 leading-snug ${isOpen ? '' : 'truncate'}`} title={speaker.talkTitle}>
            {speaker.talkTitle}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className={`${neutralChip} gap-1.5 font-bold ${TRACK_CHIP_COLORS[speaker.track]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${TRACK_DOT_COLORS[speaker.track]}`} aria-hidden="true" />
              {TRACK_LABELS[speaker.track]}
            </span>
            <span className={neutralChip}>{FORMAT_LABELS[speaker.format]}</span>
            <span className={neutralChip}>{EXPERIENCE_LABELS[speaker.experienceLevel]}</span>
            {session && (
              <span className={neutralChip}>
                {session.room === 'all' ? '' : `${SCHEDULE_ROOM_LABELS[session.room].name}, `}
                {formatScheduleTime(session.startTime)}
              </span>
            )}
            {missing.length > 0 && (
              <span title="These fields are blank and will show as gaps on the public speakers section." className={warningChip}>
                Missing {missing.join(', ')}
              </span>
            )}
            {canSendTicket && !ticketSent && (
              <span
                title="This speaker has confirmed but hasn't been sent their complimentary ticket yet. Send it with the ticket button."
                className={warningChip}
              >
                No ticket sent
              </span>
            )}
            {inviteChip && (
              <span title={inviteChip.title} className={warningChip}>
                {inviteChip.label}
              </span>
            )}
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="mt-3 space-y-1">
                {speaker.tagline ? (
                  <p className="text-sm text-white/70">{speaker.tagline}</p>
                ) : (
                  <p className="text-sm text-white/50">No tagline yet</p>
                )}
                <p className="flex items-center gap-1.5 text-sm text-white/60 min-w-0">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
                  </svg>
                  <span className="truncate">{speaker.email}</span>
                </p>
              </div>

              <MarkdownText text={speaker.abstract} className="mt-3 text-sm text-white/65 leading-relaxed" />

              <div className="mt-4 text-sm text-white/65 bg-white/[0.04] rounded-xl px-4 py-3 leading-relaxed">
                <p className="font-bold text-white/85 mb-1">Bio</p>
                {speaker.bio ? <MarkdownText text={speaker.bio} /> : <p className="text-white/50">Not written yet</p>}
              </div>

              {(speaker.linkedinUrl || speaker.githubUrl || speaker.websiteUrl) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {speaker.linkedinUrl && <ProfileLink href={speaker.linkedinUrl} label="LinkedIn" />}
                  {speaker.githubUrl && <ProfileLink href={speaker.githubUrl} label="GitHub" />}
                  {speaker.websiteUrl && <ProfileLink href={speaker.websiteUrl} label="Website" />}
                </div>
              )}

              <HistoryDisclosure subjectName={speaker.name} rows={speakerHistoryRows(speaker)} />
            </div>
          </div>
        </div>

        {/* The panel's actions, labelled: sends as pills, Remove as quiet text at the end. */}
        <div className="relative order-first w-full flex flex-wrap items-center gap-2 pb-4 mb-1 border-b border-white/10">
          <button onClick={() => setEditing(true)} aria-label={`Edit ${speaker.name}`} className={PANEL_PILL_CLASSES}>
            Edit
          </button>

          {!isCoSpeaker && (
            <button
              onClick={() => setAddingCoSpeaker(true)}
              aria-label={`Add a co-speaker to ${speaker.name}'s session`}
              className={PANEL_PILL_CLASSES}
            >
              Add co-speaker
            </button>
          )}

          {canEmail && (
            <ConfirmAction
              tone="send"
              message={`${alreadyEmailed ? 'Resend' : 'Send'} the acceptance email to ${speaker.name}?`}
              detail={speaker.confirmation === 'confirmed'
                ? 'They have confirmed their spot. They get the email again anyway.'
                : alreadyEmailed
                  ? `Last sent ${formatDate(speaker.acceptanceEmailSentAt!)}. They get it again, with a new date to confirm by.`
                  : 'It tells them their talk is in and asks them to confirm their spot.'}
              confirmLabel={alreadyEmailed ? 'Resend email' : 'Send email'}
              onConfirm={handleSendAcceptanceEmail}
            >
              {(triggerProps) => (
                <button
                  {...triggerProps}
                  disabled={isPending}
                  aria-label={`${alreadyEmailed ? 'Resend' : 'Send'} acceptance email to ${speaker.name} for: ${speaker.talkTitle}`}
                  className={PANEL_PILL_CLASSES}
                >
                  {alreadyEmailed ? 'Resend acceptance email' : 'Send acceptance email'}
                </button>
              )}
            </ConfirmAction>
          )}

          {canSendTicket && (
            <ConfirmAction
              tone="send"
              message={`${ticketSent ? 'Resend' : 'Send'} the speaker ticket to ${speaker.name}?`}
              detail={ticketSent ? 'They get the free ticket link again.' : 'It emails them the link to their free speaker ticket.'}
              confirmLabel={ticketSent ? 'Resend ticket' : 'Send ticket'}
              onConfirm={handleSendSpeakerTicket}
            >
              {(triggerProps) => (
                <button
                  {...triggerProps}
                  disabled={isPending}
                  aria-label={`${ticketSent ? 'Resend' : 'Send'} the complimentary speaker ticket to ${speaker.name}`}
                  className={PANEL_PILL_CLASSES}
                >
                  {ticketSent ? 'Resend ticket' : 'Send ticket'}
                </button>
              )}
            </ConfirmAction>
          )}

          {inviteAction && (
            <ConfirmAction
              tone="send"
              message={`${INVITE_BUTTON_TITLE[inviteAction]} to ${speaker.name}?`}
              detail={INVITE_CONFIRM_DETAIL[inviteAction]}
              confirmLabel={INVITE_BUTTON_TITLE[inviteAction].replace(/ calendar /, ' ').replace(/^./, (letter) => letter.toUpperCase())}
              onConfirm={handleSendCalendarInvite}
            >
              {(triggerProps) => (
                <button
                  {...triggerProps}
                  disabled={isPending}
                  aria-label={`${INVITE_BUTTON_TITLE[inviteAction]} to ${speaker.name}`}
                  className={PANEL_PILL_CLASSES}
                >
                  {INVITE_BUTTON_TITLE[inviteAction]}
                </button>
              )}
            </ConfirmAction>
          )}

          {canSendTicket && (
            <ConfirmAction
              tone="send"
              message={`${thanksSent ? 'Resend' : 'Send'} the thank-you email to ${speaker.name}?`}
              detail={thanksSent ? 'They get the photos, mug and Asana trial offer again.' : 'It links the event photos and offers the mug and the Asana trial.'}
              confirmLabel={thanksSent ? 'Resend email' : 'Send email'}
              onConfirm={handleSendThanks}
            >
              {(triggerProps) => (
                <button
                  {...triggerProps}
                  disabled={isPending}
                  aria-label={`${thanksSent ? 'Resend' : 'Send'} the thank-you email with photos, mug and Asana trial to ${speaker.name}`}
                  className={PANEL_PILL_CLASSES}
                >
                  {thanksSent ? 'Resend thank-you' : 'Send thank-you'}
                </button>
              )}
            </ConfirmAction>
          )}

          <ConfirmAction

            tone="danger"

            message={`Remove ${speaker.name} from the lineup?`}

            detail={isCoSpeaker

              ? 'They come off this session. Nothing is emailed.'

              : coSpeakers.length > 0

                ? `The talk comes off the lineup with ${coSpeakers.map((coSpeaker) => coSpeaker.name.split(' ')[0]).join(' and ')}, and the proposal goes back to pending. Nothing is emailed.`

                : 'The talk comes off the lineup and the proposal goes back to pending. Nothing is emailed.'}

            confirmLabel="Remove"

            onConfirm={handleRemove}

          >

            {(triggerProps) => (

              <button

                {...triggerProps}

                aria-label={`Remove ${speaker.name} from the lineup`}
                className={PANEL_TEXT_BUTTON_CLASSES}
              >
                Remove from lineup
              </button>

            )}

          </ConfirmAction>
        </div>
      </div>

      {editing && (
        <EditSpeakerModal
          speaker={speaker}
          leadSpeakerName={leadSpeaker?.name}
          onClose={() => setEditing(false)}
          onError={(message) => {
            setEditing(false);
            onError(message);
          }}
        />
      )}

      {addingCoSpeaker && (
        <AddCoSpeakerModal
          lead={speaker}
          onClose={() => setAddingCoSpeaker(false)}
          onError={(message) => {
            setAddingCoSpeaker(false);
            onError(message);
          }}
        />
      )}
    </div>
  );
}

const NEXT_STEP_PILL =
  'press inline-flex items-center justify-center h-8 px-3.5 rounded-full border border-white/35 text-sm font-bold text-off-white whitespace-nowrap hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue';

// A row of the lineup table: the person and their talk, the track, where they stand, what's
// missing from their profile, and the one email to send next. The full card (bio, links,
// session, every send, co-speakers, edit, remove, history) opens in the side panel.
function LineupRow(props: LineupCardProps) {
  const { speaker, leadSpeaker, inviteStatus, onError } = props;
  const [isPending, startTransition] = useTransition();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const isCoSpeaker = Boolean(speaker.coSpeakerOf);
  const status = acceptedStatus(speaker.confirmation);
  const missing = missingProfileParts(speaker);
  const canEmail = !isCoSpeaker && speaker.confirmation !== 'unknown';
  const canSendTicket = speaker.confirmation === 'confirmed';
  const inviteAction = canSendTicket && inviteStatus && inviteStatus !== 'unscheduled' ? inviteStatus : null;

  function run(send: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await send();
      if (result.error) onError(result.error);
    });
  }

  function handleRowClick(event: React.MouseEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"], [role="dialog"], [role="alertdialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsPanelOpen(true);
  }

  let nextStep: React.ReactNode = null;
  if (canEmail && speaker.confirmation === 'not-emailed') {
    nextStep = (
      <ConfirmAction
        tone="send"
        message={`Send the acceptance email to ${speaker.name}?`}
        detail="It tells them their talk is in and asks them to confirm their spot."
        confirmLabel="Send email"
        onConfirm={() => run(() => sendAcceptanceEmail(speaker.submissionId))}
      >
        {(triggerProps) => (
          <button {...triggerProps} type="button" disabled={isPending} aria-label={`Send acceptance email to ${speaker.name}`} className={NEXT_STEP_PILL}>
            Send acceptance email
          </button>
        )}
      </ConfirmAction>
    );
  } else if (canSendTicket && !speaker.speakerTicketEmailSentAt) {
    // Co-speakers get their own ticket, sent against their place on the talk.
    nextStep = (
      <ConfirmAction
        tone="send"
        message={`Send the speaker ticket to ${speaker.name}?`}
        detail="It emails them the link to their free speaker ticket."
        confirmLabel="Send ticket"
        onConfirm={() => run(() => (isCoSpeaker ? sendCoSpeakerTicketEmail(speaker.talkId, speaker.id) : sendSpeakerTicketEmail(speaker.submissionId)))}
      >
        {(triggerProps) => (
          <button {...triggerProps} type="button" disabled={isPending} aria-label={`Send the speaker ticket to ${speaker.name}`} className={NEXT_STEP_PILL}>
            Send ticket
          </button>
        )}
      </ConfirmAction>
    );
  } else if (inviteAction && INVITE_NEEDS_SENDING.includes(inviteAction)) {
    nextStep = (
      <ConfirmAction
        tone="send"
        message={`${INVITE_BUTTON_TITLE[inviteAction]} to ${speaker.name}?`}
        detail={INVITE_CONFIRM_DETAIL[inviteAction]}
        confirmLabel={INVITE_BUTTON_TITLE[inviteAction].replace(/ calendar /, ' ').replace(/^./, (letter) => letter.toUpperCase())}
        onConfirm={() => run(() => sendCalendarInvite(speaker.talkId, speaker.id))}
      >
        {(triggerProps) => (
          <button {...triggerProps} type="button" disabled={isPending} aria-label={`${INVITE_BUTTON_TITLE[inviteAction]} to ${speaker.name}`} className={NEXT_STEP_PILL}>
            {INVITE_BUTTON_TITLE[inviteAction].replace(/^Send calendar /, 'Send ')}
          </button>
        )}
      </ConfirmAction>
    );
  }

  return (
    <li
      onClick={handleRowClick}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_8.5rem_11.5rem_12rem_auto] items-center gap-x-4 gap-y-2 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.04] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <SpeakerAvatar speaker={speaker} />
      <div className="min-w-0">
        <h2 className="font-bold text-off-white text-[0.9375rem] leading-snug truncate">
          {speaker.name}
          {isCoSpeaker && leadSpeaker && <span className="font-normal text-white/60"> with {leadSpeaker.name}</span>}
        </h2>
        <p className="mt-0.5 text-sm text-white/60 truncate">{speaker.talkTitle}</p>
        {missing.length > 0 && (
          <p className="mt-1.5"><Chip tone="attention" title="Missing from the public profile">Missing {missing.join(', ').toLowerCase()}</Chip></p>
        )}
      </div>
      <span className="hidden md:block"><Chip dotClass={TRACK_DOT_COLORS[speaker.track]}>{TRACK_LABELS[speaker.track]}</Chip></span>
      <span className="hidden md:block"><StatusLabel tone={status.tone} title={status.title}>{status.label}</StatusLabel></span>
      <span className="col-span-full md:col-span-1 flex justify-start md:justify-end pl-14 md:pl-0 max-md:empty:hidden">{nextStep}</span>
      <button
        type="button"
        onClick={() => setIsPanelOpen(true)}
        aria-label={`Open ${speaker.name}: ${speaker.talkTitle}`}
        className="press row-start-1 col-start-3 md:row-auto md:col-auto inline-flex items-center justify-center w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5L10.5 8 6 12.5" />
        </svg>
      </button>
      {isPanelOpen && (
        <SidePanel title={speaker.name} subtitle={speaker.talkTitle} onClose={() => setIsPanelOpen(false)}>
          <LineupCard {...props} inPanel />
        </SidePanel>
      )}
    </li>
  );
}

interface Props {
  speakers: Speaker[];
  // Speaker id to their slot. Null when the schedule couldn't be read.
  sessionTimes: Record<string, SpeakerSessionTime> | null;
}

// Resend rate limits sends per second, so a bulk send goes one at a time with this gap,
// the same spacing the rejection emails use on /admin.
const BULK_SEND_SPACING_MS = 600;

// The two emails the header can send to everyone who needs one.
type BulkKind = 'invites' | 'thanks';

const BULK_COPY: Record<BulkKind, { singular: string; plural: string; buttonClass: string; confirmClass: string; title: string }> = {
  invites: {
    singular: 'calendar invite',
    plural: 'calendar invites',
    buttonClass: 'bg-google-yellow/15 text-google-yellow hover:bg-google-yellow hover:text-black-02',
    confirmClass: 'bg-google-yellow text-black-02',
    title: 'Sends first invites and updates. Cancellations are sent from each card.',
  },
  thanks: {
    singular: 'thank-you',
    plural: 'thank-yous',
    buttonClass: 'bg-google-green/15 text-google-green-light hover:bg-google-green-deep hover:text-white',
    confirmClass: 'bg-google-green-deep text-white',
    title: 'Sends the thank-you with the photos and the mug and Asana link to every confirmed speaker and co-speaker who hasn\'t had it.',
  },
};

export default function SpeakersDashboard({ speakers, sessionTimes }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [alertMessage, setAlertMessage] = useState<string | null>(
    sessionTimes ? null : 'The schedule couldn\'t be loaded, so calendar invites are hidden for now. Refresh the page to try again.'
  );
  const [bulkProgress, setBulkProgress] = useState<{ kind: BulkKind; sent: number; total: number } | null>(null);
  const [isBulkPending, startBulkTransition] = useTransition();
  const [filter, setFilter] = useState<FilterTrack>('all');
  const [confirmationFilter, setConfirmationFilter] = useState<FilterConfirmation>('all');
  const [search, setSearch] = useState('');
  const [trackMenuOpen, setTrackMenuOpen] = useState(false);
  const [confirmationMenuOpen, setConfirmationMenuOpen] = useState(false);
  const trackMenuRef = useRef<HTMLDivElement>(null);
  const confirmationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (trackMenuRef.current && !trackMenuRef.current.contains(event.target as Node)) {
        setTrackMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setTrackMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [trackMenuOpen]);

  useEffect(() => {
    if (!confirmationMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (confirmationMenuRef.current && !confirmationMenuRef.current.contains(event.target as Node)) {
        setConfirmationMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmationMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmationMenuOpen]);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterTrack, number> = {
    all: speakers.length,
    keynote: speakers.filter((speaker) => speaker.track === 'keynote').length,
    spotlight: speakers.filter((speaker) => speaker.track === 'spotlight').length,
    developer: speakers.filter((speaker) => speaker.track === 'developer').length,
    builder: speakers.filter((speaker) => speaker.track === 'builder').length,
    workshop: speakers.filter((speaker) => speaker.track === 'workshop').length,
    showcase: speakers.filter((speaker) => speaker.track === 'showcase').length,
  };
  const confirmationCounts: Record<FilterConfirmation, number> = {
    all: speakers.length,
    'not-emailed': speakers.filter((speaker) => speaker.confirmation === 'not-emailed').length,
    awaiting: speakers.filter((speaker) => speaker.confirmation === 'awaiting').length,
    confirmed: speakers.filter((speaker) => speaker.confirmation === 'confirmed').length,
    unknown: speakers.filter((speaker) => speaker.confirmation === 'unknown').length,
  };
  const confirmedCount = confirmationCounts.confirmed;
  // A co-speaker shares their lead's status but is never emailed an acceptance themselves.
  const notEmailedCount = speakers.filter((speaker) => !speaker.coSpeakerOf && speaker.confirmation === 'not-emailed').length;
  const incompleteCount = speakers.filter((speaker) => missingProfileParts(speaker).length > 0).length;
  const awaitingTicketCount = speakers.filter(
    (speaker) => speaker.confirmation === 'confirmed' && !speaker.speakerTicketEmailSentAt
  ).length;
  const inviteStatuses = new Map(speakers.map((speaker) => [speaker.rowId, inviteStatusFor(speaker, sessionTimes)]));
  // First invites and updates. Cancellations are left to each card: removing an event from
  // someone's calendar should be a decision made about that one person.
  const bulkInviteTargets = speakers.filter((speaker) => {
    const status = inviteStatuses.get(speaker.rowId);
    return speaker.confirmation === 'confirmed' && (status === 'not-sent' || status === 'changed');
  });

  // Thank-yous go to every confirmed speaker and co-speaker once.
  const bulkThanksTargets = speakers.filter((speaker) => speaker.confirmation === 'confirmed' && !speaker.thanksEmailSentAt);
  const bulkTargets: Record<BulkKind, Speaker[]> = { invites: bulkInviteTargets, thanks: bulkThanksTargets };
  const bulkSenders: Record<BulkKind, (talkId: string, speakerId: string) => Promise<{ error?: string; emailSent?: boolean }>> = {
    invites: sendCalendarInvite,
    thanks: sendSpeakerThanksEmail,
  };

  function handleBulkSend(kind: BulkKind) {
    const targets = bulkTargets[kind];
    const { singular, plural } = BULK_COPY[kind];
    if (targets.length === 0) return;

    startBulkTransition(async () => {
      let sendFailures = 0;
      let recordFailures = 0;
      setBulkProgress({ kind, sent: 0, total: targets.length });

      for (const [index, target] of targets.entries()) {
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, BULK_SEND_SPACING_MS));
        const result = await bulkSenders[kind](target.talkId, target.id);
        if (result.error) {
          if (result.emailSent) recordFailures += 1;
          else sendFailures += 1;
        }
        setBulkProgress({ kind, sent: index + 1, total: targets.length });
      }

      setBulkProgress(null);

      if (recordFailures > 0) {
        setAlertMessage(
          `${recordFailures} ${recordFailures === 1 ? `${singular} was` : `${plural} were`} sent but couldn't be recorded, so those cards may still ask for one. Refresh the page before sending again so nobody gets a duplicate.`
        );
      } else if (sendFailures > 0) {
        setAlertMessage(
          `${sendFailures} of ${targets.length} ${plural} couldn't be sent. Those cards still ask for one, so you can send them again.`
        );
      }
    });
  }

  // Rows arrive a talk at a time, lead first, so a shared session already reads as a group.
  // Grouped by talk (stage 4c) rather than by speaker id, since one person can give two
  // talks at the same event.
  const leadByTalk = new Map(speakers.filter((speaker) => !speaker.coSpeakerOf).map((speaker) => [speaker.talkId, speaker]));
  const coSpeakersByTalk = new Map<string, Speaker[]>();
  for (const speaker of speakers) {
    if (speaker.coSpeakerOf) coSpeakersByTalk.set(speaker.talkId, [...(coSpeakersByTalk.get(speaker.talkId) ?? []), speaker]);
  }
  const orderedSpeakers = speakers;

  const query = search.trim().toLowerCase();
  const filtered = orderedSpeakers
    .filter((speaker) => filter === 'all' || speaker.track === filter)
    .filter((speaker) => confirmationFilter === 'all' || speaker.confirmation === confirmationFilter)
    .filter(
      (speaker) =>
        !query ||
        speaker.name.toLowerCase().includes(query) ||
        speaker.email.toLowerCase().includes(query) ||
        speaker.talkTitle.toLowerCase().includes(query)
    );

  const filterTabs: { value: FilterTrack; label: string }[] = [
    { value: 'all', label: 'All tracks' },
    { value: 'keynote', label: TRACK_LABELS.keynote },
    { value: 'spotlight', label: TRACK_LABELS.spotlight },
    { value: 'developer', label: TRACK_LABELS.developer },
    { value: 'builder', label: TRACK_LABELS.builder },
    { value: 'workshop', label: TRACK_LABELS.workshop },
    { value: 'showcase', label: TRACK_LABELS.showcase },
  ];

  // "No proposal" is only offered when it applies; it is a data problem, not a stage.
  const confirmationTabs: { value: FilterConfirmation; label: string }[] = [
    { value: 'all', label: 'Any status' },
    { value: 'not-emailed', label: CONFIRMATION_CHIP['not-emailed'].label },
    { value: 'awaiting', label: CONFIRMATION_CHIP.awaiting.label },
    { value: 'confirmed', label: CONFIRMATION_CHIP.confirmed.label },
    ...(confirmationCounts.unknown > 0 ? [{ value: 'unknown' as const, label: CONFIRMATION_CHIP.unknown.label }] : []),
  ];

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-black-02/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Speakers</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {counts.all} in the lineup &middot; {confirmedCount} confirmed
              {notEmailedCount > 0 && <> &middot; {notEmailedCount} not emailed</>}
              {awaitingTicketCount > 0 && <> &middot; {awaitingTicketCount} without a ticket</>}
              {bulkInviteTargets.length > 0 && <> &middot; {bulkInviteTargets.length} calendar {bulkInviteTargets.length === 1 ? 'invite' : 'invites'} to send</>}
              {bulkThanksTargets.length > 0 && <> &middot; {bulkThanksTargets.length} without a thank-you</>}
              {incompleteCount > 0 && <> &middot; {incompleteCount} with profile gaps</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {bulkProgress ? (
              <p role="status" className="shrink-0 h-10 inline-flex items-center px-4 rounded-full bg-white/[0.06] text-sm font-bold text-white/70">
                Sending {BULK_COPY[bulkProgress.kind].plural} {bulkProgress.sent} of {bulkProgress.total}
              </p>
            ) : (
              (['thanks', 'invites'] as const)
                .filter((kind) => bulkTargets[kind].length > 0)
                .map((kind) => (
                  <ConfirmAction
                    key={kind}
                    tone="send"
                    align="left"
                    message={`Email ${bulkTargets[kind].length} ${bulkTargets[kind].length === 1 ? 'speaker' : 'speakers'} their ${bulkTargets[kind].length === 1 ? BULK_COPY[kind].singular : BULK_COPY[kind].plural}?`}
                    detail={`${BULK_COPY[kind].title} They go one at a time, about a second apart.`}
                    confirmLabel={`Send ${bulkTargets[kind].length}`}
                    onConfirm={() => handleBulkSend(kind)}
                    className="inline-flex shrink-0"
                  >
                    {(triggerProps) => (
                      <button
                        {...triggerProps}
                        disabled={isBulkPending}
                        aria-label={`Send ${BULK_COPY[kind].plural} to the ${bulkTargets[kind].length} confirmed speakers who need one`}
                        title={BULK_COPY[kind].title}
                        className={`shrink-0 inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full font-bold transition-colors disabled:opacity-50 ${BULK_COPY[kind].buttonClass}`}
                      >
                        {kind === 'invites' ? (
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <rect x="2" y="3" width="12" height="11" rx="1.5" />
                            <path strokeLinecap="round" d="M2 6.5h12M5.5 1.75v2.5M10.5 1.75v2.5" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <path strokeLinejoin="round" d="M8 13.5S1.75 9.75 1.75 5.75A3 3 0 018 4a3 3 0 016.25 1.75C14.25 9.75 8 13.5 8 13.5z" />
                          </svg>
                        )}
                        Send {bulkTargets[kind].length} {bulkTargets[kind].length === 1 ? BULK_COPY[kind].singular : BULK_COPY[kind].plural}
                      </button>
                    )}
                  </ConfirmAction>
                ))
            )}

            <AdminSearch value={search} onChange={setSearch} label="Search speakers by name, email or talk title" placeholder="Search by name, email or talk…" />

            <div className="relative shrink-0" ref={confirmationMenuRef}>
              <button
                onClick={() => setConfirmationMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={confirmationMenuOpen}
                aria-label="Filter speakers by confirmation status"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  confirmationMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {confirmationTabs.find((tab) => tab.value === confirmationFilter)?.label}
                <span className="font-normal text-white/60">{confirmationCounts[confirmationFilter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${confirmationMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {confirmationMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 bg-surface-raised border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {confirmationTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitemradio"
                      onClick={() => {
                        setConfirmationFilter(tab.value);
                        setConfirmationMenuOpen(false);
                      }}
                      aria-checked={confirmationFilter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        confirmationFilter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-bold hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className="text-white/55">{confirmationCounts[tab.value]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative shrink-0" ref={trackMenuRef}>
              <button
                onClick={() => setTrackMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={trackMenuOpen}
                aria-label="Filter speakers by track"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  trackMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {filterTabs.find((tab) => tab.value === filter)?.label}
                <span className="font-normal text-white/60">{counts[filter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${trackMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {trackMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-surface-raised border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitemradio"
                      onClick={() => {
                        setFilter(tab.value);
                        setTrackMenuOpen(false);
                      }}
                      aria-checked={filter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        filter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-bold hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className="text-white/55">{counts[tab.value]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {speakers.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">No speakers yet. Accept a proposal on the Submissions page to add one to the lineup.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">No speakers match this filter.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface overflow-hidden">
            <div aria-hidden="true" className="hidden md:grid grid-cols-[auto_minmax(0,1fr)_8.5rem_11.5rem_12rem_auto] gap-x-4 px-4 py-2.5 border-b border-white/10 text-xs font-bold text-white/60">
              <span className="w-10 sm:w-11" />
              <span>Speaker and talk</span>
              <span>Track</span>
              <span>Status</span>
              <span className="text-right">Next step</span>
              <span className="w-8" />
            </div>
            <ul className="divide-y divide-white/[0.07]">
              {filtered.map((speaker) => (
                <LineupRow
                  key={speaker.rowId}
                  speaker={speaker}
                  leadSpeaker={speaker.coSpeakerOf ? leadByTalk.get(speaker.talkId) : undefined}
                  coSpeakers={speaker.coSpeakerOf ? [] : coSpeakersByTalk.get(speaker.talkId) ?? []}
                  session={sessionTimes?.[speaker.talkId] ?? null}
                  inviteStatus={inviteStatuses.get(speaker.rowId) ?? null}
                  onError={setAlertMessage}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
