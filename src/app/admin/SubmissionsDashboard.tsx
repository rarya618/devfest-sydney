'use client';

import { useState, useCallback, useEffect, useRef, useTransition, type FormEvent, type ReactNode } from 'react';
import { promoteSubmission, rejectSubmission, restoreSubmission, undoPromotion, archiveSubmission, addReviewerNote, deleteReviewerNote } from './actions';
import EditSubmissionModal from './EditSubmissionModal';
import Alert from '@/components/Alert';
import { formatDate } from '@/lib/format';
import {
  STATUS_DOT_STYLES,
  STATUS_LABELS,
  TRACK_LABELS,
  TRACK_COLORS,
  TRACK_BORDER_COLORS,
  TRACK_DOT_COLORS,
  FORMAT_LABELS,
  EXPERIENCE_LABELS,
} from '@/lib/submissionLabels';
import type { ReviewerNote, Submission, SubmissionStatus, Track } from '@/lib/types';
import { useMobileBarHidden } from './MobileBarContext';

function toHref(value: string): string | null {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

interface LinkChipProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: 'blue' | 'red';
}

const LINK_CHIP_ACCENTS: Record<LinkChipProps['accent'], { iconBg: string; iconText: string; hoverBorder: string; hoverBg: string }> = {
  blue: { iconBg: 'bg-google-blue/15', iconText: 'text-google-blue', hoverBorder: 'group-hover:border-google-blue/30', hoverBg: 'group-hover:bg-google-blue/[0.08]' },
  red: { iconBg: 'bg-google-red/15', iconText: 'text-google-red', hoverBorder: 'group-hover:border-google-red/30', hoverBg: 'group-hover:bg-google-red/[0.08]' },
};

