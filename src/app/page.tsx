import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CfsLink from '@/components/CfsLink';
import TicketsLink from '@/components/TicketsLink';
import { areTicketsOpen, TICKET_INCLUSIONS, TICKET_INCLUSION_DOT } from '@/lib/tickets';
import { isCfsOpen } from '@/lib/cfs';
import Reveal from '@/components/Reveal';
import Countdown from '@/components/Countdown';
import { adminDb } from '@/lib/firebase-admin';
import { fetchSponsors, fetchPartnerAssets, groupSponsorsByTier, TIER_LABELS } from '@/lib/sponsors';
import { fetchPublicSpeakers } from '@/lib/speakers';
import { fetchPublicOrganisers } from '@/lib/volunteers';
import { buildEventJsonLd } from '@/lib/eventJsonLd';
import { getInitials } from '@/lib/format';
import { TRACK_DOT_COLORS, TRACK_LABELS } from '@/lib/submissionLabels';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Tickets open on a date rather than a deploy, so this page must be rendered per request.
// A prerender (with or without `revalidate`) freezes the ticket CTAs at whatever
// areTicketsOpen() returned during the build: ISR regeneration was measured NOT to pick
// the change up, while force-dynamic does so immediately.
export const dynamic = 'force-dynamic';

const TRACK_DETAILS: { name: string; color: string; audience: string; topics: string[] }[] = [
  {
    name: 'Developer track',
    color: 'google-blue',
    audience: 'A deep-tech dive into Gemini API, Flutter, Firebase, Android, and Cloud. Perfect for engineers looking to master Google’s latest ecosystem tools.',
    topics: ['Agentic app development', 'Gemini API', 'Flutter', 'Firebase', 'Android', 'Google Cloud'],
  },
  {
    name: 'Builder track',
    color: 'google-green',
    audience: 'Designed for founders, PMs, and designers using AI and low-code tools to ship products faster. No formal engineering background required.',
    topics: ['Prototyping with AI', 'Automation', 'No-code tooling', 'Low-code tooling'],
  },
  {
    name: 'Workshops track',
    color: 'google-yellow',
    audience: 'Hands-on sessions where attendees build alongside the speaker. Open to any topic or audience, from either the Developer or Builder track.',
    topics: ['Guided building', 'Live coding', 'Small-group format'],
  },
];

const TRACK_DOT: Record<string, string> = {
  'google-blue': 'bg-google-blue',
  'google-green': 'bg-google-green',
  'google-yellow': 'bg-google-yellow',
};

