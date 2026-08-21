import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CfsLink from '@/components/CfsLink';
import Reveal from '@/components/Reveal';
import Countdown from '@/components/Countdown';
import { adminDb } from '@/lib/firebase-admin';
import type { Sponsor, SponsorTier, TeamMember } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devfest.gdgsydney.com';

const eventJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'DevFest Sydney 2026',
  description: 'Build, Secure, Scale: Developers and Builders in the Agentic Era.',
  startDate: '2026-10-10',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: 'Torrens University, Surry Hills',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Shop 1/37 Foveaux St',
      addressLocality: 'Surry Hills',
      addressRegion: 'NSW',
      postalCode: '2010',
      addressCountry: 'AU',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'GDG Sydney',
    url: 'https://gdgsydney.com',
  },
  url: siteUrl,
};

const tracks = ['Developer track', 'Builder track', 'Workshop track'];

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

const TIER_ORDER: SponsorTier[] = ['platinum', 'gold', 'silver', 'community'];
const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  community: 'Community',
};

async function fetchSponsors(): Promise<Sponsor[]> {
  try {
    const snap = await adminDb.collection('sponsors').orderBy('order').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sponsor));
  } catch {
    return [];
  }
}

async function fetchTeam(): Promise<TeamMember[]> {
  try {
    const snap = await adminDb.collection('team').orderBy('order').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TeamMember));
  } catch {
    return [];
  }
}

async function fetchSponsorshipProspectusUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.sponsorshipProspectusUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function fetchLandingHeroImageUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.landingHeroImageUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function fetchGoogleLogoUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.googleLogoUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function fetchTorrensLogoUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.torrensLogoUrl as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function fetchLandingCfsImageUrl(): Promise<string | null> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.landingCfsImageUrl as string | undefined) ?? null;
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

const showVenue = false;
const showSponsors = false;

function formatCloseDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });
}

