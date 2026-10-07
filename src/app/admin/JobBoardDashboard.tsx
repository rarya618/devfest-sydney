'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition, type ReactNode } from 'react';
import Alert from '@/components/Alert';
import { formatDate } from '@/lib/format';
import {
  JOB_BOARD_STATUS_DOT_STYLES,
  JOB_BOARD_STATUS_LABELS,
  JOB_TYPE_LABELS,
  WORK_ARRANGEMENT_LABELS,
} from '@/lib/jobBoardLabels';
import type { JobBoardStatus, JobListing, JobSeeker, SponsorTier } from '@/lib/types';
import { deleteJobBoardEntry, setJobBoardStatus, setJobListingSponsor, type JobBoardCollection } from './jobBoardActions';
import StickyAdminHeader from './StickyAdminHeader';

type DashboardTab = 'roles' | 'people';
type StatusFilter = JobBoardStatus | 'all';

interface SponsorOption {
  id: string;
  name: string;
  tier: SponsorTier;
}

interface Props {
  activeTab: DashboardTab;
  listings: JobListing[];
  seekers: JobSeeker[];
  sponsors: SponsorOption[];
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'On the board' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

const actionButtonClass =
  'text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40';

interface EntryActionsProps {
  collection: JobBoardCollection;
  id: string;
  status: JobBoardStatus;
  label: string;
  onError: (message: string) => void;
}

// The same set of moves for both kinds of post. Approve is the only one that publishes.
function EntryActions({ collection, id, status, label, onError }: EntryActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) onError(result.error);
    });
  }

  const move = (nextStatus: JobBoardStatus) => () => run(() => setJobBoardStatus(collection, id, nextStatus));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'approved' && (
        <button
          type="button"
          disabled={isPending}
          onClick={move('approved')}
          aria-label={`Approve ${label} and put it on the board`}
          className={`${actionButtonClass} bg-google-green-deep border-google-green-deep text-white hover:opacity-90`}
        >
          Approve
        </button>
      )}
      {status === 'pending' && (
        <button type="button" disabled={isPending} onClick={move('rejected')} aria-label={`Reject ${label}`} className={`${actionButtonClass} border-white/35 text-white/80 hover:border-white`}>
          Reject
        </button>
      )}
      {status === 'approved' && (
        <button type="button" disabled={isPending} onClick={move('archived')} aria-label={`Take ${label} off the board`} className={`${actionButtonClass} border-white/35 text-white/80 hover:border-white`}>
          Take down
        </button>
      )}
      {(status === 'rejected' || status === 'archived') && (
        <button type="button" disabled={isPending} onClick={move('pending')} aria-label={`Move ${label} back to pending`} className={`${actionButtonClass} border-white/35 text-white/80 hover:border-white`}>
          Back to pending
        </button>
      )}

      {confirmingDelete ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-xs text-white/70">Delete for good?</span>
          <button type="button" disabled={isPending} onClick={() => setConfirmingDelete(false)} aria-label="Keep it" className={`${actionButtonClass} border-white/35 text-white/80 hover:border-white`}>
            Keep
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => deleteJobBoardEntry(collection, id))}
            aria-label={`Delete ${label} permanently`}
            className={`${actionButtonClass} bg-google-red-deep border-google-red-deep text-white hover:opacity-90`}
          >
            Delete
          </button>
        </span>
      ) : (
        <button type="button" disabled={isPending} onClick={() => setConfirmingDelete(true)} aria-label={`Delete ${label}`} className={`${actionButtonClass} border-transparent text-google-red-light hover:border-google-red-light`}>
          Delete
        </button>
      )}
    </div>
  );
}