const VENUE_ADDRESS = 'Shop 1/37 Foveaux St, Surry Hills NSW 2010';
const VENUE_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(VENUE_ADDRESS)}`;
const VENUE_MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(VENUE_ADDRESS)}&output=embed`;
const VENUE_CALENDAR_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('DevFest Sydney 2026')}&dates=20261010T090000/20261010T170000&ctz=Australia/Sydney&details=${encodeURIComponent('A full day of talks, workshops, and building together at DevFest Sydney 2026.')}&location=${encodeURIComponent(VENUE_ADDRESS)}`;

async function fetchLandingHeroImageUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.landingHeroImageUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function fetchLandingSlideImageUrls(): Promise<string[]> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.landingSlideImageUrls as string[] | undefined) ?? [];
  } catch {
    return [];
  }
}

const showVenue = true;
// How many speakers the landing page teases before handing over to /speakers.
const LANDING_SPEAKER_LIMIT = 8;

export default async function Home() {
  const cfsOpen = isCfsOpen();
  const ticketsOnSale = areTicketsOpen();
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const [sponsors, organisers, partnerAssets, landingHeroImageUrl, landingSlideImageUrls, speakers] = await Promise.all([
    fetchSponsors(),
    fetchPublicOrganisers(),
    fetchPartnerAssets(),
    fetchLandingHeroImageUrl(),
    fetchLandingSlideImageUrls(),
    fetchPublicSpeakers(),
  ]);
  const { sponsorshipProspectusUrl, googleLogoUrl, torrensLogoUrl } = partnerAssets;
  const sponsorGroups = groupSponsorsByTier(sponsors);
  // The grid is four across on desktop, so the tease is rounded down to whole rows:
  // five confirmed speakers show as four plus "See all 5", not four and a straggler.
  const wholeRowsOfSpeakers = Math.floor(Math.min(speakers.length, LANDING_SPEAKER_LIMIT) / 4) * 4;
  const featuredSpeakers = speakers.slice(0, wholeRowsOfSpeakers || speakers.length);

  return (
    <div className="bg-[#010103] text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildEventJsonLd(speakers)) }}
      />
      <Navbar accent="blue" isCfsOpen={cfsOpen} cfsCloseDate={cfsCloseDate} areTicketsOpen={ticketsOnSale} />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-12 px-4 sm:px-6 lg:px-12 overflow-hidden">
        {landingHeroImageUrl ? (
          <>
            <Image
              src={landingHeroImageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#010103]/65 via-[#010103]/30 to-[#010103]/5" aria-hidden="true" />
            {/* Second wash darkens the left third so the headline sits on a calm ground
                whatever the photo is doing behind it. */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#010103]/45 via-[#010103]/15 to-transparent" aria-hidden="true" />
          </>
        ) : (
          <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />
        )}

        <div className="relative max-w-2xl">
          <p className="mb-6 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 text-base font-bold text-white/80 animate-fade-in">
            <span className="flex items-center gap-2.5">
              <span>Saturday, 10 October 2026</span>
              <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" aria-hidden="true" />
            </span>
            <span>Torrens University, Surry Hills</span>
          </p>

          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-[clamp(4rem,18vw,6rem)] md:text-[clamp(3rem,10vw,6rem)] font-bold leading-[0.95] tracking-tight text-white">
              <span className="block md:inline">Build,</span>{' '}
              <span className="block md:inline">Secure,</span>
              <span className="block text-google-blue">Scale.</span>
            </h1>
            <h2 className="mt-6 text-[clamp(1.125rem,4vw,1.5rem)] text-white/70 max-w-xl leading-snug">
              Developers and Builders in the Agentic Era
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-5 mt-14 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <a
              href="#about"
              className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
            >
              Learn more
            </a>
            {ticketsOnSale ? (
              <TicketsLink
                source="hero"
                aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
              >
                Get tickets
              </TicketsLink>
            ) : cfsOpen ? (
              <CfsLink
                source="hero"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
              >
                Apply to speak
              </CfsLink>
            ) : (
              <a
                href="https://gdgsydney.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
              >
                Follow GDG Sydney
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── CFS COUNTDOWN BAR ─── */}
      {cfsOpen && cfsCloseDate && (
        <section className="py-10 px-6 bg-white/[0.03] border-y border-white/8">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Countdown targetIso={cfsCloseDate} label="Call for Speakers closes in" />
          </div>
        </section>
      )}

      {/* ─── WHAT TO EXPECT ─── */}
      <section id="about" className="pt-24 pb-14 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
            What to expect
          </h2>

          <div className="flex flex-col gap-5 text-lg md:text-xl text-white/80 leading-relaxed mb-10">
            <p>
              DevFest Sydney is GDG Sydney&apos;s flagship annual conference, presented by Google. Each
              year it brings together engineers, designers, product managers, and founders for a full day
              of talks, workshops, and hands-on building.
            </p>
            <p>
              This year, we look at a real shift underway: the professional developer&apos;s role is moving
              from writing code to reviewing it. We&apos;re bringing together the people building,
              securing, and scaling products for that new reality.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {TRACK_DETAILS.map((track) => (
              <span key={track.name} className="inline-flex items-center gap-3.5 text-base font-bold text-white">
                <span className={`w-2 h-2 rounded-full ${TRACK_DOT[track.color]}`} aria-hidden="true" />
                {track.name}
              </span>
            ))}
          </div>

          {sponsorshipProspectusUrl && (
            <a
              href={sponsorshipProspectusUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download the DevFest Sydney sponsorship prospectus (PDF)"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-google-blue hover:text-halftone-blue transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download the sponsorship prospectus
            </a>
          )}
        </div>
      </section>

      {/* ─── TICKETS ─── (hidden until tickets are on sale on Humanitix) */}
      {ticketsOnSale && (
        <section id="tickets" className="py-14 px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="rounded-xl border-l-[8px] border-google-blue bg-surface p-8 md:p-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14">
                  <div className="lg:w-[42%] lg:shrink-0">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                      One ticket, the whole day
                    </h2>
                    <p className="text-lg leading-relaxed text-white/70 mb-10">
                      Talks, workshops, and hands-on building from morning to evening. No track to
                      pick in advance, and no session you need a separate ticket for.
                    </p>
                    <div className="flex flex-wrap items-center gap-5">
                      <TicketsLink
                        source="landing-section"
                        aria-label="Get tickets for DevFest Sydney 2026 on Humanitix"
                        className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
                      >
                        Get tickets
                      </TicketsLink>
                      <Link
                        href="/tickets"
                        className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
                      >
                        What&apos;s included
                      </Link>
                    </div>
                    <p className="mt-6 text-sm text-white/55">
                      Ticketing is handled by Humanitix.
                    </p>
                  </div>

                  <ul className="flex-1 grid sm:grid-cols-2 gap-x-8 gap-y-7">
                    {TICKET_INCLUSIONS.map((inclusion) => (
                      <li key={inclusion.title}>
                        <span className="inline-flex items-center gap-3 text-base font-bold text-white mb-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${TICKET_INCLUSION_DOT[inclusion.color]}`}
                            aria-hidden="true"
                          />
                          {inclusion.title}
                        </span>
                        <p className="text-white/55 leading-relaxed">{inclusion.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─── TRACKS ─── */}
      <section id="tracks" className="py-14 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-14 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">However you build, there&apos;s a track for you</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {TRACK_DETAILS.map((track, i) => (
              <Reveal
                key={track.name}
                delay={i * 0.1}
                className="bg-surface rounded-2xl p-6 md:p-7"
              >
                <span className="inline-flex items-center gap-3 text-lg font-bold text-white mb-3">
                  <span className={`w-2 h-2 rounded-full ${TRACK_DOT[track.color]}`} aria-hidden="true" />
                  {track.name}
                </span>
                <p className="text-white/55 leading-relaxed mb-6">{track.audience}</p>
                <div className="flex flex-wrap gap-2">
                  {track.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white/60"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPEAKERS ─── (only rendered once at least one speaker has confirmed) */}
      {featuredSpeakers.length > 0 && (
        <section id="speakers" className="py-14 px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <Reveal className="mb-14 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Meet the people on stage</h2>
            </Reveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {featuredSpeakers.map((speaker, index) => (
                <Reveal key={speaker.id} delay={Math.min(index, 7) * 0.06} className="text-center">
                  <Link
                    href={`/speakers/${speaker.slug}`}
                    aria-label={`${speaker.name}: ${speaker.talkTitle}`}
                    className="group block"
                  >
                    <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden bg-white/[0.07] ring-2 ring-transparent group-hover:ring-white/30 transition-shadow">
                      {speaker.photoUrl ? (
                        <Image src={speaker.photoUrl} alt="" width={112} height={112} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60 text-2xl font-bold" aria-hidden="true">
                          {getInitials(speaker.name)}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-white text-base leading-snug">{speaker.name}</p>
                    {speaker.tagline && <p className="text-sm text-white/55 mt-1 leading-snug line-clamp-2">{speaker.tagline}</p>}
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white/55">
                      <span className={`w-1.5 h-1.5 rounded-full ${TRACK_DOT_COLORS[speaker.track]}`} aria-hidden="true" />
                      {TRACK_LABELS[speaker.track]}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2} className="mt-14 text-center">
              <Link
                href="/speakers"
                className="inline-flex items-center gap-2.5 px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
              >
                {speakers.length > featuredSpeakers.length
                  ? `See all ${speakers.length} speakers`
                  : 'See the full lineup'}
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─── VENUE ─── */}
      {showVenue && (
        <section id="venue" className="pt-14 pb-24 px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-10 rounded-xl border-l-[8px] border-google-blue bg-surface p-8 pt-8 pb-8 md:p-10 md:pt-10 md:pb-12">
                <div className="flex-1 flex flex-col">
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Torrens University, Surry Hills</h2>
                      <div className="flex flex-col gap-1 text-lg font-bold leading-relaxed text-white">
                        <span>{VENUE_ADDRESS}</span>
                        <span>Saturday, 10 October 2026</span>
                      </div>
                    </div>
                    <p className="text-lg leading-relaxed text-white/70 max-w-xl">
                      A full day of talks, workshops, and building together, right in the heart of Surry Hills.
                      Auditorium, breakout rooms, and a dedicated Builder&apos;s Space for hands-on hacking between
                      sessions.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-5 mt-14">
                    <a
                      href={VENUE_DIRECTIONS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80"
                      aria-label="Get directions to Torrens University, Surry Hills on Google Maps"
                    >
                      Get directions
                    </a>
                    <a
                      href={VENUE_CALENDAR_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-7 py-2 bg-transparent text-white text-base font-bold rounded border border-white/40 transition-colors hover:border-white"
                      aria-label="Add DevFest Sydney 2026 to your calendar"
                    >
                      Add to calendar
                    </a>
                  </div>
                </div>

                <div className="w-full aspect-[420/300] md:aspect-auto md:w-[320px] md:h-[300px] shrink-0 rounded-lg overflow-hidden bg-white/[0.06]">
                  <iframe
                    src={VENUE_MAP_EMBED_URL}
                    title="Map showing Torrens University, Surry Hills"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─── PHOTO BAND ─── (only rendered when we have real event photos) */}
      {landingSlideImageUrls.length > 0 && (
        <section className="overflow-hidden">
          <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
            {[...landingSlideImageUrls, ...landingSlideImageUrls].map((url, i) => (
              <div key={i} className="relative w-[280px] md:w-[360px] aspect-[5/4] rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src={url}
                  alt="DevFest Sydney community at a past event"
                  fill
                  sizes="360px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── PARTNERS ─── (sponsor tiers appear as the sponsors collection fills) */}
      <section id="partners" className="py-20 px-6 border-t border-white/8">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <p className="text-lg font-medium text-white/55">Supported by</p>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 sm:gap-16">
            {googleLogoUrl && (
              <Image src={googleLogoUrl} alt="Google" width={160} height={48} className="h-16 w-auto object-contain opacity-70" />
            )}
            {torrensLogoUrl && (
              <Image src={torrensLogoUrl} alt="Torrens University" width={120} height={36} className="h-14 w-auto object-contain opacity-70" />
            )}
          </div>

          {sponsorGroups.length > 0 && (
            <div className="w-full mt-8 space-y-10">
              {sponsorGroups.map((group) => (
                <div key={group.tier}>
                  <p className="text-xs font-bold text-white/50 mb-6 text-center">
                    {TIER_LABELS[group.tier]}
                  </p>
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
                          width={192}
                          height={56}
                          className={group.tier === 'platinum' ? 'h-14 w-40 max-w-full object-contain' : 'h-12 w-32 max-w-full object-contain'}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/partners"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors"
          >
            {sponsorGroups.length > 0 ? 'All partners and how to join them' : 'Become a partner'}
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── ORGANISERS ─── (only rendered once an organiser is listed publicly) */}
      {organisers.length > 0 && (
        <section id="organisers" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14 text-center">The organisers</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-6">
              {organisers.map((member) => (
                <div key={member.id} className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-white/5">
                    {member.photoUrl ? (
                      <Image
                        src={member.photoUrl}
                        alt={member.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50 text-xl font-bold">
                        {getInitials(member.name)}
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-white/85 text-sm">{member.name}</p>
                  <p className="text-xs text-white/55 mt-0.5">{member.organiserRole}</p>
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn`}
                      className="inline-block mt-3 text-white/50 hover:text-white/70 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
