import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Countdown from '@/components/Countdown';
import CfsForm from './CfsForm';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const title = 'Call for Speakers';
const description = 'Submit a talk, workshop, or lightning talk for DevFest Sydney 2026. We are looking for passionate speakers across the Developer, Builder, and Workshops tracks.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/call-for-speakers' },
  openGraph: {
    title: `${title} — DevFest Sydney 2026`,
    description,
    url: '/call-for-speakers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — DevFest Sydney 2026`,
    description,
  },
};

const isCfsOpen = process.env.CFS_OPEN === 'true';

const REASONS = [
  { title: 'Driven people in the room', desc: 'Part of a 2,000+ strong community.', color: 'google-blue' },
  { title: "First talk? That's okay", desc: "If you've built something or learned something worth sharing, that's enough.", color: 'google-green' },
  { title: "We'll help you get ready", desc: 'Feedback on your talk, support along the way.', color: 'google-red' },
  { title: 'Free entry, all day', desc: 'Not just for your session.', color: 'google-yellow' },
];

const REASON_BORDER: Record<string, string> = {
  'google-blue': 'border-google-blue',
  'google-green': 'border-google-green',
  'google-red': 'border-google-red',
  'google-yellow': 'border-google-yellow',
};

// Matches the upload order in scripts/upload-cfs-hero-images.mjs (cfs-1, cfs-2, cfs-3).
// The collage crop is so narrow that a plain center crop can miss the subject or
// leave too much dead background in frame; these are calibrated per source photo.
const HERO_IMAGE_OBJECT_POSITIONS = ['47% center', '18% center', '46% center'];
// The third photo's subject sits noticeably lower in the source frame than the
// other two, so the extra zoom is paired with an upward shift to line up the faces.
// The first gets a much lighter touch of the same treatment: a small downward
// shift compensates for the face drifting up as the center-anchored zoom scales
// its distance from the frame's vertical center.
const HERO_IMAGE_TRANSFORMS: Record<number, string> = {
  0: 'scale(1.12) translateY(3%)',
  2: 'scale(1.2) translateY(-9%)',
};

async function fetchCfsHeroImageUrls(): Promise<string[]> {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    return (doc.data()?.cfsHeroImageUrls as string[] | undefined) ?? [];
  } catch {
    return [];
  }
}

const topics: { label: string; track: 'developer' | 'builder' | 'workshop' }[] = [
  { label: 'Agentic app development', track: 'developer' },
  { label: 'AI prototyping', track: 'builder' },
  { label: 'Gemini API & AI Studio', track: 'developer' },
  { label: 'No-code & low-code tooling', track: 'builder' },
  { label: 'Flutter & Dart', track: 'developer' },
  { label: 'Product design with AI', track: 'builder' },
  { label: 'Firebase', track: 'developer' },
  { label: 'Automation for builders', track: 'builder' },
  { label: 'Android development', track: 'developer' },
  { label: 'Founder & PM playbooks', track: 'builder' },
  { label: 'Google Cloud', track: 'developer' },
  { label: 'Developer productivity', track: 'developer' },
  { label: 'Rapid MVP validation', track: 'builder' },
  { label: 'From idea to launch', track: 'builder' },
  { label: 'Hands-on building', track: 'workshop' },
  { label: 'Live coding sessions', track: 'workshop' },
];

function formatCloseDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });
}

