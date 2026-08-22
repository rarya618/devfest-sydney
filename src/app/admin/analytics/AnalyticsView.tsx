import type { ReactNode } from 'react';
import {
  STATUS_LABELS,
  TRACK_LABELS,
  TRACK_DOT_COLORS,
  FORMAT_LABELS,
  EXPERIENCE_LABELS,
} from '@/lib/submissionLabels';
import type { Submission, SubmissionStatus, Track, TalkFormat, ExperienceLevel } from '@/lib/types';
import { INTERNAL_UTM_SOURCE } from '@/lib/tracking';
import SubmissionsOverTimeChart from './SubmissionsOverTimeChart';

interface Props {
  submissions: Submission[];
}

type StatAccent = 'neutral' | 'blue' | 'yellow' | 'green' | 'muted';

const STAT_ACCENT_STYLES: Record<StatAccent, { border: string; bg: string; iconBg: string; iconText: string; countText: string }> = {
  neutral: { border: 'border-white/15', bg: 'bg-white/[0.06]', iconBg: 'bg-white/10', iconText: 'text-white/70', countText: 'text-white' },
  blue: { border: 'border-google-blue/25', bg: 'bg-google-blue/[0.08]', iconBg: 'bg-google-blue/15', iconText: 'text-google-blue', countText: 'text-google-blue' },
  yellow: { border: 'border-google-yellow/25', bg: 'bg-google-yellow/[0.08]', iconBg: 'bg-google-yellow/15', iconText: 'text-google-yellow', countText: 'text-google-yellow' },
  green: { border: 'border-google-green/25', bg: 'bg-google-green/[0.08]', iconBg: 'bg-google-green/15', iconText: 'text-google-green', countText: 'text-google-green' },
  muted: { border: 'border-white/10', bg: 'bg-white/[0.06]', iconBg: 'bg-white/10', iconText: 'text-white/40', countText: 'text-white/50' },
};

const STAT_ICON_PATHS: Record<string, string> = {
  layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  x: 'M18 6 6 18M6 6l12 12',
};

function StatIcon({ name, className }: { name: keyof typeof STAT_ICON_PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={STAT_ICON_PATHS[name]} />
    </svg>
  );
}

