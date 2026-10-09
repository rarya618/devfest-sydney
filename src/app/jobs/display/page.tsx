import type { Metadata } from 'next';
import Image from 'next/image';
import QRCode from 'qrcode';
import { fetchPublicJobListings, fetchPublicJobSeekers } from '@/lib/jobBoard';
import { JOB_TYPE_LABELS, WORK_ARRANGEMENT_LABELS } from '@/lib/jobBoardLabels';
import { TIER_LABELS } from '@/lib/sponsors';
import type { PublicJobListing, PublicJobSeeker } from '@/lib/types';
import AutoRefresh from './AutoRefresh';
import VerticalMarquee from './VerticalMarquee';

// Listings appear as organisers approve them, so this is rendered per request, and
// AutoRefresh re-renders it on a timer while it sits on the screen.
export const dynamic = 'force-dynamic';

// A screen view for the venue, not a page to land on: kept out of search like /jobs/people,
// since it carries the same profiles.
export const metadata: Metadata = {
  title: 'Job board display',
  robots: { index: false, follow: false },
};

const REFRESH_INTERVAL_SECONDS = 30;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';
const boardUrl = `${siteUrl}/jobs`;
// Printed under the QR code for anyone who would rather type it.
const boardUrlLabel = boardUrl.replace(/^https?:\/\//, '');

function RoleCard({ listing }: { listing: PublicJobListing }) {
  return (
    <li
      className={`h-full bg-surface rounded-2xl p-6 border-l-6 ${
        listing.sponsor ? 'border-google-blue' : 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          {listing.sponsor && (
            <p className="font-mono text-sm uppercase tracking-[0.12em] text-google-blue mb-1">
              {TIER_LABELS[listing.sponsor.tier]} sponsor
            </p>
          )}
          <h3 className="text-3xl font-bold text-white leading-tight">{listing.roleTitle}</h3>
          <p className="mt-1 text-xl text-white/80">{listing.companyName}</p>
        </div>
        {listing.sponsor?.logoUrl && (
          <div className="relative h-12 w-32 shrink-0">
            <Image src={listing.sponsor.logoUrl} alt={listing.sponsor.name} fill sizes="128px" className="object-contain object-right brightness-0 invert" />
          </div>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-base text-white/75" aria-label="Role details">
        <li className="px-3 py-1 rounded-full bg-white/[0.08]">{listing.location}</li>
        <li className="px-3 py-1 rounded-full bg-white/[0.08]">{WORK_ARRANGEMENT_LABELS[listing.workArrangement]}</li>
        <li className="px-3 py-1 rounded-full bg-white/[0.08]">{JOB_TYPE_LABELS[listing.jobType]}</li>
      </ul>

      <p className="mt-4 text-lg text-white/80 leading-relaxed line-clamp-3">{listing.description}</p>
    </li>
  );
}

function SeekerCard({ seeker }: { seeker: PublicJobSeeker }) {
  return (
    <li className="bg-surface rounded-2xl p-6 border-l-6 border-google-green">
      <h3 className="text-2xl font-bold text-white leading-tight">{seeker.name}</h3>
      <p className="mt-1 text-lg text-white/80">{seeker.headline}</p>

      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-base text-white/75" aria-label="Location and ways of working">
        <li className="px-3 py-1 rounded-full bg-white/[0.08]">{seeker.location}</li>
        {seeker.workArrangements.map((arrangement) => (
          <li key={arrangement} className="px-3 py-1 rounded-full bg-white/[0.08]">{WORK_ARRANGEMENT_LABELS[arrangement]}</li>
        ))}
      </ul>

      <p className="mt-4 text-lg text-white/80 leading-relaxed line-clamp-2">
        <span className="font-bold text-white">Looking for:</span> {seeker.lookingFor}
      </p>
    </li>
  );
}

function EmptyColumn({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-white/15 p-10 text-center">
      <p className="text-xl text-white/60 max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}

export default async function JobBoardDisplayPage() {
  const [listings, seekers, qrSvg] = await Promise.all([
    fetchPublicJobListings(),
    fetchPublicJobSeekers(),
    QRCode.toString(boardUrl, { type: 'svg', margin: 0, color: { dark: '#1e1e1e', light: '#ffffff' } }),
  ]);

  return (
    // Fixed to the viewport with nothing to scroll: the columns roll themselves instead.
    <div className="h-screen overflow-hidden bg-[#010103] text-white flex flex-col px-10 py-6 gap-6">
      <AutoRefresh intervalSeconds={REFRESH_INTERVAL_SECONDS} />

      <header className="flex items-center justify-between gap-10 shrink-0">
        {/* One line, so the header is no taller than the QR code beside it. */}
        <div className="flex items-center gap-6">
          <Image src="/logo-wordmark.png" alt="DevFest Sydney" width={1331} height={240} priority className="h-11 w-auto object-contain" />
          <span className="h-12 w-px bg-white/25" aria-hidden="true" />
          <h1 className="text-5xl font-bold tracking-tight leading-none">Job board</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold">Scan to apply, post a role or add your profile</p>
            <p className="font-mono text-xl text-white/70 mt-1">{boardUrlLabel}</p>
          </div>
          <div
            role="img"
            aria-label={`QR code linking to ${boardUrlLabel}`}
            className="size-24 shrink-0 rounded-lg bg-white p-2 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-[3fr_2fr] gap-8">
        <section aria-labelledby="display-roles-heading" className="min-h-0 flex flex-col">
          <h2 id="display-roles-heading" className="shrink-0 mb-3 flex items-baseline gap-3 text-3xl font-bold">
            Roles
            <span className="font-mono text-xl font-normal text-white/60">{listings.length}</span>
          </h2>
          <div className="flex-1 min-h-0">
            {listings.length > 0 ? (
              <VerticalMarquee>
                {/* Two across, so four or so roles fit on one screen before the column has to roll. */}
                <ul className="grid grid-cols-2 gap-6">
                  {listings.map((listing) => (
                    <RoleCard key={listing.id} listing={listing} />
                  ))}
                </ul>
              </VerticalMarquee>
            ) : (
              <EmptyColumn message="Hiring? Scan the code to post the first role." />
            )}
          </div>
        </section>

        <section aria-labelledby="display-people-heading" className="min-h-0 flex flex-col">
          <h2 id="display-people-heading" className="shrink-0 mb-3 flex items-baseline gap-3 text-3xl font-bold">
            Open to work
            <span className="font-mono text-xl font-normal text-white/60">{seekers.length}</span>
          </h2>
          <div className="flex-1 min-h-0">
            {seekers.length > 0 ? (
              <VerticalMarquee>
                <ul className="space-y-6">
                  {seekers.map((seeker) => (
                    <SeekerCard key={seeker.id} seeker={seeker} />
                  ))}
                </ul>
              </VerticalMarquee>
            ) : (
              <EmptyColumn message="Looking for your next role? Scan the code to add your profile." />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
