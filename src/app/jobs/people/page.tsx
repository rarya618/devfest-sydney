import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { fetchPublicJobSeekers } from '@/lib/jobBoard';
import { WORK_ARRANGEMENT_LABELS } from '@/lib/jobBoardLabels';
import { LinkedInIcon } from '@/components/SocialIcons';
import type { PublicJobSeeker } from '@/lib/types';
import JobBoardHeader from '../JobBoardHeader';

export const dynamic = 'force-dynamic';

const title = 'Open to work';
const description = 'DevFest Sydney 2026 attendees looking for their next role.';

// Public, but kept out of search results and the sitemap: someone saying they are looking
// for work agreed to be seen by the people at the event, not to have it come up when their
// current employer searches their name.
export const metadata: Metadata = {
  ...buildPageMetadata({ title, description, path: '/jobs/people' }),
  robots: { index: false, follow: false },
};

function SeekerCard({ seeker }: { seeker: PublicJobSeeker }) {
  return (
    <li className="bg-surface rounded-2xl p-6 md:p-8 flex flex-col">
      <h3 className="text-xl font-bold text-white">{seeker.name}</h3>
      <p className="mt-1 text-base text-white/80">{seeker.headline}</p>

      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-white/70" aria-label="Location and ways of working">
        <li className="px-2.5 py-1 rounded-full bg-white/[0.06]">{seeker.location}</li>
        {seeker.workArrangements.map((arrangement) => (
          <li key={arrangement} className="px-2.5 py-1 rounded-full bg-white/[0.06]">{WORK_ARRANGEMENT_LABELS[arrangement]}</li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-white/60">
        <span className="font-bold text-white/80">Looking for:</span> {seeker.lookingFor}
      </p>
      <p className="mt-3 text-base text-white/80 leading-relaxed whitespace-pre-line">{seeker.about}</p>

      <div className="mt-auto pt-6 flex flex-wrap gap-3">
        <a
          href={seeker.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${seeker.name} on LinkedIn (opens in a new tab)`}
          className="inline-flex items-center gap-2 px-5 py-2 bg-google-blue-deep text-white text-sm font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
        >
          <LinkedInIcon />
          Connect on LinkedIn
        </a>
        {seeker.portfolioUrl && (
          <a
            href={seeker.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${seeker.name}'s portfolio (opens in a new tab)`}
            className="inline-flex items-center px-5 py-2 text-white text-sm font-bold rounded border border-white/40 transition-colors hover:border-white"
          >
            Portfolio
          </a>
        )}
      </div>
    </li>
  );
}

export default async function JobSeekersPage() {
  const seekers = await fetchPublicJobSeekers();

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar areTicketsOpen={areTicketsOpen()} />

      <JobBoardHeader activeTab="people" postHref="/jobs/people/add" postLabel="Add your profile" />

      <section aria-labelledby="people-heading" className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 id="people-heading" className="sr-only">Attendees open to work</h2>
          {seekers.length > 0 ? (
            <ul className="grid md:grid-cols-2 gap-6">
              {seekers.map((seeker) => (
                <SeekerCard key={seeker.id} seeker={seeker} />
              ))}
            </ul>
          ) : (
            <div className="max-w-4xl mx-auto bg-surface rounded-2xl p-12 text-center">
              <h3 className="text-lg font-bold text-white/80 mb-3">No profiles on the board yet</h3>
              <p className="text-sm text-white/55 leading-relaxed max-w-sm mx-auto">
                Looking for your next role?{' '}
                <Link href="/jobs/people/add" className="text-white/85 hover:text-white underline underline-offset-2">
                  Add your profile
                </Link>
                . Profiles appear here once an organiser has checked them.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