export default async function CallForSpeakers() {
  const cfsCloseDate = process.env.CFS_CLOSE_DATE;
  const heroImageUrls = await fetchCfsHeroImageUrls();

  return (
    <div className="bg-[#202124] text-white min-h-screen">
      <Navbar accent="green" isCfsOpen={isCfsOpen} />

      {/* Hero */}
      <section className={`relative pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden ${isCfsOpen ? 'pt-40' : 'pt-36'}`}>
        <div className="absolute inset-0 hero-atmosphere pointer-events-none" aria-hidden="true" />

        <div className="relative flex flex-col md:flex-row md:items-stretch gap-10">
          <div className="md:shrink-0">
            {isCfsOpen && (
              <p className="mb-4 text-base font-bold text-white/80 animate-fade-in">
                Now open{cfsCloseDate ? ` · closes ${formatCloseDate(cfsCloseDate)}` : ''}
              </p>
            )}

            <h1 className="text-[clamp(3.5rem,15vw,6rem)] md:text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.95] tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Call for
              <br />
              <span className="text-google-green">Speakers</span>
            </h1>

            <p className="text-white/55 text-lg max-w-lg leading-relaxed mb-14 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              We&apos;re looking for passionate Developers and Builders like you. Apply now!
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <a
                href="#topics"
                className="inline-flex items-center px-8 py-2.5 bg-transparent text-white text-base font-bold rounded-lg border border-[#555555] transition-colors hover:border-white animate-slide-up"
                style={{ animationDelay: '0.25s' }}
              >
                Learn more
              </a>
              {isCfsOpen && (
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2.5 px-8 py-2.5 bg-google-green text-white text-base font-bold rounded-lg border border-google-green transition-colors hover:bg-transparent hover:text-google-green animate-slide-up"
                  style={{ animationDelay: '0.3s' }}
                >
                  Apply to speak
              </a>
            )}
            </div>
          </div>

          {heroImageUrls.length > 0 && (
            <div className="flex gap-2 h-72 md:h-auto md:flex-1 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              {heroImageUrls.map((url, i) => {
                const isFirst = i === 0;
                const isLast = i === heroImageUrls.length - 1;
                const cornerClass = isFirst
                  ? 'rounded-tl-[20px] rounded-bl-[20px] rounded-tr-lg rounded-br-lg'
                  : isLast
                    ? 'rounded-tr-[20px] rounded-br-[20px] rounded-tl-lg rounded-bl-lg'
                    : 'rounded-lg';
                // The collage crops each photo down to a narrow sliver (~25% of its
                // width), so a plain center crop can miss an off-center subject
                // entirely. This is calibrated per source photo's subject position.
                const objectPosition = HERO_IMAGE_OBJECT_POSITIONS[i] ?? 'center';
                const transform = HERO_IMAGE_TRANSFORMS[i];
                return (
                  <div key={url} className={`relative flex-1 h-full overflow-hidden ${cornerClass}`}>
                    <Image
                      src={url}
                      alt="A past DevFest Sydney speaker presenting"
                      fill
                      sizes="(min-width: 768px) 640px, 480px"
                      priority={isFirst}
                      className="object-cover"
                      style={transform ? { objectPosition, transform } : { objectPosition }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Countdown bar */}
      {isCfsOpen && cfsCloseDate && (
        <section className="py-10 px-6 bg-white/[0.02] border-y border-white/8">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Countdown targetIso={cfsCloseDate} label="Closing in" />
          </div>
        </section>
      )}

      {/* Reasons to apply */}
      <section id="topics" className="pt-20 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">Good reasons to apply</h2>
            <p className="text-white/70 mt-4 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              You don&apos;t need a polished deck or years on stage. If you&apos;ve built something or learned something the hard way, that&apos;s a talk.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {REASONS.map((reason) => (
              <div
                key={reason.title}
                className={`flex flex-col gap-3 bg-white/[0.06] border border-l-8 ${REASON_BORDER[reason.color]} rounded-xl pt-8 pb-10 px-6 md:px-8`}
              >
                <h3 className="text-xl md:text-2xl font-bold text-white">{reason.title}</h3>
                <p className="text-base text-white/80 leading-relaxed">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative -mx-6 overflow-hidden border-y border-[#CCCCCC] bg-white/[0.06] animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#202124] to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#202124] to-transparent z-10 pointer-events-none" aria-hidden="true" />
          <div className="flex w-max items-center gap-6 py-4 animate-marquee hover:[animation-play-state:paused]" aria-hidden="true">
            {[...topics, ...topics].map(({ label }, i) => (
              <span key={i} className="flex items-center gap-2.5 text-base font-normal text-white whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-google-green shrink-0" />
                {label}
              </span>
            ))}
          </div>
          <p className="sr-only">
            Topics we welcome: {topics.map(({ label }) => label).join(', ')}, and more.
          </p>
        </div>
      </section>

      {/* Form or Closed State */}
      <section id="apply" className="pt-16 pb-20 px-6 bg-[#202124]">
        <div className={isCfsOpen ? 'max-w-4xl mx-auto' : 'max-w-xl mx-auto'}>
          <div className="mb-10 text-center animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">Apply to speak</h2>
            <p className="text-white/70 mt-4 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Need something to present comfortably, an interpreter, step-free access, or anything else? Tell us in the form below, or email{' '}
              <a href="mailto:hello@gdgsydney.com" className="text-white/85 hover:text-white underline underline-offset-2 transition-colors">
                hello@gdgsydney.com
              </a>
              .
            </p>
          </div>

          {isCfsOpen ? (
            <CfsForm />
          ) : (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white/70 mb-3">Applications are now closed</h3>
              <p className="text-sm text-white/45 leading-relaxed max-w-sm mx-auto">
                The Call for Speakers has closed for DevFest Sydney 2026. Thank you to everyone who submitted a session. We&apos;ll be in touch soon.
              </p>
              <a
                href="mailto:hello@gdgsydney.com"
                className="inline-flex mt-6 text-sm text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors"
              >
                Contact us if you have questions
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
