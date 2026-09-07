import Link from 'next/link';
import type { Submission, VolunteerSubmission, ShowcaseSubmission } from '@/lib/types';
import StickyAdminHeader from '../../StickyAdminHeader';
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
      <StickyAdminHeader className="z-20 w-full px-4 md:px-5 pt-4 pb-3 md:pt-8 md:pb-4 bg-[#010103]/95 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white tracking-tight mb-3">Analytics</h1>
        <nav aria-label="Analytics sections" className="flex gap-1.5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          {ANALYTICS_TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Link
                key={tab}
                href={tab === 'speakers' ? '/admin/analytics' : `/admin/analytics?tab=${tab}`}
                aria-current={active ? 'page' : undefined}
                aria-label={`Show ${TAB_LABELS[tab]} analytics`}
                className={`inline-flex items-center gap-2 shrink-0 text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-white/[0.1] border-white/15 text-white font-bold'
                    : 'border-white/10 text-white/70 font-medium hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {TAB_LABELS[tab]}
                <span className={`text-xs ${active ? 'text-white/70' : 'text-white/50'}`}>{counts[tab]}</span>
              </Link>
            );
          })}
        </nav>
      </StickyAdminHeader>

      <div className="px-4 md:px-5">
        {activeTab === 'speakers' && <SpeakerAnalytics submissions={submissions} />}
        {activeTab === 'volunteers' && <VolunteerAnalytics volunteers={volunteers} />}
        {activeTab === 'showcase' && <ShowcaseAnalytics entries={showcaseEntries} />}
      </div>
    </>
  );
}
