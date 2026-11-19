'use client';

import { useState, useTransition, useEffect, useRef, useCallback, type FormEvent } from 'react';
import {
  acceptShowcaseEntry,
  rejectShowcaseEntry,
  restoreShowcaseEntry,
  archiveShowcaseEntry,
  addShowcaseReviewerNote,
  sendShowcaseAcceptanceEmail,
  sendShowcaseTicketEmail,
} from './showcaseActions';
import EditShowcaseEntryModal from './EditShowcaseEntryModal';
import Alert from '@/components/Alert';
import { formatDate, formatDeadlineDate } from '@/lib/format';
import {
  SHOWCASE_STATUS_DOT_STYLES,
  SHOWCASE_STATUS_LABELS,
  SHOWCASE_STAGE_LABELS,
  SHOWCASE_CONFIRMATION_CHIPS,
} from '@/lib/showcaseLabels';
import type { ReviewerNote, ShowcaseStage, ShowcaseStatus, ShowcaseSubmission } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';
import ConfirmAction from './ConfirmAction';
import DecisionButtons from './DecisionButtons';
import AdminSearch from './AdminSearch';
import FilterChipRow from './FilterChipRow';

interface ReviewerNotesPanelProps {
  entryId: string;
  notes: ReviewerNote[];
  onError: (message: string) => void;
}

function ReviewerNotesPanel({ entryId, notes, onError }: ReviewerNotesPanelProps) {
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addShowcaseReviewerNote(entryId, text);
      if (result.error) {
        onError(result.error);
      } else {
        setDraft('');
      }
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
        <label htmlFor={`showcase-note-${entryId}`} className="sr-only">
          Add a reviewer note
        </label>
        <textarea
          id={`showcase-note-${entryId}`}
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
          className="shrink-0 text-xs font-bold px-3 py-2 rounded-full bg-google-blue-deep text-white hover:opacity-90 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Add'}
        </button>
      </form>
    </div>
  );
}

interface ShowcaseRowProps {
  entry: ShowcaseSubmission;
  onError: (message: string) => void;
}

