'use client';

import { useState, useCallback, useTransition, type ReactNode } from 'react';
import { promoteSubmission, rejectSubmission, restoreSubmission, undoPromotion } from './actions';
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
} from '@/lib/submissionLabels';
import type { Submission, SubmissionStatus } from '@/lib/types';

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

interface SubmissionRowProps {
  submission: Submission;
  onError: (message: string) => void;
}

function SubmissionRow({ submission, onError }: SubmissionRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleAction(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(submission.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <div
      className={`bg-white border border-l-4 rounded-2xl p-6 shadow-[0_1px_3px_rgba(30,30,30,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(30,30,30,0.07)] hover:-translate-y-0.5 ${
        isPending ? 'opacity-50 pointer-events-none' : 'border-black-02/8'
      } ${TRACK_BORDER_COLORS[submission.track]}`}
      aria-label={`Submission from ${submission.name}: ${submission.talkTitle}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-black-02 text-xl leading-snug tracking-tight truncate">{submission.talkTitle}</h3>
          <p className="mt-1 truncate">
            <span className="text-sm font-medium text-black-02/70">{submission.name}</span>
            <span className="text-xs text-black-02/40"> &middot; {submission.email}</span>
          </p>
          {submission.speakerTagline && (
            <p className="text-xs text-black-02/40 truncate mt-0.5">{submission.speakerTagline}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
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

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-black-02/6">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_DOT_STYLES[submission.status].text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_STYLES[submission.status].dot}`} />
            {STATUS_LABELS[submission.status]}
          </span>
          <span className="text-black-02/15 text-xs">&middot;</span>
          <span className="text-xs text-black-02/30">{formatDate(submission.submittedAt)}</span>
        </div>

        <div className="flex gap-2">
          {submission.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(rejectSubmission)}
                disabled={isPending}
                aria-label={`Reject proposal: ${submission.talkTitle}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" d="M2.5 2.5l7 7m0-7l-7 7" />
                </svg>
                Reject
              </button>
              <button
                onClick={() => handleAction(promoteSubmission)}
                disabled={isPending}
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
          {submission.status === 'rejected' && (
            <button
              onClick={() => handleAction(restoreSubmission)}
              disabled={isPending}
              aria-label={`Restore proposal to pending: ${submission.talkTitle}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
            >
              Restore
            </button>
          )}
          {submission.status === 'accepted' && (
            <button
              onClick={() => handleAction(undoPromotion)}
              disabled={isPending}
              aria-label={`Undo acceptance of proposal: ${submission.talkTitle}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4L2.5 7.5 6 11M2.5 7.5h6.5a4 4 0 010 8H7" />
              </svg>
              Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  submissions: Submission[];
}

type FilterStatus = 'all' | SubmissionStatus;

export default function SubmissionsDashboard({ submissions }: Props) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const counts: Record<FilterStatus, number> = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    accepted: submissions.filter((s) => s.status === 'accepted').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);

  const filterTabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      <div className="max-w-3xl mx-auto px-4">

        <div className="flex items-center justify-between mt-8 mb-6">
          <h1 className="text-4xl font-bold text-black-02 tracking-tight">Submissions</h1>

          <div className="flex items-center gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                className={`inline-flex items-center text-sm px-3 py-1.5 rounded-full transition-colors ${
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

        {/* Submissions list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-black-02/30 text-sm">
            No {filter === 'all' ? '' : filter} submissions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((submission) => (
              <SubmissionRow
                key={submission.id}
                submission={submission}
                onError={setAlertMessage}
              />
            ))}
          </div>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
