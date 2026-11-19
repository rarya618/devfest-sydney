import Link from 'next/link';
import type { Submission, VolunteerSubmission, ShowcaseSubmission } from '@/lib/types';
import StickyAdminHeader from '../../../StickyAdminHeader';
import FilterChipRow from '../../../FilterChipRow';
import SpeakerAnalytics from './SpeakerAnalytics';
import VolunteerAnalytics from './VolunteerAnalytics';
import ShowcaseAnalytics from './ShowcaseAnalytics';

export const ANALYTICS_TABS = ['speakers', 'volunteers', 'showcase'] as const;
export type AnalyticsTab = (typeof ANALYTICS_TABS)[number];

export function isAnalyticsTab(value: string | undefined): value is AnalyticsTab {
  return ANALYTICS_TABS.includes(value as AnalyticsTab);
}

const TAB_LABELS: Record<AnalyticsTab, string> = {
  speakers: 'Speakers',
  volunteers: 'Volunteers',
  showcase: 'Builder Showcase',
};

interface Props {
  activeTab: AnalyticsTab;
  submissions: Submission[];
  volunteers: VolunteerSubmission[];
  showcaseEntries: ShowcaseSubmission[];
}

// Tabs are links carrying `?tab=` so a view can be bookmarked or shared, and the page
// stays a server component: each panel is rendered from data fetched once in page.tsx.
export default function AnalyticsView({ activeTab, submissions, volunteers, showcaseEntries }: Props) {
  const counts: Record<AnalyticsTab, number> = {
    speakers: submissions.length,
    volunteers: volunteers.length,
    showcase: showcaseEntries.length,
  };

  return (
    <>
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-4 pb-3 md:pt-8 md:pb-4 bg-black-02/95 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-off-white tracking-[-0.01em] mb-3">Form results</h1>
        <nav aria-label="Form results sections">
          <FilterChipRow label="Form results sections" className="-mx-4 md:-mx-5">
          {ANALYTICS_TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Link
                key={tab}
                href={tab === 'speakers' ? '/admin/devfest/analytics' : `/admin/devfest/analytics?tab=${tab}`}
                aria-current={active ? 'page' : undefined}
                aria-label={`Show ${TAB_LABELS[tab]} results`}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue md:h-9 ${
                  active ? 'bg-white/[0.12] text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {TAB_LABELS[tab]}
                <span className="font-normal text-white/60">{counts[tab]}</span>
              </Link>
            );
          })}
          </FilterChipRow>
        </nav>
      </StickyAdminHeader>

      <div className="px-4 pt-2 md:px-5">
        {activeTab === 'speakers' && <SpeakerAnalytics submissions={submissions} />}
        {activeTab === 'volunteers' && <VolunteerAnalytics volunteers={volunteers} />}
        {activeTab === 'showcase' && <ShowcaseAnalytics entries={showcaseEntries} />}
      </div>
    </>
  );
}
