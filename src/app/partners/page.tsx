import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import {
  fetchCommunityPartners,
  fetchPartnerAssets,
  fetchSponsors,
  groupSponsorsByTier,
  PARTNERS_CARD_LOGO_BOXES,
  PARTNERS_ROW_LOGO_BOXES,
  TIER_LABELS,
} from '@/lib/sponsors';
import type { PartnerOrganisation } from '@/lib/types';

// The navbar ticket CTA follows the on-sale date, and sponsors appear as they are added,
// so this page is rendered per request like the other public pages.
export const dynamic = 'force-dynamic';

const CONTACT_EMAIL = 'hello@gdgsydney.com';
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Sponsoring DevFest Sydney 2026')}`;

const title = 'Partners';
const description =
  'Sponsor DevFest Sydney 2026 and reach the builders shaping what comes next: 200+ developers, designers and founders on Saturday 10 October.';

export const metadata: Metadata = buildPageMetadata({ title, description, path: '/partners' });

function ProspectusButton({ href, className }: { href: string; className: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download the DevFest Sydney sponsorship prospectus (PDF)"
      className={className}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Download the prospectus
    </a>
  );
}

const primaryButton = 'inline-flex items-center gap-2.5 px-7 py-2 bg-google-green-deep text-white text-base font-bold rounded border border-google-green-deep transition-opacity hover:opacity-80';
const outlineButton = 'inline-flex items-center gap-2.5 px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white';

// Every logo sits in a fixed box with both a height and a width cap, so a stacked lockup
// fills the height and a wide wordmark fills the width and the two read at a similar weight.
function SponsorCard({ sponsor, label, logoBoxClass, delay }: { sponsor: PartnerOrganisation; label: string; logoBoxClass: string; delay: number }) {
  return (
    <Reveal delay={delay} className="w-full md:w-[calc(50%-0.75rem)] rounded-2xl bg-surface p-8 flex flex-col items-start gap-5">
      <Image src={sponsor.logoUrl} alt={sponsor.name} width={288} height={96} className={`${logoBoxClass} max-w-full object-contain object-left brightness-0 invert`} />
      <div>
        <p className="text-xs font-bold text-google-green mb-2">{label}</p>
        <p className="text-white/70 leading-relaxed">{sponsor.description}</p>
        <a
          href={sponsor.website}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit the ${sponsor.name} website`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors"
        >
          Visit {sponsor.name}
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>
      </div>
    </Reveal>
  );
}

function SponsorLogoLink({ sponsor, logoBoxClass }: { sponsor: PartnerOrganisation; logoBoxClass: string }) {
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${sponsor.name} website`}
      className="opacity-80 hover:opacity-100 transition-opacity"
    >
      <Image src={sponsor.logoUrl} alt={sponsor.name} width={288} height={96} className={`${logoBoxClass} max-w-full object-contain brightness-0 invert`} />
    </a>
  );
}

