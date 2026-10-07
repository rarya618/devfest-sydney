import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/metadata';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { areTicketsOpen } from '@/lib/tickets';
import { fetchPublicJobListings } from '@/lib/jobBoard';
import { JOB_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/lib/jobBoardLabels';
import { TIER_LABELS } from '@/lib/sponsors';
import type { PublicJobListing } from '@/lib/types';
import JobBoardHeader from './JobBoardHeader';

// Listings appear as organisers approve them, so this is rendered per request.
export const dynamic = 'force-dynamic';

const title = 'Job board';
const description =
  'Roles from the teams at DevFest Sydney 2026, and attendees open to their next one. Post a role or browse what is on offer.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/jobs' });

// Roughly four lines at the card's width; anything longer is clamped behind a disclosure.
const DESCRIPTION_PREVIEW_LENGTH = 280;

function JobCard({ listing }: { listing: PublicJobListing }) {
  const isMailto = listing.applyHref.startsWith('mailto:');

  return (
    <li
      className={`bg-surface rounded-2xl p-6 md:p-8 border-l-6 ${
        listing.sponsor ? 'border-google-blue' : 'border-white/10'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {listing.sponsor && (
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-google-blue mb-2">
              {TIER_LABELS[listing.sponsor.tier]} sponsor
            </p>
          )}
          <h3 className="text-xl md:text-2xl font-bold text-white">{listing.roleTitle}</h3>
          <p className="mt-1 text-base text-white/80">{listing.companyName}</p>
        </div>
        {listing.sponsor?.logoUrl && (
          <div className="relative h-10 w-28 shrink-0">
            <Image src={listing.sponsor.logoUrl} alt={listing.sponsor.name} fill sizes="112px" className="object-contain object-right" />
          </div>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-white/70" aria-label="Role details">
        <li className="px-2.5 py-1 rounded-full bg-white/[0.06]">{listing.location}</li>
        <li className="px-2.5 py-1 rounded-full bg-white/[0.06]">{WORK_ARRANGEMENT_LABELS[listing.workArrangement]}</li>
        <li className="px-2.5 py-1 rounded-full bg-white/[0.06]">{JOB_TYPE_LABELS[listing.jobType]}</li>
      </ul>

      {listing.description.length > DESCRIPTION_PREVIEW_LENGTH ? (
        // A native disclosure keeps the page a server component. The clamped preview hides
        // once it is open, so the opening lines are never shown twice.
        <div className="group/description mt-4">
          <p className="text-base text-white/80 leading-relaxed whitespace-pre-line line-clamp-4 group-has-[details[open]]/description:hidden">
            {listing.description}
          </p>
          <details className="group">
            <summary className="mt-2 cursor-pointer text-sm font-bold text-white/70 hover:text-white list-none group-open:hidden">
              Read the full description
            </summary>
            <p className="text-base text-white/80 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </details>
        </div>
      ) : (
        <p className="mt-4 text-base text-white/80 leading-relaxed whitespace-pre-line">{listing.description}</p>
      )}

      <a
        href={listing.applyHref}
        {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        aria-label={`Apply for ${listing.roleTitle} at ${listing.companyName}${isMailto ? ' by email' : ' (opens in a new tab)'}`}
        className="inline-flex mt-6 items-center px-6 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
      >
        {isMailto ? 'Apply by email' : 'Apply'}
      </a>
    </li>
  );
}

export default async function JobsPage() {
  const listings = await fetchPublicJobListings();

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar areTicketsOpen={areTicketsOpen()} />

      <JobBoardHeader activeTab="roles" postHref="/jobs/post" postLabel="Post a role" />

      <section aria-labelledby="roles-heading" className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 id="roles-heading" className="sr-only">Open roles</h2>
          {listings.length > 0 ? (
            <ul className="space-y-6">
              {listings.map((listing) => (
                <JobCard key={listing.id} listing={listing} />
              ))}
            </ul>
          ) : (
            <div className="bg-surface rounded-2xl p-12 text-center">
              <h3 className="text-lg font-bold text-white/80 mb-3">No roles on the board yet</h3>
              <p className="text-sm text-white/55 leading-relaxed max-w-sm mx-auto">
                Hiring?{' '}
                <Link href="/jobs/post" className="text-white/85 hover:text-white underline underline-offset-2">
                  Post the first one
                </Link>
                . Roles appear here once an organiser has checked them.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
