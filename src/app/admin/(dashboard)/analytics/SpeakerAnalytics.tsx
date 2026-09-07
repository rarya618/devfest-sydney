import { TRACK_LABELS, TRACK_DOT_COLORS, FORMAT_LABELS, EXPERIENCE_LABELS } from '@/lib/submissionLabels';
import type { Submission, SubmissionStatus, Track, TalkFormat, ExperienceLevel } from '@/lib/types';
import SubmissionsOverTimeChart from './SubmissionsOverTimeChart';
import { BarRow, BreakdownCard, EmptyState, StatusTiles, countChannels, countUniqueEmails } from './shared';

interface Props {
  submissions: Submission[];
}

const TRACK_ORDER: Track[] = ['developer', 'builder', 'workshop'];
const FORMAT_ORDER: TalkFormat[] = ['talk', 'lightning-talk', 'workshop'];
const EXPERIENCE_ORDER: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function SpeakerAnalytics({ submissions }: Props) {
  const total = submissions.length;

  const statusCounts: Record<SubmissionStatus, number> = { pending: 0, accepted: 0, rejected: 0, archived: 0 };
  const trackCounts: Partial<Record<Track, number>> = {};
  const formatCounts: Partial<Record<TalkFormat, number>> = {};
  const experienceCounts: Partial<Record<ExperienceLevel, number>> = {};
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
  }

  const channels = countChannels(submissions);

  return (
    <>
      <StatusTiles
        total={total}
        totalLabel="Submissions"
        uniqueCount={countUniqueEmails(submissions)}
        uniqueLabel="Unique applicants"
        pending={statusCounts.pending}
        accepted={statusCounts.accepted}
        rejected={statusCounts.rejected}
      />

      {total === 0 ? (
        <EmptyState message="No submissions yet." />
      ) : (
        <>
          <SubmissionsOverTimeChart entries={submissions} noun="submissions" accent="blue" />

          <div className="grid sm:grid-cols-2 gap-3">
            <BreakdownCard title="By track">
              {TRACK_ORDER.filter((track) => trackCounts[track]).map((track) => (
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
              {FORMAT_ORDER.filter((format) => formatCounts[format]).map((format) => (
                <BarRow key={format} label={FORMAT_LABELS[format]} count={formatCounts[format] ?? 0} total={total} />
              ))}
            </BreakdownCard>

            <BreakdownCard title="By experience level">
              {EXPERIENCE_ORDER.filter((level) => experienceCounts[level]).map((level) => (
                <BarRow key={level} label={EXPERIENCE_LABELS[level]} count={experienceCounts[level] ?? 0} total={total} />
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
    </>
  );
}