export default async function Home() {
  const isCfsOpen = process.env.CFS_OPEN === 'true';
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const [sponsors, team, sponsorshipProspectusUrl, landingHeroImageUrl, googleLogoUrl, torrensLogoUrl, landingSlideImageUrls, landingCfsImageUrl] = await Promise.all([
    fetchSponsors(),
    fetchTeam(),
    fetchSponsorshipProspectusUrl(),
    fetchLandingHeroImageUrl(),
    fetchGoogleLogoUrl(),
    fetchTorrensLogoUrl(),
    fetchLandingSlideImageUrls(),
    fetchLandingCfsImageUrl(),
  ]);

  const sponsorsByTier = TIER_ORDER.reduce<Record<SponsorTier, Sponsor[]>>(
    (acc, tier) => {
      acc[tier] = sponsors.filter((s) => s.tier === tier);
      return acc;
    },
    { platinum: [], gold: [], silver: [], community: [] }
  );

  return (
    <div className="bg-[#202124] text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <Navbar accent="blue" isCfsOpen={isCfsOpen} cfsCloseDate={cfsCloseDate} />

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
            <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/80 via-[#202124]/50 to-[#202124]/10" aria-hidden="true" />
          </>
        ) : (
          <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />
        )}

        <div className="relative max-w-2xl">
          {isCfsOpen && (
            <p className="mb-6 text-base font-bold text-white/80 animate-fade-in">
              Call for Speakers extended{cfsCloseDate ? ` · now closes ${formatCloseDate(cfsCloseDate)}` : ''}
            </p>
          )}

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
              className="inline-flex items-center px-8 py-2.5 bg-transparent text-white text-base font-bold rounded-lg border border-[#555555] transition-colors hover:border-white"
            >
              Learn more
            </a>
            {isCfsOpen ? (
              <CfsLink
                source="hero"
                className="inline-flex items-center gap-2.5 px-8 py-2.5 bg-google-blue text-white text-base font-bold rounded-lg border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
              >
                Apply to speak
              </CfsLink>
            ) : (
              <a
                href="https://gdgsydney.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-2.5 bg-google-blue text-white text-base font-bold rounded-lg border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
              >
                Follow GDG Sydney
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── CFS COUNTDOWN BAR ─── */}
      {isCfsOpen && cfsCloseDate && (
        <section className="py-10 px-6 bg-white/[0.03] border-y border-white/8">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Countdown targetIso={cfsCloseDate} label="Call for Speakers closes in" />
          </div>
        </section>
      )}

      {/* ─── WHAT TO EXPECT ─── */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8">
            What to Expect?
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

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {tracks.map((track, i) => (
              <span key={track} className="inline-flex items-center gap-3.5 text-base font-bold text-white">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ['var(--google-blue)', 'var(--google-green)', 'var(--google-yellow)'][i] }}
                />
                {track}
              </span>
            ))}
          </div>

          {sponsorshipProspectusUrl && (
            <a
              href={sponsorshipProspectusUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download the DevFest Sydney sponsorship prospectus (PDF)"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-google-blue hover:text-[#6ba3f8] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download the sponsorship prospectus
            </a>
          )}
        </div>
      </section>

      {/* ─── CFS CALLOUT ─── */}
      {isCfsOpen && (
        <section className="pb-24 px-4 sm:px-6 lg:px-12">
          <Reveal className="max-w-7xl mx-auto">
            <div className="relative bg-white/[0.06] border border-google-green/30 border-l-[8px] border-l-google-green rounded-[20px] overflow-hidden">
              <div className="grid md:grid-cols-[1fr_auto]">
                <div className="p-8 md:p-10">
                  <div className="space-y-2 md:space-y-4">
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Call for speakers</h3>
                    <p className="text-lg text-white/70 leading-relaxed">
                      We&apos;re looking for passionate speakers across the Developer and Builder tracks. Whether
                      you&apos;re an engineer, designer, PM, or founder. If you have something worth sharing, we
                      want to hear from you.
                    </p>
                  </div>
                  <CfsLink
                    source="cfs-callout"
                    className="inline-flex items-center gap-2.5 px-8 py-2.5 mt-12 bg-google-green text-white text-base font-bold rounded-lg border border-google-green transition-colors hover:bg-transparent hover:text-google-green"
                  >
                    Submit a session
                  </CfsLink>
                </div>
                <div className="hidden md:block md:w-64" aria-hidden="true" />
              </div>
              {landingCfsImageUrl ? (
                <div className="hidden md:block absolute inset-y-0 right-0 w-64">
                  <Image src={landingCfsImageUrl} alt="" fill sizes="500px" className="object-cover" />
                </div>
              ) : (
                <div className="hidden md:flex items-center justify-center absolute top-0 bottom-0 right-0 w-64 bg-google-green/10">
                  <svg className="w-20 h-20 text-google-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ─── TRACKS ─── */}
      <section id="tracks" className="pt-4 pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-14 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">However you build, there&apos;s a track for you</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {TRACK_DETAILS.map((track, i) => (
              <Reveal
                key={track.name}
                delay={i * 0.1}
                className="card-hover-lift bg-white/[0.08] rounded-2xl p-6 md:p-7"
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
                      className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white/60 transition-colors duration-200 hover:border-white/25 hover:text-white/85"
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

      {/* ─── VENUE ─── (hidden while the section is being redesigned) */}
      {showVenue && (
        <section id="venue" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold text-white/40 tracking-[0.15em] uppercase mb-3">Venue</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14">Where it happens</h2>

            <div className="grid md:grid-cols-2 gap-10 md:gap-16">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    { label: 'Venue', value: 'Torrens University, Surry Hills' },
                    { label: 'Doors open', value: '8:30 AM' },
                    { label: 'Format', value: 'Multi-track, full day' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-white/85">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/50 leading-relaxed pt-5 border-t border-white/10">
                  Shop 1/37 Foveaux St, Surry Hills NSW 2010
                </p>
              </div>

              <div className="md:pl-16 md:border-l md:border-white/10 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-google-blue/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-google-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white/80 mb-1">Torrens University, Surry Hills</p>
                  <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                    Shop 1/37 Foveaux St, Surry Hills NSW 2010
                  </p>
                </div>
              </div>
            </div>
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

      {/* ─── SUPPORTED BY ─── */}
      <section id="partners" className="py-16 px-6 border-t border-white/8">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <p className="text-lg font-medium text-white/40">Supported by</p>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-16">
            {googleLogoUrl && (
              <Image src={googleLogoUrl} alt="Google" width={160} height={48} className="h-16 w-auto object-contain opacity-70" />
            )}
            {torrensLogoUrl && (
              <Image src={torrensLogoUrl} alt="Torrens University" width={120} height={36} className="h-14 w-auto object-contain opacity-70" />
            )}
          </div>
        </div>
      </section>

      {/* ─── SPONSORS ─── (hidden until there are sponsors to show) */}
      {showSponsors && (
        <section className="py-24 px-6 bg-white/[0.02] border-b border-white/8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14 text-center">Our sponsors</h2>

            {sponsors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/45 text-sm mb-3">Sponsors will be announced soon.</p>
                <a
                  href="mailto:hello@gdgsydney.com"
                  className="text-sm text-google-yellow/80 hover:text-google-yellow transition-colors underline underline-offset-2"
                >
                  Interested in sponsoring? Get in touch.
                </a>
              </div>
            ) : (
              <div className="space-y-12">
                {TIER_ORDER.filter((tier) => sponsorsByTier[tier].length > 0).map((tier) => (
                  <div key={tier}>
                    <p className="text-xs font-bold text-white/35 tracking-[0.15em] uppercase mb-6 text-center">
                      {TIER_LABELS[tier]}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-10">
                      {sponsorsByTier[tier].map((sponsor) => (
                        <a
                          key={sponsor.id}
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${sponsor.name} — sponsor website`}
                          className="opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <Image
                            src={sponsor.logoUrl}
                            alt={sponsor.name}
                            width={160}
                            height={48}
                            className="h-10 w-auto object-contain"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── TEAM ─── (only rendered when team members exist) */}
      {team.length > 0 && (
        <section id="team" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold text-white/40 tracking-[0.15em] uppercase mb-3 text-center">Team</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14 text-center">The organisers</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-6">
              {team.map((member) => (
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
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xl font-bold">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-white/85 text-sm">{member.name}</p>
                  <p className="text-xs text-white/45 mt-0.5">{member.role}</p>
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn`}
                      className="inline-block mt-3 text-white/30 hover:text-white/70 transition-colors"
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
