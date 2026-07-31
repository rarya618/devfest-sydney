import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';
import CfsLink from '@/components/CfsLink';
import Reveal from '@/components/Reveal';
import { adminDb } from '@/lib/firebase-admin';
import type { Sponsor, SponsorTier, TeamMember } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const tracks = ['Developer Track', 'Builder Track', 'Workshops Track'];

const TRACK_DETAILS: { name: string; color: string; audience: string; topics: string[] }[] = [
  {
    name: 'Developer Track',
    color: 'google-blue',
    audience: 'A deep-tech dive into Gemini API, Flutter, Firebase, Android, and Cloud. Perfect for engineers looking to master Google’s latest ecosystem tools.',
    topics: ['Agentic app development', 'Gemini API', 'Flutter', 'Firebase', 'Android', 'Google Cloud'],
  },
  {
    name: 'Builder Track',
    color: 'google-green',
    audience: 'Designed for founders, PMs, and designers using AI and low-code tools to ship products faster. No formal engineering background required.',
    topics: ['Prototyping with AI', 'Automation', 'No-code tooling', 'Low-code tooling'],
  },
  {
    name: 'Workshops Track',
    color: 'google-yellow',
    audience: 'Hands-on sessions where attendees build alongside the speaker. Open to any topic or audience, from either the Developer or Builder track.',
    topics: ['Guided building', 'Live coding', 'Small-group format'],
  },
];

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

const showLandingContent = false;
const showVenue = false;
const showSponsors = false;