function StatusLabel({ status }: { status: JobBoardStatus }) {
  const styles = JOB_BOARD_STATUS_DOT_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${styles.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {JOB_BOARD_STATUS_LABELS[status]}
    </span>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70">{children}</span>;
}

function ListingCard({ listing, sponsors, onError }: { listing: JobListing; sponsors: SponsorOption[]; onError: (message: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const label = `${listing.roleTitle} at ${listing.companyName}`;

  function changeSponsor(sponsorId: string) {
    startTransition(async () => {
      const result = await setJobListingSponsor(listing.id, sponsorId);
      if (result.error) onError(result.error);
    });
  }

  return (
    <li className="bg-surface rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white">{listing.roleTitle}</h2>
          <p className="text-sm text-white/70">{listing.companyName}</p>
        </div>
        <StatusLabel status={listing.status} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip>{listing.location}</Chip>
        <Chip>{WORK_ARRANGEMENT_LABELS[listing.workArrangement]}</Chip>
        <Chip>{JOB_TYPE_LABELS[listing.jobType]}</Chip>
      </div>

      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{listing.description}</p>

      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div>
          <dt className="inline text-white/50">How to apply: </dt>
          <dd className="inline text-white/80 break-all">{listing.howToApply}</dd>
        </div>
        <div>
          <dt className="inline text-white/50">Posted by: </dt>
          <dd className="inline text-white/80">
            {listing.contactName} &middot;{' '}
            <a href={`mailto:${listing.contactEmail}`} className="underline underline-offset-2 hover:text-white">{listing.contactEmail}</a>
          </dd>
        </div>
        <div>
          <dt className="inline text-white/50">Submitted: </dt>
          <dd className="inline text-white/80">{formatDate(listing.submittedAt)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        <label className="flex items-center gap-2 text-xs text-white/70">
          Sponsor
          <select
            value={listing.sponsorId}
            disabled={isPending}
            onChange={(event) => changeSponsor(event.target.value)}
            aria-label={`Sponsor for ${label}; sponsor roles are listed first`}
            className="rounded-lg border border-white/35 bg-white/[0.06] px-2 py-1.5 text-xs text-white focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40 [&>option]:bg-black-02 disabled:opacity-50"
          >
            <option value="">Not a sponsor</option>
            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>{sponsor.name}</option>
            ))}
          </select>
        </label>
        <EntryActions collection="jobListings" id={listing.id} status={listing.status} label={label} onError={onError} />
      </div>
    </li>
  );
}

function SeekerCard({ seeker, onError }: { seeker: JobSeeker; onError: (message: string) => void }) {
  return (
    <li className="bg-surface rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white">{seeker.name}</h2>
          <p className="text-sm text-white/70">{seeker.headline}</p>
        </div>
        <StatusLabel status={seeker.status} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip>{seeker.location}</Chip>
        {seeker.workArrangements.map((arrangement) => (
          <Chip key={arrangement}>{WORK_ARRANGEMENT_LABELS[arrangement]}</Chip>
        ))}
      </div>

      <p className="text-sm text-white/60"><span className="font-bold text-white/80">Looking for:</span> {seeker.lookingFor}</p>
      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{seeker.about}</p>

      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div>
          <dt className="inline text-white/50">LinkedIn: </dt>
          <dd className="inline">
            <a href={seeker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 underline underline-offset-2 hover:text-white break-all">{seeker.linkedinUrl}</a>
          </dd>
        </div>
        {seeker.portfolioUrl && (
          <div>
            <dt className="inline text-white/50">Portfolio: </dt>
            <dd className="inline">
              <a href={seeker.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 underline underline-offset-2 hover:text-white break-all">{seeker.portfolioUrl}</a>
            </dd>
          </div>
        )}
        <div>
          <dt className="inline text-white/50">Email (private): </dt>
          <dd className="inline">
            <a href={`mailto:${seeker.email}`} className="text-white/80 underline underline-offset-2 hover:text-white">{seeker.email}</a>
          </dd>
        </div>
        <div>
          <dt className="inline text-white/50">Submitted: </dt>
          <dd className="inline text-white/80">{formatDate(seeker.submittedAt)}</dd>
        </div>
      </dl>

      <div className="flex justify-end pt-3 border-t border-white/10">
        <EntryActions collection="jobSeekers" id={seeker.id} status={seeker.status} label={`${seeker.name}'s profile`} onError={onError} />
      </div>
    </li>
  );
}

export default function JobBoardDashboard({ activeTab, listings, seekers, sponsors }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const dismissAlert = useCallback(() => setAlertMessage(null), []);

  const entries: { status: JobBoardStatus }[] = activeTab === 'roles' ? listings : seekers;
  const countFor = (filter: StatusFilter) =>
    filter === 'all' ? entries.length : entries.filter((entry) => entry.status === filter).length;
  const matchesFilter = (entry: { status: JobBoardStatus }) => statusFilter === 'all' || entry.status === statusFilter;

  const pendingListings = listings.filter((listing) => listing.status === 'pending').length;
  const pendingSeekers = seekers.filter((seeker) => seeker.status === 'pending').length;

  const tabs: { value: DashboardTab; label: string; href: string; pending: number }[] = [
    { value: 'roles', label: 'Roles', href: '/admin/jobs', pending: pendingListings },
    { value: 'people', label: 'Open to work', href: '/admin/jobs?tab=people', pending: pendingSeekers },
  ];

  const visibleListings = listings.filter(matchesFilter);
  const visibleSeekers = seekers.filter(matchesFilter);
  const visibleCount = activeTab === 'roles' ? visibleListings.length : visibleSeekers.length;

  return (
    <>
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-2 md:pt-[1.125rem] pb-3 bg-[#010103]/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Job board</h1>
            <p className="mt-0.5 text-sm text-white/55">
              {pendingListings + pendingSeekers} waiting for review &middot;{' '}
              <Link href={activeTab === 'roles' ? '/jobs' : '/jobs/people'} className="underline underline-offset-2 hover:text-white">
                View the public board
              </Link>
            </p>
          </div>

          <nav aria-label="Job board sections" className="inline-flex rounded-full bg-white/[0.06] p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={tab.href}
                aria-current={tab.value === activeTab ? 'page' : undefined}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                  tab.value === activeTab ? 'bg-white text-black-02' : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.pending > 0 && <span className="ml-1.5 font-mono text-xs">({tab.pending})</span>}
              </Link>
            ))}
          </nav>
        </div>

        <div role="group" aria-label="Filter by status" className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                statusFilter === filter.value ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {filter.label} <span className="font-mono">{countFor(filter.value)}</span>
            </button>
          ))}
        </div>
      </StickyAdminHeader>

      <div className="px-4 md:px-5 pb-10">
        {visibleCount === 0 ? (
          <p className="mt-10 text-center text-sm text-white/55">Nothing here.</p>
        ) : activeTab === 'roles' ? (
          <ul className="space-y-3">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} sponsors={sponsors} onError={setAlertMessage} />
            ))}
          </ul>
        ) : (
          <ul className="space-y-3">
            {visibleSeekers.map((seeker) => (
              <SeekerCard key={seeker.id} seeker={seeker} onError={setAlertMessage} />
            ))}
          </ul>
        )}
      </div>

      {alertMessage && <Alert message={alertMessage} onDismiss={dismissAlert} />}
    </>
  );
}
