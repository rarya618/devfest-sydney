'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { removeSpeaker } from './speakerActions';
import { sendAcceptanceEmail, sendSpeakerTicketEmail } from './actions';
import EditSpeakerModal from './EditSpeakerModal';
import Alert from '@/components/Alert';
import { formatDate, getInitials } from '@/lib/format';
import {
  TRACK_LABELS,
  TRACK_CHIP_COLORS,
  TRACK_BORDER_COLORS,
  TRACK_DOT_COLORS,
  FORMAT_LABELS,
  EXPERIENCE_LABELS,
} from '@/lib/submissionLabels';
import type { Speaker, SpeakerConfirmation, Track } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';

type FilterTrack = 'all' | Track;
type FilterConfirmation = 'all' | SpeakerConfirmation;

const CONFIRMATION_CHIP: Record<SpeakerConfirmation, { label: string; className: string; title: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-google-green/15 text-google-green',
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
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white/[0.06] shrink-0">
      {speaker.photoUrl ? (
        <Image src={speaker.photoUrl} alt={speaker.name} width={64} height={64} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/55 text-base font-bold" aria-hidden="true">
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
      className="inline-flex items-center gap-1 text-xs font-medium text-google-blue hover:underline"
    >
      {label}
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 2.5h5v5M9.5 2.5l-6 6" />
      </svg>
    </a>
  );
}

interface SpeakerCardProps {
  speaker: Speaker;
  onError: (message: string) => void;
}

function SpeakerCard({ speaker, onError }: SpeakerCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const confirmation = CONFIRMATION_CHIP[speaker.confirmation];
  const missing = missingProfileParts(speaker);

  useEffect(() => {
    if (!confirmingRemove) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmingRemove(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmingRemove]);

  function handleRemove() {
    setConfirmingRemove(false);
    startTransition(async () => {
      const result = await removeSpeaker(speaker.id);
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
  // confirmed: the same rule the action enforces on the server.
  function handleSendSpeakerTicket() {
    startTransition(async () => {
      const result = await sendSpeakerTicketEmail(speaker.submissionId);
      if (result.error) onError(result.error);
    });
  }

  const alreadyEmailed = Boolean(speaker.acceptanceEmailSentAt);
  const canEmail = speaker.confirmation !== 'unknown';
  const canSendTicket = speaker.confirmation === 'confirmed';
  const ticketSent = Boolean(speaker.speakerTicketEmailSentAt);

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"], [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-surface border-l-4 ${TRACK_BORDER_COLORS[speaker.track]} rounded-lg p-4 sm:p-5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      }`}
      aria-label={`Speaker ${speaker.name}`}
    >
      <div className="flex items-start gap-4">
        <SpeakerAvatar speaker={speaker} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-bold text-white text-xl leading-snug tracking-tight">{speaker.name}</h3>
            <span title={confirmation.title} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${confirmation.className}`}>
              {confirmation.label}
            </span>
          </div>
          {speaker.tagline ? (
            <p className="mt-0.5 text-sm text-white/65">{speaker.tagline}</p>
          ) : (
            <p className="mt-0.5 text-sm text-white/50 italic">No tagline yet</p>
          )}

          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/55 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
            </svg>
            <span className="truncate">{speaker.email}</span>
          </p>

          <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mt-3">
            <span className={`inline-flex items-center gap-1.5 text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] font-bold ${TRACK_CHIP_COLORS[speaker.track]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${TRACK_DOT_COLORS[speaker.track]}`} aria-hidden="true" />
              {TRACK_LABELS[speaker.track]}
            </span>
            <span className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-medium">
              {FORMAT_LABELS[speaker.format]}
            </span>
            <span className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-medium">
              {EXPERIENCE_LABELS[speaker.experienceLevel]}
            </span>
            {missing.length > 0 && (
              <span
                title="These fields are blank and will show as gaps on the public speakers section."
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25"
              >
                Missing {missing.join(', ')}
              </span>
            )}
            {canSendTicket && !ticketSent && (
              <span
                title="This speaker has confirmed but hasn't been sent their complimentary ticket yet. Send it with the ticket button."
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25"
              >
                No ticket sent
              </span>
            )}
          </div>

          <p className="mt-4 font-semibold text-white/90 text-base leading-snug">{speaker.talkTitle}</p>

          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <p className="mt-3 text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{speaker.abstract}</p>

              <div className="mt-4 text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
                <span className="font-bold text-white/85">Bio: </span>
                {speaker.bio ? <span className="whitespace-pre-wrap">{speaker.bio}</span> : <span className="italic text-white/50">not written yet</span>}
              </div>

              {(speaker.linkedinUrl || speaker.githubUrl || speaker.websiteUrl) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {speaker.linkedinUrl && <ProfileLink href={speaker.linkedinUrl} label="LinkedIn" />}
                  {speaker.githubUrl && <ProfileLink href={speaker.githubUrl} label="GitHub" />}
                  {speaker.websiteUrl && <ProfileLink href={speaker.websiteUrl} label="Website" />}
                </div>
              )}

              <p className="mt-4 text-xs text-white/50">
                Added to the lineup {formatDate(speaker.promotedAt)}
                {speaker.acceptanceEmailSentAt && (
                  <>
                    {' '}&middot; Acceptance email sent {formatDate(speaker.acceptanceEmailSentAt)}
                    {speaker.acceptanceEmailSentBy && <> by {speaker.acceptanceEmailSentBy}</>}
                  </>
                )}
                {speaker.speakerConfirmedAt ? (
                  <> &middot; Confirmed {formatDate(speaker.speakerConfirmedAt)}</>
                ) : speaker.confirmByDate ? (
                  <> &middot; Confirmation due {formatDate(speaker.confirmByDate)}</>
                ) : null}
                {speaker.speakerTicketEmailSentAt && (
                  <>
                    {' '}&middot; Ticket sent {formatDate(speaker.speakerTicketEmailSentAt)}
                    {speaker.speakerTicketEmailSentBy && <> by {speaker.speakerTicketEmailSentBy}</>}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            aria-label={`Edit ${speaker.name}`}
            title="Edit speaker"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
            </svg>
          </button>

          {canEmail && (
            <button
              onClick={handleSendAcceptanceEmail}
              disabled={isPending}
              aria-label={`${alreadyEmailed ? 'Resend' : 'Send'} acceptance email to ${speaker.name} for: ${speaker.talkTitle}`}
              title={alreadyEmailed ? 'Resend acceptance email' : 'Send acceptance email'}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                alreadyEmailed
                  ? 'text-white/55 hover:text-white hover:bg-white/[0.08]'
                  : 'bg-google-green/15 text-google-green hover:bg-google-green-deep hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 4 6-4" />
              </svg>
            </button>
          )}

          {canSendTicket && (
            <button
              onClick={handleSendSpeakerTicket}
              disabled={isPending}
              aria-label={`${ticketSent ? 'Resend' : 'Send'} the complimentary speaker ticket to ${speaker.name}`}
              title={ticketSent ? 'Resend speaker ticket' : 'Send speaker ticket'}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                ticketSent
                  ? 'text-white/55 hover:text-white hover:bg-white/[0.08]'
                  : 'bg-google-blue/15 text-google-blue-light hover:bg-google-blue-deep hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 6.25V4.5a1 1 0 011-1h11a1 1 0 011 1v1.75a1.75 1.75 0 000 3.5V11.5a1 1 0 01-1 1h-11a1 1 0 01-1-1V9.75a1.75 1.75 0 000-3.5z" />
                <path strokeLinecap="round" strokeDasharray="1.5 1.5" d="M10 4v8" />
              </svg>
            </button>
          )}

          {confirmingRemove ? (
            <div role="group" aria-label={`Confirm removing ${speaker.name}`} className="flex flex-col items-end gap-1.5 bg-[#2d2e31] border border-white/10 rounded-xl px-3 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] w-52">
              <p className="text-xs text-white/70 leading-snug text-left w-full">
                Remove from the lineup and return the proposal to pending?
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setConfirmingRemove(false)}
                  aria-label="Keep this speaker"
                  className="text-xs px-2.5 py-1 rounded-lg border border-white/40 text-white/50 hover:border-white/60 hover:text-white transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={handleRemove}
                  aria-label={`Remove ${speaker.name} from the lineup`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-google-red-deep text-white font-medium hover:opacity-90 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRemove(true)}
              aria-label={`Remove ${speaker.name} from the lineup`}
              title="Remove from lineup"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/55 hover:text-google-red-light hover:bg-google-red/[0.08] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9h6.6l.7-9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {editing && (
        <EditSpeakerModal
          speaker={speaker}
          onClose={() => setEditing(false)}
          onError={(message) => {
            setEditing(false);
            onError(message);
          }}
        />
      )}
    </div>
  );
}

interface Props {
  speakers: Speaker[];
}

export default function SpeakersDashboard({ speakers }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTrack>('all');
  const [confirmationFilter, setConfirmationFilter] = useState<FilterConfirmation>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [trackMenuOpen, setTrackMenuOpen] = useState(false);
  const [confirmationMenuOpen, setConfirmationMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const trackMenuRef = useRef<HTMLDivElement>(null);
  const confirmationMenuRef = useRef<HTMLDivElement>(null);
  const searchWidthOpen = searchOpen || Boolean(search);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

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

  useEffect(() => {
    if (!searchOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearch('');
        setSearchOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearch('');
        setSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterTrack, number> = {
    all: speakers.length,
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
  const notEmailedCount = confirmationCounts['not-emailed'];
  const incompleteCount = speakers.filter((speaker) => missingProfileParts(speaker).length > 0).length;
  const awaitingTicketCount = speakers.filter(
    (speaker) => speaker.confirmation === 'confirmed' && !speaker.speakerTicketEmailSentAt
  ).length;

  const query = search.trim().toLowerCase();
  const filtered = speakers
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
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Speakers</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {counts.all} in the lineup &middot; {confirmedCount} confirmed
              {notEmailedCount > 0 && <> &middot; {notEmailedCount} not emailed</>}
              {awaitingTicketCount > 0 && <> &middot; {awaitingTicketCount} without a ticket</>}
              {incompleteCount > 0 && <> &middot; {incompleteCount} with profile gaps</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div
              ref={searchContainerRef}
              className={`relative shrink-0 h-10 rounded-full transition-all duration-300 ease-in-out ${
                searchWidthOpen ? 'w-full sm:w-80 bg-white/[0.06]' : 'w-10 bg-white/[0.06] hover:bg-white/[0.1]'
              }`}
            >
              <button
                onClick={() => setSearchOpen(true)}
                tabIndex={searchOpen || search ? -1 : undefined}
                aria-label="Search speakers by name, email, or talk title"
                title="Search"
                className={`absolute left-0 top-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <circle cx="7" cy="7" r="5" />
                  <path strokeLinecap="round" d="M11 11l3.5 3.5" />
                </svg>
              </button>

              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                tabIndex={searchOpen || search ? undefined : -1}
                placeholder="Search by name, email, or talk…"
                aria-label="Search speakers by name, email, or talk title"
                className={`w-full h-10 rounded-full bg-transparent pl-9 pr-9 py-0 text-sm text-white placeholder:text-white/50 focus:outline-none transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/55 pointer-events-none transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0'
                }`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="5" />
                <path strokeLinecap="round" d="M11 11l3.5 3.5" />
              </svg>
              <button
                onClick={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                tabIndex={searchOpen || search ? undefined : -1}
                aria-label="Close search"
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-white/55 hover:text-white/70 transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {(searchOpen || search) && <div className="basis-full h-0 sm:hidden" aria-hidden="true" />}

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
                <span className="font-medium text-white/60">{confirmationCounts[confirmationFilter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${confirmationMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {confirmationMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {confirmationTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitem"
                      onClick={() => {
                        setConfirmationFilter(tab.value);
                        setConfirmationMenuOpen(false);
                      }}
                      aria-pressed={confirmationFilter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        confirmationFilter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
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
                <span className="font-medium text-white/60">{counts[filter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${trackMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {trackMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitem"
                      onClick={() => {
                        setFilter(tab.value);
                        setTrackMenuOpen(false);
                      }}
                      aria-pressed={filter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        filter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
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
          <div className="grid grid-cols-1 gap-5 items-start">
            {filtered.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} onError={setAlertMessage} />
            ))}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