export default async function Home() {
  const isCfsOpen = process.env.CFS_OPEN === 'true';
  const [sponsors, team, sponsorshipProspectusUrl] = await Promise.all([
    fetchSponsors(),
    fetchTeam(),
    fetchSponsorshipProspectusUrl(),
  ]);

  const sponsorsByTier = TIER_ORDER.reduce<Record<SponsorTier, Sponsor[]>>(
    (acc, tier) => {
      acc[tier] = sponsors.filter((s) => s.tier === tier);
      return acc;
    },
    { platinum: [], gold: [], silver: [], community: [] }
  );

  return (
    <div className="bg-off-white text-black-02 min-h-screen">
      <Navbar light isCfsOpen={isCfsOpen} />

      {/* ─── HERO ─── */}
      <section className={`relative pb-28 px-6 overflow-hidden ${isCfsOpen ? 'pt-44' : 'pt-40'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-[clamp(3.25rem,13vw,7rem)] font-bold leading-[0.95] tracking-tight text-black-02">
              Build, Secure,
            </h1>
            <h1 className="text-[clamp(3.25rem,13vw,7rem)] font-bold leading-[0.95] tracking-tight text-google-blue">
              Scale.
            </h1>
            <h2 className="mt-6 text-[clamp(1.125rem,4vw,1.5rem)] text-black-02/50 max-w-xl mx-auto leading-snug">
              Developers and Builders in the Agentic Era
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 mt-14 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <a
              href="#about"
              className="inline-flex items-center px-5 py-2.5 bg-transparent text-black-02/80 text-sm font-bold rounded-[3px] border border-black-02/15 transition-colors hover:border-black-02/30"
            >
              About
            </a>
            {isCfsOpen ? (
              <CfsLink
                source="hero"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-google-blue text-white text-sm font-bold rounded-[3px] border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
              >
                Submit your session
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </CfsLink>
            ) : (
              <a
                href="https://gdgsydney.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-google-blue text-white text-sm font-bold rounded-[3px] border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
              >
                Follow GDG Sydney
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="max-w-2xl animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">About the Event</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-8">
              Sydney&apos;s biggest Google community conference
            </h2>

            <div className="space-y-4 text-black-02/60 leading-relaxed mb-10">
              <p>
                DevFest Sydney is GDG Sydney&apos;s flagship annual conference, presented by Google. Each
                year it brings together engineers, designers, product managers, and founders for a full day
                of talks, workshops, and hands-on building.
              </p>
              <p>
                2026&apos;s theme, <span className="text-black-02/85 italic">&ldquo;Build, Secure, Scale: Developers and Builders in the Agentic Era,&rdquo;</span> looks at a real shift underway: the professional developer&apos;s role is moving from writing code to reviewing it. We&apos;re bringing together the people building, securing, and scaling products for that new reality.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-black-02/80">
              {tracks.map((track, i) => (
                <span key={track} className="inline-flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: [ 'var(--google-blue)', 'var(--google-green)', 'var(--google-yellow)' ][i] }}
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
                className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-google-blue hover:text-[#3574db] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download the sponsorship prospectus
              </a>
            )}
          </div>

          <div
            className="grid grid-cols-2 divide-x divide-y divide-black-02/10 border-t border-l border-black-02/10 animate-slide-up"
            style={{ animationDelay: '0.15s' }}
          >
            {[
              { label: 'Tracks', value: '3', dot: 'var(--google-blue)' },
              { label: 'Community', value: '2,000+', dot: 'var(--google-green)' },
              { label: 'Format', value: 'Full-day', dot: 'var(--google-yellow)' },
              { label: 'Location', value: 'Sydney CBD', dot: 'var(--google-red)' },
            ].map((stat) => (
              <div key={stat.label} className="p-6">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mb-4"
                  style={{ backgroundColor: stat.dot }}
                  aria-hidden="true"
                />
                <p className="text-2xl font-bold text-black-02/90 leading-tight mb-1">{stat.value}</p>
                <p className="text-xs text-black-02/45">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRACKS ─── */}
      <section id="tracks" className="pt-4 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">Tracks</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">However you build, there&apos;s a track for you</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {TRACK_DETAILS.map((track, i) => (
              <Reveal
                key={track.name}
                delay={i * 0.1}
                className="bg-white border border-black-02/8 rounded-2xl p-8 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black-02/5"
              >
                <span className="inline-flex items-center gap-2 text-lg font-bold text-black-02 mb-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      track.color === 'google-blue' ? 'bg-google-blue' : track.color === 'google-green' ? 'bg-google-green' : 'bg-google-yellow'
                    }`}
                    aria-hidden="true"
                  />
                  {track.name}
                </span>
                <p className="text-black-02/55 leading-relaxed mb-6">{track.audience}</p>
                <div className="flex flex-wrap gap-2">
                  {track.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 bg-off-white border border-black-02/8 rounded-full text-xs text-black-02/60 transition-colors duration-200 hover:border-black-02/20 hover:text-black-02/80"
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

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center">
            <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14">Common questions</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <FAQ isCfsOpen={isCfsOpen} sponsorshipProspectusUrl={sponsorshipProspectusUrl} />
          </Reveal>
        </div>
      </section>

      {/* ─── everything below FAQ is hidden until content is finalised ─── */}
      {showLandingContent && (
        <>

      {/* ─── VENUE ─── (hidden until the venue is finalised) */}
      {showVenue && (
        <>
          <section id="venue" className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3">Venue</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14">Where it happens</h2>

              <div className="grid md:grid-cols-2 gap-10 md:gap-16">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {[
                      { label: 'City', value: 'Sydney CBD' },
                      { label: 'Doors open', value: '8:30 AM' },
                      { label: 'Format', value: 'Multi-track, full day' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-black-02/40 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-black-02/85">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-black-02/50 leading-relaxed pt-5 border-t border-black-02/10">
                    The full venue address will be announced closer to the event. Follow GDG Sydney for updates.
                  </p>
                </div>

                <div className="md:pl-16 md:border-l md:border-black-02/10 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-google-blue/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-google-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-black-02/80 mb-1">Venue to be announced</p>
                    <p className="text-sm text-black-02/50 leading-relaxed max-w-xs">
                      We&apos;re finalising the venue. Check back closer to the event for details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ─── SPONSORS ─── (hidden until there are sponsors to show) */}
      {showSponsors && (
        <>
          <section id="sponsors" className="py-24 px-6 bg-white border-y border-black-02/8">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3 text-center">Partners</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14 text-center">Our sponsors</h2>

              {sponsors.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-black-02/45 text-sm mb-3">Sponsors will be announced soon.</p>
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
                      <p className="text-xs font-bold text-black-02/35 tracking-[0.15em] uppercase mb-6 text-center">
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
        </>
      )}

      {/* ─── TEAM ─── (only rendered when team members exist) */}
      {team.length > 0 && (
        <>
          <section id="team" className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs font-bold text-black-02/40 tracking-[0.15em] uppercase mb-3 text-center">Team</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-14 text-center">The organisers</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-6">
                {team.map((member) => (
                  <div key={member.id} className="text-center">
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-black-02/5">
                      {member.photoUrl ? (
                        <Image
                          src={member.photoUrl}
                          alt={member.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black-02/30 text-xl font-bold">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-black-02/85 text-sm">{member.name}</p>
                    <p className="text-xs text-black-02/45 mt-0.5">{member.role}</p>
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on LinkedIn`}
                        className="inline-block mt-3 text-black-02/30 hover:text-black-02/70 transition-colors"
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
        </>
      )}

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6 bg-white border-t border-black-02/8">
        <Reveal className="max-w-3xl mx-auto text-center">
          {isCfsOpen ? (
            <>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">Ready to speak?</h2>
              <p className="text-black-02/55 leading-relaxed mb-10 max-w-lg mx-auto">
                The Call for Speakers is open now. We review every submission and get back to all applicants.
              </p>
              <CfsLink
                source="final-cta"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-google-blue text-white text-sm font-bold rounded-[3px] border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
              >
                Submit your session
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </CfsLink>
            </>
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">Join us in 2026</h2>
              <p className="text-black-02/55 leading-relaxed mb-10 max-w-lg mx-auto">
                DevFest Sydney 2026 is coming to Sydney CBD. Tickets and speaker announcements coming soon.
              </p>
              <a
                href="https://gdgsydney.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-google-blue text-white text-sm font-bold rounded-[3px] border border-google-blue transition-colors hover:bg-transparent hover:text-google-blue"
              >
                Follow GDG Sydney
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </a>
            </>
          )}
          <p className="text-xs text-black-02/35 mt-5">Sydney CBD · 2026</p>
        </Reveal>
      </section>
        </>
      )}

      <Footer light />
    </div>
  );
}
