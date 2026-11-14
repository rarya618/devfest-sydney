import { SHOWCASE_STAGE_LABELS } from '@/lib/showcaseLabels';
import type { ShowcaseSubmission, ShowcaseStatus, ShowcaseStage } from '@/lib/types';
import SubmissionsOverTimeChart from './SubmissionsOverTimeChart';
import { ACCENT_CHART_CLASSES, BarRow, BreakdownCard, EmptyState, StatusTiles, countChannels, countUniqueEmails } from './shared';

interface Props {
  entries: ShowcaseSubmission[];
}

const BAR_CLASS = ACCENT_CHART_CLASSES.yellow.bar;
const STAGE_ORDER: ShowcaseStage[] = ['idea', 'prototype', 'live'];

export default function ShowcaseAnalytics({ entries }: Props) {
  const total = entries.length;

  const statusCounts: Record<ShowcaseStatus, number> = { pending: 0, accepted: 0, rejected: 0, archived: 0 };
  const stageCounts: Partial<Record<ShowcaseStage, number>> = {};
  const teamSizeCounts: Record<number, number> = {};
  let firstTimePresenterCount = 0;
  let hasCoPresentersCount = 0;
  let demoRequirementsCount = 0;
  let projectLinkCount = 0;
  let repositoryCount = 0;
  let linkedinCount = 0;

  for (const entry of entries) {
    statusCounts[entry.status] += 1;
    stageCounts[entry.stage] = (stageCounts[entry.stage] ?? 0) + 1;
    const teamSize = entry.coPresenters.length + 1;
    teamSizeCounts[teamSize] = (teamSizeCounts[teamSize] ?? 0) + 1;
    if (entry.isFirstTimePresenter) firstTimePresenterCount += 1;
    if (entry.coPresenters.length > 0) hasCoPresentersCount += 1;
    if (entry.demoRequirements) demoRequirementsCount += 1;
    if (entry.demoUrl) projectLinkCount += 1;
    if (entry.repoUrl) repositoryCount += 1;
    if (entry.linkedinUrl) linkedinCount += 1;
  }

  const channels = countChannels(entries);
  const teamSizes = Object.keys(teamSizeCounts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      <StatusTiles
        total={total}
        totalLabel="Entries"
        uniqueCount={countUniqueEmails(entries)}
        uniqueLabel="Unique entrants"
        pending={statusCounts.pending}
        accepted={statusCounts.accepted}
        rejected={statusCounts.rejected}
      />

      {total === 0 ? (
        <EmptyState message="No Builder Showcase entries yet." />
      ) : (
        <>
          <SubmissionsOverTimeChart entries={entries} noun="entries" accent="yellow" />

          <div className="grid sm:grid-cols-2 gap-3">
            <BreakdownCard title="By stage">
              {STAGE_ORDER.filter((stage) => stageCounts[stage]).map((stage) => (
                <BarRow key={stage} label={SHOWCASE_STAGE_LABELS[stage]} count={stageCounts[stage] ?? 0} total={total} barClass={BAR_CLASS} />
              ))}
            </BreakdownCard>

            <BreakdownCard title="Team size">
              {teamSizes.map((size) => (
                <BarRow
                  key={size}
                  label={size === 1 ? 'Solo' : size === 2 ? 'Pair' : `Team of ${size}`}
                  count={teamSizeCounts[size]}
                  total={total}
                  barClass={BAR_CLASS}
                />
              ))}
            </BreakdownCard>

            <BreakdownCard title="Entrant profile">
              <BarRow label="First-time presenters" count={firstTimePresenterCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Presenting with co-presenters" count={hasCoPresentersCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Has demo requirements" count={demoRequirementsCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Shared a project link" count={projectLinkCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Shared a repository" count={repositoryCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Shared a LinkedIn profile" count={linkedinCount} total={total} barClass={BAR_CLASS} />
            </BreakdownCard>

            <BreakdownCard title="Traffic sources">
              {channels.map(([channel, count]) => (
                <BarRow key={channel} label={channel} count={count} total={total} barClass={BAR_CLASS} />
              ))}
            </BreakdownCard>
          </div>
        </>
      )}
    </>
  );
}