function LinkChip({ label, value, icon, accent }: LinkChipProps) {
  const href = toHref(value);
  const colors = LINK_CHIP_ACCENTS[accent];

  const content = (
    <>
      <span className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${colors.iconBg} ${colors.iconText}`}>
        {icon}
      </span>
      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
        {label}
        {!href && <span className="ml-1.5 font-normal text-white/40">{value.trim()}</span>}
      </span>
    </>
  );

  const baseClasses = `group inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border border-white/10 bg-white/[0.06] transition-colors ${colors.hoverBorder} ${colors.hoverBg}`;

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`${label}: ${value} (opens in new tab)`}
      className={baseClasses}
    >
      {content}
    </a>
  ) : (
    <span className={baseClasses}>{content}</span>
  );
}

interface ReviewerNotesPanelProps {
  submissionId: string;
  notes: ReviewerNote[];
  onError: (message: string) => void;
}

function ReviewerNotesPanel({ submissionId, notes, onError }: ReviewerNotesPanelProps) {
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addReviewerNote(submissionId, text);
      if (result.error) {
        onError(result.error);
      } else {
        setDraft('');
      }
    });
  }

  function handleDelete(index: number) {
    setDeletingIndex(index);
    startDeleteTransition(async () => {
      const result = await deleteReviewerNote(submissionId, index);
      if (result.error) onError(result.error);
      setDeletingIndex(null);
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={index} className="text-xs bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap flex-1">{note.text}</p>
                <button
                  onClick={() => handleDelete(index)}
                  disabled={isDeleting}
                  aria-label={`Delete reviewer note from ${note.authorName}`}
                  className="shrink-0 text-white/40 hover:text-google-red/85 transition-colors disabled:opacity-40"
                >
                  {isDeleting && deletingIndex === index ? (
                    <span className="text-[10px]">Deleting…</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 4.5h9M6.5 4.5v-1a1 1 0 011-1h1a1 1 0 011 1v1m-5.5 0l.5 8a1 1 0 001 .95h5a1 1 0 001-.95l.5-8" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-white/40">
                <span className="font-medium text-white/50">{note.authorName}</span> &middot; {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex items-start gap-2">
        <label htmlFor={`note-${submissionId}`} className="sr-only">
          Add a reviewer note
        </label>
        <textarea
          id={`note-${submissionId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a reviewer note (admin-only)…"
          rows={2}
          maxLength={2000}
          disabled={isPending}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30 resize-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Save reviewer note"
          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-google-blue text-white hover:bg-google-blue/90 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Add'}
        </button>
      </form>
    </div>
  );
}

interface SubmissionRowProps {
  submission: Submission;
  onError: (message: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
  bulkActionsPending: boolean;
}

function SubmissionRow({ submission, onError, selected, onToggleSelect, bulkActionsPending }: SubmissionRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(submission.id);
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

  return (
    <div
      onClick={handleCardClick}
      className={`relative cursor-pointer bg-white/[0.035] border-l-4 rounded-lg pt-4 pb-4 pl-4 pr-4 sm:pt-5 sm:pb-6 sm:pl-5 sm:pr-5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : selected ? 'ring-2 ring-google-blue/30' : ''
      } ${TRACK_BORDER_COLORS[submission.track]} ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Submission from ${submission.name}: ${submission.talkTitle}`}
    >
      <div className="flex items-stretch gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex items-start gap-4 mb-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={bulkActionsPending}
          aria-label={`Select submission: ${submission.talkTitle}`}
          className="mt-[0.28125rem] shrink-0 w-4 h-4 rounded-md border-white/15 text-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue/40"
        />
        <h3 className="min-w-0 font-bold text-white text-xl leading-snug tracking-tight">{submission.talkTitle}</h3>
      </div>

      <div className="mb-3 pl-8">
        <div className="min-w-0">
          <p className="text-base font-bold text-white/90 truncate">{submission.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55 truncate">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 4.5l6 5 6-5" />
            </svg>
            <span className="truncate">{submission.email}</span>
          </p>
          {submission.speakerTagline && (
            <p className="text-sm text-white/55 truncate mt-1">{submission.speakerTagline}</p>
          )}
        </div>
        {(submission.isFirstTimeSpeaker ||
          submission.wantsMentoring ||
          submission.isGoogleDeveloperExpert ||
          submission.requiresTravelSupport ||
          submission.optOutOfRecording) && (
          <div className="flex flex-wrap items-center gap-1.5 gap-y-2 mt-3">
            {submission.isFirstTimeSpeaker && (
              <span className="inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-green/15 text-google-green border-google-green/25">
                First-time speaker
              </span>
            )}
            {submission.wantsMentoring && (
              <span className="inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-green/15 text-google-green border-google-green/25">
                Wants mentoring
              </span>
            )}
            {submission.isGoogleDeveloperExpert && (
              <span className="inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-blue/15 text-google-blue border-google-blue/25">
                GDE
              </span>
            )}
            {submission.requiresTravelSupport && (
              <span className="inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-yellow/15 text-google-yellow border-google-yellow/25">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.5V9.75a1.5 1.5 0 011.5-1.5h13.5a1.5 1.5 0 011.5 1.5v5.75M3.75 15.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5M3.75 15.5v.75A1.5 1.5 0 005.25 17.75h13.5a1.5 1.5 0 001.5-1.5v-.75M9 8.25V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5v1.75" />
                </svg>
                Travel support{submission.travelSupportLocation ? ` · ${submission.travelSupportLocation}` : ''}
              </span>
            )}
            {submission.optOutOfRecording && (
              <span className="inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full border font-bold bg-google-red/15 text-google-red border-google-red/25">
                Don&apos;t record
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 mb-5 pl-8">
        <span className={`inline-block w-[5px] h-[5px] rounded-full ${TRACK_DOT_COLORS[submission.track]}`} />
        <span className={`text-xs font-medium ${TRACK_COLORS[submission.track]}`}>
          {TRACK_LABELS[submission.track]}
        </span>
        <span className="text-white/30 text-xs">/</span>
        <span className="text-xs text-white/55">{FORMAT_LABELS[submission.format]}</span>
        <span className="text-white/30 text-xs">/</span>
        <span className="text-xs text-white/55 capitalize">{submission.experienceLevel}</span>
      </div>

      <p className="text-sm text-white/65 leading-relaxed mb-5 pl-8">{submission.abstract}</p>

      {(submission.speakerBio ||
        submission.accessibilityNeeds ||
        submission.howDidYouHear ||
        submission.tracking.utmSource ||
        submission.tracking.utmMedium ||
        submission.tracking.utmCampaign ||
        submission.tracking.ref ||
        submission.coSpeakerEmails ||
        submission.hasSpokenAtGdgSydneyBefore ||
        submission.isOpenToAudienceQuestions) && (
        <div className="space-y-3 mb-5 pl-8">
          {submission.speakerBio && (
            <p className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-white/85">Bio: </span>
              {submission.speakerBio}
            </p>
          )}

          {submission.accessibilityNeeds && (
            <p className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
              <span className="font-bold text-white/85">Accessibility: </span>
              {submission.accessibilityNeeds}
            </p>
          )}

          {submission.howDidYouHear && (
            <p className="text-sm text-white/55">
              <span className="font-medium text-white/70">Found us via: </span>
              {submission.howDidYouHear}
            </p>
          )}

          {(submission.tracking.utmSource || submission.tracking.utmMedium || submission.tracking.utmCampaign || submission.tracking.ref) && (
            <p className="text-sm text-white/55">
              <span className="font-medium text-white/70">Link tracking: </span>
              {[
                submission.tracking.ref && `ref=${submission.tracking.ref}`,
                submission.tracking.utmSource && `source=${submission.tracking.utmSource}`,
                submission.tracking.utmMedium && `medium=${submission.tracking.utmMedium}`,
                submission.tracking.utmCampaign && `campaign=${submission.tracking.utmCampaign}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {submission.coSpeakerEmails && (
            <p className="text-sm text-white/55">
              <span className="font-medium text-white/70">Co-speaker(s): </span>
              {submission.coSpeakerEmails}
            </p>
          )}

          {(submission.hasSpokenAtGdgSydneyBefore || submission.isOpenToAudienceQuestions) && (
            <p className="text-sm text-white/55">
              {[
                submission.hasSpokenAtGdgSydneyBefore && 'Has spoken at GDG Sydney before',
                submission.isOpenToAudienceQuestions && 'Open to audience questions',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      {(submission.linkedinUrl || submission.githubUrl || submission.websiteUrl || submission.previousTalkLink) && (
        <div className="flex flex-wrap gap-2 mb-5 pl-8">
          {submission.linkedinUrl && (
            <LinkChip
              label="LinkedIn"
              value={submission.linkedinUrl}
              accent="blue"
              icon={
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M3.5 5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM2.25 6.75h2.5v7.5h-2.5v-7.5zM6.75 6.75h2.4v1.03h.03c.33-.63 1.15-1.3 2.37-1.3 2.54 0 3.01 1.67 3.01 3.84v4.93h-2.5v-4.37c0-1.04-.02-2.38-1.45-2.38-1.45 0-1.67 1.14-1.67 2.3v4.45h-2.5v-7.5z" />
                </svg>
              }
            />
          )}
          {submission.githubUrl && (
            <LinkChip
              label="GitHub"
              value={submission.githubUrl}
              accent="blue"
              icon={
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 0a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.48c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.72-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.23 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.96 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.5 7.5 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.08-1.88 3.76-3.66 3.96.29.25.55.74.55 1.5v2.22c0 .21.15.46.55.38A8 8 0 008 0z" />
                </svg>
              }
            />
          )}
          {submission.websiteUrl && (
            <LinkChip
              label="Website"
              value={submission.websiteUrl}
              accent="blue"
              icon={
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" />
                  <path strokeLinecap="round" d="M2 8h12M8 1.5c1.5 1.7 2.3 3.9 2.3 6.5s-.8 4.8-2.3 6.5c-1.5-1.7-2.3-3.9-2.3-6.5S6.5 3.2 8 1.5z" />
                </svg>
              }
            />
          )}
          {submission.previousTalkLink && (
            <LinkChip
              label="Previous talk"
              value={submission.previousTalkLink}
              accent="red"
              icon={
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <rect x="1.5" y="3" width="13" height="9" rx="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6l3 2-3 2V6z" />
                </svg>
              }
            />
          )}
        </div>
      )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto pt-2 pl-8">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${STATUS_DOT_STYLES[submission.status].text}`}>
          <span className={`w-[5px] h-[5px] rounded-full ${STATUS_DOT_STYLES[submission.status].dot}`} />
          {STATUS_LABELS[submission.status]}
        </span>
        <span className="text-white/30 text-xs font-bold">&middot;</span>
        <span className="text-xs font-bold text-white/55">{formatDate(submission.submittedAt)}</span>
      </div>
      </div>

      <div className="flex flex-col items-center gap-2 shrink-0 self-start">
          <button
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for: ${submission.talkTitle}`}
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
          {submission.status === 'pending' && (
            <div className="inline-flex flex-col rounded-full border border-white/15 overflow-hidden">
              <button
                onClick={() => handleAction(rejectSubmission)}
                disabled={isPending || bulkActionsPending}
                aria-label={`Reject proposal: ${submission.talkTitle}`}
                title="Reject"
                className="inline-flex items-center justify-center w-8 py-3 text-white/70 hover:bg-google-red hover:text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
              </button>
              <span className="h-px bg-white/15" />
              <button
                onClick={() => handleAction(promoteSubmission)}
                disabled={isPending || bulkActionsPending}
                aria-label={`Accept and promote proposal: ${submission.talkTitle}`}
                title="Accept"
                className="inline-flex items-center justify-center w-8 py-3 text-white/70 hover:bg-google-green hover:text-white transition-colors disabled:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
                </svg>
              </button>
            </div>
          )}
          {submission.status === 'accepted' && (
            <button
              onClick={() => handleAction(undoPromotion)}
              disabled={isPending || bulkActionsPending}
              aria-label={`Undo acceptance of proposal: ${submission.talkTitle}`}
              title="Undo"
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
              disabled={isPending || bulkActionsPending}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label={`More actions for: ${submission.talkTitle}`}
              title="More actions"
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="8" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="13" cy="8" r="1.25" />
              </svg>
              {submission.reviewerNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-google-blue text-white text-[10px] font-bold leading-none">
                  {submission.reviewerNotes.length}
                </span>
              )}
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-44 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setNotesOpen((open) => !open);
                    setMoreOpen(false);
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  Notes{submission.reviewerNotes.length > 0 ? ` (${submission.reviewerNotes.length})` : ''}
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
                {(submission.status === 'rejected' || submission.status === 'archived') && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      handleAction(restoreSubmission);
                      setMoreOpen(false);
                    }}
                    className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                  >
                    Restore
                  </button>
                )}
                {submission.status !== 'accepted' && submission.status !== 'archived' && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      handleAction(archiveSubmission);
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
        <ReviewerNotesPanel
          submissionId={submission.id}
          notes={submission.reviewerNotes}
          onError={onError}
        />
      )}

      {isEditing && (
        <EditSubmissionModal
          submission={submission}
          onClose={() => setIsEditing(false)}
          onError={onError}
        />
      )}
    </div>
  );
}

function SubmissionListRow({ submission, onError, selected, onToggleSelect, bulkActionsPending }: SubmissionRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const links = [
    submission.linkedinUrl && { label: 'LinkedIn', value: submission.linkedinUrl },
    submission.githubUrl && { label: 'GitHub', value: submission.githubUrl },
    submission.websiteUrl && { label: 'Website', value: submission.websiteUrl },
    submission.previousTalkLink && { label: 'Previous talk', value: submission.previousTalkLink },
  ].filter((link): link is { label: string; value: string } => Boolean(link));

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(submission.id);
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

  function handleRowClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="menu"], [role="dialog"]')) return;
    if (window.getSelection()?.toString()) return;
    setIsOpen((open) => !open);
  }

  return (
    <div
      onClick={handleRowClick}
      className={`relative cursor-pointer bg-white/[0.035] border-l-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.07] ${
        isPending ? 'opacity-50 pointer-events-none' : selected ? 'ring-2 ring-google-blue/30' : ''
      } ${TRACK_BORDER_COLORS[submission.track]} ${moreOpen ? 'z-40' : ''}`}
      aria-label={`Submission from ${submission.name}: ${submission.talkTitle}`}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={bulkActionsPending}
          aria-label={`Select submission: ${submission.talkTitle}`}
          className="shrink-0 w-4 h-4 rounded-md border-white/15 text-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue/40"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h3 className="font-bold text-white text-sm truncate">{submission.talkTitle}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/45 truncate">
            <span className="font-bold text-white/70">{submission.name}</span>
            <span>&middot;</span>
            <span className="truncate">{FORMAT_LABELS[submission.format]} &middot; {EXPERIENCE_LABELS[submission.experienceLevel]}</span>
            {submission.isGoogleDeveloperExpert && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-google-blue/15 text-google-blue">GDE</span>
            )}
            {submission.isFirstTimeSpeaker && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-google-green/15 text-google-green">First-timer</span>
            )}
          </div>
        </div>

        <span className="hidden sm:flex flex-col items-end shrink-0 text-[11px] text-white/45 leading-snug text-right">
          <span className={`font-bold ${STATUS_DOT_STYLES[submission.status].text}`}>{STATUS_LABELS[submission.status]}</span>
          {formatDate(submission.submittedAt)}
        </span>

        {submission.status === 'pending' && (
          <div className="hidden md:inline-flex shrink-0 rounded-full border border-white/15 overflow-hidden">
            <button
              onClick={() => handleAction(rejectSubmission)}
              disabled={isPending || bulkActionsPending}
              aria-label={`Reject proposal: ${submission.talkTitle}`}
              title="Reject"
              className="inline-flex items-center justify-center px-3 h-8 text-white/70 hover:bg-google-red hover:text-white transition-colors disabled:opacity-60"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
              </svg>
            </button>
            <span className="w-px bg-white/15" />
            <button
              onClick={() => handleAction(promoteSubmission)}
              disabled={isPending || bulkActionsPending}
              aria-label={`Accept and promote proposal: ${submission.talkTitle}`}
              title="Accept"
              className="inline-flex items-center justify-center px-3 h-8 text-white/70 hover:bg-google-green hover:text-white transition-colors disabled:opacity-60"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
              </svg>
            </button>
          </div>
        )}
        {submission.status === 'accepted' && (
          <button
            onClick={() => handleAction(undoPromotion)}
            disabled={isPending || bulkActionsPending}
            aria-label={`Undo acceptance of proposal: ${submission.talkTitle}`}
            title="Undo"
            className="hidden md:inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4L2.5 7.5 6 11M2.5 7.5h6.5a4 4 0 010 8H7" />
            </svg>
          </button>
        )}

        <div className="relative shrink-0" ref={moreMenuRef}>
          <button
            onClick={() => setMoreOpen((open) => !open)}
            disabled={isPending || bulkActionsPending}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label={`More actions for: ${submission.talkTitle}`}
            title="More actions"
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="8" r="1.25" />
              <circle cx="8" cy="8" r="1.25" />
              <circle cx="13" cy="8" r="1.25" />
            </svg>
            {submission.reviewerNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-google-blue text-white text-[10px] font-bold leading-none">
                {submission.reviewerNotes.length}
              </span>
            )}
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-44 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setNotesOpen((open) => !open);
                  setMoreOpen(false);
                }}
                className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
              >
                Notes{submission.reviewerNotes.length > 0 ? ` (${submission.reviewerNotes.length})` : ''}
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
              {(submission.status === 'rejected' || submission.status === 'archived') && (
                <button
                  role="menuitem"
                  onClick={() => {
                    handleAction(restoreSubmission);
                    setMoreOpen(false);
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                >
                  Restore
                </button>
              )}
              {submission.status !== 'accepted' && submission.status !== 'archived' && (
                <button
                  role="menuitem"
                  onClick={() => {
                    handleAction(archiveSubmission);
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

        <button
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for: ${submission.talkTitle}`}
          className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
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
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="mt-2.5 pl-7 pr-1 pb-0.5 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/45 sm:hidden">
              <span className={`font-bold ${STATUS_DOT_STYLES[submission.status].text}`}>{STATUS_LABELS[submission.status]}</span>
              <span>&middot;</span>
              <span>{formatDate(submission.submittedAt)}</span>
            </div>
            <p className="text-sm text-white/65 leading-relaxed">{submission.abstract}</p>
            {submission.speakerBio && (
              <p className="text-sm text-white/65 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 leading-relaxed">
                <span className="font-bold text-white/85">Bio: </span>
                {submission.speakerBio}
              </p>
            )}
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <LinkChip
                    key={link.label}
                    label={link.label}
                    value={link.value}
                    accent={link.label === 'Previous talk' ? 'red' : 'blue'}
                    icon={
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <circle cx="8" cy="8" r="6.5" />
                        <path strokeLinecap="round" d="M2 8h12M8 1.5c1.5 1.7 2.3 3.9 2.3 6.5s-.8 4.8-2.3 6.5c-1.5-1.7-2.3-3.9-2.3-6.5S6.5 3.2 8 1.5z" />
                      </svg>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {notesOpen && (
        <div className="mt-2 pl-7">
          <ReviewerNotesPanel
            submissionId={submission.id}
            notes={submission.reviewerNotes}
            onError={onError}
          />
        </div>
      )}

      {isEditing && (
        <EditSubmissionModal
          submission={submission}
          onClose={() => setIsEditing(false)}
          onError={onError}
        />
      )}
    </div>
  );
}

interface Props {
  submissions: Submission[];
}

type FilterStatus = 'all' | SubmissionStatus;
type TrackFilter = 'all' | Track;
type SortOption = 'newest' | 'oldest' | 'track' | 'submitter';

const TRACK_SORT_ORDER: Record<Track, number> = {
  developer: 0,
  builder: 1,
  workshop: 2,
  showcase: 3,
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  track: 'By track',
  submitter: 'By submitter',
};

interface SubmitterGroup {
  key: string;
  name: string;
  email: string;
  submissions: Submission[];
  latestAt: number;
}

function groupBySubmitter(list: Submission[]): SubmitterGroup[] {
  const groups = new Map<string, SubmitterGroup>();
  for (const submission of list) {
    const key = submission.email.trim().toLowerCase();
    let group = groups.get(key);
    if (!group) {
      group = { key, name: submission.name, email: submission.email, submissions: [], latestAt: 0 };
      groups.set(key, group);
    }
    group.submissions.push(submission);
    const submittedAt = new Date(submission.submittedAt).getTime();
    if (submittedAt > group.latestAt) group.latestAt = submittedAt;
  }
  const result = Array.from(groups.values());
  result.forEach((group) => group.submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
  return result.sort((a, b) => b.latestAt - a.latestAt);
}

function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SubmissionsDashboard({ submissions }: Props) {
  const mobileBarHidden = useMobileBarHidden();
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [trackFilter, setTrackFilter] = useState<TrackFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchWidthOpen, setSearchWidthOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen || search) {
      const timeout = setTimeout(() => setSearchWidthOpen(true), 20);
      return () => clearTimeout(timeout);
    }
    setSearchWidthOpen(false);
  }, [searchOpen, search]);

  useEffect(() => {
    if (searchWidthOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchWidthOpen]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isBulkPending, startBulkTransition] = useTransition();
  const [filtersMenuOpen, setFiltersMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [trackStatsOpen, setTrackStatsOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const filtersMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const trackStatsRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersMenuOpen && !moreMenuOpen && !searchOpen && !trackStatsOpen && !statusMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (filtersMenuOpen && filtersMenuRef.current && !filtersMenuRef.current.contains(event.target as Node)) {
        setFiltersMenuOpen(false);
      }
      if (moreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (trackStatsOpen && trackStatsRef.current && !trackStatsRef.current.contains(event.target as Node)) {
        setTrackStatsOpen(false);
      }
      if (statusMenuOpen && statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
      if (searchOpen && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearch('');
        setSearchOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setFiltersMenuOpen(false);
        setMoreMenuOpen(false);
        setTrackStatsOpen(false);
        setStatusMenuOpen(false);
        if (searchOpen) {
          setSearch('');
          setSearchOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filtersMenuOpen, moreMenuOpen, searchOpen, trackStatsOpen, statusMenuOpen]);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: submissions.filter((s) => s.status !== 'archived').length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    accepted: submissions.filter((s) => s.status === 'accepted').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    archived: submissions.filter((s) => s.status === 'archived').length,
  };

  const trackCounts: Record<Track, number> = {
    developer: 0,
    builder: 0,
    workshop: 0,
    showcase: 0,
  };
  for (const submission of submissions) {
    if (submission.status === 'archived') continue;
    trackCounts[submission.track] += 1;
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = submissions.filter((s) => {
    if (filter === 'all') {
      if (s.status === 'archived') return false;
    } else if (s.status !== filter) {
      return false;
    }
    if (trackFilter !== 'all' && s.track !== trackFilter) return false;
    if (
      normalizedSearch &&
      !s.name.toLowerCase().includes(normalizedSearch) &&
      !s.email.toLowerCase().includes(normalizedSearch) &&
      !s.talkTitle.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }
    return true;
  });

  const sorted =
    sort === 'submitter'
      ? groupBySubmitter(filtered).flatMap((group) => group.submissions)
      : [...filtered].sort((a, b) => {
          if (sort === 'track') {
            const trackDiff = TRACK_SORT_ORDER[a.track] - TRACK_SORT_ORDER[b.track];
            if (trackDiff !== 0) return trackDiff;
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          }
          const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          return sort === 'oldest' ? diff : -diff;
        });

  const filterTabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  const visibleSelectedIds = sorted.filter((s) => selectedIds.has(s.id)).map((s) => s.id);
  const allVisibleSelected = sorted.length > 0 && visibleSelectedIds.length === sorted.length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        sorted.forEach((s) => next.delete(s.id));
        return next;
      }
      const next = new Set(prev);
      sorted.forEach((s) => next.add(s.id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function runBulkAction(
    eligible: (s: Submission) => boolean,
    action: (id: string) => Promise<{ error?: string }>,
    ineligibleMessage: string
  ) {
    const targets = sorted.filter((s) => selectedIds.has(s.id) && eligible(s));
    if (targets.length === 0) {
      setAlertMessage(ineligibleMessage);
      return;
    }
    startBulkTransition(async () => {
      const results = await Promise.all(targets.map((s) => action(s.id)));
      const failures = results.filter((r) => r.error).length;
      if (failures > 0) {
        setAlertMessage(`${failures} of ${targets.length} submissions could not be updated. Please try again.`);
      }
      clearSelection();
    });
  }

  function handleBulkAccept() {
    runBulkAction((s) => s.status === 'pending', promoteSubmission, 'Only pending submissions can be accepted.');
  }

  function handleBulkReject() {
    runBulkAction((s) => s.status === 'pending', rejectSubmission, 'Only pending submissions can be rejected.');
  }

  function handleBulkArchive() {
    runBulkAction(
      (s) => s.status !== 'accepted' && s.status !== 'archived',
      archiveSubmission,
      'Accepted submissions can\'t be archived. Undo the acceptance first.'
    );
  }

  function handleExport() {
    const rows = [
      ['Name', 'Email', 'Talk title', 'Track', 'Format', 'Experience', 'Status', 'Submitted at'],
      ...sorted.map((s) => [
        s.name,
        s.email,
        s.talkTitle,
        TRACK_LABELS[s.track],
        FORMAT_LABELS[s.format],
        EXPERIENCE_LABELS[s.experienceLevel],
        STATUS_LABELS[s.status],
        formatDate(s.submittedAt),
      ]),
    ];
    downloadCsv(`submissions-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  const selectedCount = visibleSelectedIds.length;

  return (
    <>
      <div className={`sticky ${mobileBarHidden ? 'top-0' : 'top-[4.25rem]'} md:top-0 transition-[top] duration-300 ease-in-out z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#17181a]/95 backdrop-blur-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 min-h-[3.25rem] flex items-center">
            {selectedCount > 0 ? (
              <div key="bulk-actions" className="flex items-center gap-2 flex-wrap animate-fade-in-fast">
                <span className="shrink-0 text-sm text-white/40 mr-2">{selectedCount} selected</span>
                <button
                  onClick={handleBulkReject}
                  disabled={isBulkPending}
                  aria-label={`Reject ${selectedCount} selected submissions`}
                  className="shrink-0 h-10 text-sm font-semibold px-4 rounded-full bg-google-red text-white hover:bg-google-red/90 transition-colors disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  onClick={handleBulkAccept}
                  disabled={isBulkPending}
                  aria-label={`Accept ${selectedCount} selected submissions`}
                  className="shrink-0 h-10 text-sm font-semibold px-4 rounded-full bg-google-green text-white hover:bg-google-green/90 transition-colors disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  onClick={handleBulkArchive}
                  disabled={isBulkPending}
                  aria-label={`Archive ${selectedCount} selected submissions`}
                  className="shrink-0 h-10 text-sm px-4 rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={clearSelection}
                  disabled={isBulkPending}
                  className="shrink-0 h-10 text-sm px-4 rounded-full text-white/40 hover:text-white/70 transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div key="title" className="animate-fade-in-fast">
                <h1 className="text-xl font-bold text-white tracking-tight">Submissions</h1>
                <p className="mt-0.5 text-sm text-white/40">
                  {counts.all} total &middot; {counts.pending} pending review
                </p>
              </div>
            )}
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
                aria-label="Search name, email, or talk title"
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
                onChange={(e) => setSearch(e.target.value)}
                tabIndex={searchOpen || search ? undefined : -1}
                placeholder="Search name, email, or talk title…"
                aria-label="Search name, email, or talk title"
                className={`w-full h-10 rounded-full bg-transparent pl-9 pr-9 py-0 text-sm text-white placeholder:text-white/30 focus:outline-none transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none transition-opacity duration-200 ${
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
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-opacity duration-200 ${
                  searchWidthOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {(searchOpen || search) && <div className="basis-full h-0 sm:hidden" aria-hidden="true" />}

            <div className="relative shrink-0" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                aria-label="Filter submissions by status"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-bold ${
                  statusMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {filterTabs.find((tab) => tab.value === filter)?.label}
                <span className="font-medium text-white/60">{counts[filter]}</span>
                <svg className={`w-3 h-3 text-white/40 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {statusMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.value}
                      role="menuitem"
                      onClick={() => {
                        setFilter(tab.value);
                        setStatusMenuOpen(false);
                      }}
                      aria-pressed={filter === tab.value}
                      className={`w-full flex items-center justify-between gap-3 text-left text-sm px-4 py-2.5 transition-colors ${
                        filter === tab.value ? 'bg-white/[0.08] text-white font-bold' : 'text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      <span className="text-white/40">{counts[tab.value]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative shrink-0" ref={trackStatsRef}>
              <button
                onClick={() => setTrackStatsOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={trackStatsOpen}
                aria-label="View submission counts by track"
                className={`inline-flex items-center gap-2 h-10 text-sm px-4 rounded-full transition-colors font-medium ${
                  trackStatsOpen
                    ? 'bg-white/[0.12] text-white'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">By track</span>
                <span className="sm:hidden">Tracks</span>
                <svg className={`w-3 h-3 text-white/40 transition-transform ${trackStatsOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5l3.5 3.5 3.5-3.5" />
                </svg>
              </button>

              {trackStatsOpen && (
                <div
                  role="menu"
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-2 z-30"
                >
                  {(Object.keys(TRACK_LABELS) as Track[]).map((track) => (
                    <div key={track} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                      <span className="inline-flex items-center gap-2 text-white/70 font-medium">
                        <span className={`w-[5px] h-[5px] rounded-full ${TRACK_DOT_COLORS[track]}`} />
                        {TRACK_LABELS[track]}
                      </span>
                      <span className="text-white font-semibold">{trackCounts[track]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative shrink-0" ref={filtersMenuRef}>
              <button
                onClick={() => setFiltersMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={filtersMenuOpen}
                aria-label="Filter and sort submissions"
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  filtersMenuOpen || trackFilter !== 'all' || sort !== 'newest'
                    ? 'text-google-blue bg-google-blue/15'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h12M4.5 8h7M7 12h2" />
                </svg>
              </button>

              {filtersMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden px-4 py-5 space-y-4 z-30"
                >
                  <div>
                    <label htmlFor="track-filter-select" className="block text-sm font-semibold text-white/40 capitalize mb-1">
                      Track
                    </label>
                    <select
                      id="track-filter-select"
                      value={trackFilter}
                      onChange={(e) => setTrackFilter(e.target.value as TrackFilter)}
                      aria-label="Filter by track"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-sm font-medium text-white/70 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30"
                    >
                      <option value="all">All tracks</option>
                      {(Object.entries(TRACK_LABELS) as [Track, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sort-select" className="block text-sm font-semibold text-white/40 capitalize mb-1">
                      Sort
                    </label>
                    <select
                      id="sort-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      aria-label="Sort submissions"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-sm font-medium text-white/70 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30"
                    >
                      {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="inline-flex shrink-0 rounded-full bg-white/[0.06] p-1 gap-1">
              <button
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                aria-label="Card view"
                title="Card view"
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  viewMode === 'cards' ? 'bg-white/[0.14] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <rect x="2" y="2.5" width="12" height="4.5" rx="1" />
                  <rect x="2" y="9" width="12" height="4.5" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="List view"
                title="List view"
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  viewMode === 'list' ? 'bg-white/[0.14] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2 4h12M2 8h12M2 12h12" />
                </svg>
              </button>
            </div>

            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
                aria-label="More submission actions"
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  moreMenuOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <circle cx="3" cy="8" r="1.25" />
                  <circle cx="8" cy="8" r="1.25" />
                  <circle cx="13" cy="8" r="1.25" />
                </svg>
              </button>

              {moreMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-[#2d2e31] border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden py-1.5 z-30"
                >
                  <label className="flex items-center gap-2.5 text-sm text-white px-4 py-2.5 hover:bg-white/[0.08] transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      disabled={sorted.length === 0 || isBulkPending}
                      aria-label="Select all visible submissions"
                      className="w-4 h-4 rounded border-white/15 text-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue/40"
                    />
                    Select all visible
                  </label>
                  <button
                    role="menuitem"
                    onClick={() => {
                      handleExport();
                      setMoreMenuOpen(false);
                    }}
                    aria-label="Export visible submissions as CSV"
                    className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <svg className="w-4 h-4 text-white/40 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 1.5v8m0 0L5 6.5m3 3l3-3M2.5 11v2A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5v-2" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-5">
        {/* Submissions list */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-white/40 text-sm">
            No submissions match these filters.
          </div>
        ) : sort === 'submitter' ? (
          <div className="space-y-8 pt-0.5">
            {groupBySubmitter(sorted).map((group) => (
              <div key={group.key}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3 px-1">
                  <h2 className="text-base font-bold text-white">{group.name}</h2>
                  <span className="text-sm text-white/40">{group.email}</span>
                  {group.submissions.length > 1 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-google-blue/15 text-google-blue border border-google-blue/25">
                      {group.submissions.length} submissions
                    </span>
                  )}
                </div>
                <div className={`grid grid-cols-1 items-start ${viewMode === 'list' ? 'gap-2' : 'gap-5'}`}>
                  {group.submissions.map((submission) =>
                    viewMode === 'list' ? (
                      <SubmissionListRow
                        key={submission.id}
                        submission={submission}
                        onError={setAlertMessage}
                        selected={selectedIds.has(submission.id)}
                        onToggleSelect={() => toggleSelect(submission.id)}
                        bulkActionsPending={isBulkPending}
                      />
                    ) : (
                      <SubmissionRow
                        key={submission.id}
                        submission={submission}
                        onError={setAlertMessage}
                        selected={selectedIds.has(submission.id)}
                        onToggleSelect={() => toggleSelect(submission.id)}
                        bulkActionsPending={isBulkPending}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 items-start ${viewMode === 'list' ? 'gap-2' : 'gap-5'}`}>
            {sorted.map((submission) =>
              viewMode === 'list' ? (
                <SubmissionListRow
                  key={submission.id}
                  submission={submission}
                  onError={setAlertMessage}
                  selected={selectedIds.has(submission.id)}
                  onToggleSelect={() => toggleSelect(submission.id)}
                  bulkActionsPending={isBulkPending}
                />
              ) : (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  onError={setAlertMessage}
                  selected={selectedIds.has(submission.id)}
                  onToggleSelect={() => toggleSelect(submission.id)}
                  bulkActionsPending={isBulkPending}
                />
              )
            )}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
