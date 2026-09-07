import { VOLUNTEER_AREA_LABELS, GDG_ON_CAMPUS_CHAPTER_LABELS } from '@/lib/volunteerLabels';
import type { VolunteerSubmission, VolunteerStatus, VolunteerArea, GdgOnCampusChapter } from '@/lib/types';
import SubmissionsOverTimeChart from './SubmissionsOverTimeChart';
import { ACCENT_CHART_CLASSES, BarRow, BreakdownCard, EmptyState, StatusTiles, countChannels, countUniqueEmails } from './shared';

interface Props {
  volunteers: VolunteerSubmission[];
}

const BAR_CLASS = ACCENT_CHART_CLASSES.green.bar;
const AREA_ORDER = Object.keys(VOLUNTEER_AREA_LABELS) as VolunteerArea[];
const CHAPTER_ORDER = Object.keys(GDG_ON_CAMPUS_CHAPTER_LABELS) as Exclude<GdgOnCampusChapter, ''>[];

export default function VolunteerAnalytics({ volunteers }: Props) {
  const total = volunteers.length;

  const statusCounts: Record<VolunteerStatus, number> = { pending: 0, accepted: 0, rejected: 0, archived: 0 };
  const areaCounts: Partial<Record<VolunteerArea, number>> = {};
  const chapterCounts: Partial<Record<Exclude<GdgOnCampusChapter, ''>, number>> = {};
  let torrensCount = 0;
  let gdgOnCampusExecCount = 0;
  let priorExperienceCount = 0;
  let googleTechExperienceCount = 0;
  let dietaryRequirementsCount = 0;
  let phoneProvidedCount = 0;

  for (const volunteer of volunteers) {
    statusCounts[volunteer.status] += 1;
    for (const area of volunteer.areasOfInterest) {
      areaCounts[area] = (areaCounts[area] ?? 0) + 1;
    }
    if (volunteer.isTorrensStudentOrStaff) torrensCount += 1;
    if (volunteer.hasBeenGdgOnCampusExec) {
      gdgOnCampusExecCount += 1;
      if (volunteer.gdgOnCampusChapter) {
        chapterCounts[volunteer.gdgOnCampusChapter] = (chapterCounts[volunteer.gdgOnCampusChapter] ?? 0) + 1;
      }
    }
    if (volunteer.priorExperience) priorExperienceCount += 1;
    if (volunteer.googleTechExperience) googleTechExperienceCount += 1;
    if (volunteer.dietaryRequirements) dietaryRequirementsCount += 1;
    if (volunteer.phone) phoneProvidedCount += 1;
  }

  const channels = countChannels(volunteers);
  const areasWithSignups = AREA_ORDER.filter((area) => areaCounts[area]).sort((a, b) => (areaCounts[b] ?? 0) - (areaCounts[a] ?? 0));
  const chaptersWithExecs = CHAPTER_ORDER.filter((chapter) => chapterCounts[chapter]);

  return (
    <>
      <StatusTiles
        total={total}
        totalLabel="Signups"
        uniqueCount={countUniqueEmails(volunteers)}
        uniqueLabel="Unique volunteers"
        pending={statusCounts.pending}
        accepted={statusCounts.accepted}
        rejected={statusCounts.rejected}
      />

      {total === 0 ? (
        <EmptyState message="No volunteer signups yet." />
      ) : (
        <>
          <SubmissionsOverTimeChart entries={volunteers} noun="signups" accent="green" />

          <div className="grid sm:grid-cols-2 gap-3">
            <BreakdownCard title="Areas of interest">
              {areasWithSignups.map((area) => (
                <BarRow key={area} label={VOLUNTEER_AREA_LABELS[area]} count={areaCounts[area] ?? 0} total={total} barClass={BAR_CLASS} />
              ))}
            </BreakdownCard>

            <BreakdownCard title="Volunteer profile">
              <BarRow label="Torrens student or staff" count={torrensCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="GDG on Campus exec before" count={gdgOnCampusExecCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Has volunteered before" count={priorExperienceCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Google tech experience" count={googleTechExperienceCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Dietary requirements" count={dietaryRequirementsCount} total={total} barClass={BAR_CLASS} />
              <BarRow label="Phone number provided" count={phoneProvidedCount} total={total} barClass={BAR_CLASS} />
            </BreakdownCard>

            {chaptersWithExecs.length > 0 && (
              <BreakdownCard title="GDG on Campus chapter">
                {chaptersWithExecs.map((chapter) => (
                  <BarRow
                    key={chapter}
                    label={GDG_ON_CAMPUS_CHAPTER_LABELS[chapter]}
                    count={chapterCounts[chapter] ?? 0}
                    total={gdgOnCampusExecCount}
                    barClass={BAR_CLASS}
                  />
                ))}
              </BreakdownCard>
            )}

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