// A group with blurbs gets a row of cards, then the rest of the group as a logo row, so no
// organisation appears twice. Shared by the sponsor tiers and the community partners.
function PartnerGroup({ sponsors, label, cardLogoBoxClass, rowLogoBoxClass }: { sponsors: PartnerOrganisation[]; label: string; cardLogoBoxClass: string; rowLogoBoxClass: string }) {
  const sponsorsWithBlurb = sponsors.filter((sponsor) => sponsor.description);
  const logoOnlySponsors = sponsors.filter((sponsor) => !sponsor.description);
  return (
    <>
      {sponsorsWithBlurb.length > 0 && (
        <div className={`flex flex-wrap justify-center gap-6 ${logoOnlySponsors.length > 0 ? 'mb-10' : ''}`}>
          {sponsorsWithBlurb.map((sponsor, index) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} label={label} logoBoxClass={cardLogoBoxClass} delay={index * 0.1} />
          ))}
        </div>
      )}
      {logoOnlySponsors.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-10">
          {logoOnlySponsors.map((sponsor) => (
            <SponsorLogoLink key={sponsor.id} sponsor={sponsor} logoBoxClass={rowLogoBoxClass} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function PartnersPage() {
  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const ticketsOnSale = areTicketsOpen();
  // Sponsors (paid or in-kind, every tier including community) and community partners
  // (reciprocal, unpaid) are separate collections and separate sections.
  const [sponsors, communityPartners, assets] = await Promise.all([fetchSponsors(), fetchCommunityPartners(), fetchPartnerAssets()]);
  const sponsorGroups = groupSponsorsByTier(sponsors);

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <Navbar accent="green" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

      {/* Hero */}
      <section className={`relative pb-20 px-4 sm:px-6 lg:px-12 overflow-hidden ${ticketsOnSale ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-2.5 text-base font-bold text-white/80 animate-fade-in">
            <span className="flex items-center gap-2.5">
              <span>Saturday, 10 October 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" aria-hidden="true" />
            </span>
            <span>Torrens University, Surry Hills</span>
          </p>

          <h1
            className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Partners
          </h1>

          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Reach the builders shaping what comes next. Sponsoring DevFest Sydney puts your brand in front of an engaged
            technical audience at the moment they are choosing the tools, platforms and products they will build with.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            {assets.sponsorshipProspectusUrl && (
              <ProspectusButton href={assets.sponsorshipProspectusUrl} className={`${outlineButton} animate-slide-up`} />
            )}
            <a href={CONTACT_HREF} className={`${primaryButton} animate-slide-up`} style={{ animationDelay: '0.3s' }}>
              Get in touch
            </a>
          </div>
        </div>
      </section>

      {/* Sponsors: Diamond and Venue first, then every tier from the `sponsors` collection */}
      <section id="sponsors" className="py-20 px-4 sm:px-6 lg:px-12 bg-white/[0.02] border-y border-white/8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-bold text-google-green mb-3">Sponsors</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The organisations making 2026 happen</h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            <Reveal className="rounded-2xl bg-surface p-8 flex flex-col items-start gap-5">
              {assets.googleLogoUrl && (
                <Image src={assets.googleLogoUrl} alt="Google" width={288} height={96} className="h-18 w-52 max-w-full object-contain object-left brightness-0 invert" />
              )}
              <div>
                <p className="text-xs font-bold text-google-green mb-2">Diamond Sponsor</p>
                <p className="text-white/70 leading-relaxed">
                  Google backs DevFest Sydney with an event grant and ecosystem support across Gemini, Google Cloud and Firebase.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="rounded-2xl bg-surface p-8 flex flex-col items-start gap-5">
              {assets.torrensLogoUrl && (
                <Image src={assets.torrensLogoUrl} alt="Torrens University" width={240} height={80} className="h-16 w-44 max-w-full object-contain object-left brightness-0 invert" />
              )}
              <div>
                <p className="text-xs font-bold text-google-green mb-2">Venue Sponsor</p>
                <p className="text-white/70 leading-relaxed">
                  Torrens University hosts the day at its Surry Hills campus, minutes from Central Station.
                </p>
              </div>
            </Reveal>
          </div>

          {sponsorGroups.length > 0 && (
            <div className="mt-14 space-y-14">
              {sponsorGroups.map((group) => (
                <div key={group.tier}>
                  <p className="text-xs font-bold text-white/50 mb-6 text-center">{TIER_LABELS[group.tier]}</p>
                  <PartnerGroup
                    sponsors={group.sponsors}
                    label={`${TIER_LABELS[group.tier]} sponsor`}
                    cardLogoBoxClass={PARTNERS_CARD_LOGO_BOXES[group.tier]}
                    rowLogoBoxClass={PARTNERS_ROW_LOGO_BOXES[group.tier]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Community partners */}
      <section id="community" className="pt-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className={`text-center ${communityPartners.length > 0 ? 'mb-12' : 'mb-5'}`}>
            <p className="text-xs font-bold text-google-green mb-3">Community partners</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {communityPartners.length > 0 ? 'The communities we build with' : 'Community partners are being confirmed'}
            </h2>
          </Reveal>

          {communityPartners.length > 0 ? (
            <PartnerGroup sponsors={communityPartners} label="Community partner" cardLogoBoxClass={PARTNERS_CARD_LOGO_BOXES.community} rowLogoBoxClass={PARTNERS_ROW_LOGO_BOXES.community} />
          ) : (
            <Reveal delay={0.1} className="max-w-2xl mx-auto text-center">
              <p className="text-white/65 leading-relaxed">
                Meetups, student groups and developer communities that help spread the word about DevFest Sydney are
                listed here. If your community would like to partner with us, email{' '}
                <a href={CONTACT_HREF} className="text-white underline underline-offset-4 hover:text-white/80">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-xl border-l-[8px] border-google-green bg-surface p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Tiers, benefits and how to get involved</h2>
              <p className="text-white/70 leading-relaxed max-w-2xl mx-auto mb-8">
                Everything from Platinum through to in-kind community sponsorship is in the prospectus. Email the organising
                team and we will come back to you with what is still available.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-5">
                <a href={CONTACT_HREF} aria-label={`Email ${CONTACT_EMAIL} about sponsoring`} className={primaryButton}>
                  Email us
                </a>
                {assets.sponsorshipProspectusUrl && <ProspectusButton href={assets.sponsorshipProspectusUrl} className={outlineButton} />}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
