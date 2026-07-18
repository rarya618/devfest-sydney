import type { ReactNode } from 'react';
import {
  STATUS_LABELS,
  STATUS_DOT_STYLES,
  TRACK_LABELS,
  TRACK_DOT_COLORS,
  FORMAT_LABELS,
  EXPERIENCE_LABELS,
} from '@/lib/submissionLabels';
import type { Submission, SubmissionStatus, Track, TalkFormat, ExperienceLevel } from '@/lib/types';

interface Props {
  submissions: Submission[];
}

function StatTile({ label, count, dotClass }: { label: string; count: number; dotClass?: string }) {
  return (
    <div className="bg-white border border-black-02/8 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-2 mb-1.5">
        {dotClass && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />}
        <span className="text-xs font-medium text-black-02/45">{label}</span>
      </div>
      <p className="text-3xl font-bold text-black-02 tracking-tight">{count}</p>
    </div>
  );
}

function BarRow({ label, count, total, dotClass }: { label: string; count: number; total: number; dotClass?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div title={`${label}: ${count} of ${total} (${pct}%)`}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-2 font-medium text-black-02/70">
          {dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />}
          {label}
        </span>
        <span className="text-black-02/40 font-mono text-xs shrink-0">{count} &middot; {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-black-02/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-google-blue" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BreakdownCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-black-02/8 rounded-2xl px-5 py-5">
      <h2 className="text-sm font-bold text-black-02/70 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function getChannel(submission: Submission): string {
  if (submission.tracking.utmSource) return submission.tracking.utmSource;
  if (submission.tracking.ref) return submission.tracking.ref;
  return 'Direct / unknown';
}

export default function AnalyticsView({ submissions }: Props) {
  const total = submissions.length;

  const statusCounts: Record<SubmissionStatus, number> = { pending: 0, accepted: 0, rejected: 0 };
  const trackCounts: Partial<Record<Track, number>> = {};
  const formatCounts: Partial<Record<TalkFormat, number>> = {};
  const experienceCounts: Partial<Record<ExperienceLevel, number>> = {};
  const channelCounts: Record<string, number> = {};

  for (const submission of submissions) {
    statusCounts[submission.status] += 1;
    trackCounts[submission.track] = (trackCounts[submission.track] ?? 0) + 1;
    formatCounts[submission.format] = (formatCounts[submission.format] ?? 0) + 1;
    experienceCounts[submission.experienceLevel] = (experienceCounts[submission.experienceLevel] ?? 0) + 1;
    const channel = getChannel(submission);
    channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;
  }

  const trackOrder: Track[] = ['developer', 'builder', 'workshop'];
  const formatOrder: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
  const experienceOrder: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
  const channels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl font-bold text-black-02 tracking-tight mt-8 mb-8">Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile label="Total" count={total} />
        <StatTile label={STATUS_LABELS.pending} count={statusCounts.pending} dotClass={STATUS_DOT_STYLES.pending.dot} />
        <StatTile label={STATUS_LABELS.accepted} count={statusCounts.accepted} dotClass={STATUS_DOT_STYLES.accepted.dot} />
        <StatTile label={STATUS_LABELS.rejected} count={statusCounts.rejected} dotClass={STATUS_DOT_STYLES.rejected.dot} />
      </div>

      {total === 0 ? (
        <div className="text-center py-16 text-black-02/30 text-sm">No submissions yet.</div>
      ) : (
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

          <BreakdownCard title="Traffic sources">
            {channels.map(([channel, count]) => (
              <BarRow key={channel} label={channel} count={count} total={total} />
            ))}
          </BreakdownCard>
        </div>
      )}
    </div>
  );
}
