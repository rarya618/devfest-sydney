'use client';

import { useState, useTransition, useEffect, useRef, useCallback, type FormEvent } from 'react';
import {
  acceptMeetupProposal,
  rejectMeetupProposal,
  restoreMeetupProposal,
  archiveMeetupProposal,
  addMeetupReviewerNote,
  sendMeetupAcceptanceEmail,
} from './meetupProposalActions';
import Alert from '@/components/Alert';
import EditMeetupProposalModal from './EditMeetupProposalModal';
import MarkdownText from '@/components/MarkdownText';
import { formatDate } from '@/lib/format';
import {
  MEETUP_FORMATS,
  MEETUP_FORMAT_LABELS,
  MEETUP_FORMAT_SHORT_LABELS,
  MEETUP_STATUS_DOT_STYLES,
  MEETUP_STATUS_LABELS,
} from '@/lib/meetupProposalLabels';
import type { MeetupFormat, MeetupProposal, MeetupProposalStatus, ReviewerNote } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';

// Closes a popover on an outside click or Escape.
function useDismissable(isOpen: boolean, containerRef: React.RefObject<HTMLDivElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onDismiss();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, containerRef, onDismiss]);
}

interface ReviewerNotesPanelProps {
  proposalId: string;
  notes: ReviewerNote[];
  onError: (message: string) => void;
}