function StatTile({
  label,
  count,
  subtext,
  accent = 'neutral',
  icon,
}: {
  label: string;
  count: number;
  subtext?: string;
  accent?: StatAccent;
  icon: keyof typeof STAT_ICON_PATHS;
}) {
  const styles = STAT_ACCENT_STYLES[count === 0 ? 'muted' : accent];
  return (
    <div
      title={subtext}
      className={`group inline-flex items-center gap-3 rounded-full border ${styles.border} ${styles.bg} pl-2 pr-6 py-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]`}
    >
      <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${styles.iconBg} ${styles.iconText}`}>
        <StatIcon name={icon} className="w-4 h-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium text-white/50">{label}</span>
        <span className={`text-lg font-bold tracking-tight ${styles.countText}`}>{count}</span>
      </span>
    </div>
  );
}

function BarRow({ label, count, total, dotClass }: { label: string; count: number; total: number; dotClass?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div title={`${label}: ${count} of ${total} (${pct}%)`}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-2 font-medium text-white/70">
          {dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />}
          {label}
        </span>
        <span className="text-white/40 text-xs shrink-0">{count} &middot; {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-google-blue" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BreakdownCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-5">
      <h2 className="text-sm font-bold text-white/70 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function getChannel(submission: Submission): string {
  // Internal CTAs (banner, navbar, etc.) all share the same utm_source — bucket those
  // by their more specific ref instead, so "banner" and "navbar" show up separately.
  if (submission.tracking.utmSource && submission.tracking.utmSource !== INTERNAL_UTM_SOURCE) {
    return submission.tracking.utmSource;
  }
  if (submission.tracking.ref) return submission.tracking.ref;
  if (submission.tracking.utmSource) return submission.tracking.utmSource;
  return 'Direct / unknown';
}

export default function AnalyticsView({ submissions }: Props) {
  const total = submissions.length;
  const uniqueApplicantCount = new Set(submissions.map((submission) => submission.email.trim().toLowerCase())).size;

  const statusCounts: Record<SubmissionStatus, number> = { pending: 0, accepted: 0, rejected: 0, archived: 0 };
  const trackCounts: Partial<Record<Track, number>> = {};
  const formatCounts: Partial<Record<TalkFormat, number>> = {};
  const experienceCounts: Partial<Record<ExperienceLevel, number>> = {};
  const channelCounts: Record<string, number> = {};
  let firstTimeSpeakerCount = 0;
  let gdeCount = 0;
  let wantsMentoringCount = 0;
  let requiresTravelSupportCount = 0;

  for (const submission of submissions) {
    statusCounts[submission.status] += 1;
    trackCounts[submission.track] = (trackCounts[submission.track] ?? 0) + 1;
    formatCounts[submission.format] = (formatCounts[submission.format] ?? 0) + 1;
    experienceCounts[submission.experienceLevel] = (experienceCounts[submission.experienceLevel] ?? 0) + 1;
    if (submission.isFirstTimeSpeaker) firstTimeSpeakerCount += 1;
    if (submission.isGoogleDeveloperExpert) gdeCount += 1;
    if (submission.wantsMentoring) wantsMentoringCount += 1;
    if (submission.requiresTravelSupport) requiresTravelSupportCount += 1;
    const channel = getChannel(submission);
    channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;
  }

  const trackOrder: Track[] = ['developer', 'builder', 'workshop'];
  const formatOrder: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
  const experienceOrder: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
  const channels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="sticky top-[52px] md:top-0 z-20 w-full px-6 pt-8 pb-5 bg-[#202124]/95 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white tracking-tight">Analytics</h1>
      </div>

      <div className="px-6">
      <div className="flex flex-wrap gap-2.5 mb-6">
        <StatTile label="Total" count={total} icon="layers" accent="neutral" />
        <StatTile
          label="Unique applicants"
          count={uniqueApplicantCount}
          subtext={total > 0 ? `${Math.round((uniqueApplicantCount / total) * 100)}% of submissions` : undefined}
          icon="users"
          accent="blue"
        />
        <StatTile
          label={STATUS_LABELS.pending}
          count={statusCounts.pending}
          subtext={total > 0 ? `${Math.round((statusCounts.pending / total) * 100)}% of total` : undefined}
          icon="clock"
          accent="yellow"
        />
        <StatTile
          label={STATUS_LABELS.accepted}
          count={statusCounts.accepted}
          subtext={total > 0 ? `${Math.round((statusCounts.accepted / total) * 100)}% of total` : undefined}
          icon="check"
          accent="green"
        />
        <StatTile
          label={STATUS_LABELS.rejected}
          count={statusCounts.rejected}
          subtext={total > 0 ? `${Math.round((statusCounts.rejected / total) * 100)}% of total` : undefined}
          icon="x"
          accent="muted"
        />
      </div>

      {total === 0 ? (
        <div className="text-center py-16 text-white/40 text-sm">No submissions yet.</div>
      ) : (
        <>
          <SubmissionsOverTimeChart submissions={submissions} />

          <div className="grid sm:grid-cols-2 gap-3">
            <BreakdownCard title="By track">
              {trackOrder
                .filter((track) => trackCounts[track])
                .map((track) => (
                  <BarRow
                    key={track}
                    label={TRACK_LABELS[track]}
                    count={trackCounts[track] ?? 0}
                    total={total}
                    dotClass={TRACK_DOT_COLORS[track]}
                  />
                ))}
            </BreakdownCard>

            <BreakdownCard title="By format">
              {formatOrder
                .filter((format) => formatCounts[format])
                .map((format) => (
                  <BarRow key={format} label={FORMAT_LABELS[format]} count={formatCounts[format] ?? 0} total={total} />
                ))}
            </BreakdownCard>

            <BreakdownCard title="By experience level">
              {experienceOrder
                .filter((level) => experienceCounts[level])
                .map((level) => (
                  <BarRow
                    key={level}
                    label={EXPERIENCE_LABELS[level]}
                    count={experienceCounts[level] ?? 0}
                    total={total}
                  />
                ))}
            </BreakdownCard>

            <BreakdownCard title="Speaker profile">
              <BarRow label="First-time speakers" count={firstTimeSpeakerCount} total={total} />
              <BarRow label="Google Developer Experts (GDE)" count={gdeCount} total={total} />
              <BarRow label="Wants mentoring" count={wantsMentoringCount} total={total} />
              <BarRow label="Requires travel support" count={requiresTravelSupportCount} total={total} />
            </BreakdownCard>

            <BreakdownCard title="Traffic sources">
              {channels.map(([channel, count]) => (
                <BarRow key={channel} label={channel} count={count} total={total} />
              ))}
            </BreakdownCard>
          </div>
        </>
      )}
      </div>
    </>
  );
}
