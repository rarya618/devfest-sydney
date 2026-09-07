import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import { areTicketsOpen } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import { fetchPartnerAssets, fetchSponsors, groupSponsorsByTier, TIER_LABELS } from '@/lib/sponsors';

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

const primaryButton = 'inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80';
const outlineButton = 'inline-flex items-center gap-2.5 px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white';

export default async function PartnersPage() {
  const cfsOpen = isCfsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const ticketsOnSale = areTicketsOpen();
  const [sponsors, assets] = await Promise.all([fetchSponsors(), fetchPartnerAssets()]);
  const sponsorGroups = groupSponsorsByTier(sponsors);

  return (
    <div className="bg-[#17181a] text-white min-h-screen">
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
            className="text-[clamp(3rem,13vw,5rem)] md:text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up"
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

      {/* Presenting and venue partners */}
      <section id="presenting" className="pb-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-10 text-center">
            <p className="text-xs font-bold text-white/55 mb-3">Supported by</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The partners behind the day</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal className="rounded-2xl bg-white/[0.045] p-8 flex flex-col items-start gap-5">
              {assets.googleLogoUrl && (
                <Image src={assets.googleLogoUrl} alt="Google" width={160} height={48} className="h-12 w-auto object-contain" />
              )}
              <div>
                <p className="text-xs font-bold text-white/55 mb-2">Presenting partner</p>
                <p className="text-white/70 leading-relaxed">
                  Google backs DevFest Sydney with an event grant and ecosystem support across Gemini, Google Cloud and Firebase.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="rounded-2xl bg-white/[0.045] p-8 flex flex-col items-start gap-5">
              {assets.torrensLogoUrl && (
                <Image src={assets.torrensLogoUrl} alt="Torrens University" width={120} height={36} className="h-12 w-auto object-contain" />
              )}
              <div>
                <p className="text-xs font-bold text-white/55 mb-2">Venue partner</p>
                <p className="text-white/70 leading-relaxed">
                  Torrens University hosts the day at its Surry Hills campus, minutes from Central Station.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section id="sponsors" className="py-20 px-4 sm:px-6 lg:px-12 bg-white/[0.02] border-y border-white/8">
        <div className="max-w-5xl mx-auto">
          <Reveal className={`text-center ${sponsorGroups.length > 0 ? 'mb-12' : 'mb-5'}`}>
            <p className="text-xs font-bold text-white/55 mb-3">Sponsors</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {sponsorGroups.length > 0 ? 'The organisations making 2026 happen' : 'Sponsors are being confirmed'}
            </h2>
          </Reveal>

          {sponsorGroups.length > 0 ? (
            <div className="space-y-14">
              {sponsorGroups.map((group) => (
                <div key={group.tier}>
                  <p className="text-xs font-bold text-white/50 mb-6 text-center">{TIER_LABELS[group.tier]}</p>
                  <div className="flex flex-wrap items-center justify-center gap-10">
                    {group.sponsors.map((sponsor) => (
                      <a
                        key={sponsor.id}
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${sponsor.name} website`}
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <Image
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          width={200}
                          height={64}
                          className={group.tier === 'platinum' ? 'h-16 w-auto object-contain' : 'h-11 w-auto object-contain'}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Reveal delay={0.1} className="max-w-2xl mx-auto text-center">
              <p className="text-white/65 leading-relaxed">
                Sponsor logos appear here as partnerships are signed. The first names on this page get the longest run of
                visibility before the event, on the site, in social posts and in the lead-up to ticket sales.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-2xl bg-white/[0.045] p-8 md:p-12 text-center">
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
