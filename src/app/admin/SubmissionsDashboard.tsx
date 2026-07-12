'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { promoteSubmission, rejectSubmission, restoreSubmission } from './actions';
import Alert from '@/components/Alert';
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
      className={`bg-white border rounded-xl p-5 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : 'border-black-02/8'}`}
      aria-label={`Submission from ${submission.name}: ${submission.talkTitle}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-black-02 text-sm leading-snug truncate">{submission.talkTitle}</h3>
          <p className="text-xs text-black-02/40 mt-0.5 truncate">{submission.name} &middot; {submission.email}</p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[submission.status]}`}>
          {STATUS_LABELS[submission.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs font-medium font-mono ${TRACK_COLORS[submission.track]}`}>
          {TRACK_LABELS[submission.track]}
        </span>
        <span className="text-black-02/20 text-xs">/</span>
        <span className="text-xs text-black-02/40 font-mono">{FORMAT_LABELS[submission.format]}</span>
        <span className="text-black-02/20 text-xs">/</span>
        <span className="text-xs text-black-02/40 font-mono capitalize">{submission.experienceLevel}</span>
        {submission.isGoogleDeveloperExpert && (
          <>
            <span className="text-black-02/20 text-xs">/</span>
            <span className="text-xs text-google-blue font-mono">GDE</span>
          </>
        )}
        {submission.requiresTravelSupport && (
          <>
            <span className="text-black-02/20 text-xs">/</span>
            <span className="text-xs text-google-yellow font-mono">Travel support</span>
          </>
        )}
      </div>

      <p className="text-xs text-black-02/45 leading-relaxed line-clamp-2 mb-4">{submission.abstract}</p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-black-02/30 font-mono">{formatDate(submission.submittedAt)}</span>

        <div className="flex gap-2">
          {submission.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(rejectSubmission)}
                disabled={isPending}
                aria-label={`Reject proposal: ${submission.talkTitle}`}
                className="text-xs px-3 py-1.5 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction(promoteSubmission)}
                disabled={isPending}
                aria-label={`Accept and promote proposal: ${submission.talkTitle}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-google-green/10 border border-google-green/25 text-google-green hover:bg-google-green/15 transition-colors font-medium"
              >
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
      <div className="min-h-screen bg-off-white px-4 py-10">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/" className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity mb-1" aria-label="Back to DevFest Sydney home">
                <Image
                  src="/logo.png"
                  alt="GDG"
                  width={100}
                  height={27}
                  className="h-7 w-auto object-contain"
                />
                <span className="font-bold text-black-02 text-lg tracking-wide">DevFest Sydney</span>
              </Link>
              <p className="text-sm text-black-02/40">Submissions</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                aria-label="Go to homepage"
                className="text-xs px-4 py-2 rounded-lg border border-black-02/15 text-black-02/50 hover:border-black-02/30 hover:text-black-02/75 transition-colors"
              >
                Home
              </Link>
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {([
              { label: 'Pending', value: counts.pending, color: 'text-google-yellow' },
              { label: 'Accepted', value: counts.accepted, color: 'text-google-green' },
              { label: 'Total', value: counts.all, color: 'text-black-02' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-black-02/8 rounded-xl px-4 py-3 text-center">
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-xs text-black-02/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-5 bg-white border border-black-02/8 rounded-xl p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium ${
                  filter === tab.value
                    ? 'bg-black-02/8 text-black-02'
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

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