function ShowcaseRow({ entry, onError }: ShowcaseRowProps) {
  const [isPending, startTransition] = useTransition();
  const [notesOpen, setNotesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  // The ticket link unlocks a free ticket, so it is only offered once the entrant has
  // confirmed. sendShowcaseTicketEmail enforces the same rule server-side.
  const canSendTicket = entry.status === 'accepted' && Boolean(entry.showcaseConfirmedAt);

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(entry.id);
      if (result.error) onError(result.error);
    });
  }

  useEffect(() => {
    if (!moreOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"], [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  const hasTracking = Boolean(
    entry.tracking.utmSource || entry.tracking.utmMedium || entry.tracking.utmCampaign || entry.tracking.ref,
  );
  const links: { label: string; href: string }[] = [
    ...(entry.demoUrl ? [{ label: 'Project', href: entry.demoUrl }] : []),
    ...(entry.repoUrl ? [{ label: 'Repository', href: entry.repoUrl }] : []),
    ...(entry.linkedinUrl ? [{ label: 'LinkedIn', href: entry.linkedinUrl }] : []),
  ];

  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-surface border-l-4 border-l-google-yellow rounded-lg pt-4 pb-4 pl-5 pr-4 sm:pt-5 sm:pb-6 sm:pl-6 sm:pr-5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : ''
      } ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Builder Showcase entry: ${entry.projectName} by ${entry.name}`}
    >
      <div className="flex items-stretch gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
        <h2 className="min-w-0 font-bold text-white text-xl leading-snug tracking-tight">{entry.projectName}</h2>
        {/* Only on accepted entries: "Not emailed" against a pending one would read as a
            task, when the thing to do first is decide. */}
        {entry.status === 'accepted' && (
          <span
            title={SHOWCASE_CONFIRMATION_CHIPS[entry.confirmation].title}
            className={`text-xs font-bold px-1.5 py-0.5 rounded ${SHOWCASE_CONFIRMATION_CHIPS[entry.confirmation].className}`}
          >
            {SHOWCASE_CONFIRMATION_CHIPS[entry.confirmation].label}
          </span>
        )}
        {canSendTicket && !entry.showcaseTicketEmailSentAt && (
          <span
            title="This entrant has confirmed but hasn't been emailed their complimentary ticket. Send it with the ticket button."
            className="text-xs font-bold px-1.5 py-0.5 rounded bg-google-yellow/15 text-google-yellow"
          >
            No ticket sent
          </span>
        )}
      </div>
      <p className="text-sm text-white/65 leading-relaxed mb-3">{entry.pitch}</p>

      <div className="mb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-white/55 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <circle cx="8" cy="5.5" r="2.75" />
              <path strokeLinecap="round" d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
            </svg>
            <span className="truncate">{entry.name}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
            </svg>
            <span className="truncate">{entry.email}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mb-4">
        <span className="inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25">
          {SHOWCASE_STAGE_LABELS[entry.stage]}
        </span>
        {entry.isFirstTimePresenter && (
          <span className="inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full border font-bold bg-google-blue/15 text-google-blue-light border-google-blue/25">
            First-time presenter
          </span>
        )}
        {entry.coPresenters.length > 0 && (
          <span className="inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.06] text-white/70 font-bold">
            {entry.coPresenters.length === 1 ? 'Presenting as a pair' : `Presenting as a team of ${entry.coPresenters.length + 1}`}
          </span>
        )}
        {entry.demoRequirements && (
          <span className="inline-flex items-center text-xs leading-none px-2.5 py-1 rounded-full border font-bold bg-google-red/15 text-google-red-light border-google-red/25">
            Has demo requirements
          </span>
        )}
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">

      <p className="text-sm text-white/65 leading-relaxed mb-5 whitespace-pre-wrap break-words">{entry.description}</p>

      {(entry.builtWith || entry.coPresenters.length > 0 || entry.demoRequirements || hasTracking || entry.acceptanceEmailSentAt) && (
        <div className="space-y-3 mb-5">
          {entry.status === 'accepted' && entry.acceptanceEmailSentAt && (
            <p className="text-sm text-white/55">
              Acceptance email sent {formatDate(entry.acceptanceEmailSentAt)}
              {entry.acceptanceEmailSentBy && <> by {entry.acceptanceEmailSentBy}</>}
              {entry.showcaseConfirmedAt ? (
                <> &middot; Confirmed {formatDate(entry.showcaseConfirmedAt)}</>
              ) : (
                entry.confirmByDate && <> &middot; Confirmation due {formatDeadlineDate(entry.confirmByDate)}</>
              )}
              {entry.showcaseTicketEmailSentAt && (
                <>
                  {' '}&middot; Ticket sent {formatDate(entry.showcaseTicketEmailSentAt)}
                  {entry.showcaseTicketEmailSentBy && <> by {entry.showcaseTicketEmailSentBy}</>}
                </>
              )}
            </p>
          )}
          {entry.builtWith && (
            <p className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-white/85">Built with: </span>
              {entry.builtWith}
            </p>
          )}
          {entry.coPresenters.length > 0 && (
            <div className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
              <p className="font-bold text-white/85 mb-1.5">Co-presenters</p>
              <ul className="space-y-1">
                {entry.coPresenters.map((coPresenter, index) => (
                  <li key={index} className="flex flex-wrap items-baseline gap-x-2">
                    <span>{coPresenter.name}</span>
                    {coPresenter.email && (
                      <a
                        href={`mailto:${coPresenter.email}`}
                        aria-label={`Email ${coPresenter.name}`}
                        className="text-white/55 hover:text-white/70 underline underline-offset-2 transition-colors"
                      >
                        {coPresenter.email}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {entry.demoRequirements && (
            <p className="text-sm text-white/65 bg-google-red/10 border border-google-red/20 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-google-red-light">Needs on the day: </span>
              {entry.demoRequirements}
            </p>
          )}
          {hasTracking && (
            <p className="text-sm text-white/55">
              <span className="font-bold text-white/70">Link tracking: </span>
              {[
                entry.tracking.ref && `ref=${entry.tracking.ref}`,
                entry.tracking.utmSource && `source=${entry.tracking.utmSource}`,
                entry.tracking.utmMedium && `medium=${entry.tracking.utmMedium}`,
                entry.tracking.utmCampaign && `campaign=${entry.tracking.utmCampaign}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${link.label.toLowerCase()} link for ${entry.projectName} in a new tab`}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
            >
              {link.label}
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h7v7M13 3L4 12" />
              </svg>
            </a>
          ))}
        </div>
      )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto pt-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${SHOWCASE_STATUS_DOT_STYLES[entry.status].text}`}>
          <span className={`w-[5px] h-[5px] rounded-full ${SHOWCASE_STATUS_DOT_STYLES[entry.status].dot}`} />
          {SHOWCASE_STATUS_LABELS[entry.status]}
        </span>
        <span className="text-white/50 text-xs font-bold">&middot;</span>
        <span className="text-xs font-bold text-white/55">{formatDate(entry.submittedAt)}</span>
      </div>
      </div>

      <div className="flex flex-col items-center gap-2 shrink-0 self-start">
          <button
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for: ${entry.projectName}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
            </svg>
          </button>
          {entry.status === 'pending' && (
            <DecisionButtons
              subject={`the Builder Showcase entry ${entry.projectName}`}
              disabled={isPending}
              accept={{
                message: `Accept ${entry.projectName} into the showcase?`,
                detail: `No email is sent yet: send ${entry.name} the acceptance email when you're ready.`,
                onConfirm: () => handleAction(acceptShowcaseEntry),
              }}
              reject={{
                message: `Turn down ${entry.projectName}?`,
                detail: 'No email is sent, and you can move it back to pending.',
                onConfirm: () => handleAction(rejectShowcaseEntry),
              }}
            />
          )}
          {entry.status === 'accepted' && (
            <ConfirmAction
              tone="send"
              message={`${entry.acceptanceEmailSentAt ? 'Resend' : 'Send'} the showcase acceptance email to ${entry.name}?`}
              detail={entry.acceptanceEmailSentAt
                ? `Last sent ${formatDate(entry.acceptanceEmailSentAt)}. They get it again, with a new date to confirm by.`
                : `It tells them ${entry.projectName} is in the Builder Showcase and asks them to confirm.`}
              confirmLabel={entry.acceptanceEmailSentAt ? 'Resend email' : 'Send email'}
              onConfirm={() => handleAction(sendShowcaseAcceptanceEmail)}
            >
              {(triggerProps) => (
                <button
                  {...triggerProps}
                  disabled={isPending}
                  aria-label={`${entry.acceptanceEmailSentAt ? 'Resend' : 'Send'} the Builder Showcase acceptance email to ${entry.name} for ${entry.projectName}`}
                  title={entry.acceptanceEmailSentAt ? 'Resend acceptance email' : 'Send acceptance email'}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-60 ${
                    entry.acceptanceEmailSentAt
                      ? 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                      : 'bg-google-green/15 text-google-green-light hover:bg-google-green-deep hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 4 6-4" />
                  </svg>
                </button>
              )}
            </ConfirmAction>
          )}
          {canSendTicket && (
            <ConfirmAction
              tone="send"
              message={`${entry.showcaseTicketEmailSentAt ? 'Resend' : 'Send'} the showcase ticket to ${entry.name}?`}
              detail={entry.showcaseTicketEmailSentAt ? 'They get the free ticket link again.' : 'It emails them the link to their free showcase ticket.'}
              confirmLabel={entry.showcaseTicketEmailSentAt ? 'Resend ticket' : 'Send ticket'}
              onConfirm={() => handleAction(sendShowcaseTicketEmail)}
            >
              {(triggerProps) => (
                <button
                  {...triggerProps}
                  disabled={isPending}
                  aria-label={`${entry.showcaseTicketEmailSentAt ? 'Resend' : 'Send'} the complimentary Builder Showcase ticket to ${entry.name} for ${entry.projectName}`}
                  title={entry.showcaseTicketEmailSentAt ? 'Resend showcase ticket' : 'Send showcase ticket'}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-60 ${
                    entry.showcaseTicketEmailSentAt
                      ? 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                      : 'bg-google-yellow/15 text-google-yellow hover:bg-google-yellow hover:text-black-02'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 6.25V4.5a1 1 0 011-1h11a1 1 0 011 1v1.75a1.75 1.75 0 000 3.5V11.5a1 1 0 01-1 1h-11a1 1 0 01-1-1V9.75a1.75 1.75 0 000-3.5z" />
                    <path strokeLinecap="round" strokeDasharray="1.5 1.5" d="M10 4v8" />
                  </svg>
                </button>
              )}
            </ConfirmAction>
          )}
          {(entry.status === 'rejected' || entry.status === 'archived' || entry.status === 'accepted') && (
            <button
              onClick={() => handleAction(restoreShowcaseEntry)}
              disabled={isPending}
              aria-label={`Restore Builder Showcase entry to pending: ${entry.projectName}`}
              title="Restore"
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
              aria-label={`More actions for: ${entry.projectName}`}
              title="More actions"
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="8" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="13" cy="8" r="1.25" />
              </svg>
              {entry.reviewerNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-google-blue-deep text-white text-xs font-bold leading-none">
                  {entry.reviewerNotes.length}
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
                    setNotesOpen((open) => !open);
                    setMoreOpen(false);
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  Notes{entry.reviewerNotes.length > 0 ? ` (${entry.reviewerNotes.length})` : ''}
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsEditing(true);
                    setMoreOpen(false);
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  Edit
                </button>
                {entry.status !== 'archived' && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      handleAction(archiveShowcaseEntry);
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

      {notesOpen && (
        <ReviewerNotesPanel entryId={entry.id} notes={entry.reviewerNotes} onError={onError} />
      )}

      {isEditing && (
        <EditShowcaseEntryModal
          entry={entry}
          onClose={() => setIsEditing(false)}
          onError={onError}
        />
      )}
    </div>
  );
}

interface Props {
  entries: ShowcaseSubmission[];
}

type FilterStatus = 'all' | ShowcaseStatus;
type FilterStage = 'all' | ShowcaseStage;

export default function ShowcaseDashboard({ entries }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [stageFilter, setStageFilter] = useState<FilterStage>('all');
  const [search, setSearch] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!statusMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (statusMenuOpen && statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setStatusMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [statusMenuOpen]);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: entries.length,
    pending: entries.filter((entry) => entry.status === 'pending').length,
    accepted: entries.filter((entry) => entry.status === 'accepted').length,
    rejected: entries.filter((entry) => entry.status === 'rejected').length,
    archived: entries.filter((entry) => entry.status === 'archived').length,
  };
  // Accepted but never told: the gap that leaves someone waiting to hear from us.
  const notEmailedCount = entries.filter(
    (entry) => entry.status === 'accepted' && entry.confirmation === 'not-emailed'
  ).length;
  const awaitingTicketCount = entries.filter(
    (entry) => entry.status === 'accepted' && entry.showcaseConfirmedAt && !entry.showcaseTicketEmailSentAt
  ).length;

  const query = search.trim().toLowerCase();
  const withinStatus = entries.filter((entry) => filter === 'all' || entry.status === filter);
  const filtered = withinStatus
    .filter((entry) => stageFilter === 'all' || entry.stage === stageFilter)
    .filter(
      (entry) =>
        !query ||
        entry.projectName.toLowerCase().includes(query) ||
        entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        entry.pitch.toLowerCase().includes(query)
    );

  // Counted within the chosen status, so the number on a tab is what clicking it shows.
  // All three stages are always offered, unlike the volunteers' areas: there are only three
  // of them, and an empty "Live and in use" is worth seeing rather than hiding.
  const stageTabs: { value: FilterStage; label: string; count: number }[] = [
    { value: 'all', label: 'All stages', count: withinStatus.length },
    ...(Object.keys(SHOWCASE_STAGE_LABELS) as ShowcaseStage[]).map((stage) => ({
      value: stage,
      label: SHOWCASE_STAGE_LABELS[stage],
      count: withinStatus.filter((entry) => entry.stage === stage).length,
    })),
  ];

  const filterTabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-black-02/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-off-white tracking-[-0.01em]">Builder Showcase</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {counts.all} total &middot; {counts.pending} pending review
              {notEmailedCount > 0 && <> &middot; {notEmailedCount} accepted, not emailed</>}
              {awaitingTicketCount > 0 && <> &middot; {awaitingTicketCount} without a ticket</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <AdminSearch value={search} onChange={setSearch} label="Search entries by project, name or email" placeholder="Search by project, name or email…" />

            <div className="relative shrink-0" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                aria-label="Filter Builder Showcase entries by status"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  statusMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {filterTabs.find((tab) => tab.value === filter)?.label}
                <span className="font-normal text-white/60">{counts[filter]}</span>
                <svg className={`w-3 h-3 text-white/55 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {statusMenuOpen && (
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
                        setStatusMenuOpen(false);
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

        {/* Stage as a tab row, matching /admin/devfest/volunteers: status is a menu because an entry
            is in exactly one state, while stage is a lens on the queue and the row shows how
            much of it is still an idea without opening anything. */}
        <FilterChipRow label="Filter entries by project stage" className="mt-3 -mx-4 md:-mx-5">
          {stageTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStageFilter(tab.value)}
              aria-pressed={stageFilter === tab.value}
              aria-label={
                tab.value === 'all'
                  ? 'Show entries at every stage'
                  : `Show entries at the ${tab.label.toLowerCase()} stage`
              }
              className={`shrink-0 inline-flex items-center gap-2 h-9 text-sm px-4 rounded-full transition-colors font-bold ${
                stageFilter === tab.value
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {tab.label}
              <span className="font-normal text-white/60">{tab.count}</span>
            </button>
          ))}
        </FilterChipRow>
      </div>

      <div className="px-4 md:px-5 pb-8 sm:pb-10">
        {filtered.length === 0 ? (
          <div className="bg-surface border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-sm text-white/50">No Builder Showcase entries match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 items-start">
            {filtered.map((entry) => (
              <ShowcaseRow key={entry.id} entry={entry} onError={setAlertMessage} />
            ))}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