function ReviewerNotesPanel({ proposalId, notes, onError }: ReviewerNotesPanelProps) {
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addMeetupReviewerNote(proposalId, text);
      if (result.error) onError(result.error);
      else setDraft('');
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={index} className="text-xs bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{note.text}</p>
              <p className="mt-1.5 text-white/50">
                {note.authorName} &middot; {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-start gap-2">
        <label htmlFor={`meetup-note-${proposalId}`} className="sr-only">
          Add a reviewer note
        </label>
        <textarea
          id={`meetup-note-${proposalId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a reviewer note (admin-only)…"
          rows={2}
          maxLength={2000}
          disabled={isPending}
          className="flex-1 rounded-lg border border-white/35 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40 resize-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Save reviewer note"
          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-google-blue-deep text-white hover:opacity-90 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Add'}
        </button>
      </form>
    </div>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
      <p className="font-bold text-white/85 mb-1">{label}</p>
      <p className="whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
}

// An event a talk can be accepted into: upcoming general events, soonest first.
export interface MeetupEventOption {
  id: string;
  name: string;
}

// The Not emailed / Awaiting / Confirmed chip, as on DevFest > Speakers (stage 4f).
const CONFIRMATION_CHIPS: Record<MeetupProposal['confirmation'], { label: string; className: string; title: string }> = {
  'not-emailed': {
    label: 'Not emailed',
    className: 'bg-google-yellow/15 text-google-yellow border-google-yellow/25',
    title: 'Accepted, but the speaker hasn\'t been told. Send the acceptance email with the envelope button.',
  },
  awaiting: {
    label: 'Awaiting confirmation',
    className: 'bg-white/[0.06] text-white/70 border-white/10',
    title: 'The acceptance email has gone; the speaker hasn\'t confirmed yet.',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-google-green/15 text-google-green border-google-green/25',
    title: 'The speaker has confirmed. They now appear in the event\'s public lineup.',
  },
  unknown: { label: 'Unknown', className: 'bg-white/[0.06] text-white/70 border-white/10', title: '' },
};

interface MeetupProposalRowProps {
  proposal: MeetupProposal;
  events: MeetupEventOption[];
  eventNames: Record<string, string>;
  onError: (message: string) => void;
}

function MeetupProposalRow({ proposal, events, eventNames, onError }: MeetupProposalRowProps) {
  const [isPending, startTransition] = useTransition();
  // Accepting asks which event; taking an accepted talk back asks first, since its talk goes.
  const [choosingEvent, setChoosingEvent] = useState(false);
  const [confirmingTakeBack, setConfirmingTakeBack] = useState<null | 'pending' | 'archived'>(null);
  const isAccepted = proposal.status === 'accepted';
  const [notesOpen, setNotesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const closeMoreMenu = useCallback(() => setMoreOpen(false), []);
  useDismissable(moreOpen, moreMenuRef, closeMoreMenu);

  function handleAccept(eventId: string) {
    setChoosingEvent(false);
    startTransition(async () => {
      const result = await acceptMeetupProposal(proposal.id, eventId);
      if (result.error) onError(result.error);
    });
  }

  function handleTakeBack(target: 'pending' | 'archived') {
    setConfirmingTakeBack(null);
    handleAction(target === 'pending' ? restoreMeetupProposal : archiveMeetupProposal);
  }

  function handleAction(action: (proposalId: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(proposal.id);
      if (result.error) onError(result.error);
    });
  }

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  return (
    <>
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-surface border-l-4 border-l-google-blue rounded-lg pt-4 pb-4 pl-5 pr-4 sm:pt-5 sm:pb-6 sm:pl-6 sm:pr-5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      } ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Meetup talk proposal: ${proposal.talkTitle} by ${proposal.name}`}
    >
      <div className="flex items-stretch gap-4">
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="min-w-0 font-bold text-white text-xl leading-snug tracking-tight mb-3">{proposal.talkTitle}</h3>

          <div className="mb-3 min-w-0">
            <p className="flex items-center gap-1.5 text-sm text-white/55 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <circle cx="8" cy="5.5" r="2.75" />
                <path strokeLinecap="round" d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
              </svg>
              <span className="truncate">{proposal.name}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
              </svg>
              <a
                href={`mailto:${proposal.email}`}
                aria-label={`Email ${proposal.name}`}
                className="truncate hover:text-white/75 underline-offset-2 hover:underline"
              >
                {proposal.email}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mb-4">
            <span
              title={MEETUP_FORMAT_LABELS[proposal.format]}
              className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-blue/15 text-google-blue-light border-google-blue/25"
            >
              {MEETUP_FORMAT_SHORT_LABELS[proposal.format]}
            </span>
            {isAccepted && (
              <span className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-green/15 text-google-green border-google-green/25">
                {eventNames[proposal.eventId] ?? 'Event removed'}
              </span>
            )}
            {isAccepted && (
              <span
                title={CONFIRMATION_CHIPS[proposal.confirmation].title}
                className={`inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold ${CONFIRMATION_CHIPS[proposal.confirmation].className}`}
              >
                {CONFIRMATION_CHIPS[proposal.confirmation].label}
              </span>
            )}
            {proposal.source === 'api' && (
              <span
                title="Sent through the proposal API rather than the gdgsydney.com/speak form, usually by an AI agent on the speaker's behalf. Check it reads like them before accepting."
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25"
              >
                Sent by an agent
              </span>
            )}
            {!proposal.speakingExperience && (
              <span
                title="They left speaking experience blank, which may mean this would be their first talk."
                className="inline-flex items-center text-[11px] leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-medium"
              >
                No speaking experience given
              </span>
            )}
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <MarkdownText text={proposal.abstract} className="text-sm text-white/65 leading-relaxed mb-5" />
              <div className="space-y-3 mb-5">
                <DetailBlock label="Who it's for" text={proposal.audience} />
                <DetailBlock label="About the speaker" text={proposal.bio} />
                {proposal.speakingExperience && <DetailBlock label="Speaking experience" text={proposal.speakingExperience} />}
                {proposal.notes && <DetailBlock label="Anything else" text={proposal.notes} />}
              </div>
              {proposal.profileUrl && (
                <div className="mb-5">
                  <a
                    href={proposal.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${proposal.name}'s profile in a new tab`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
                  >
                    Profile
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h7v7M13 3L4 12" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-auto pt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${MEETUP_STATUS_DOT_STYLES[proposal.status].text}`}>
              <span className={`w-[5px] h-[5px] rounded-full ${MEETUP_STATUS_DOT_STYLES[proposal.status].dot}`} />
              {MEETUP_STATUS_LABELS[proposal.status]}
            </span>
            <span className="text-white/50 text-xs font-bold">&middot;</span>
            <span className="text-xs font-bold text-white/55">{formatDate(proposal.submittedAt)}</span>
            {proposal.editedAt && (
              <span className="text-xs font-bold text-google-yellow" title={`The speaker edited this proposal on ${formatDate(proposal.editedAt)}`}>
                Edited {formatDate(proposal.editedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0 self-start">
          <button
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for: ${proposal.talkTitle}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
            </svg>
          </button>
          {proposal.status === 'pending' && (
            <div className="inline-flex flex-col rounded-full border border-white/15 overflow-hidden">
              <button
                onClick={() => handleAction(rejectMeetupProposal)}
                disabled={isPending}
                aria-label={`Reject meetup talk proposal: ${proposal.talkTitle}`}
                title="Reject"
                className="inline-flex items-center justify-center w-8 py-3 text-white/70 hover:bg-google-red-deep hover:text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
              </button>
              <span className="h-px bg-white/15" />
              <button
                onClick={() => (events.length > 0 ? setChoosingEvent((open) => !open) : onError('There\'s no upcoming general event to accept this into. Create one in Events first.'))}
                disabled={isPending}
                aria-expanded={choosingEvent}
                aria-label={`Accept meetup talk proposal: ${proposal.talkTitle}, choosing which event`}
                title="Accept"
                className="inline-flex items-center justify-center w-8 py-3 text-white/70 hover:bg-google-green-deep hover:text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
                </svg>
              </button>
            </div>
          )}
          {isAccepted && (
            <button
              onClick={() => handleAction(sendMeetupAcceptanceEmail)}
              disabled={isPending}
              aria-label={`${proposal.acceptanceEmailSentAt ? 'Resend' : 'Send'} the acceptance email for ${proposal.talkTitle}`}
              title={proposal.acceptanceEmailSentAt ? 'Resend acceptance email' : 'Send acceptance email'}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-60 ${
                // Highlighted only while the speaker still needs telling: not once sent, nor for a
                // talk agreed outside the form and confirmed without an email.
                proposal.acceptanceEmailSentAt || proposal.confirmation === 'confirmed'
                  ? 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                  : 'bg-google-green/15 text-google-green hover:bg-google-green-deep hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 4 6-4" />
              </svg>
            </button>
          )}
          {proposal.status !== 'pending' && (
            <button
              onClick={() => (isAccepted ? setConfirmingTakeBack('pending') : handleAction(restoreMeetupProposal))}
              disabled={isPending}
              aria-label={`Move meetup talk proposal back to pending: ${proposal.talkTitle}`}
              title="Back to pending"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4L2.5 7.5 6 11M2.5 7.5h6.5a4 4 0 010 8H7" />
              </svg>
            </button>
          )}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreOpen((open) => !open)}
              disabled={isPending}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label={`More actions for: ${proposal.talkTitle}`}
              title="More actions"
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="8" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="13" cy="8" r="1.25" />
              </svg>
              {proposal.reviewerNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-google-blue-deep text-white text-[10px] font-bold leading-none">
                  {proposal.reviewerNotes.length}
                </span>
              )}
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-44 bg-surface-raised border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsEditing(true);
                    setMoreOpen(false);
                  }}
                  aria-label={`Edit ${isAccepted ? 'the talk' : 'the proposal'}: ${proposal.talkTitle}`}
                  className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  Edit
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setNotesOpen((open) => !open);
                    setMoreOpen(false);
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  Notes{proposal.reviewerNotes.length > 0 ? ` (${proposal.reviewerNotes.length})` : ''}
                </button>
                {proposal.status !== 'archived' && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      if (isAccepted) setConfirmingTakeBack('archived');
                      else handleAction(archiveMeetupProposal);
                      setMoreOpen(false);
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {choosingEvent && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs font-semibold text-white/65 mb-2">Accept into which event?</p>
          <div className="flex flex-wrap gap-2">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => handleAccept(event.id)}
                disabled={isPending}
                aria-label={`Accept ${proposal.talkTitle} into ${event.name}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/40 text-white/85 hover:border-google-green hover:text-white transition-colors"
              >
                {event.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setChoosingEvent(false)}
              aria-label="Cancel accepting this proposal"
              className="text-xs px-3 py-1.5 rounded-full text-white/55 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmingTakeBack && (
        <div role="alert" className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <p className="text-xs text-white/70 mr-auto">
            {confirmingTakeBack === 'pending' ? 'Back to pending' : 'Archive'} takes this talk off{' '}
            {eventNames[proposal.eventId] ?? 'its event'}
            {proposal.confirmation !== 'not-emailed' ? ', and the speaker has already been emailed' : ''}.
          </p>
          <button
            type="button"
            onClick={() => setConfirmingTakeBack(null)}
            aria-label="Keep this talk on its event"
            className="text-xs px-3 py-1.5 rounded-lg border border-white/40 text-white/70 hover:text-white transition-colors"
          >
            Keep
          </button>
          <button
            type="button"
            onClick={() => handleTakeBack(confirmingTakeBack)}
            aria-label="Take this talk off its event"
            className="text-xs px-3 py-1.5 rounded-full bg-google-red-deep text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Take it off
          </button>
        </div>
      )}

      {notesOpen && <ReviewerNotesPanel proposalId={proposal.id} notes={proposal.reviewerNotes} onError={onError} />}
    </div>
    {/* Beside the card, not inside it: the modal is a portal, but React still bubbles its clicks
        to the card's own click handler, which would open and close the card. */}
    {isEditing && <EditMeetupProposalModal proposal={proposal} onClose={() => setIsEditing(false)} onError={onError} />}
    </>
  );
}

type FilterStatus = 'all' | MeetupProposalStatus;
type FilterFormat = 'all' | MeetupFormat;

const STATUS_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

interface Props {
  proposals: MeetupProposal[];
  events: MeetupEventOption[];
  eventNames: Record<string, string>;
}

export default function MeetupProposalsDashboard({ proposals, events, eventNames }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [formatFilter, setFormatFilter] = useState<FilterFormat>('all');
  const [search, setSearch] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const closeStatusMenu = useCallback(() => setStatusMenuOpen(false), []);
  useDismissable(statusMenuOpen, statusMenuRef, closeStatusMenu);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: proposals.length,
    pending: proposals.filter((proposal) => proposal.status === 'pending').length,
    accepted: proposals.filter((proposal) => proposal.status === 'accepted').length,
    rejected: proposals.filter((proposal) => proposal.status === 'rejected').length,
    archived: proposals.filter((proposal) => proposal.status === 'archived').length,
  };

  const query = search.trim().toLowerCase();
  const withinStatus = proposals.filter((proposal) => statusFilter === 'all' || proposal.status === statusFilter);
  const visibleProposals = withinStatus
    .filter((proposal) => formatFilter === 'all' || proposal.format === formatFilter)
    .filter(
      (proposal) =>
        !query ||
        proposal.talkTitle.toLowerCase().includes(query) ||
        proposal.name.toLowerCase().includes(query) ||
        proposal.email.toLowerCase().includes(query)
    );

  // Counted within the chosen status, so the number on a tab is what clicking it shows.
  const formatTabs: { value: FilterFormat; label: string; count: number }[] = [
    { value: 'all', label: 'All formats', count: withinStatus.length },
    ...MEETUP_FORMATS.map((format) => ({
      value: format,
      label: MEETUP_FORMAT_SHORT_LABELS[format],
      count: withinStatus.filter((proposal) => proposal.format === format).length,
    })),
  ];

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-black-02/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Meetup talks</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {counts.all} total &middot; {counts.pending} pending review &middot; from gdgsydney.com/speak
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/55 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <circle cx="7" cy="7" r="5" />
                <path strokeLinecap="round" d="M11 11l3.5 3.5" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, name, or email…"
                aria-label="Search meetup proposals by talk title, name, or email"
                className="w-full h-10 rounded-full bg-white/[0.06] border border-white/35 pl-9 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40"
              />
            </div>

            <div className="relative shrink-0" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                aria-label="Filter meetup proposals by status"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  statusMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {STATUS_TABS.find((tab) => tab.value === statusFilter)?.label}
                <span className="font-medium text-white/60">{counts[statusFilter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {statusMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-surface-raised border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitemradio"
                      aria-checked={statusFilter === tab.value}
                      onClick={() => {
                        setStatusFilter(tab.value);
                        setStatusMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        statusFilter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
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

        <div role="group" aria-label="Filter proposals by format" className="mt-3 -mx-4 md:-mx-5 px-4 md:px-5 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {formatTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFormatFilter(tab.value)}
              aria-pressed={formatFilter === tab.value}
              aria-label={tab.value === 'all' ? 'Show proposals in every format' : `Show ${tab.label.toLowerCase()} proposals only`}
              className={`shrink-0 inline-flex items-center gap-2 h-9 text-sm px-4 rounded-full transition-colors font-bold ${
                formatFilter === tab.value ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {tab.label}
              <span className="font-medium text-white/60">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {visibleProposals.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">
              {proposals.length === 0 ? 'No meetup talk proposals yet.' : 'No meetup talk proposals match this filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-start">
            {visibleProposals.map((proposal) => (
              <MeetupProposalRow key={proposal.id} proposal={proposal} events={events} eventNames={eventNames} onError={setAlertMessage} />
            ))}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
