'use client';

import { useState, useCallback, useTransition, type FormEvent, type ReactNode } from 'react';
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

function toHref(value: string): string | null {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function cleanDisplayValue(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

interface LinkChipProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: 'blue' | 'red';
}

const LINK_CHIP_ACCENTS: Record<LinkChipProps['accent'], { iconBg: string; iconText: string; hoverBorder: string; hoverBg: string }> = {
  blue: { iconBg: 'bg-google-blue/10', iconText: 'text-google-blue', hoverBorder: 'group-hover:border-google-blue/25', hoverBg: 'group-hover:bg-google-blue/[0.03]' },
  red: { iconBg: 'bg-google-red/10', iconText: 'text-google-red', hoverBorder: 'group-hover:border-google-red/25', hoverBg: 'group-hover:bg-google-red/[0.03]' },
};

function LinkChip({ label, value, icon, accent }: LinkChipProps) {
  const href = toHref(value);
  const colors = LINK_CHIP_ACCENTS[accent];

  const content = (
    <>
      <span className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${colors.iconBg} ${colors.iconText}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold text-black-02/35">{label}</span>
        <span className="block text-xs text-black-02/70 truncate max-w-[200px] group-hover:text-black-02 transition-colors">{cleanDisplayValue(value)}</span>
      </span>
      {href && (
        <svg className="w-3 h-3 text-black-02/25 shrink-0 ml-0.5 group-hover:text-black-02/50 transition-colors" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 4H4a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V9.5M9 3h4v4M7 9l6-6" />
        </svg>
      )}
    </>
  );

  const baseClasses = `group inline-flex items-center gap-2.5 pl-1 pr-3.5 py-1.5 rounded-full border border-black-02/10 bg-white transition-colors ${colors.hoverBorder} ${colors.hoverBg}`;

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
    <div className="mt-3 pt-3 border-t border-black-02/6 space-y-3">
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={index} className="text-xs bg-off-white border border-black-02/8 rounded-lg px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-black-02/70 leading-relaxed whitespace-pre-wrap flex-1">{note.text}</p>
                <button
                  onClick={() => handleDelete(index)}
                  disabled={isDeleting}
                  aria-label={`Delete reviewer note from ${note.authorName}`}
                  className="shrink-0 text-black-02/30 hover:text-google-red/85 transition-colors disabled:opacity-40"
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
              <p className="mt-1 text-[10px] text-black-02/35">
                {note.authorName} &middot; {formatDate(note.createdAt)}
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
          className="flex-1 rounded-lg border border-black-02/15 bg-white px-3 py-2 text-xs text-black-02 placeholder:text-black-02/35 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30 resize-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          aria-label="Save reviewer note"
          className="shrink-0 text-xs px-3 py-2 rounded-lg bg-google-blue/10 border border-google-blue/25 text-google-blue hover:bg-google-blue/15 transition-colors font-medium disabled:opacity-40"
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

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(submission.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <div
      className={`bg-white border border-l-4 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(30,30,30,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(30,30,30,0.07)] hover:-translate-y-0.5 ${
        isPending ? 'opacity-50 pointer-events-none' : selected ? 'border-black-02/8 ring-2 ring-google-blue/30' : 'border-black-02/8'
      } ${TRACK_BORDER_COLORS[submission.track]}`}
      aria-label={`Submission from ${submission.name}: ${submission.talkTitle}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={bulkActionsPending}
            aria-label={`Select submission: ${submission.talkTitle}`}
            className="mt-1.5 shrink-0 w-4 h-4 rounded border-black-02/25 text-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue/40"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-black-02 text-xl leading-snug tracking-tight">{submission.talkTitle}</h3>
            <p className="mt-1 truncate">
              <span className="text-sm font-medium text-black-02/70">{submission.name}</span>
              <span className="text-xs text-black-02/40"> &middot; {submission.email}</span>
            </p>
            {submission.speakerTagline && (
              <p className="text-xs text-black-02/40 truncate mt-0.5">{submission.speakerTagline}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {submission.isFirstTimeSpeaker && (
            <span className="inline-flex items-center gap-1 text-xs pl-2 pr-2.5 py-1 rounded-full border font-medium bg-google-green/10 text-google-green border-google-green/20">
              First-time speaker
            </span>
          )}
          {submission.wantsMentoring && (
            <span className="inline-flex items-center gap-1 text-xs pl-2 pr-2.5 py-1 rounded-full border font-medium bg-google-green/10 text-google-green border-google-green/20">
              Wants mentoring
            </span>
          )}
          {submission.isGoogleDeveloperExpert && (
            <span className="inline-flex items-center gap-1 text-xs pl-2 pr-2.5 py-1 rounded-full border font-medium bg-google-blue/10 text-google-blue border-google-blue/20">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              GDE
            </span>
          )}
          {submission.requiresTravelSupport && (
            <span className="inline-flex items-center gap-1 text-xs pl-2 pr-2.5 py-1 rounded-full border font-medium bg-google-yellow/10 text-google-yellow border-google-yellow/20">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.5V9.75a1.5 1.5 0 011.5-1.5h13.5a1.5 1.5 0 011.5 1.5v5.75M3.75 15.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5M3.75 15.5v.75A1.5 1.5 0 005.25 17.75h13.5a1.5 1.5 0 001.5-1.5v-.75M9 8.25V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5v1.75" />
              </svg>
              Travel support{submission.travelSupportLocation ? ` · ${submission.travelSupportLocation}` : ''}
            </span>
          )}
          {submission.optOutOfRecording && (
            <span className="inline-flex items-center gap-1 text-xs pl-2 pr-2.5 py-1 rounded-full border font-medium bg-google-red/10 text-google-red border-google-red/20">
              Don&apos;t record
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${TRACK_DOT_COLORS[submission.track]}`} />
        <span className={`text-xs font-medium ${TRACK_COLORS[submission.track]}`}>
          {TRACK_LABELS[submission.track]}
        </span>
        <span className="text-black-02/20 text-xs">/</span>
        <span className="text-xs text-black-02/40">{FORMAT_LABELS[submission.format]}</span>
        <span className="text-black-02/20 text-xs">/</span>
        <span className="text-xs text-black-02/40 capitalize">{submission.experienceLevel}</span>
      </div>

      <p className="text-sm text-black-02/50 leading-relaxed mb-4">{submission.abstract}</p>

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
        <div className="space-y-2 mb-4">
          {submission.speakerBio && (
            <p className="text-xs text-black-02/50 bg-off-white border border-black-02/8 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold text-black-02/60">Bio: </span>
              {submission.speakerBio}
            </p>
          )}

          {submission.accessibilityNeeds && (
            <p className="text-xs text-black-02/50 bg-off-white border border-black-02/8 rounded-lg px-3 py-2 leading-relaxed">
              <span className="font-bold text-black-02/60">Accessibility: </span>
              {submission.accessibilityNeeds}
            </p>
          )}

          {submission.howDidYouHear && (
            <p className="text-xs text-black-02/40">
              <span className="font-medium text-black-02/50">Found us via: </span>
              {submission.howDidYouHear}
            </p>
          )}

          {(submission.tracking.utmSource || submission.tracking.utmMedium || submission.tracking.utmCampaign || submission.tracking.ref) && (
            <p className="text-xs text-black-02/40">
              <span className="font-medium text-black-02/50">Link tracking: </span>
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
            <p className="text-xs text-black-02/40">
              <span className="font-medium text-black-02/50">Co-speaker(s): </span>
              {submission.coSpeakerEmails}
            </p>
          )}

          {(submission.hasSpokenAtGdgSydneyBefore || submission.isOpenToAudienceQuestions) && (
            <p className="text-xs text-black-02/40">
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
        <div className="flex flex-wrap gap-2 mb-4">
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

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black-02/6">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_DOT_STYLES[submission.status].text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_STYLES[submission.status].dot}`} />
            {STATUS_LABELS[submission.status]}
          </span>
          <span className="text-black-02/15 text-xs">&middot;</span>
          <span className="text-xs text-black-02/30">{formatDate(submission.submittedAt)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setNotesOpen((open) => !open)}
            disabled={isPending || bulkActionsPending}
            aria-expanded={notesOpen}
            aria-label={`${notesOpen ? 'Hide' : 'Show'} reviewer notes for: ${submission.talkTitle}`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3.5h11M2.5 7h11M2.5 10.5h7" />
            </svg>
            Notes{submission.reviewerNotes.length > 0 ? ` (${submission.reviewerNotes.length})` : ''}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            disabled={isPending || bulkActionsPending}
            aria-label={`Edit submission: ${submission.talkTitle}`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 2.5a1.5 1.5 0 012.12 2.12l-8 8-3 .88.88-3 8-8z" />
            </svg>
            Edit
          </button>
          {submission.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(rejectSubmission)}
                disabled={isPending || bulkActionsPending}
                aria-label={`Reject proposal: ${submission.talkTitle}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-google-red/10 border border-google-red/25 text-google-red hover:bg-google-red/15 transition-colors font-medium"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
                Reject
              </button>
              <button
                onClick={() => handleAction(promoteSubmission)}
                disabled={isPending || bulkActionsPending}
                aria-label={`Accept and promote proposal: ${submission.talkTitle}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-google-green/10 border border-google-green/25 text-google-green hover:bg-google-green/15 transition-colors font-medium"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.375l2.625 2.625L9.75 3.75" />
                </svg>
                Accept
              </button>
            </>
          )}
          {(submission.status === 'rejected' || submission.status === 'archived') && (
            <button
              onClick={() => handleAction(restoreSubmission)}
              disabled={isPending || bulkActionsPending}
              aria-label={`Restore proposal to pending: ${submission.talkTitle}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
            >
              Restore
            </button>
          )}
          {submission.status === 'accepted' && (
            <button
              onClick={() => handleAction(undoPromotion)}
              disabled={isPending || bulkActionsPending}
              aria-label={`Undo acceptance of proposal: ${submission.talkTitle}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4L2.5 7.5 6 11M2.5 7.5h6.5a4 4 0 010 8H7" />
              </svg>
              Undo
            </button>
          )}
          {submission.status !== 'accepted' && submission.status !== 'archived' && (
            <button
              onClick={() => handleAction(archiveSubmission)}
              disabled={isPending || bulkActionsPending}
              aria-label={`Archive proposal: ${submission.talkTitle}`}
              className="text-xs px-3 py-1.5 rounded-lg text-black-02/35 hover:text-black-02/60 transition-colors"
            >
              Archive
            </button>
          )}
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

interface Props {
  submissions: Submission[];
}

type FilterStatus = 'all' | SubmissionStatus;
type TrackFilter = 'all' | Track;
type SortOption = 'newest' | 'oldest' | 'track';

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
};

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
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [trackFilter, setTrackFilter] = useState<TrackFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isBulkPending, startBulkTransition] = useTransition();

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: submissions.filter((s) => s.status !== 'archived').length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    accepted: submissions.filter((s) => s.status === 'accepted').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    archived: submissions.filter((s) => s.status === 'archived').length,
  };

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

  const sorted = [...filtered].sort((a, b) => {
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
      <div className="max-w-3xl mx-auto px-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 sm:mt-8 mb-4 gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-black-02 tracking-tight">Submissions</h1>

          <div className="flex items-center gap-1 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                className={`inline-flex items-center shrink-0 text-sm px-3 py-1.5 rounded-full transition-colors ${
                  filter === tab.value
                    ? 'bg-google-blue text-white font-bold'
                    : 'text-black-02/40 font-medium hover:text-black-02/65 hover:bg-black-02/[0.04]'
                }`}
              >
                <span className="leading-none">
                  {tab.label}
                  <span className="ml-2.5">{counts[tab.value]}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: search, track filter, sort, export */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black-02/30" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <circle cx="7" cy="7" r="5" />
              <path strokeLinecap="round" d="M11 11l3.5 3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or talk title…"
              aria-label="Search submissions"
              className="w-full rounded-lg border border-black-02/15 bg-white pl-8 pr-3 py-1.5 text-xs text-black-02 placeholder:text-black-02/35 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30"
            />
          </div>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as TrackFilter)}
            aria-label="Filter by track"
            className="rounded-lg border border-black-02/15 bg-white px-2.5 py-1.5 text-xs font-medium text-black-02/70 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30"
          >
            <option value="all">All tracks</option>
            {(Object.entries(TRACK_LABELS) as [Track, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort submissions"
            className="rounded-lg border border-black-02/15 bg-white px-2.5 py-1.5 text-xs font-medium text-black-02/70 focus:outline-none focus:border-google-blue/50 focus:ring-1 focus:ring-google-blue/30"
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            onClick={handleExport}
            aria-label="Export visible submissions as CSV"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/60 hover:border-black-02/30 hover:text-black-02/85 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 1.5v8m0 0L5 6.5m3 3l3-3M2.5 11v2A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5v-2" />
            </svg>
            Export
          </button>
        </div>

        {/* Bulk selection bar */}
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          <label className="flex items-center gap-2 text-xs text-black-02/40">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              disabled={sorted.length === 0 || isBulkPending}
              aria-label="Select all visible submissions"
              className="w-4 h-4 rounded border-black-02/25 text-google-blue focus:outline-none focus:ring-2 focus:ring-google-blue/40"
            />
            Select all
          </label>

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-black-02/40">{selectedCount} selected</span>
              <button
                onClick={handleBulkReject}
                disabled={isBulkPending}
                aria-label={`Reject ${selectedCount} selected submissions`}
                className="text-xs px-3 py-1.5 rounded-lg bg-google-red/10 border border-google-red/25 text-google-red hover:bg-google-red/15 transition-colors font-medium"
              >
                Reject
              </button>
              <button
                onClick={handleBulkAccept}
                disabled={isBulkPending}
                aria-label={`Accept ${selectedCount} selected submissions`}
                className="text-xs px-3 py-1.5 rounded-lg bg-google-green/10 border border-google-green/25 text-google-green hover:bg-google-green/15 transition-colors font-medium"
              >
                Accept
              </button>
              <button
                onClick={handleBulkArchive}
                disabled={isBulkPending}
                aria-label={`Archive ${selectedCount} selected submissions`}
                className="text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
              >
                Archive
              </button>
              <button
                onClick={clearSelection}
                disabled={isBulkPending}
                className="text-xs px-3 py-1.5 rounded-lg text-black-02/35 hover:text-black-02/60 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Submissions list */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-black-02/30 text-sm">
            No submissions match these filters.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((submission) => (
              <SubmissionRow
                key={submission.id}
                submission={submission}
                onError={setAlertMessage}
                selected={selectedIds.has(submission.id)}
                onToggleSelect={() => toggleSelect(submission.id)}
                bulkActionsPending={isBulkPending}
              />
            ))}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
