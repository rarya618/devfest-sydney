'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { promoteSubmission, rejectSubmission, restoreSubmission } from './actions';
import Alert from '@/components/Alert';
import InviteAdminForm from './InviteAdminForm';
import type { Submission, SubmissionStatus, Track, TalkFormat } from '@/lib/types';

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  pending: 'bg-google-yellow/10 text-google-yellow border-google-yellow/20',
  accepted: 'bg-google-green/10 text-google-green border-google-green/20',
  rejected: 'bg-black-02/5 text-black-02/35 border-black-02/10',
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const TRACK_LABELS: Record<Track, string> = {
  developer: 'Developer',
  builder: 'Builder',
  showcase: 'Showcase',
};

const TRACK_COLORS: Record<Track, string> = {
  developer: 'text-google-blue',
  builder: 'text-google-green',
  showcase: 'text-google-yellow',
};

const TRACK_BORDER_COLORS: Record<Track, string> = {
  developer: 'border-l-google-blue',
  builder: 'border-l-google-green',
  showcase: 'border-l-google-yellow',
};

const TRACK_DOT_COLORS: Record<Track, string> = {
  developer: 'bg-google-blue',
  builder: 'bg-google-green',
  showcase: 'bg-google-yellow',
};

const FORMAT_LABELS: Record<TalkFormat, string> = {
  talk: 'Talk',
  workshop: 'Workshop',
  'lightning-talk': 'Lightning',
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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
          <p className="text-xs text-black-02/40 mt-1 truncate">{submission.name} &middot; {submission.email}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {submission.isGoogleDeveloperExpert && (
            <span className="text-xs px-2.5 py-1 rounded-full border font-medium bg-google-blue/10 text-google-blue border-google-blue/20">
              GDE
            </span>
          )}
          {submission.requiresTravelSupport && (
            <span className="text-xs px-2.5 py-1 rounded-full border font-medium bg-google-yellow/10 text-google-yellow border-google-yellow/20">
              Travel support
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[submission.status]}`}>
            {STATUS_LABELS[submission.status]}
          </span>
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

      {(submission.socialLinks || submission.previousTalkLink) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs">
          {submission.socialLinks && (
            <span className="text-black-02/45">
              <span className="text-black-02/30">Social: </span>
              {submission.socialLinks}
            </span>
          )}
          {submission.previousTalkLink && (
            <span className="text-black-02/45">
              <span className="text-black-02/30">Previous talk: </span>
              {submission.previousTalkLink}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-black-02/6">
        <span className="text-xs text-black-02/30">{formatDate(submission.submittedAt)}</span>

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
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [inviting, setInviting] = useState(false);

  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
      await fetch('/api/admin/session', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      setSigningOut(false);
      setAlertMessage('Sign-out failed. Please try again.');
    }
  }

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
      <div className="min-h-screen bg-off-white pb-10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 mb-6 border-b border-black-02/8">
          <Link href="/" className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity" aria-label="Back to DevFest Sydney home">
            <Image
              src="/logo.png"
              alt="GDG"
              width={100}
              height={27}
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-black-02 text-lg tracking-tight">DevFest Sydney</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInviting(true)}
              aria-label="Invite a new admin"
              className="text-xs px-4 py-2 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
            >
              Invite admin
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out of admin panel"
              className="text-xs px-4 py-2 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4">

          <h1 className="text-4xl font-bold text-black-02 tracking-tight text-center mb-8">Submissions</h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {([
              { label: 'Pending', value: counts.pending, color: 'text-google-yellow', dot: 'bg-google-yellow' },
              { label: 'Accepted', value: counts.accepted, color: 'text-google-green', dot: 'bg-google-green' },
              { label: 'Total', value: counts.all, color: 'text-black-02', dot: null },
            ] as const).map(({ label, value, color, dot }) => (
              <div key={label} className="bg-white border border-black-02/8 rounded-2xl px-4 py-5 text-center shadow-[0_1px_3px_rgba(30,30,30,0.04)]">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="flex items-center justify-center gap-1.5 text-xs text-black-02/40 mt-1">
                  {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-5 bg-black-02/[0.04] rounded-xl p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium ${
                  filter === tab.value
                    ? 'bg-white text-black-02 shadow-[0_1px_4px_rgba(30,30,30,0.1)]'
                    : 'text-black-02/40 hover:text-black-02/65'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-black-02/30">{counts[tab.value]}</span>
              </button>
            ))}
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
      </div>

      {inviting && (
        <InviteAdminForm
          onDone={() => setInviting(false)}
          onError={(message) => {
            setInviting(false);
            setAlertMessage(message);
          }}
        />
      )}

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
